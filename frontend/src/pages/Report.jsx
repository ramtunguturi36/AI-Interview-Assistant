import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { saveAs } from 'file-saver';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

function Report() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [debugError, setDebugError] = useState('');
  const navigate = useNavigate();
  const [feedbackRatings, setFeedbackRatings] = useState({});
  const [comments, setComments] = useState({});
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    fetchSessionDetails();
    fetchAvailableSessions();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sessions/${sessionId}`);
      setSession(response.data);
      
      // Initialize feedback ratings and comments
      const initialRatings = {};
      const initialComments = {};
      response.data.questions.forEach((_, index) => {
        initialRatings[index] = 0;
        initialComments[index] = '';
      });
      setFeedbackRatings(initialRatings);
      setComments(initialComments);
    } catch (err) {
      setError('Failed to fetch session details. Please try again.');
      console.error('Error fetching session details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSessions = async () => {
    try {
      const response = await api.get('/debug/sessions');
      setAvailableSessions(response.data.sessions);
      setDebugError('');
    } catch (err) {
      console.error('Failed to fetch available sessions:', err);
      setDebugError('Unable to fetch available sessions. Please try again later.');
      setAvailableSessions([]);
    }
  };

  const calculateAverageScore = (evaluations) => {
    if (!evaluations || evaluations.length === 0) return 0;
    const scores = evaluations.map(evaluation => evaluation.score || 0);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/report/${sessionId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `interview-report-${sessionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download report');
    }
  };

  const handleShare = async () => {
    try {
      const response = await api.post(`/report/${sessionId}/share`);
      setShowShareModal(true);
      navigator.clipboard.writeText(response.data.shareUrl);
    } catch (err) {
      setError('Failed to generate share link');
    }
  };

  const createTestSession = async () => {
    try {
      setLoading(true);
      const response = await api.post('/debug/create-test-session');
      const newSessionId = response.data.session_id;
      navigate(`/report/${newSessionId}`);
    } catch (err) {
      setError('Failed to create test session. Please try again.');
      setLoading(false);
    }
  };

  const handleRatingChange = async (questionIndex, rating) => {
    try {
      await api.post(`/sessions/${sessionId}/feedback/rating`, {
        questionIndex,
        rating
      });
      setFeedbackRatings(prev => ({
        ...prev,
        [questionIndex]: rating
      }));
    } catch (err) {
      setError('Failed to save rating. Please try again.');
      console.error('Error saving rating:', err);
    }
  };

  const handleCommentSubmit = async () => {
    try {
      await api.post(`/sessions/${sessionId}/feedback/comment`, {
        questionIndex: selectedQuestion,
        comment: comments[selectedQuestion]
      });
      setShowCommentModal(false);
    } catch (err) {
      setError('Failed to save comment. Please try again.');
      console.error('Error saving comment:', err);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get(`/sessions/${sessionId}/export`, {
        responseType: 'blob'
      });
      saveAs(response.data, `interview-report-${sessionId}.pdf`);
    } catch (err) {
      setError('Failed to export report. Please try again.');
      console.error('Error exporting report:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-4">{error}</p>
          <button
            onClick={() => navigate('/sessions')}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Session not found</h3>
          <p className="mt-2 text-gray-500">
            The requested interview session could not be found.
          </p>
          <button
            onClick={() => navigate('/sessions')}
            className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview Report</h1>
          <button
            onClick={handleExportPDF}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Export PDF
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {session.interview_type} Interview
            </h2>
            <p className="text-gray-500">
              {formatDate(session.timestamp)}
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-sm text-gray-500">Questions Answered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {session.answers.length} / {session.questions.length}
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-sm text-gray-500">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {calculateAverageScore(session.evaluations).toFixed(1)} / 10
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-sm text-gray-500">Difficulty</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {session.difficulty}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {session.questions.map((question, index) => (
              <div key={index} className="border-b border-gray-200 pb-8">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Question {index + 1}: {question.text}
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRatingChange(index, star)}
                          className="text-yellow-400 hover:text-yellow-500"
                        >
                          {star <= feedbackRatings[index] ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedQuestion(index);
                        setShowCommentModal(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-md font-medium text-gray-700 mb-2">Your Answer:</h4>
                  <p className="text-gray-600">{session.answers[index] || 'No answer provided'}</p>
                </div>

                {session.evaluations[index] && (
                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-700 mb-2">Feedback:</h4>
                    <p className="text-gray-600">{session.evaluations[index].summary}</p>
                    
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Strengths:</h5>
                      <ul className="list-disc list-inside text-gray-600">
                        {session.evaluations[index].strengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Areas for Improvement:</h5>
                      <ul className="list-disc list-inside text-gray-600">
                        {session.evaluations[index].improvements.map((improvement, i) => (
                          <li key={i}>{improvement}</li>
                        ))}
                      </ul>
                    </div>

                    {comments[index] && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Your Notes:</h5>
                        <p className="text-gray-600">{comments[index]}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comment Modal */}
        {showCommentModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Comment</h3>
              <textarea
                value={comments[selectedQuestion]}
                onChange={(e) => setComments(prev => ({
                  ...prev,
                  [selectedQuestion]: e.target.value
                }))}
                className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Add your comment here..."
              />
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setShowCommentModal(false)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCommentSubmit}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Share Report</h3>
            <p className="text-gray-600 mb-4">
              Share this link with others to view the report:
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={session.shareUrl}
                readOnly
                className="flex-1 p-2 border rounded-md"
              />
              <button
                onClick={() => navigator.clipboard.writeText(session.shareUrl)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Report; 