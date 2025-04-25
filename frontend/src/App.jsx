import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import ResumeUpload from './pages/ResumeUpload';
import Interview from './pages/Interview';
import Feedback from './pages/Feedback';
import Sessions from './pages/Sessions';
import Report from './pages/Report';
import Settings from './pages/Settings';
import InterviewSession from './pages/InterviewSession';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/upload-resume" element={<ResumeUpload />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/report/:id" element={<Report />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/interview/:sessionId" element={<InterviewSession />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 