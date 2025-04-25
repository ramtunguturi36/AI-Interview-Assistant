import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

function SessionHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sessions');
      setSessions(response.data.sessions);
    } catch (err) {
      setError('Failed to fetch sessions. Please try again.');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionDetails = async (sessionId) => {
    try {
      setLoading(true);
      const response = await api.get(`/sessions/${sessionId}`);
      setSelectedSession(response.data);
    } catch (err) {
      setError('Failed to fetch session details. Please try again.');
      console.error('Error fetching session details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatScore = (score) => {
    return score ? score.toFixed(1) : 'N/A';
  };

  if (loading && !selectedSession) {
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
            onClick={() => window.location.reload()}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
          <button
            onClick={() => navigate('/upload-resume')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Start New Interview
          </button>
        </div>

        {selectedSession ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Session Details
              </h2>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Back to List
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Session Information
                </h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(selectedSession.session.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">
                      {selectedSession.session.interview_type.replace('_', ' ')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Difficulty</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">
                      {selectedSession.session.difficulty}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Questions</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {selectedSession.session.num_questions}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Performance Summary
                </h3>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <svg className="w-32 h-32">
                      <circle
                        className="text-gray-200"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r="56"
                        cx="64"
                        cy="64"
                      />
                      <circle
                        className="text-indigo-600"
                        strokeWidth="8"
                        strokeDasharray={`${(selectedSession.session.overall_score || 0) * 10} 100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="56"
                        cx="64"
                        cy="64"
                      />
                    </svg>
                    <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-indigo-600">
                      {formatScore(selectedSession.session.overall_score)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {selectedSession.questions.map((q, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Question {index + 1}
                    </h4>
                    <p className="mt-2 text-gray-700">{q.question}</p>
                  </div>

                  {q.answer && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-500">Your Answer</h5>
                      <p className="mt-2 text-gray-700">{q.answer}</p>
                    </div>
                  )}

                  {q.evaluation && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h5 className="text-sm font-medium text-gray-500 mb-4">
                        Evaluation
                      </h5>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Overall Score
                            </span>
                            <span className="text-sm font-bold text-indigo-600">
                              {formatScore(q.evaluation.score)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-indigo-600 h-2.5 rounded-full"
                              style={{ width: `${(q.evaluation.score || 0) * 10}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <h6 className="text-sm font-medium text-green-800 mb-2">
                              Strengths
                            </h6>
                            <ul className="space-y-1">
                              {q.evaluation.strengths.map((strength, i) => (
                                <li key={i} className="text-sm text-green-700">
                                  • {strength}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-red-50 p-4 rounded-lg">
                            <h6 className="text-sm font-medium text-red-800 mb-2">
                              Areas for Improvement
                            </h6>
                            <ul className="space-y-1">
                              {q.evaluation.improvements.map((improvement, i) => (
                                <li key={i} className="text-sm text-red-700">
                                  • {improvement}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <h6 className="text-sm font-medium text-gray-700 mb-2">
                            Revised Answer
                          </h6>
                          <p className="text-sm text-gray-600">
                            {q.evaluation.revised_answer}
                          </p>
                        </div>

                        <div>
                          <h6 className="text-sm font-medium text-gray-700 mb-2">
                            Improvement Tips
                          </h6>
                          <ul className="space-y-1">
                            {q.evaluation.tips.map((tip, i) => (
                              <li key={i} className="text-sm text-gray-600">
                                {i + 1}. {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => fetchSessionDetails(session.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {session.interview_type.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(session.created_at)}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm capitalize">
                    {session.difficulty}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {session.num_questions} questions
                  </div>
                  <div className="flex items-center">
                    <span className="text-lg font-bold text-indigo-600 mr-2">
                      {formatScore(session.average_score)}
                    </span>
                    <span className="text-sm text-gray-500">/10</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionHistory; 