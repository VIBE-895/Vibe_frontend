import React, { useState } from "react";
import { FaMicrophone, FaUpload } from "react-icons/fa";
import { motion } from "framer-motion";
import axios from "axios";
import "../styles/Vibe.css";

const VibeApp = () => {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [totalTime, setTotalTime] = useState(null);

  const handleAudioProcessing = async (file) => {
    setProcessing(true);
    setStatus("Uploading audio...");
    setResult(null); // 清空之前的结果
    setTotalTime(null);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      setStatus("Processing audio...");
      const response = await axios.post("http://127.0.0.1:5656/summarize/v1", formData);
      setResult(response.data.data);
      setTotalTime(response.data.metaData.totalTime);
    } catch (error) {
      setStatus("Error processing audio.");
      alert("Failed to process audio. Please try again later.");
    }

    setProcessing(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) handleAudioProcessing(file);
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <h1 className="logo">VIBE</h1>
      </nav>
      
      <div className="content">
        <h2 className="title artistic-title">VIBE – Voice Interpretation and Brief Extraction</h2>
        <div className="button-container">
          {!processing ? (
            <>
              <input type="file" accept="audio/*" onChange={handleFileUpload} hidden id="upload-input" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="button upload-button"
                onClick={() => document.getElementById("upload-input").click()}
              >
                <FaUpload /> Upload Audio
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="button record-button"
              >
                <FaMicrophone /> Record Audio
              </motion.button>
            </>
          ) : (
            <div className="processing">
              <div className="spinner"></div>
              <p>{status}</p>
            </div>
          )}
        </div>
        
        {result && (
          <div className="result">
            <h2>Processing Time</h2>
            <p className="total-time">Total Time: {totalTime?.toFixed(2)} seconds</p>
            <div className="summary-container">
              <h2>Summary</h2>
              <p><strong>Topic:</strong> {result.topic}</p>
              <p><strong>Context:</strong> {result.setting}</p>
              <p><strong>Key Terms:</strong> {result.key_terms.join(", ")}</p>
              <p><strong>Summary:</strong> {result.summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VibeApp;
