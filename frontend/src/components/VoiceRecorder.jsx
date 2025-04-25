import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const VoiceRecorder = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateWaveform = () => {
        analyserRef.current.getByteTimeDomainData(dataArray);
        setAudioData([...dataArray]);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          onRecordingComplete(event.data);
        }
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      updateWaveform();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="h-32 mb-4 relative overflow-hidden">
        {audioData.map((value, index) => (
          <motion.div
            key={index}
            className="absolute bottom-0 w-1 bg-indigo-500"
            style={{
              left: `${(index / audioData.length) * 100}%`,
              height: `${(value / 128) * 100}%`,
            }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.1 }}
          />
        ))}
      </div>
      
      <div className="flex justify-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`px-6 py-3 rounded-full font-semibold text-white ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-indigo-500 hover:bg-indigo-600'
          } transition-colors duration-200`}
        >
          {isProcessing ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : isRecording ? (
            'Stop Recording'
          ) : (
            'Start Recording'
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default VoiceRecorder; 