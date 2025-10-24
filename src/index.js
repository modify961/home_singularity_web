import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './css/index.css';
import "./utils/fetchs";
import reportWebVitals from './reportWebVitals';
import { BusProvider } from './utils/BusProvider';
import LoginPlugin from './view/auth/LoginPlugin';
import ChatApp from './components/ChatApp';
import { AuthProvider } from './utils/AuthContext';
import ProtectedRoute from './utils/ProtectedRoute';
import PublicRoute from './utils/PublicRoute';
import { DialogProvider } from './components/tips/DialogProvider';


const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* 公共路由 - 不需要登录 */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPlugin />} />
          </Route>
          
          {/* 受保护路由 - 需要登录 */}
          <Route element={<ProtectedRoute />}>
            <Route path="/chatapp" element={<ChatApp />} />
          </Route>
          
          {/* 默认路由重定向 */}
          <Route path="*" element={<Navigate to="/chatapp" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // 将全局事件总线注入整个应用
  <DialogProvider>
    <BusProvider>
      <App />
    </BusProvider>
  </DialogProvider>
);

reportWebVitals();
