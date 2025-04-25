import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import VideoRecorder from '../components/VideoRecorder';

const InterviewSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionData, setSessionData] = useState({
    answers: [],
    evaluations: [],
    timestamps: []
  });
  const [isComplete, setIsComplete] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Session timeout (30 minutes)
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  const [timeLeft, setTimeLeft] = useState(SESSION_TIMEOUT);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          handleSessionTimeout();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSessionTimeout = () => {
    setError('Session timed out. Please start a new interview.');
    // Save partial session data
    savePartialSession();
  };

  const savePartialSession = async () => {
    try {
      await axios.post('http://localhost:8000/api/save-partial-session', {
        session_id: sessionId,
        data: sessionData
      });
    } catch (error) {
      console.error('Error saving partial session:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/questions/${sessionId}`, {
        timeout: 10000
      });
      
      if (!response.data.questions || !Array.isArray(response.data.questions)) {
        throw new Error('Invalid questions data received');
      }

      setQuestions(response.data.questions);
      setLoading(false);
      setError('');
    } catch (error) {
      console.error('Error fetching questions:', error);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(fetchQuestions, 2000 * (retryCount + 1)); // Exponential backoff
      } else {
        setError('Failed to load questions. Please try again later.');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [sessionId]);

  const handleTranscriptionComplete = async (data) => {
    try {
      // Validate transcription data
      if (!data.transcription || typeof data.transcription !== 'string') {
        throw new Error('Invalid transcription data');
      }

      setSessionData(prev => ({
        answers: [...prev.answers, data.transcription],
        evaluations: [...prev.evaluations, data.evaluation || ''],
        timestamps: [...prev.timestamps, data.timestamp || new Date().toISOString()]
      }));

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setIsComplete(true);
      }
    } catch (error) {
      console.error('Error handling transcription:', error);
      setError('Failed to process your answer. Please try again.');
    }
  };

  const handleFinishInterview = async () => {
    try {
      if (sessionData.answers.length !== questions.length) {
        throw new Error('Not all questions have been answered');
      }

      const response = await axios.post('http://localhost:8000/api/interview/generate-report', {
        session_data: {
          ...sessionData,
          questions: questions.map(q => q.question)
        }
      }, {
        timeout: 30000
      });

      if (!response.data.report) {
        throw new Error('Invalid report data received');
      }
      
      setReport(response.data.report);
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;

    const element = document.createElement('a');
    const file = new Blob([report], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `interview-report-${sessionId}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">
          {retryCount > 0 ? `Retrying... (${retryCount}/${MAX_RETRIES})` : 'Loading questions...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-xl text-red-500 mb-4">{error}</div>
        <button
          onClick={() => navigate('/upload')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start New Interview
        </button>
      </div>
    );
  }

  if (isComplete && report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Interview Report</h1>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <pre className="whitespace-pre-line">{report}</pre>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Download Report
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">No questions found for this session</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Interview Session</h1>
          <div className="text-sm text-gray-600">
            Time remaining: {formatTime(timeLeft)}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {currentQuestion.type}
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {currentQuestion.difficulty}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {currentQuestion.question}
        </h2>
        
        {currentQuestion.expected_keywords && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Expected Keywords:</h3>
            <div className="flex flex-wrap gap-2">
              {currentQuestion.expected_keywords.map((keyword, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <VideoRecorder
          question={currentQuestion.question}
          sessionId={sessionId}
          onTranscriptionComplete={handleTranscriptionComplete}
        />
      </div>

      {isComplete && (
        <button
          onClick={handleFinishInterview}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Finish Interview
        </button>
      )}
    </div>
  );
};

export default InterviewSession; 