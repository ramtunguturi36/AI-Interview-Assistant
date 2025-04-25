import React, { useRef } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'framer-motion';

function WebcamDisplay({ isRecording }) {
  const webcamRef = useRef(null);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative rounded-lg overflow-hidden shadow-md"
    >
      <Webcam
        ref={webcamRef}
        audio={false}
        className="w-full h-full object-cover"
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user"
        }}
      />
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium">Recording</span>
        </div>
      )}
    </motion.div>
  );
}

export default WebcamDisplay; 