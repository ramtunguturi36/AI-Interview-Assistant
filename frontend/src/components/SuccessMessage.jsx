import React from 'react';
import { motion } from 'framer-motion';

export default function SuccessMessage({ message, onContinue }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-green-50 border border-green-200 rounded-lg p-4"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-green-700">{message}</p>
        </div>
        {onContinue && (
          <div className="ml-auto pl-3">
            <button
              onClick={onContinue}
              className="text-sm font-medium text-green-600 hover:text-green-500"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}