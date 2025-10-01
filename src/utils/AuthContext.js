import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // 清除登录信息
  const clearLogin = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user_info');
    sessionStorage.removeItem('token_expire');
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  // 检查认证状态
  const checkAuth = () => {
    setIsLoading(true);

    const token = sessionStorage.getItem('token');
    const userInfoStr = sessionStorage.getItem('user_info');
    const expire = sessionStorage.getItem('token_expire');

    // 没有 token
    if (!token || !expire) {
      clearLogin();
      setIsAuthenticated(false);
      setUserInfo(null);
      setIsLoading(false);
      return;
    }

    // 过期检查
    const now = Date.now();
    if (now > parseInt(expire, 10)) {
      // 已过期
      clearLogin();
      setIsAuthenticated(false);
      setUserInfo(null);
      setIsLoading(false);
      return;
    }

    // token 有效
    setIsAuthenticated(true);
    if (userInfoStr) {
      try {
        setUserInfo(JSON.parse(userInfoStr));
      } catch (e) {
        console.error('Failed to parse user info:', e);
      }
    }

    setIsLoading(false);
  };

  // 登录函数
  const login = (token, user, expireMinutes = 30) => {
    const expireTime = Date.now() + expireMinutes * 60 * 1000;
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user_info', JSON.stringify(user));
    sessionStorage.setItem('token_expire', expireTime.toString());
    setIsAuthenticated(true);
    setUserInfo(user);
    if (window.BroadcastChannel) {
      const bc = new BroadcastChannel('auth');
      bc.postMessage({ type: 'login', token, user, expireTime });
    }
  };

  const logout = () => {
    clearLogin();
    setIsAuthenticated(false);
    setUserInfo(null);

    if (window.BroadcastChannel) {
      const bc = new BroadcastChannel('auth');
      bc.postMessage({ type: 'logout' });
    }
  };
  useEffect(() => {
    checkAuth();

    if (window.BroadcastChannel) {
      const bc = new BroadcastChannel('auth');
      bc.onmessage = (event) => {
        const { type, token, user, expireTime } = event.data;
        if (type === 'login') {
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('user_info', JSON.stringify(user));
          sessionStorage.setItem('token_expire', expireTime.toString());
          setIsAuthenticated(true);
          setUserInfo(user);
        } else if (type === 'logout') {
          clearLogin();
          setIsAuthenticated(false);
          setUserInfo(null);
        }
      };
      return () => bc.close();
    }
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    userInfo,
    login,
    logout,
    checkAuth,
    clearLogin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
