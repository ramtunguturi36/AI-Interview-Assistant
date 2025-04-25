import React from 'react';
import { motion } from 'framer-motion';

export default function RecordingControls({ isRecording, onStartRecording, onStopRecording, onNextQuestion }) {
  return (
    <div className="flex justify-center space-x-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isRecording ? onStopRecording : onStartRecording}
        className={`px-6 py-3 rounded-full font-semibold text-white ${
          isRecording 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-indigo-500 hover:bg-indigo-600'
        } transition-colors duration-200`}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </motion.button>
      
      {!isRecording && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNextQuestion}
          className="px-6 py-3 rounded-full font-semibold text-indigo-600 bg-indigo-100 hover:bg-indigo-200 transition-colors duration-200"
        >
          Next Question
        </motion.button>
      )}
    </div>
  );
}
