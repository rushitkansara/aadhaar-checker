import React from 'react';
import { createRoot } from 'react-dom/client';
import AadhaarChecker from './components/AadhaarChecker';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<AadhaarChecker />);
