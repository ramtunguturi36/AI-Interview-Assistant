import os
import pdfplumber
import requests
import json
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import uuid
from pydantic import BaseModel
import tempfile
import speech_recognition as sr
from pydub import AudioSegment
import io
import sqlite3
from datetime import datetime
import logging
from pymongo import MongoClient
from bson import ObjectId
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import csv
import pandas as pd
from typing import List, Optional
from datetime import datetime, timedelta
import traceback
from fastapi import APIRouter
import openai
import whisper

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a router for API endpoints
api_router = APIRouter(prefix="/api")

# Database setup
def init_db():
    try:
        conn = sqlite3.connect('interview_sessions.db')
        c = conn.cursor()
        
        # Create sessions table
        c.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                created_at TIMESTAMP,
                num_questions INTEGER,
                difficulty TEXT,
                interview_type TEXT,
                overall_score REAL
            )
        ''')
        
        # Create questions table
        c.execute('''
            CREATE TABLE IF NOT EXISTS questions (
                id TEXT PRIMARY KEY,
                session_id TEXT,
                question_text TEXT,
                answer_text TEXT,
                evaluation_json TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions (id)
            )
        ''')
        
        conn.commit()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise
    finally:
        conn.close()

# Initialize database
init_db()

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["interview_db"]
sessions_collection = db["sessions"]

# New Pydantic models for additional features
class Tag(BaseModel):
    name: str
    color: Optional[str] = None

class SessionStats(BaseModel):
    total_sessions: int
    total_questions: int
    total_answers: int
    average_score: float
    difficulty_distribution: Dict[str, int]
    score_trend: List[Dict[str, Any]]
    tag_distribution: Dict[str, int]

class ExportRequest(BaseModel):
    session_ids: List[str]
    format: str
    include_questions: bool = True
    include_answers: bool = True
    include_evaluations: bool = True

class ComparisonRequest(BaseModel):
    session_ids: List[str]
    compare_by: List[str] = ["score", "difficulty", "interview_type"]

# Add new MongoDB collections
tags_collection = db["tags"]
session_tags_collection = db["session_tags"]

class InterviewParams(BaseModel):
    num_questions: int
    difficulty: str
    interview_type: str

class EvaluationRequest(BaseModel):
    session_id: str
    answers: List[Dict[str, str]]

class Session(BaseModel):
    id: str
    timestamp: datetime
    questions: List[dict]
    answers: List[str]
    evaluations: List[dict]
    difficulty: str
    interview_type: str

# OpenRouter API Configuration
OPENROUTER_API_KEY = "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"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Configure OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Whisper model (will download the model on first run)
model = whisper.load_model("base")  # You can use "tiny", "base", "small", "medium", or "large"

def get_openrouter_headers():
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Interview Assistant"
    }
    logger.info(f"Using headers: {headers}")
    return headers

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file with better error handling"""
    try:
        logger.info(f"Opening PDF file: {file_path}")
        with pdfplumber.open(file_path) as pdf:
            logger.info(f"PDF opened successfully. Number of pages: {len(pdf.pages)}")
            text = []
            for i, page in enumerate(pdf.pages):
                try:
                    page_text = page.extract_text() or ""
                    text.append(page_text)
                    logger.info(f"Extracted text from page {i+1}. Length: {len(page_text)} characters")
                except Exception as e:
                    logger.error(f"Error extracting text from page {i+1}: {str(e)}")
                    text.append("")  # Add empty string for failed pages
            
            result = "\n".join(text)
            logger.info(f"Total extracted text length: {len(result)} characters")
            return result
    except Exception as e:
        logger.error(f"Error in extract_text_from_pdf: {str(e)}")
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def generate_questions(resume_text: str, params: InterviewParams) -> List[Dict[str, str]]:
    try:
        logger.info("Generating questions using OpenRouter API")
        prompt = (
            f"Generate {params.num_questions} technical interview questions based on this resume. "
            f"Focus on:\n"
            f"  1. Core technical skills mentioned\n"
            f"  2. Tools and technologies actually used\n"
            f"  3. Work experience and contribution-based scenarios\n"
            f"  4. At least 1 question around a challenge faced in projects\n"
            f"  5. 1–2 behavioral questions tied to leadership/teamwork if applicable\n"
            f"- Do NOT ask generic questions. Only ask what is directly relevant.\n\n"
            f"Resume Summary:\n{resume_text}\n\n"
            f"Return exactly {params.num_questions} numbered questions in a clear list."
        )

        payload = {
            "model": "meta-llama/llama-4-maverick:free",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }

        logger.info(f"Sending request to OpenRouter API with payload: {json.dumps(payload)}")
        response = requests.post(
            OPENROUTER_URL,
            headers=get_openrouter_headers(),
            json=payload,
            timeout=30
        )

        logger.info(f"Response status code: {response.status_code}")
        logger.info(f"Response headers: {response.headers}")
        logger.info(f"Response text: {response.text}")

        if response.status_code != 200:
            logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to generate questions: {response.text}")

        response_data = response.json()
        logger.info(f"Response data: {json.dumps(response_data, indent=2)}")

        if "choices" not in response_data or not response_data["choices"]:
            logger.error("No choices in response data")
            raise HTTPException(status_code=500, detail="Invalid response format from API")

        content = response_data["choices"][0]["message"]["content"]
        logger.info(f"Raw response content: {content}")

        # Process the response and format questions
        questions = []
        for line in content.split('\n'):
            if line.strip() and line[0].isdigit():
                questions.append({"question": line.strip()})
        
        logger.info(f"Generated {len(questions)} questions")
        return questions

    except requests.exceptions.Timeout:
        logger.error("Request to OpenRouter API timed out")
        raise HTTPException(status_code=500, detail="Request timed out")
    except requests.exceptions.RequestException as e:
        logger.error(f"Request to OpenRouter API failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in generate_questions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

def convert_webm_to_wav(webm_data: bytes) -> bytes:
    """Convert webm audio data to wav format"""
    # Create a temporary file for the webm data
    with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as webm_file:
        webm_file.write(webm_data)
        webm_path = webm_file.name

    try:
        # Load the webm file
        audio = AudioSegment.from_file(webm_path, format="webm")
        
        # Export to wav format in memory
        wav_buffer = io.BytesIO()
        audio.export(wav_buffer, format="wav")
        return wav_buffer.getvalue()
        
    finally:
        # Clean up the temporary file
        if os.path.exists(webm_path):
            os.remove(webm_path)

def transcribe_audio(audio_file_path: str) -> str:
    try:
        # Transcribe using local Whisper model
        result = model.transcribe(
            audio_file_path,
            language="en",  # Specify English language
            task="transcribe",  # Specify transcription task
            temperature=0.2,  # Lower temperature for more accurate transcription
            initial_prompt="This is an interview response. Please transcribe it accurately."  # Context for better accuracy
        )
        
        if result and result["text"]:
            return result["text"].strip()
        else:
            logger.error("No transcription returned from Whisper")
            return "Could not transcribe audio. Please try again."
            
    except Exception as e:
        logger.error(f"Error in transcribe_audio: {str(e)}")
        return f"Error transcribing audio: {str(e)}"

def evaluate_answer(question: str, answer: str) -> Dict[str, Any]:
    """Evaluate the answer using Llama 4 Maverick model with structured evaluation criteria"""
    try:
        logger.info("Evaluating answer using OpenRouter API")
        prompt = f"""You are an expert interview coach and AI analyst. Your task is to evaluate a candidate's spoken interview response.

### Interview Question:
{question}

### Candidate Response:
{answer}

### Your Evaluation Should Include:
1. **Overall Clarity**: Was the answer coherent and easy to understand?
2. **Technical Relevance**: Did the candidate address the key technical aspects of the question?
3. **Structure & Flow**: Was the answer well-organized (e.g., point-wise, logical order)?
4. **Communication Style**: Was it confident, concise, and professional?
5. **Correctness**: Were there any factual or conceptual errors?

### Provide:
- A 1–2 sentence **Summary Feedback**
- A detailed **Strengths vs Areas to Improve** section
- A **Revised Version** of the answer (as you would say it in an interview)
- A **Score out of 10**
- 1–2 **Improvement Tips**

Format your response as a JSON object with the following structure:
{{
    "summary": "1-2 sentence summary of the evaluation",
    "score": <number between 0 and 10>,
    "evaluation": {{
        "clarity": {{
            "score": <number between 0 and 10>,
            "feedback": "feedback on clarity"
        }},
        "technical_relevance": {{
            "score": <number between 0 and 10>,
            "feedback": "feedback on technical relevance"
        }},
        "structure": {{
            "score": <number between 0 and 10>,
            "feedback": "feedback on structure and flow"
        }},
        "communication": {{
            "score": <number between 0 and 10>,
            "feedback": "feedback on communication style"
        }},
        "correctness": {{
            "score": <number between 0 and 10>,
            "feedback": "feedback on correctness"
        }}
    }},
    "strengths": ["strength1", "strength2", "strength3"],
    "improvements": ["improvement1", "improvement2"],
    "revised_answer": "A better version of the answer",
    "tips": ["tip1", "tip2"]
}}

IMPORTANT: Return ONLY the JSON object, without any markdown formatting or additional text."""

        payload = {
            "model": "meta-llama/llama-4-maverick:free",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 1000
        }

        logger.info("Sending request to OpenRouter API")
        response = requests.post(
            OPENROUTER_URL,
            headers=get_openrouter_headers(),
            json=payload,
            timeout=30
        )

        if response.status_code != 200:
            logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {response.text}")

        response_data = response.json()
        logger.info(f"Response data: {json.dumps(response_data, indent=2)}")

        if "choices" not in response_data or not response_data["choices"]:
            logger.error("No choices in response data")
            raise HTTPException(status_code=500, detail="Invalid response format from API")

        content = response_data["choices"][0]["message"]["content"]
        logger.info(f"Raw response content: {content}")

        # Clean the content by removing any markdown formatting
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        try:
            evaluation = json.loads(content)
            logger.info("Successfully parsed evaluation response")
            return evaluation
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse evaluation response: {str(e)}")
            logger.error(f"Content that failed to parse: {content}")
            raise HTTPException(status_code=500, detail="Failed to parse evaluation response")

    except requests.exceptions.Timeout:
        logger.error("Request to OpenRouter API timed out")
        raise HTTPException(status_code=500, detail="Request timed out")
    except requests.exceptions.RequestException as e:
        logger.error(f"Request to OpenRouter API failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Request failed: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in evaluate_answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@api_router.post("/transcribe")
async def transcribe_interview(
    audio: UploadFile = File(...),
    question: str = Form(...),
    session_id: str = Form(...),
    is_final: bool = Form(False)  # New parameter to indicate if this is the final answer
):
    try:
        logger.info("Starting transcription process")
        
        # Save the audio file
        audio_path = f"audio/{session_id}_{datetime.now().timestamp()}.webm"
        os.makedirs("audio", exist_ok=True)
        with open(audio_path, "wb") as buffer:
            content = await audio.read()
            buffer.write(content)
        logger.info(f"Saved audio file to {audio_path}")
        
        # Convert WebM to WAV
        try:
            # Use the saved file for conversion
            audio = AudioSegment.from_file(audio_path, format="webm")
            # Set the sample rate to 16kHz (recommended for speech recognition)
            audio = audio.set_frame_rate(16000)
            # Set the number of channels to 1 (mono)
            audio = audio.set_channels(1)
            wav_buffer = io.BytesIO()
            audio.export(wav_buffer, format="wav")
            wav_data = wav_buffer.getvalue()
            logger.info("Successfully converted WebM to WAV")
        except Exception as e:
            logger.error(f"Error converting WebM to WAV: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error converting audio format: {str(e)}")
        
        # Save WAV data to a temporary file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as wav_file:
            wav_file.write(wav_data)
            wav_path = wav_file.name
        logger.info(f"Saved WAV file to {wav_path}")
        
        try:
            # Transcribe the audio
            transcription = transcribe_audio(wav_path)
            logger.info("Successfully transcribed audio")
            
            if is_final:
                # Only store the answer if this is marked as final
                sessions_collection.update_one(
                    {"_id": ObjectId(session_id)},
                    {"$push": {"answers": transcription}}
                )
                logger.info("Updated session with final transcription")
            
            return {"transcription": transcription}
        finally:
            # Clean up the temporary WAV file
            if os.path.exists(wav_path):
                os.remove(wav_path)
                logger.info(f"Cleaned up temporary WAV file: {wav_path}")
            # Clean up the original WebM file
            if os.path.exists(audio_path):
                os.remove(audio_path)
                logger.info(f"Cleaned up original WebM file: {audio_path}")
    except Exception as e:
        logger.error(f"Error in transcribe_interview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload")
async def upload_resume(
    file: UploadFile = File(...),
    num_questions: int = Form(...),
    difficulty: str = Form(...),
    interview_type: str = Form(...)
):
    file_path = None
    try:
        logger.info(f"Starting resume upload process for file: {file.filename}")
        
        # Validate parameters
        if num_questions < 1 or num_questions > 20:
            raise HTTPException(status_code=400, detail="Number of questions must be between 1 and 20")
        
        if difficulty not in ["easy", "medium", "hard"]:
            raise HTTPException(status_code=400, detail="Invalid difficulty level")
            
        if interview_type not in ["technical", "behavioral", "system_design", "mixed"]:
            raise HTTPException(status_code=400, detail="Invalid interview type")
        
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Save the uploaded file
        file_path = os.path.join("uploads", f"{uuid.uuid4()}_{file.filename}")
        logger.info(f"Saving file to: {file_path}")
        
        try:
            content = await file.read()
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            logger.info(f"File saved successfully: {file_path}")
        except Exception as e:
            logger.error(f"Error saving file: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
        
        # Extract text from PDF
        try:
            logger.info("Extracting text from PDF")
            resume_text = extract_text_from_pdf(file_path)
            if not resume_text.strip():
                raise HTTPException(status_code=400, detail="Could not extract text from PDF. Please ensure the PDF contains text and is not scanned/image-based.")
            logger.info(f"Successfully extracted text from PDF. Length: {len(resume_text)} characters")
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error extracting text from PDF: {str(e)}")
        
        # Create interview parameters
        params = InterviewParams(
            num_questions=num_questions,
            difficulty=difficulty,
            interview_type=interview_type
        )
        
        # Generate questions
        try:
            logger.info("Generating questions from resume text")
            questions = generate_questions(resume_text, params)
            logger.info(f"Successfully generated {len(questions)} questions")
        except Exception as e:
            logger.error(f"Error generating questions: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error generating questions: {str(e)}")
        
        # Create a new session in MongoDB
        try:
            logger.info("Creating new session in MongoDB")
            session_id = str(ObjectId())
            session = {
                "_id": ObjectId(session_id),
                "timestamp": datetime.now(),
                "questions": questions,
                "answers": [],
                "evaluations": [],
                "difficulty": difficulty,
                "interview_type": interview_type,
                "status": "in-progress",
                "resume_text": resume_text  # Store the resume text for reference
            }
            sessions_collection.insert_one(session)
            logger.info(f"Successfully created session with ID: {session_id}")
        except Exception as e:
            logger.error(f"Error creating session in MongoDB: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error creating session: {str(e)}")
        
        return {
            "session_id": session_id,
            "questions": questions
        }
        
    except HTTPException as he:
        # Re-raise HTTP exceptions as they are already properly formatted
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in upload_resume: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the uploaded file
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Cleaned up file: {file_path}")
            except Exception as e:
                logger.error(f"Error cleaning up file {file_path}: {str(e)}")

@api_router.post("/evaluate")
async def evaluate_interview(request: EvaluationRequest):
    try:
        logger.info(f"Starting evaluation for session {request.session_id}")
        
        # Get the session
        session = sessions_collection.find_one({"_id": ObjectId(request.session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Evaluate each answer
        evaluations = []
        for answer in request.answers:
            evaluation = evaluate_answer(answer["question"], answer["answer"])
            evaluations.append(evaluation)
        
        # Update session with evaluations
        sessions_collection.update_one(
            {"_id": ObjectId(request.session_id)},
            {"$set": {"evaluations": evaluations}}
        )
        
        logger.info(f"Successfully evaluated session {request.session_id}")
        return {"feedback": evaluations}
        
    except Exception as e:
        logger.error(f"Error in evaluate_interview: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions")
async def get_sessions():
    try:
        sessions = list(sessions_collection.find().sort("timestamp", -1))
        for session in sessions:
            session["_id"] = str(session["_id"])
        return sessions
    except Exception as e:
        logger.error(f"Error in get_sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions/stats")
async def get_session_statistics():
    try:
        # Get all sessions
        sessions = list(sessions_collection.find())
        
        # Calculate statistics
        total_sessions = len(sessions)
        total_questions = sum(len(session.get('questions', [])) for session in sessions)
        total_answers = sum(len(session.get('answers', [])) for session in sessions)
        
        # Calculate average score
        scores = []
        for session in sessions:
            if 'evaluations' in session and session['evaluations']:
                for eval in session['evaluations']:
                    if isinstance(eval, dict) and 'score' in eval:
                        scores.append(float(eval['score']))
                    elif isinstance(eval, dict) and 'evaluation' in eval:
                        # Handle nested evaluation structure
                        eval_scores = []
                        for key in ['clarity', 'technical_relevance', 'structure', 'communication', 'correctness']:
                            if key in eval['evaluation'] and 'score' in eval['evaluation'][key]:
                                eval_scores.append(float(eval['evaluation'][key]['score']))
                        if eval_scores:
                            scores.append(sum(eval_scores) / len(eval_scores))
        
        average_score = sum(scores) / len(scores) if scores else 0
        
        # Calculate difficulty distribution
        difficulty_distribution = {}
        for session in sessions:
            difficulty = session.get('difficulty', 'unknown')
            difficulty_distribution[difficulty] = difficulty_distribution.get(difficulty, 0) + 1
        
        # Calculate score trend (last 10 sessions)
        score_trend = []
        sorted_sessions = sorted(sessions, key=lambda x: x.get('timestamp', ''), reverse=True)[:10]
        for session in sorted_sessions:
            if 'evaluations' in session and session['evaluations']:
                session_scores = []
                for eval in session['evaluations']:
                    if isinstance(eval, dict) and 'score' in eval:
                        session_scores.append(float(eval['score']))
                    elif isinstance(eval, dict) and 'evaluation' in eval:
                        eval_scores = []
                        for key in ['clarity', 'technical_relevance', 'structure', 'communication', 'correctness']:
                            if key in eval['evaluation'] and 'score' in eval['evaluation'][key]:
                                eval_scores.append(float(eval['evaluation'][key]['score']))
                        if eval_scores:
                            session_scores.append(sum(eval_scores) / len(eval_scores))
                if session_scores:
                    score_trend.append({
                        'date': session.get('timestamp', ''),
                        'score': sum(session_scores) / len(session_scores)
                    })
        
        # Calculate tag distribution
        tag_distribution = {}
        for session in sessions:
            if 'tags' in session:
                for tag in session['tags']:
                    tag_distribution[tag] = tag_distribution.get(tag, 0) + 1
        
        return {
            'total_sessions': total_sessions,
            'total_questions': total_questions,
            'total_answers': total_answers,
            'average_score': round(average_score, 2),
            'difficulty_distribution': difficulty_distribution,
            'score_trend': score_trend,
            'tag_distribution': tag_distribution
        }
    except Exception as e:
        logger.error(f"Error in get_session_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    try:
        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except Exception as e:
        logger.error(f"Error in get_session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/report/{session_id}")
async def get_report(session_id: str):
    try:
        logger.info(f"Fetching report for session {session_id}")
        conn = sqlite3.connect('interview_sessions.db')
        c = conn.cursor()
        
        # Get session details
        c.execute('''
            SELECT 
                s.id,
                s.created_at,
                s.difficulty,
                s.interview_type,
                s.overall_score,
                s.duration,
                COUNT(q.id) as total_questions
            FROM sessions s
            LEFT JOIN questions q ON s.id = q.session_id
            WHERE s.id = ?
            GROUP BY s.id
        ''', (session_id,))
        
        session = c.fetchone()
        
        if not session:
            logger.warning(f"Session {session_id} not found")
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get all questions with their evaluations
        c.execute('''
            SELECT 
                q.question_text,
                q.answer_text,
                q.evaluation_json,
                q.score
            FROM questions q
            WHERE q.session_id = ?
            ORDER BY q.id
        ''', (session_id,))
        
        questions = []
        strengths = set()
        improvements = set()
        
        for row in c.fetchall():
            evaluation = json.loads(row[2]) if row[2] else {}
            question_data = {
                "text": row[0],
                "answer": row[1],
                "feedback": evaluation.get("summary", "No feedback available"),
                "score": row[3] if row[3] is not None else evaluation.get("score", 0) * 10,  # Convert 0-10 scale to percentage
                "evaluation": {
                    "strengths": evaluation.get("strengths", []),
                    "improvements": evaluation.get("improvements", []),
                    "tips": evaluation.get("tips", [])
                }
            }
            questions.append(question_data)
            
            # Collect strengths and improvements from evaluations
            if "strengths" in evaluation:
                strengths.update(evaluation["strengths"])
            if "improvements" in evaluation:
                improvements.update(evaluation["improvements"])
        
        # Calculate overall performance metrics
        total_score = sum(q["score"] for q in questions)
        average_score = total_score / len(questions) if questions else 0
        
        # Prepare the report data
        report_data = {
            "id": session[0],
            "date": session[1],
            "role": session[3].replace("_", " ").title(),
            "difficulty": session[2].capitalize(),
            "duration": session[5] or 0,
            "totalQuestions": session[6],
            "score": average_score,
            "questions": questions,
            "feedback": {
                "strengths": list(strengths),
                "improvements": list(improvements)
            }
        }
        
        conn.close()
        return report_data
        
    except Exception as e:
        logger.error(f"Error fetching report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/report/{session_id}/download")
async def download_report(session_id: str):
    try:
        # In a real application, you would generate a PDF here
        # For now, we'll return a simple text file
        report_text = f"Interview Report for Session {session_id}\n\n"
        report_text += "This is a placeholder for the actual report content.\n"
        report_text += "In a real implementation, this would be a PDF file."
        
        return Response(
            content=report_text,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=interview-report-{session_id}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/report/{session_id}/share")
async def share_report(session_id: str):
    try:
        # In a real application, you would generate a unique shareable link
        # For now, we'll return a mock URL
        share_url = f"http://localhost:3000/report/{session_id}/shared"
        return {"shareUrl": share_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/debug/sessions")
async def debug_list_sessions():
    try:
        logger.info("Fetching all sessions from database")
        conn = sqlite3.connect('interview_sessions.db')
        c = conn.cursor()
        
        # Get all sessions
        c.execute('SELECT id, created_at, interview_type FROM sessions')
        sessions = c.fetchall()
        
        logger.info(f"Found {len(sessions)} sessions")
        
        conn.close()
        
        return {
            "sessions": [
                {
                    "id": session[0],
                    "created_at": session[1],
                    "type": session[2]
                }
                for session in sessions
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/debug/create-test-session")
async def create_test_session():
    try:
        logger.info("Creating test session")
        conn = sqlite3.connect('interview_sessions.db')
        c = conn.cursor()
        
        # Create a test session
        session_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        c.execute('''
            INSERT INTO sessions 
            (id, created_at, num_questions, difficulty, interview_type, overall_score)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            session_id,
            now,
            3,  # num_questions
            "medium",  # difficulty
            "technical",  # interview_type
            85.0  # overall_score
        ))
        
        # Create test questions
        test_questions = [
            {
                "text": "Explain the concept of React hooks and their benefits",
                "answer": "React hooks are functions that let you use state and other React features in functional components...",
                "evaluation": {
                    "summary": "Good understanding of hooks, but could provide more examples",
                    "score": 9,
                    "strengths": ["Clear explanation", "Good technical knowledge"],
                    "improvements": ["Could add more examples", "Mention specific hooks"]
                }
            },
            {
                "text": "How would you optimize a slow database query?",
                "answer": "There are several ways to optimize database queries...",
                "evaluation": {
                    "summary": "Comprehensive answer covering indexing and query optimization",
                    "score": 9.5,
                    "strengths": ["Detailed explanation", "Good practical knowledge"],
                    "improvements": ["Could mention specific database systems"]
                }
            }
        ]
        
        for question in test_questions:
            c.execute('''
                INSERT INTO questions 
                (id, session_id, question_text, answer_text, evaluation_json)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                str(uuid.uuid4()),
                session_id,
                question["text"],
                question["answer"],
                json.dumps(question["evaluation"])
            ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Created test session with ID: {session_id}")
        return {"session_id": session_id}

    except Exception as e:
        logger.error(f"Error creating test session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    try:
        result = sessions_collection.delete_one({"_id": ObjectId(session_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"message": "Session deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/sessions/{session_id}")
async def update_session(session_id: str, notes: str = Form(...)):
    try:
        result = sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {"notes": notes}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"message": "Session updated successfully"}
    except Exception as e:
        logger.error(f"Error updating session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions/search")
async def search_sessions(
    query: str = None,
    difficulty: str = None,
    start_date: str = None,
    end_date: str = None
):
    try:
        # Build the query filter
        filter_query = {}
        
        if query:
            filter_query["interview_type"] = {"$regex": query, "$options": "i"}
        
        if difficulty and difficulty != "all":
            filter_query["difficulty"] = difficulty.lower()
        
        if start_date and end_date:
            filter_query["timestamp"] = {
                "$gte": datetime.fromisoformat(start_date),
                "$lte": datetime.fromisoformat(end_date)
            }
        
        # Execute the query
        sessions = list(sessions_collection.find(filter_query).sort("timestamp", -1))
        
        # Convert ObjectId to string for JSON serialization
        for session in sessions:
            session["_id"] = str(session["_id"])
        
        return sessions
    except Exception as e:
        logger.error(f"Error searching sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions/{session_id}/feedback/rating")
async def rate_feedback(
    session_id: str,
    question_index: int = Form(...),
    rating: int = Form(...)
):
    try:
        # Validate rating
        if rating < 1 or rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
        # Update the session with the rating
        result = sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {f"feedback_ratings.{question_index}": rating}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Rating saved successfully"}
    except Exception as e:
        logger.error(f"Error saving rating: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions/{session_id}/feedback/comment")
async def add_comment(
    session_id: str,
    question_index: int = Form(...),
    comment: str = Form(...)
):
    try:
        # Update the session with the comment
        result = sessions_collection.update_one(
            {"_id": ObjectId(session_id)},
            {"$set": {f"comments.{question_index}": comment}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Comment saved successfully"}
    except Exception as e:
        logger.error(f"Error saving comment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions/{session_id}/export")
async def export_report(session_id: str):
    try:
        # Get the session
        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Convert ObjectId to string for JSON serialization
        session["_id"] = str(session["_id"])
        
        # Generate PDF content
        pdf_content = generate_pdf_report(session)
        
        # Return the PDF file
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=interview-report-{session_id}.pdf"
            }
        )
    except Exception as e:
        logger.error(f"Error exporting report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def generate_pdf_report(session):
    """Generate a PDF report for the interview session"""
    # Create a buffer to store the PDF
    buffer = io.BytesIO()
    
    # Create the PDF document
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=18,
        spaceAfter=20
    )
    
    # Content
    content = []
    
    # Title
    content.append(Paragraph(f"Interview Report - {session['interview_type']}", title_style))
    content.append(Paragraph(f"Date: {session['timestamp']}", styles['Normal']))
    content.append(Spacer(1, 20))
    
    # Questions and Answers
    for i, (question, answer, evaluation) in enumerate(zip(
        session['questions'],
        session['answers'],
        session['evaluations']
    )):
        content.append(Paragraph(f"Question {i+1}: {question['text']}", heading_style))
        content.append(Paragraph("Your Answer:", styles['Heading3']))
        content.append(Paragraph(answer or "No answer provided", styles['Normal']))
        
        if evaluation:
            content.append(Paragraph("Feedback:", styles['Heading3']))
            content.append(Paragraph(evaluation['summary'], styles['Normal']))
            
            # Strengths
            content.append(Paragraph("Strengths:", styles['Heading4']))
            for strength in evaluation['strengths']:
                content.append(Paragraph(f"• {strength}", styles['Normal']))
            
            # Areas for Improvement
            content.append(Paragraph("Areas for Improvement:", styles['Heading4']))
            for improvement in evaluation['improvements']:
                content.append(Paragraph(f"• {improvement}", styles['Normal']))
        
        content.append(Spacer(1, 20))
    
    # Build the PDF
    doc.build(content)
    
    # Get the PDF content
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return pdf_content

@app.post("/api/tags")
async def create_tag(tag: Tag):
    try:
        # Check if tag already exists
        existing_tag = tags_collection.find_one({"name": tag.name})
        if existing_tag:
            raise HTTPException(status_code=400, detail="Tag already exists")
        
        # Create new tag
        tag_id = str(ObjectId())
        tags_collection.insert_one({
            "_id": ObjectId(tag_id),
            "name": tag.name,
            "color": tag.color,
            "created_at": datetime.now()
        })
        
        return {"tag_id": tag_id}
    except Exception as e:
        logger.error(f"Error creating tag: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions/{session_id}/tags")
async def add_tag_to_session(session_id: str, tag_name: str):
    try:
        # Check if session exists
        session = sessions_collection.find_one({"_id": ObjectId(session_id)})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Check if tag exists
        tag = tags_collection.find_one({"name": tag_name})
        if not tag:
            raise HTTPException(status_code=404, detail="Tag not found")
        
        # Add tag to session
        session_tags_collection.insert_one({
            "session_id": session_id,
            "tag_name": tag_name,
            "added_at": datetime.now()
        })
        
        return {"message": "Tag added successfully"}
    except Exception as e:
        logger.error(f"Error adding tag to session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions/export")
async def export_sessions(request: ExportRequest):
    try:
        # Get selected sessions
        sessions = []
        for session_id in request.session_ids:
            session = sessions_collection.find_one({"_id": ObjectId(session_id)})
            if session:
                sessions.append(session)
        
        if not sessions:
            raise HTTPException(status_code=404, detail="No sessions found")
        
        # Prepare data based on format
        if request.format == "json":
            return Response(
                content=json.dumps(sessions, default=str),
                media_type="application/json",
                headers={"Content-Disposition": "attachment; filename=sessions.json"}
            )
        elif request.format == "csv":
            # Convert sessions to CSV format
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write header
            headers = ["Session ID", "Date", "Interview Type", "Difficulty", "Score"]
            if request.include_questions:
                headers.extend(["Question", "Answer", "Evaluation"])
            writer.writerow(headers)
            
            # Write data
            for session in sessions:
                for i in range(len(session.get("questions", []))):
                    row = [
                        str(session["_id"]),
                        session["timestamp"].isoformat(),
                        session.get("interview_type", ""),
                        session.get("difficulty", ""),
                        calculate_average_score(session.get("evaluations", []))
                    ]
                    if request.include_questions:
                        row.extend([
                            session["questions"][i]["text"],
                            session["answers"][i] if i < len(session["answers"]) else "",
                            json.dumps(session["evaluations"][i]) if i < len(session["evaluations"]) else ""
                        ])
                    writer.writerow(row)
            
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=sessions.csv"}
            )
        elif request.format == "pdf":
            # Generate PDF report
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            styles = getSampleStyleSheet()
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30
            )
            
            # Content
            content = []
            
            # Title
            content.append(Paragraph("Interview Sessions Report", title_style))
            content.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            content.append(Spacer(1, 20))
            
            # Session details
            for session in sessions:
                content.append(Paragraph(f"Session {str(session['_id'])}", styles['Heading2']))
                content.append(Paragraph(f"Date: {session['timestamp']}", styles['Normal']))
                content.append(Paragraph(f"Type: {session['interview_type']}", styles['Normal']))
                content.append(Paragraph(f"Difficulty: {session['difficulty']}", styles['Normal']))
                
                if request.include_questions:
                    content.append(Paragraph("Questions and Answers:", styles['Heading3']))
                    for i, question in enumerate(session.get("questions", [])):
                        content.append(Paragraph(f"Q{i+1}: {question['text']}", styles['Normal']))
                        if i < len(session.get("answers", [])):
                            content.append(Paragraph(f"A: {session['answers'][i]}", styles['Normal']))
                        if request.include_evaluations and i < len(session.get("evaluations", [])):
                            eval = session['evaluations'][i]
                            content.append(Paragraph(f"Score: {eval.get('score', 'N/A')}", styles['Normal']))
                            content.append(Paragraph(f"Feedback: {eval.get('summary', 'N/A')}", styles['Normal']))
                
                content.append(Spacer(1, 20))
            
            # Build PDF
            doc.build(content)
            pdf_data = buffer.getvalue()
            buffer.close()
            
            return Response(
                content=pdf_data,
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=sessions.pdf"}
            )
        else:
            raise HTTPException(status_code=400, detail="Unsupported export format")
    except Exception as e:
        logger.error(f"Error exporting sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sessions/compare")
async def compare_sessions(request: ComparisonRequest):
    try:
        if len(request.session_ids) != 2:
            raise HTTPException(status_code=400, detail="Exactly 2 sessions must be selected for comparison")
        
        # Get sessions
        sessions = []
        for session_id in request.session_ids:
            session = sessions_collection.find_one({"_id": ObjectId(session_id)})
            if not session:
                raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
            sessions.append(session)
        
        # Prepare comparison data
        comparison = {
            "sessions": [
                {
                    "id": str(session["_id"]),
                    "timestamp": session["timestamp"],
                    "interview_type": session["interview_type"],
                    "difficulty": session["difficulty"],
                    "score": calculate_average_score(session.get("evaluations", [])),
                    "questions_answered": len(session.get("answers", [])),
                    "total_questions": len(session.get("questions", [])),
                    "tags": [tag["tag_name"] for tag in session_tags_collection.find({"session_id": str(session["_id"])})]
                }
                for session in sessions
            ],
            "differences": {
                "score_difference": abs(
                    calculate_average_score(sessions[0].get("evaluations", [])) -
                    calculate_average_score(sessions[1].get("evaluations", []))
                ),
                "question_count_difference": abs(
                    len(sessions[0].get("questions", [])) -
                    len(sessions[1].get("questions", []))
                ),
                "time_difference": abs(
                    (sessions[0]["timestamp"] - sessions[1]["timestamp"]).total_seconds()
                )
            }
        }
        
        return comparison
    except Exception as e:
        logger.error(f"Error comparing sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def calculate_average_score(evaluations):
    if not evaluations:
        return 0
    scores = [eval.get("score", 0) for eval in evaluations]
    return sum(scores) / len(scores)

# Include the router in the app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)