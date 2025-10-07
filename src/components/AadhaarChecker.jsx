// src/components/AadhaarChecker.jsx
import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { validateAadhaar } from '../utils/aadhaarValidator';
import AadhaarInput from './AadhaarInput';
import FileUpload from './FileUpload';
import CameraCapture from './CameraCapture';
import './AadhaarChecker.css';

export default function AadhaarChecker() {
  const [textInput, setTextInput] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [lastImageSrc, setLastImageSrc] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // {valid, masked}
  const [dark, setDark] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Typed input validation
  function handleTextValidate() {
    setResult(null);
    setStatus({ type: 'idle', message: '' });
    const r = validateAadhaar(textInput);
    if (r.valid) {
      setResult(r);
      setStatus({ type: 'success', message: 'Yay! Aadhaar number format & checksum are valid.' });
    } else {
      setResult(null);
      setStatus({ type: 'error', message: r.reason });
    }
  }

  // OCR processing
  async function runOCRFromBlob(blob) {
    setProcessing(true);
    setStatus({ type: 'info', message: 'Extracting text from image...' });
    try {
      const { data } = await Tesseract.recognize(blob, 'eng', {
        logger: m => { /* optional progress */ }
      });
      const text = (data && data.text) ? data.text.replace(/\s+/g, ' ') : '';
      validateAadhaarFromText(text);
    } catch (err) {
      console.error('Tesseract error:', err);
      setStatus({ type: 'error', message: 'OCR failed — please try again.' });
    } finally {
      setProcessing(false);
    }
  }

  function validateAadhaarFromText(text) {
    const match = text.match(/\b[0-9]{12}\b/);
    if (match) {
      const candidate = match[0];
      const r = validateAadhaar(candidate);
      if (r.valid) {
        setResult(r);
        setStatus({ type: 'success', message: 'Yay! Aadhaar number format & checksum are valid.' });
      } else {
        setResult(null);
        setStatus({ type: 'error', message: r.reason });
      }
    } else {
      // fallback sliding window
      const digitsOnly = text.replace(/[^0-9]/g, '');
      let found = null;
      for (let i = 0; i + 12 <= digitsOnly.length; i++) {
        const seq = digitsOnly.slice(i, i + 12);
        if (/^[2-9]/.test(seq)) {
          const r = validateAadhaar(seq);
          if (r.valid) { found = { seq, r }; break; }
        }
      }
      if (found) {
        setResult(found.r);
        setStatus({ type: 'success', message: 'Yay! Aadhaar number format & checksum are valid.' });
      } else {
        setResult(null);
        setStatus({ type: 'error', message: "No valid Aadhaar detected. Try retaking the photo (improve focus/lighting)." });
      }
    }
  }

  // File upload handler
  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatus({ type: 'error', message: 'Please upload an image file.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      setLastImageSrc(src);
      fetch(src).then(res => res.blob()).then(blob => runOCRFromBlob(blob));
    };
    reader.readAsDataURL(file);
  }

  // Camera: start
  async function startCamera() {
    setStatus({ type: 'idle', message: '' });

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus({ type: 'error', message: 'Camera API not supported in this browser.' });
      return;
    }

    try {
      // Request camera - environment preferred on mobile; browsers may ignore on desktop
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;

      if (!videoRef.current) {
        console.warn('videoRef is not attached to a DOM element yet.');
        setStatus({ type: 'error', message: 'Internal error: video element missing.' });
        return;
      }

      // Attach stream and wait for metadata so videoWidth/videoHeight are set
      videoRef.current.srcObject = stream;

      // If metadata already available, try play; otherwise wait for event
      const playVideo = async () => {
        try {
          await videoRef.current.play();
          console.log('Video playing, dimensions:', videoRef.current.videoWidth, videoRef.current.videoHeight);
        } catch (err) {
          console.warn('video play() failed:', err);
          // Some browsers require user gesture; we already performed startCamera via button click (user gesture) so this usually works
        }
      };

      if (videoRef.current.readyState >= 1) { // HAVE_METADATA or more
        await playVideo();
      } else {
        // Wait for metadata then play
        videoRef.current.onloadedmetadata = async () => {
          await playVideo();
        };
      }

      setStatus({ type: 'info', message: 'Camera opened. Align Aadhaar and press Capture.' });
    } catch (err) {
      console.error('getUserMedia error:', err);
      // err.name could be 'NotAllowedError' (permission denied) or 'NotFoundError' (no camera)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStatus({ type: 'error', message: 'Camera permission denied. Please allow camera access.' });
      } else if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        setStatus({ type: 'error', message: 'No camera found or constraints could not be satisfied.' });
      } else {
        setStatus({ type: 'error', message: 'Unable to access camera. Use HTTPS and grant permission.' });
      }
    }
  }

  // Camera: stop
  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus({ type: 'idle', message: '' });
  }

  // Capture photo from video
  function capturePhoto() {
    if (!videoRef.current) {
      setStatus({ type: 'error', message: 'Camera is not active.' });
      return;
    }

    // Use available video dimensions; fall back to client size if needed
    const videoEl = videoRef.current;
    let w = videoEl.videoWidth;
    let h = videoEl.videoHeight;

    if (!w || !h) {
      // fallback: use CSS rendered size
      const rect = videoEl.getBoundingClientRect();
      w = Math.max(320, Math.round(rect.width));
      h = Math.max(240, Math.round(rect.height));
    }

    const canvas = canvasRef.current;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, w, h);

    const dataUrl = canvas.toDataURL('image/png');
    setLastImageSrc(dataUrl);

    // Stop camera to save battery / privacy (optional)
    stopCamera();

    // Convert dataURL to blob and run OCR
    fetch(dataUrl).then(res => res.blob()).then(blob => runOCRFromBlob(blob));
  }

  function resetAll() {
    setTextInput('');
    setStatus({ type: 'idle', message: '' });
    setLastImageSrc(null);
    setProcessing(false);
    setResult(null);
    stopCamera();
  }

  return (
    <div className={`app ${dark ? 'dark' : ''}`}>
      <div className="container">
        <header>
          <h1>Verify Aadhaar Number Format Validity</h1>
          <p className="sub">Don’t worry — we don’t upload or save any personal information.</p>
        </header>

        <section className="card">
          <AadhaarInput
            value={textInput}
            onChange={(e) => setTextInput(e.target.value.replace(/[^0-9]/g, ''))}
            onValidate={handleTextValidate}
            onClear={() => { setTextInput(''); setStatus({ type: 'idle', message: '' }); }}
          />

          <FileUpload onFileChange={handleFileChange} />

          <CameraCapture
            onStart={startCamera}
            onCapture={capturePhoto}
            onStop={stopCamera}
            videoRef={videoRef}
          />

          {processing && <div className="status info">⏳ Extracting text from image...</div>}
          {status.type === 'error' && <div className="status error">{status.message}</div>}
          {status.type === 'success' && <div className="status success">{status.message}</div>}
          {status.type === 'info' && <div className="status info">{status.message}</div>}

          {lastImageSrc && (
            <div className="preview">
              <p>Preview:</p>
              <img src={lastImageSrc} alt="preview" style={{ maxWidth: 220, borderRadius: 8 }} />
            </div>
          )}

          {result && result.valid && (
            <div className="result">
              <p className="big">✅ Valid Aadhaar</p>
              <div className="masked">{result.masked}</div>
              <CopyToClipboard text={result.masked} onCopy={() => alert('Masked Aadhaar copied')}>
                <button>Copy Masked</button>
              </CopyToClipboard>
            </div>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </section>

        <footer>
          <p>Client-side OCR and validation only. Deploy on HTTPS for camera access.</p>
          <div className="footer-actions">
            <button onClick={resetAll}>Home</button>
            <button onClick={() => setDark(d => !d)}>{dark ? 'Light' : 'Dark'} Mode</button>
          </div>
        </footer>
      </div>
    </div>
  );
}