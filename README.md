# Aadhaar Card Checker

A simple React-based web app that validates Aadhaar numbers by checking:
	1.	Format Validation – Aadhaar must be 12 digits, first digit between 2–9.
	2.	Checksum Validation – Uses Verhoeff Algorithm to verify last digit.
	3.	OCR Verification – Upload Aadhaar card photo, extract text, check number validity.
	4.	Live Camera Capture – Take photo with webcam and verify Aadhaar number.

Privacy Note: No Aadhaar number, photo, or personal data is stored or uploaded anywhere. Everything runs in the browser.


## Features

	•	Enter Aadhaar number manually & verify instantly
	•	Upload Aadhaar card photo (JPG/PNG) → OCR extracts Aadhaar number → Validate
	•	Use camera to capture Aadhaar card → OCR + Validate
	•	Error handling for blurry images / unclear text
	•	Friendly UI messages (“Try again if unclear”, “Yay! Aadhaar number is valid”)


## Tech Stack

	•	Frontend: React (CRA)
	•	OCR: Tesseract.js
	•	Camera Capture: Browser MediaDevices API
	•	Validation: Custom Aadhaar format + Verhoeff checksum


## Folder Structure

- aadhaar-checker/
- ├── public/
- │   └── index.html
- ├── src/
- │   ├── components/
- │   │   ├── AadhaarInput.js       # Textbox input + validation
- │   │   ├── FileUpload.js         # Upload image + OCR + validation
- │   │   ├── CameraCapture.js      # Live webcam capture + OCR + validation
- │   ├── utils/
- │   │   └── verhoeff.js           # Verhoeff checksum algorithm
- │   ├── App.js                    # Main app layout
- │   ├── index.js                  # React entry point
- │   └── styles.css                # Styling
- ├── package.json
- └── README.md


## Setup & Run Locally

/# Clone repo
git clone https://github.com/your-username/aadhaar-checker.git
cd aadhaar-checker

/# Install dependencies
npm install

/# Run app
npm start


## How Validation Works

	1.	Manual Input
	    •	Regex checks Aadhaar format → Verhoeff validates checksum
	2.	Image Upload
	    •	OCR extracts Aadhaar number from photo → Validate as above
	3.	Camera Capture
	    •	Opens webcam → Capture → OCR → Validate
	    •	If unclear, error message asks to retake photo


## Troubleshooting

	•	react-scripts: command not found → Run npm install react-scripts --save
	•	Camera not opening → Check browser permission for camera
	•	OCR failing on blur → Ensure Aadhaar number is clearly visible, good lighting


## Future Improvements

	•	Support for remaining 22 Aadhaar supported languages
    •	Mobile-optimized camera scanning
	•	Offline OCR model for faster validation
	•	QR code scanning support
