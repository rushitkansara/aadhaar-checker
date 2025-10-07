// src/components/FileUpload.jsx
import React from 'react';

export default function FileUpload({ onFileChange }) {
  return (
    <div className="row">
      <label>Upload Aadhaar photo</label>
      <input type="file" accept="image/*" onChange={onFileChange} />
      <small>jpeg, png recommended</small>
    </div>
  );
}
