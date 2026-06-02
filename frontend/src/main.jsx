// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './styles/main.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

// Global error handler for runtime errors
window.addEventListener('error', (event) => {
  console.error('Runtime Error:', event.error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);