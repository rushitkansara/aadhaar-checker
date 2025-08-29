// src/components/AadhaarChecker.jsx
import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { validateAadhaar } from '../utils/aadhaarValidator';

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

  // OCR processing (same logic as before)
  async function runOCRFromBlob(blob) {
    setProcessing(true);
    setStatus({ type: 'info', message: 'Extracting text from image...' });
    try {
      const { data } = await Tesseract.recognize(blob, 'eng', {
        logger: m => { /* optional progress */ }
      });
      const text = (data && data.text) ? data.text.replace(/\s+/g, ' ') : '';
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
    } catch (err) {
      console.error('Tesseract error:', err);
      setStatus({ type: 'error', message: 'OCR failed — please try again.' });
    } finally {
      setProcessing(false);
    }
  }

  // File upload handler (unchanged)
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
          <div className="row">
            <label>Type Aadhaar number</label>
            <input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Enter 12-digit Aadhaar"
            />
            <div className="row-actions">
              <button onClick={handleTextValidate}>Validate</button>
              <button onClick={() => { setTextInput(''); setStatus({ type: 'idle', message: '' }); }}>Clear</button>
            </div>
          </div>

          <div className="row">
            <label>Upload Aadhaar photo</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            <small>jpeg, png recommended</small>
          </div>

          <div className="row">
            <label>Take Aadhaar photo</label>

            {/* VIDEO ELEMENT: this was missing previously — necessary for videoRef */}
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
              <button onClick={startCamera}>Open Camera</button>
              <button onClick={capturePhoto}>Capture</button>
              <button onClick={stopCamera}>Stop Camera</button>
            </div>
          </div>

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

      {/* inline styles (same as before) */}
      <style>{`
        :root { font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
        .app { padding: 20px; min-height: 100vh; background: #f6f7fb; color: #0f172a; }
        .app.dark { background: #0b1220; color: #e6eef8; }
        .container { max-width: 820px; margin: 0 auto; }
        header h1 { margin: 0 0 6px 0; font-size: 22px; }
        .sub { margin: 0 0 18px 0; opacity: 0.85; }
        .card { background: #fff; padding: 18px; border-radius: 12px; box-shadow: 0 6px 18px rgba(16,24,40,0.06); }
        .app.dark .card { background: rgba(255,255,255,0.03); box-shadow: none; }
        .row { margin-bottom: 14px; }
        label { display:block; font-weight:600; margin-bottom:6px; }
        input[type="text"], input[type="file"], input[type="number"], textarea { width:100%; padding:10px; border-radius:8px; border:1px solid #e6eef8; }
        .row-actions { margin-top:8px; display:flex; gap:8px; }
        button { background:#0b69ff; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; }
        button:disabled { opacity:0.6; cursor:not-allowed; }
        .camera-actions { display:flex; gap:8px; align-items:center; }
        .status { margin-top:10px; padding:8px; border-radius:8px; }
        .status.info { background:#eef2ff; color:#1e40af; }
        .status.error { background:#fff1f2; color:#9f1239; }
        .status.success { background:#ecfdf5; color:#065f46; }
        .preview img { max-width:220px; border-radius:8px; margin-top:8px; }
        .result { margin-top:12px; padding:12px; border-radius:8px; background:#f0fdf4; }
        .result .big { font-weight:700; }
        .masked { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace; margin-top:8px; }
        footer { margin-top:18px; display:flex; justify-content:space-between; align-items:center; }
        .footer-actions { display:flex; gap:8px; }
      `}</style>
    </div>
  );
}
