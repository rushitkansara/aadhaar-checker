// src/components/CameraCapture.jsx
import React from 'react';

export default function CameraCapture({ onStart, onCapture, onStop, videoRef }) {
  return (
    <div className="row">
      <label>Take Aadhaar photo</label>
      <div style={{ marginBottom: 8 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', maxWidth: 420, borderRadius: 8, background: '#000' }}
        />
      </div>
      <div className="camera-actions">
        <button onClick={onStart}>Open Camera</button>
        <button onClick={onCapture}>Capture</button>
        <button onClick={onStop}>Stop Camera</button>
      </div>
    </div>
  );
}
