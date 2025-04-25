import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiFilter, FiCalendar, FiPlus, FiTrash2, FiEdit2, FiRefreshCw,
  FiBarChart2, FiDownload, FiTrendingUp, FiTag, FiPieChart, FiShare2
} from 'react-icons/fi';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const navigate = useNavigate();

  // Add new state for animations
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // New state variables for additional features
  const [showStats, setShowStats] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [stats, setStats] = useState({});
  const [comparisonData, setComparisonData] = useState([]);

  useEffect(() => {
    fetchSessions();
    fetchStatistics();
  }, [dateRange, selectedTags]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/sessions');
      
      // Transform the data if needed to match the expected structure
      const transformedSessions = response.data.map(session => ({
        ...session,
        questions: session.questions || [],
        answers: session.answers || [],
        evaluations: session.evaluations || [],
        interview_type: session.interview_type || session.interviewType || 'Technical',
        difficulty: session.difficulty || 'Medium',
        timestamp: session.timestamp || session.created_at || new Date().toISOString()
      }));
      
      setSessions(transformedSessions);
    } catch (err) {
      setError('Failed to fetch sessions. Please try again.');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await api.delete(`/sessions/${sessionId}`);
      setSessions(sessions.filter(session => session._id !== sessionId));
    } catch (err) {
      setError('Failed to delete session. Please try again.');
      console.error('Error deleting session:', err);
    }
  };

  const handleSaveNotes = async (sessionId) => {
    try {
      await api.patch(`/sessions/${sessionId}`, { notes });
      setSessions(sessions.map(session => 
        session._id === sessionId ? { ...session, notes } : session
      ));
      setShowNotesModal(false);
    } catch (err) {
      setError('Failed to save notes. Please try again.');
      console.error('Error saving notes:', err);
    }
  };

  const handleRetryQuestion = (sessionId, questionIndex) => {
    navigate('/interview', {
      state: {
        sessionId,
        questionIndex,
        retryMode: true
      }
    });
  };

  const filteredSessions = sessions.filter(session => {
    // Apply search filter
    if (searchQuery && !session.interview_type.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply difficulty filter
    if (filter !== 'all' && session.difficulty.toLowerCase() !== filter.toLowerCase()) {
      return false;
    }
    
    // Apply date range filter
    if (dateRange.start && dateRange.end) {
      const sessionDate = new Date(session.timestamp);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      if (sessionDate < startDate || sessionDate > endDate) {
        return false;
      }
    }
    
    return true;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.timestamp) - new Date(a.timestamp);
    } else if (sortBy === 'score') {
      const scoreA = calculateAverageScore(a.evaluations);
      const scoreB = calculateAverageScore(b.evaluations);
      return scoreB - scoreA;
    }
    return 0;
  });

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

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-indigo-100 text-indigo-800';
      case 'medium':
        return 'bg-indigo-200 text-indigo-800';
      case 'hard':
        return 'bg-indigo-300 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalSessions = sessions.length;
    const totalQuestions = sessions.reduce((acc, session) => acc + (session.questions?.length || 0), 0);
    const totalAnswers = sessions.reduce((acc, session) => acc + (session.answers?.length || 0), 0);
    const averageScore = sessions.reduce((acc, session) => acc + calculateAverageScore(session.evaluations || []), 0) / totalSessions || 0;
    
    const difficultyDistribution = sessions.reduce((acc, session) => {
      const difficulty = session.difficulty || 'unknown';
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {});

    const scoreTrend = sessions.map(session => ({
      date: session.timestamp || new Date().toISOString(),
      score: calculateAverageScore(session.evaluations || [])
    }));

    return {
      totalSessions,
      totalQuestions,
      totalAnswers,
      averageScore,
      difficultyDistribution,
      scoreTrend
    };
  };

  const sessionStats = calculateStats();

  // Chart data with null checks
  const scoreChartData = {
    labels: (sessionStats?.score_trend || []).map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Score Trend',
        data: (sessionStats?.score_trend || []).map(item => item.score),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.1
      }
    ]
  };

  const difficultyChartData = {
    labels: Object.keys(sessionStats?.difficulty_distribution || {}),
    datasets: [
      {
        data: Object.values(sessionStats?.difficulty_distribution || {}),
        backgroundColor: [
          'rgb(99, 102, 241)',
          'rgb(79, 70, 229)',
          'rgb(67, 56, 202)'
        ]
      }
    ]
  };

  // Handle session selection for comparison
  const handleSessionSelect = (sessionId) => {
    setSelectedSessions(prev => {
      if (prev.includes(sessionId)) {
        return prev.filter(id => id !== sessionId);
      }
      if (prev.length < 2) {
        return [...prev, sessionId];
      }
      return prev;
    });
  };

  // Handle tag management
  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleExportSessions = async () => {
    try {
      const response = await api.post('/sessions/export', {
        session_ids: selectedSessions,
        format: exportFormat,
        include_questions: true,
        include_answers: true,
        include_evaluations: true
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sessions-export.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export sessions');
      console.error('Error exporting sessions:', err);
    }
  };

  const handleCompareSessions = async () => {
    try {
      const response = await api.post('/sessions/compare', {
        session_ids: selectedSessions,
        compare_by: ['score', 'difficulty', 'interview_type']
      });
      setComparisonData(response.data);
      setShowComparison(true);
    } catch (err) {
      setError('Failed to compare sessions');
      console.error('Error comparing sessions:', err);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/sessions/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const handleCreateTag = async () => {
    try {
      await api.post('/tags', { name: newTag });
      setTags([...tags, newTag]);
      setNewTag('');
      setShowTagModal(false);
    } catch (err) {
      setError('Failed to create tag');
      console.error('Error creating tag:', err);
    }
  };

  const handleAddTagToSession = async (sessionId, tagName) => {
    try {
      await api.post(`/sessions/${sessionId}/tags`, { tag_name: tagName });
      setSessions(sessions.map(session => 
        session._id === sessionId
          ? { ...session, tags: [...(session.tags || []), tagName] }
          : session
      ));
    } catch (err) {
      setError('Failed to add tag to session');
      console.error('Error adding tag to session:', err);
    }
  };

  const handleShowStats = () => {
    console.log('Toggling stats visibility');
    setShowStats(prev => !prev);
  };

  const handleNewSession = () => {
    console.log('Navigating to new session');
    navigate('/upload-resume');
  };

  const toggleSession = (sessionId) => {
    console.log('Toggling session:', sessionId);
    setExpandedSessionId(prevId => {
      const newId = prevId === sessionId ? null : sessionId;
      console.log('Setting expandedSessionId to:', newId);
      return newId;
    });
  };

  if (loading) {
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
            onClick={fetchSessions}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview Sessions</h1>
          <div className="flex space-x-4">
            <button
              onClick={handleShowStats}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FiBarChart2 className="mr-2" />
              {showStats ? 'Hide Stats' : 'Show Stats'}
            </button>
            <button
              onClick={handleNewSession}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <FiPlus className="mr-2" />
              New Session
            </button>
          </div>
        </div>

        {/* Stats Section */}
        {showStats && (
          <div className="mb-8">
            <StatisticsDashboard />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <ScoreTrendChart />
              <DifficultyDistributionChart />
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="space-y-6">
          {sortedSessions.map((session) => (
            <div
              key={session._id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              {/* Compact View */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {session.interview_type} Interview
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(session.difficulty)}`}>
                      {session.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(session.timestamp)}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Score</p>
                    <p className="text-lg font-bold text-indigo-600">
                      {Math.round(calculateAverageScore(session.evaluations || []) * 10)}/10
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Questions</p>
                    <p className="text-lg font-bold text-indigo-600">
                      {session.questions?.length || 0}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSession(session._id)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                  >
                    <motion.div
                      animate={{ rotate: expandedSessionId === session._id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.div>
                  </button>
                </div>
              </div>

              {/* Expanded View */}
              {expandedSessionId === session._id && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Questions Section */}
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900">Questions & Answers</h4>
                      <div className="space-y-4">
                        {session.questions && session.questions.map((question, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-4"
                          >
                            <div className="flex items-start space-x-3">
                              <span className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-medium">
                                {index + 1}
                              </span>
                              <div className="flex-1">
                                <p className="text-gray-700 font-medium">
                                  {typeof question === 'object' ? question.text || question.question : question}
                                </p>
                                {session.answers && session.answers[index] && (
                                  <div className="mt-2 pl-4 border-l-2 border-indigo-200">
                                    <p className="text-sm text-gray-600">Your Answer:</p>
                                    <p className="text-gray-700">
                                      {typeof session.answers[index] === 'object' ? 
                                        session.answers[index].answer || session.answers[index].text : 
                                        session.answers[index]}
                                    </p>
                                  </div>
                                )}
                                {session.evaluations && session.evaluations[index] && (
                                  <div className="mt-2 flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">Score:</span>
                                    <span className="font-medium text-indigo-600">
                                      {Math.round((
                                        typeof session.evaluations[index] === 'object' ? 
                                          session.evaluations[index].score || 0 : 
                                          session.evaluations[index] || 0
                                      ) * 10)}/10
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Session Actions */}
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900">Actions</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleRetryQuestion(session._id, 0)}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <FiRefreshCw className="w-5 h-5" />
                          <span>Retry Session</span>
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setExpandedSessionId(session._id);
                            setNotes(session.notes || '');
                            setShowNotesModal(true);
                          }}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <FiEdit2 className="w-5 h-5" />
                          <span>Add Notes</span>
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('/feedback', { state: { feedback: session.evaluations } })}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <FiBarChart2 className="w-5 h-5" />
                          <span>View Feedback</span>
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDeleteSession(session._id)}
                          className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <FiTrash2 className="w-5 h-5" />
                          <span>Delete Session</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showNotesModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white/90 backdrop-blur-md rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-xl font-medium text-gray-900 mb-4">Add Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-32 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
              placeholder="Add your notes here..."
            />
            <div className="mt-4 flex justify-end space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotesModal(false)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSaveNotes(expandedSessionId)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Save
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Tag Modal */}
      {showTagModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-medium text-gray-900 mb-4">Add New Tag</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 rounded-lg border-gray-300"
                placeholder="Enter tag name"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateTag}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
              >
                Add
              </motion.button>
            </div>
            <div className="mt-4 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowTagModal(false)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Comparison Modal */}
      {showComparison && <ComparisonModal />}
    </div>
  );
}

const StatisticsDashboard = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
  >
    <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl transform hover:scale-[1.01] transition-all duration-300">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Total Sessions</h3>
      <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
        {stats.total_sessions}
      </p>
    </div>
    <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl transform hover:scale-[1.01] transition-all duration-300">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Questions Answered</h3>
      <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
        {stats.total_answers}/{stats.total_questions}
      </p>
    </div>
    <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl transform hover:scale-[1.01] transition-all duration-300">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Average Score</h3>
      <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
        {stats.average_score.toFixed(1)}/10
      </p>
    </div>
  </motion.div>
);

const ScoreTrendChart = () => (
  <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl transform hover:scale-[1.01] transition-all duration-300">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Score Trend</h3>
    <Line
      data={{
        labels: stats.score_trend.map(item => new Date(item.date).toLocaleDateString()),
        datasets: [{
          label: 'Score',
          data: stats.score_trend.map(item => item.score),
          borderColor: 'rgb(99, 102, 241)',
          tension: 0.1
        }]
      }}
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          }
        }
      }}
    />
  </div>
);

const DifficultyDistributionChart = () => (
  <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl transform hover:scale-[1.01] transition-all duration-300">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Difficulty Distribution</h3>
    <Pie
      data={{
        labels: Object.keys(stats.difficulty_distribution),
        datasets: [{
          data: Object.values(stats.difficulty_distribution),
          backgroundColor: [
            'rgb(99, 102, 241)',
            'rgb(79, 70, 229)',
            'rgb(67, 56, 202)'
          ]
        }]
      }}
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          }
        }
      }}
    />
  </div>
);

const ComparisonModal = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white rounded-lg p-6 max-w-4xl w-full"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Comparison</h2>
      <div className="grid grid-cols-2 gap-6">
        {comparisonData.sessions.map((session, index) => (
          <div key={session.id} className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Session {index + 1}</h3>
            <p className="text-gray-600">Date: {new Date(session.timestamp).toLocaleDateString()}</p>
            <p className="text-gray-600">Type: {session.interview_type}</p>
            <p className="text-gray-600">Difficulty: {session.difficulty}</p>
            <p className="text-gray-600">Score: {session.score.toFixed(1)}/10</p>
            <p className="text-gray-600">Questions: {session.questions_answered}/{session.total_questions}</p>
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-900">Tags:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {session.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Differences</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Score Difference</p>
            <p className="text-xl font-semibold text-gray-900">
              {comparisonData.differences.score_difference.toFixed(1)}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Question Count Difference</p>
            <p className="text-xl font-semibold text-gray-900">
              {comparisonData.differences.question_count_difference}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Time Difference</p>
            <p className="text-xl font-semibold text-gray-900">
              {Math.floor(comparisonData.differences.time_difference / 3600)} hours
            </p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowComparison(false)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          Close
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
);

export default Sessions; 