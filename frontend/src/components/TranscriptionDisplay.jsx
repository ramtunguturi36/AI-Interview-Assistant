import React from 'react';
import { motion } from 'framer-motion';

export default function TranscriptionDisplay({ transcription }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg p-6 shadow-md"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Response</h3>
      <div className="min-h-[100px] p-4 bg-gray-50 rounded-md">
        {transcription ? (
          <p className="text-gray-700">{transcription}</p>
        ) : (
          <p className="text-gray-400 italic">Your transcribed response will appear here...</p>
        )}
      </div>
    </motion.div>
  );
}