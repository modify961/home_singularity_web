import React, { useState, useEffect } from 'react';
import {Box, List, ListItem, ListItemText, Typography, Chip, Button, Divider} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { allRoles} from './api';
import RoleInfoPlug from './component/RoleInfoPlug';

const MeunAndRolePlug = ({ pluginData, onPluginEvent }) => {
  const [roles, setRoles] = useState([]);
  const [roleInMenu, setRoleInMenu] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [isRoleInfoDialogOpen, setIsRoleInfoDialogOpen] = useState(false);
  
  useEffect(() => {
    fetchAllRoles();
  }, []);
  const fetchAllRoles = async () => {
    try {
      const response = await allRoles();
      if (response && response.data) {
        setRoles(response.data.all_roles || []);
        setRoleInMenu(response.data.role_in_menu || []);
      }
    } catch (error) {
      console.error('获取角色信息失败:', error);
    }
  };
  const handleDelete = () => {
    if (currentRole) {
      console.log('删除角色:', currentRole);
    } else {
      console.log('请先选择要删除的角色');
    }
  };

  const handleEdit = () => {
    if (currentRole) {
      setIsRoleInfoDialogOpen(true);
    } else {
      console.log('请先选择要编辑的角色');
    }
  };

  const handleAdd = () => {
    setCurrentRole(null);
    setIsRoleInfoDialogOpen(true);
  };

  const handleRoleSelect = (role) => {
    setCurrentRole(role);
  };

  const handleCloseRoleInfoDialog = () => {
    setIsRoleInfoDialogOpen(false);
    setCurrentRole(null);
  };

  const handleRoleInfoPlugEvent = (event, data) => {
    if (event === 'save') {
      // 保存成功后刷新角色列表
      fetchAllRoles();
      handleCloseRoleInfoDialog();
    } else if (event === 'cancel') {
      handleCloseRoleInfoDialog();
    }
    
    // 向上传递事件
    if (onPluginEvent) {
      onPluginEvent(event, data);
    }
  };

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* 左侧角色列表 */}
      <Box sx={{ width: '20%', borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <List>
            {roles.map((role, index) => (
              <ListItem 
                key={index} 
                sx={{ 
                  flexDirection: 'column', 
                  alignItems: 'flex-start', 
                  py: 2,
                  cursor: 'pointer',
                  backgroundColor: currentRole?.id === role.id ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                  '&:hover': {
                    backgroundColor: currentRole?.id === role.id ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                  }
                }}
                onClick={() => handleRoleSelect(role)}
              >
                <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                  {role.role_name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {role.role_code}
                  </Typography>
                  <Chip 
                    label={role.state === 1 ? '启用' : '禁用'} 
                    color={role.state === 1 ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
        
        <Divider />
        
        {/* 底部按钮组 */}
        <Box sx={{ textAlign: 'center', marginTop: 'auto' }}>
          <Box sx={{ 
            display: 'flex', 
            width: '100%',
            height: '50px',
            bgcolor: 'grey.200',
            borderRadius: 1,
          }}>
            <Button
              variant="text"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              sx={{ 
                flex: 1, 
                height: '100%',
                borderRadius: 0,
                borderTopLeftRadius: 4,
                borderBottomLeftRadius: 4,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.04)'
                }
              }}
            >
              删除
            </Button>
            <Button
              variant="text"
              color="primary"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ 
                flex: 1, 
                height: '100%',
                borderRadius: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderLeft: '1px solid #ddd',
                borderRight: '1px solid #ddd',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              编辑
            </Button>
            <Button
              variant="text"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{ 
                flex: 1, 
                height: '100%',
                borderRadius: 0,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.04)'
                }
              }}
            >
              新增
            </Button>
          </Box>
        </Box>
      </Box>
      
      {/* 右侧内容区域 */}
      <Box sx={{ width: '80%', p: 2 }}>
        
      </Box>
      
      <RoleInfoPlug
        pluginData={currentRole}
        onPluginEvent={handleRoleInfoPlugEvent}
        isOpen={isRoleInfoDialogOpen}
        onClose={handleCloseRoleInfoDialog}
      />
    </Box>
  );
};

export default MeunAndRolePlug;