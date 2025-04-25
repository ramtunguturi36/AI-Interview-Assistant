import React from 'react';
import { motion } from 'framer-motion';

function FeedbackDisplay({ feedback }) {
  if (!feedback) return null;

  const { score, feedback: feedbackDetails } = feedback;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Score Display */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-block"
        >
          <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-4xl font-bold text-indigo-600">{score}%</span>
          </div>
        </motion.div>
      </div>

      {/* Strengths */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-green-50 p-4 rounded-lg"
      >
        <h4 className="text-lg font-semibold text-green-800 mb-2">Strengths</h4>
        <ul className="list-disc list-inside space-y-1">
          {feedbackDetails.strengths.map((strength, index) => (
            <li key={index} className="text-green-700">{strength}</li>
          ))}
        </ul>
      </motion.div>

      {/* Areas for Improvement */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-yellow-50 p-4 rounded-lg"
      >
        <h4 className="text-lg font-semibold text-yellow-800 mb-2">Areas for Improvement</h4>
        <ul className="list-disc list-inside space-y-1">
          {feedbackDetails.improvements.map((improvement, index) => (
            <li key={index} className="text-yellow-700">{improvement}</li>
          ))}
        </ul>
      </motion.div>

      {/* Overall Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-blue-50 p-4 rounded-lg"
      >
        <h4 className="text-lg font-semibold text-blue-800 mb-2">Overall Feedback</h4>
        <p className="text-blue-700">{feedbackDetails.overall}</p>
      </motion.div>
    </motion.div>
  );
}

export default FeedbackDisplay; 