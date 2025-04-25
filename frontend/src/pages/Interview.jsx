import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import RecordingControls from '../components/RecordingControls';
import TranscriptionDisplay from '../components/TranscriptionDisplay';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

function Interview() {
  const [currentQuestion, setCurrentQuestion] = useState({ question: '' });
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState([]);
  const [showReview, setShowReview] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (location.state?.questions) {
      setQuestions(location.state.questions);
      setCurrentQuestion(location.state.questions[0]);
      setSessionId(location.state.sessionId);
    } else if (location.state?.resumeSummary) {
      generateQuestions(location.state.resumeSummary);
    } else {
      navigate('/upload-resume');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (!isPaused && !showReview) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isPaused, showReview]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const generateQuestions = async (resumeSummary) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', new Blob([resumeSummary], { type: 'text/plain' }), 'resume.txt');
      formData.append('num_questions', 10); // Default value
      formData.append('difficulty', 'medium'); // Default value
      formData.append('interview_type', 'technical'); // Default value

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.session_id || !response.data.questions) {
        throw new Error('Invalid response from server');
      }

      setQuestions(response.data.questions);
      setCurrentQuestion(response.data.questions[0]);
      setSessionId(response.data.session_id);
    } catch (err) {
      setError('Failed to generate questions. Please try again.');
      console.error('Error generating questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      if (mediaRecorderRef.current) {
        // Clean up previous recording if exists
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('question', currentQuestion.question);
        formData.append('session_id', sessionId);
        formData.append('is_final', false); // Not final until user confirms

        try {
          setIsProcessing(true);
          const response = await api.post('/transcribe', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          setTranscription(response.data.transcription);
          // Don't store in answers array yet - wait for user confirmation
        } catch (err) {
          setError('Failed to transcribe audio. Please try again.');
          console.error('Transcription error:', err);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to access microphone. Please check your permissions.');
      console.error('Microphone access error:', err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRetry = () => {
    setTranscription('');
    handleStartRecording();
  };

  const handleConfirmAnswer = async () => {
    if (!transcription) return;

    try {
      setIsProcessing(true);
      // Send the transcription again with is_final=true to store it
      const formData = new FormData();
      formData.append('audio', new Blob(chunksRef.current, { type: 'audio/webm' }), 'recording.webm');
      formData.append('question', currentQuestion.question);
      formData.append('session_id', sessionId);
      formData.append('is_final', true);

      const response = await api.post('/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Store the final answer
      setAnswers(prev => [...prev, {
        question: currentQuestion.question,
        answer: response.data.transcription
      }]);

      // Move to next question
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setCurrentQuestion(questions[nextIndex]);
        setTranscription('');
      } else {
        setShowReview(true);
      }
    } catch (err) {
      setError('Failed to confirm answer. Please try again.');
      console.error('Confirmation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitInterview = async () => {
    try {
      setLoading(true);
      const response = await api.post('/evaluate', {
        session_id: sessionId,
        answers: answers.map(answer => ({
          question: answer.question,
          answer: answer.answer
        }))
      });

      navigate('/feedback', { 
        state: { 
          feedback: response.data.feedback,
          sessionId: sessionId
        } 
      });
    } catch (err) {
      setError('Failed to submit interview. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !isRecording) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      <div className="max-w-4xl mx-auto relative">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 transform hover:scale-[1.01] transition-all duration-300">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h2>
            <div className="text-gray-600 font-medium">
              Time: {formatTime(timeElapsed)}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {currentQuestion.question}
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <TranscriptionDisplay transcription={transcription} />
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            {!transcription ? (
              <RecordingControls
                isRecording={isRecording}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
              />
            ) : (
              <div className="flex space-x-4">
                <button
                  onClick={handleRetry}
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-full font-semibold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition-colors duration-200"
                >
                  Retry
                </button>
                <button
                  onClick={handleConfirmAnswer}
                  disabled={isProcessing}
                  className="px-6 py-3 rounded-full font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                >
                  {isProcessing ? 'Processing...' : 'Next Question'}
                </button>
              </div>
            )}
          </div>

          {showReview && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Review Your Answers
              </h3>
              <div className="space-y-4">
                {answers.map((answer, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">Question {index + 1}:</p>
                    <p className="text-gray-600 mb-2">{answer.question}</p>
                    <p className="font-medium text-gray-900">Your Answer:</p>
                    <p className="text-gray-600">{answer.answer}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleSubmitInterview}
                className="mt-6 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Submit Interview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Interview;