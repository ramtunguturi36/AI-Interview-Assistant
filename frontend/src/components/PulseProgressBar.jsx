import React from 'react';
import { motion } from 'framer-motion';

function PulseProgressBar({ 
  progress, 
  color = 'indigo',
  height = 'h-2',
  showPercentage = true,
  className = ''
}) {
  const colors = {
    indigo: {
      bg: 'bg-indigo-200 dark:bg-indigo-900',
      fill: 'bg-indigo-600 dark:bg-indigo-400',
      text: 'text-indigo-600 dark:text-indigo-400'
    },
    green: {
      bg: 'bg-green-200 dark:bg-green-900',
      fill: 'bg-green-600 dark:bg-green-400',
      text: 'text-green-600 dark:text-green-400'
    },
    red: {
      bg: 'bg-red-200 dark:bg-red-900',
      fill: 'bg-red-600 dark:bg-red-400',
      text: 'text-red-600 dark:text-red-400'
    },
    yellow: {
      bg: 'bg-yellow-200 dark:bg-yellow-900',
      fill: 'bg-yellow-600 dark:bg-yellow-400',
      text: 'text-yellow-600 dark:text-yellow-400'
    }
  };

  const selectedColor = colors[color];

  return (
    <div className={`w-full relative ${className}`}>
      {showPercentage && (
        <div className="flex justify-between mb-1">
          <span className={`text-xs font-medium ${selectedColor.text}`}>
            Progress
          </span>
          <span className={`text-xs font-medium ${selectedColor.text}`}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
      <div className={`w-full ${selectedColor.bg} rounded-full overflow-hidden ${height}`}>
        <motion.div
          className={`${selectedColor.fill} ${height} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.div
          className={`${selectedColor.fill} ${height} rounded-full opacity-30`}
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '30%'
          }}
        />
      </div>
    </div>
  );
}

export default PulseProgressBar; 