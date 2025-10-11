import React, { useState, useEffect } from 'react';
import {Box, List, ListItem, ListItemText, Typography, Chip, Button, Divider, CircularProgress, Backdrop, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { allRoles,delRole} from './api';
import RoleInfoPlug from './component/RoleInfoPlug';
import { useDialog } from '../../components/tips/useDialog';

const MeunAndRolePlug = ({ pluginData, onPluginEvent }) => {
  const { confirm, alert,toast } = useDialog();
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [roleInMenu, setRoleInMenu] = useState([]);
  const [currentRole, setCurrentRole] = useState(null);
  const [isRoleInfoDialogOpen, setIsRoleInfoDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchAllRoles();
  }, []);
  const fetchAllRoles = async () => {
    try {
      setLoading(true);
      const response = await allRoles();
      if (response && response.data) {
        setRoles(response.data.all_roles || []);
        setRoleInMenu(response.data.role_in_menu || []);
        setMenus(response.data.all_menus || []);
      }
    } catch (error) {
      console.error('获取角色信息失败:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = () => {
    if (!currentRole) {
      alert("请先选择要删除的角色");
      return;
    }
    confirm(
      '确认删除',
      '您确定要删除这个角色吗？此操作不可撤销。',
      async () => {
        try {
          setLoading(true);
          await delRole(currentRole.id);
          toast("删除成功");
          fetchAllRoles();
        } catch (error) {
          console.error('删除角色失败:', error);
          alert("删除失败，请重试");
        } finally {
          setLoading(false);
        }
      },
      () => {}
    );
    
  };

  const handleEdit = () => {
    if (!currentRole) {
      alert("请先选择要编辑的角色");
      return;
    }
    setIsRoleInfoDialogOpen(true);
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
    handleCloseRoleInfoDialog();
    fetchAllRoles();
  };

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
        {/* 按钮栏 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1,borderBottom:'1px solid #eee',pb:1 }}>
          <Button
            variant="outlined"
            color="primary"
            sx={{ mr: 1 }}
          >
            角色授权
          </Button>
          <Button
            variant="outlined"
            color="primary"
          >
            新增菜单
          </Button>
        </Box>
        
        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 200px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>标题</TableCell>
                <TableCell>编码</TableCell>
                <TableCell>操作类型</TableCell>
                <TableCell align="center">序号</TableCell>
                <TableCell align="center">状态</TableCell>
                <TableCell>创建时间</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {menus.map((menu, index) => (
                <TableRow key={index} hover>
                  <TableCell>{menu.text || '-'}</TableCell>
                  <TableCell>{menu.plugin_code || '-'}</TableCell>
                  <TableCell>{menu.operate_type || '-'}</TableCell>
                  <TableCell align="center">{menu.sort_num || '-'}</TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={menu.state === 1 ? '启用' : '禁用'} 
                      color={menu.state === 1 ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{menu.create_at || '-'}</TableCell>
                </TableRow>
              ))}
              {menus.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      暂无菜单数据
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      <RoleInfoPlug
        pluginData={currentRole}
        onPluginEvent={handleRoleInfoPlugEvent}
        isOpen={isRoleInfoDialogOpen}
        onClose={handleCloseRoleInfoDialog}
      />
      
      {/* Loading遮罩 */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default MeunAndRolePlug;