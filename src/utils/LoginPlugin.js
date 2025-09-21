import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

const LoginPlugin = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    // 简单模拟登录验证
    if (username === 'admin' && password === '123456') {
      localStorage.setItem('isLoggedIn', 'true');
      onLoginSuccess?.();
    } else {
      setError('用户名或密码错误');
    }
  };

  return (
    <Box sx={{ 
      maxWidth: 400,
      mx: 'auto',
      p: 3,
      boxShadow: 3,
      borderRadius: 2,
      mt: 10
    }}>
      <Typography variant="h5" align="center" sx={{ mb: 3 }}>
        系统登录
      </Typography>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <TextField
        label="用户名"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="密码"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      />
      <Button 
        variant="contained" 
        onClick={handleLogin}
        fullWidth
        size="large"
      >
        登录
      </Button>
    </Box>
  );
};

export default LoginPlugin;