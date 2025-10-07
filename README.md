# Aadhaar Card Number Validity Verifier

A simple React-based web app that validates Aadhaar numbers by checking:

1.  **Format Validation** – Aadhaar must be 12 digits, first digit between 2–9.
2.  **Checksum Validation** – Uses Verhoeff Algorithm to verify the last digit.
3.  **OCR Verification** – Upload Aadhaar card photo, extract text, and check number validity.
4.  **Live Camera Capture** – Take a photo with a webcam and verify the Aadhaar number.

**Privacy Note:** No Aadhaar number, photo, or personal data is stored or uploaded anywhere. Everything runs in the browser.

## Demo

*[A short GIF or screenshot showing the app in action would be great here!]*

## Live Demo

*[Link to a live demo if you have one]*

## Demo Video



https://github.com/user-attachments/assets/a566ea34-9bb3-4df0-a0d0-0d32f887bab5




## Features

*   Enter Aadhaar number manually & verify instantly
*   Upload Aadhaar card photo (JPG/PNG) → OCR extracts Aadhaar number → Validate
*   Use a camera to capture Aadhaar card → OCR + Validate
*   Error handling for blurry images / unclear text
*   Friendly UI messages (“Try again if unclear”, “Yay! Aadhaar number is valid”)

## Tech Stack

*   Frontend: React (v18.2.0)
*   OCR: Tesseract.js (v5.0.5)
*   Camera Capture: Browser MediaDevices API
*   Validation: Custom Aadhaar format + Verhoeff checksum

## Folder Structure

```
aadhaar-checker/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── AadhaarChecker.jsx
│   │   ├── AadhaarInput.jsx
│   │   ├── CameraCapture.jsx
│   │   └── FileUpload.jsx
│   ├── utils/
│   │   ├── aadhaarValidator.js
│   │   └── verhoeff.js
│   ├── index.css
│   └── index.js
├── .gitignore
├── package.json
└── README.md
```

## Setup & Run Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/aadhaar-checker.git
    cd aadhaar-checker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the app:**
    ```bash
    npm start
    ```

## How Validation Works

1.  **Manual Input:**
    *   Regex checks Aadhaar format → Verhoeff validates checksum.
2.  **Image Upload:**
    *   OCR extracts the Aadhaar number from the photo → Validate as above.
3.  **Camera Capture:**
    *   Opens webcam → Capture → OCR → Validate.
    *   If unclear, an error message asks to retake the photo.

## Troubleshooting

*   `react-scripts: command not found` → Run `npm install react-scripts --save`
*   Camera not opening → Check browser permission for the camera.
*   OCR failing on blur → Ensure the Aadhaar number is clearly visible, with good lighting.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Future Improvements

*   Support for the remaining 22 Aadhaar supported languages
*   Mobile-optimized camera scanning
*   Offline OCR model for faster validation
*   QR code scanning support