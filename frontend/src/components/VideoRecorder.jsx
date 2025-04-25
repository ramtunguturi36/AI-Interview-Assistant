import React, { useRef, useState } from 'react';
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

const VideoRecorder = ({ question, sessionId, onTranscriptionComplete }) => {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [evaluation, setEvaluation] = useState('');

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('video', blob);
        formData.append('question', question);
        formData.append('session_id', sessionId);
        
        try {
          const response = await api.post('/transcribe', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          
          setTranscription(response.data.transcription);
          setEvaluation(response.data.evaluation);
          onTranscriptionComplete(response.data);
        } catch (error) {
          console.error('Error transcribing video:', error);
        }
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  return (
    <div className="video-recorder">
      <video
        ref={videoRef}
        autoPlay
        muted
        className="w-full max-w-2xl rounded-lg shadow-lg"
      />
      
      <div className="mt-4 flex gap-4">
        <button
          onClick={startRecording}
          disabled={isRecording}
          className={`px-4 py-2 rounded ${
            isRecording ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          Start Recording
        </button>
        
        <button
          onClick={stopRecording}
          disabled={!isRecording}
          className={`px-4 py-2 rounded ${
            !isRecording ? 'bg-gray-400' : 'bg-red-500 hover:bg-red-600'
          } text-white`}
        >
          Stop Recording
        </button>
      </div>
      
      {transcription && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Transcription:</h3>
          <p className="bg-gray-100 p-4 rounded">{transcription}</p>
        </div>
      )}
      
      {evaluation && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Evaluation:</h3>
          <p className="bg-gray-100 p-4 rounded whitespace-pre-line">{evaluation}</p>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder; 