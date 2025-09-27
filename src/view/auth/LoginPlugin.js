import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import '../../css/login.css';

const LoginPlugin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const loginRequest = {
        "user_code": username,
        "password": password
      };
      
      const response = await window.request("/login", "/login", "POST", loginRequest, {});
      
      if (response && response.code === 200) {
        const status = response.data.status;
        
        if (status) {
          const token = response.data.token;
          const user_info = response.data.user_info;
          
          // 使用 AuthContext 的 login 方法
          login(token, user_info);
          navigate('/chatranka');
        } else {
          setError(response.data.message || '登录失败');
        }
      } else {
        setError('用户名或密码错误');
      }
    } catch (err) {
      console.error('登录请求出错:', err);
      setError('登录请求失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  }

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
        disabled={isLoading}
        sx={{
          background: 'linear-gradient(45deg, #00dbde, #fc00ff)',
          '&:hover': {
            background: 'linear-gradient(45deg, #fc00ff, #00dbde)'
          }
        }}
      >
        {isLoading ? '登录中...' : '登录'}
      </Button>
    </Box>
  );
};

export default LoginPlugin;