import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import LoginPlugin from './utils/LoginPlugin';
import ChatrankaPlug from './view/chatranka/ChatrankaPlug';
import { checkLoginStatus } from './utils/login';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          checkLoginStatus() ? <Navigate to="/chatranka" /> : <LoginPlugin />
        } />
        <Route path="/chatranka" element={
          checkLoginStatus() ? <ChatrankaPlug /> : <Navigate to="/login" />
        } />
        <Route path="*" element={
          checkLoginStatus() ? <Navigate to="/chatranka" /> : <Navigate to="/login" />
        } />
      </Routes>
    </BrowserRouter>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
