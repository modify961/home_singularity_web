// src/components/Menu.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  ListItemIcon,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import LogoutIcon from '@mui/icons-material/Logout';
import { initMenu} from './api';


const ToolMenu = ({ onMenuClick, width = 20 }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          console.error('未找到用户信息');
          return;
        }

        const user = JSON.parse(userStr);
        if (!user.id) {
          console.error('用户信息中未找到ID');
          return;
        }

        const response = await initMenu(user.id.toString());
        if (response && response.data) {
          let menus_in = response.data.menus_in;
          let mcps = response.data.mcps;
          mcps = mcps || []
          localStorage.setItem('mcps_list', JSON.stringify(mcps));
          setMenuItems(menus_in);
        }
      } catch (error) {
        console.error('获取菜单数据失败:', error);
      }
    };

    fetchMenuData();
  }, []); // 空依赖数组意味着只在组件挂载时运行一次
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (menuItem) => {
    handleMenuClose();
    if (typeof menuItem === 'string') {
      if (menuItem === 'settings') {
        setSettingsOpen(true);
      } else if (menuItem === 'about') {
        console.log('About clicked');
      } else if (menuItem === 'logout') {
        handleLogout()
      }
      return;
    }
    // 处理常规菜单项
    let pluginCallInfo = {
      "id": "",
      "tip": menuItem.tip,
      "tool_code": menuItem.plugin_code,
      "tool_name": menuItem.text,
      "tool_model": menuItem.plugin_model,
      "system_prompt": "",
      "call_text": "1",
      "tool_config": "",
      "operate_type": menuItem.operate_type,
      "operate_parameter": menuItem.operate_param,
      "call_at": "2025-03-02T02:25:26.498142",
      "call_by": "system"
    }
    if(pluginCallInfo.tool_model === "1"){
      onMenuClick(pluginCallInfo);
    }
  };

  const handleLogout = () => {
    // 清除登录状态
    localStorage.removeItem('token');
    // 是否开启验证登录
    if (window._CONFIG['ENABLE_LOGIN']) {
      // 重定向到后端的logout路由
      window.location.href = `${window._CONFIG['BASE_URL']}/oauth2client/logout`
    } else {
      // 重定向到登录页面
      window.location.href = '/login';
    }
  };

  // 处理系统设置弹窗关闭
  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };


  // 将数字转换为百分比字符串
  const widthPercentage = `${width}%`;

  return (
    <Box sx={{ width: widthPercentage, height: '100vh', display: 'flex', backgroundColor: 'grey.200', flexDirection: 'column', borderRight: '1px solid #ddd' }}>
      {/* 中间列表 */}
      <List sx={{ flexGrow: 1, padding: '8px' }}>
        {menuItems.map((item, index) => (
          <ListItem
            button
            sx={{
              cursor: 'pointer',
              borderRadius: '8px',
              mb: 1,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                transform: 'translateX(5px)'
              }
            }}
            key={index}
            onClick={() => handleMenuItemClick(item)}
          >
            <ListItemText
              primary={<strong>{item.text}</strong>}
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '0.95rem',
                  padding: '4px 0'
                }
              }}
            />
          </ListItem>
        ))}
      </List>

      <Divider />

      <Box sx={{ textAlign: 'center' }}>
        <IconButton
          onClick={handleMenuOpen}
          sx={{
            width: '100%',
            height: '50px',
            bgcolor: 'grey.200',
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ mr: 1 }} />
          <Typography>个人信息</Typography>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <MenuItem onClick={() => handleMenuItemClick('logout')}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            注销
          </MenuItem>
          <MenuItem onClick={() => handleMenuItemClick('settings')}>
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            系统设置
          </MenuItem>
          <MenuItem onClick={() => handleMenuItemClick('about')}>
            <ListItemIcon><InfoIcon /></ListItemIcon>
            关于我们
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default ToolMenu;
