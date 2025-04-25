import React from 'react';
import { motion } from 'framer-motion';

const ProgressIndicator = ({ currentStep, totalSteps, stepLabels }) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex justify-between mb-2">
        {stepLabels.map((label, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`text-sm font-medium ${
              index <= currentStep ? 'text-indigo-600' : 'text-gray-400'
            }`}
          >
            {label}
          </motion.div>
        ))}
      </div>

      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute top-0 left-0 h-full bg-indigo-600"
        />

        <div className="absolute top-0 left-0 w-full h-full flex">
          {stepLabels.map((_, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: index <= currentStep ? 1 : 0 }}
              transition={{ delay: index * 0.1 }}
              className={`w-3 h-3 rounded-full border-2 ${
                index <= currentStep
                  ? 'bg-indigo-600 border-indigo-600'
                  : 'bg-white border-gray-300'
              }`}
              style={{
                marginLeft: index === 0 ? '0' : '-6px',
                marginTop: '-4px',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator; 