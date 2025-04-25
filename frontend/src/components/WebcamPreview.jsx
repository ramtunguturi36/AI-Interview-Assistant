import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Webcam from 'react-webcam';

function WebcamPreview({ isRecording }) {
  const webcamRef = useRef(null);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-lg overflow-hidden shadow-lg"
    >
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={videoConstraints}
        className="w-full h-full object-cover"
      />
      {isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 right-4 flex items-center space-x-2 bg-red-500 text-white px-3 py-1 rounded-full"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-medium">Recording</span>
        </motion.div>
      )}
    </motion.div>
  );
}

export default WebcamPreview; 