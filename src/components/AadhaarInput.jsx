// src/components/AadhaarInput.jsx
import React from 'react';

export default function AadhaarInput({ value, onChange, onValidate, onClear }) {
  return (
    <div className="row">
      <label>Type Aadhaar number</label>
      <input
        value={value}
        onChange={onChange}
        placeholder="Enter 12-digit Aadhaar"
      />
      <div className="row-actions">
        <button onClick={onValidate}>Validate</button>
        <button onClick={onClear}>Clear</button>
      </div>
    </div>
  );
}
