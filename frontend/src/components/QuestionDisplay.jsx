import React from 'react';
import { motion } from 'framer-motion';

function QuestionDisplay({ question, questionNumber, totalQuestions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Question {questionNumber}</h3>
        <span className="text-sm text-gray-500">{questionNumber} of {totalQuestions}</span>
      </div>
      <p className="text-gray-600 leading-relaxed">{question}</p>
    </motion.div>
  );
}

export default QuestionDisplay; 