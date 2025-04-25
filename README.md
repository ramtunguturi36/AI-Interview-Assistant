# AI Mock Interview Platform

An AI-powered mock interview platform that helps users practice interviews with instant feedback.

## Features

- Resume upload and parsing
- AI-generated interview questions
- Audio recording and transcription
- Instant feedback and scoring
- User feedback collection

## Project Structure

```
.
├── frontend/           # React frontend application (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
└── backend/           # FastAPI backend application
    ├── app/
    │   ├── routes/
    │   ├── services/
    │   └── models/
    └── requirements.txt
```

## Setup Instructions

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Technologies Used

- Frontend: React, Vite, TailwindCSS, Axios
- Backend: FastAPI, Python
- AI/ML: OpenAI Whisper API, PDF parsing libraries 