import React from 'react';
import { motion } from 'framer-motion';

function QuestionCard({ question, isActive }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isActive ? 1 : 0.5,
        y: 0,
        scale: isActive ? 1 : 0.95
      }}
      transition={{ duration: 0.3 }}
      className={`p-6 rounded-lg shadow-lg ${
        isActive 
          ? 'bg-white border-2 border-indigo-500' 
          : 'bg-gray-50 border border-gray-200'
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <p className={`text-lg font-medium ${
            isActive ? 'text-gray-900' : 'text-gray-500'
          }`}>
            {question}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default QuestionCard; 