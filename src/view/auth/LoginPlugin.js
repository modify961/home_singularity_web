import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import '../../css/login.css';

const LoginPlugin = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    debugger
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
      boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
      borderRadius: 2,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(255, 253, 245, 0.5)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    }}>
      <Typography variant="h5" align="center" sx={{ mb: 3 }}>
        系统
      </Typography>
      
      

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
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Button 
        variant="contained" 
        onClick={handleLogin}
        fullWidth
        size="large"
        sx={{
          background: 'linear-gradient(45deg, #00dbde, #fc00ff)',
          '&:hover': {
            background: 'linear-gradient(45deg, #fc00ff, #00dbde)'
          }
        }}
      >
        登录
      </Button>
    </Box>
  );
};

export default LoginPlugin;