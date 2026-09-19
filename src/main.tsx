import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Proactively clear stale cache from previous sessions
try {
  ['meetadr_hospitals', 'meetadr_hospitals_v2', 'meetadr_doctors', 'meetadr_doctors_v2', 'meetadr_appointments', 'meetadr_appointments_v2'].forEach(
    (k) => localStorage.removeItem(k)
  );
} catch {
  // Ignore in environments without localStorage
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
