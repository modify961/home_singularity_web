import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

// 受保护的路由组件
const ProtectedRoute = ({ redirectPath = '/login' }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // 如果正在加载认证状态，显示加载中
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        正在加载...
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;