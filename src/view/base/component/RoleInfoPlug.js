import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';
import { useDialog } from '../../../components/tips/useDialog';
const RoleInfoPlug = ({ pluginData = {}, onPluginEvent, isOpen = false, onClose}) => {
  const [formData, setFormData] = useState({
    role_name: '',
    role_code: '',
    state: 1
  });
  const [errors, setErrors] = useState({});

  // 生成角色编码
  const generateRoleCode = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    return `ROLE${year}${month}${day}${hour}${minute}${second}`;
  };

  useEffect(() => {
    if (isOpen) {
      if (pluginData?.role) {
        // 编辑模式
        setFormData({
          role_name: pluginData.role.role_name || '',
          role_code: pluginData.role.role_code || '',
          state: pluginData.role.state !== undefined ? pluginData.role.state : 1
        });
      } else {
        // 新增模式
        setFormData({
          role_name: '',
          role_code: generateRoleCode(),
          state: 1
        });
      }
      setErrors({});
    }
  }, [pluginData, isOpen]);

  // 处理表单字段变化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.role_name?.trim()) {
      newErrors.role_name = '角色名称不能为空';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存处理
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      // 这里调用保存API
      console.log('保存角色信息:', formData);
      // await saveRoleInfo(formData);
      
      handleClose();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 删除处理
  const handleDelete = async () => {
    if (!formData.id) return;
    
    try {
      // 这里调用删除API
      console.log('删除角色:', formData.id);
      // await deleteRole(formData.id);
      
      handleClose();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      role_name: '',
      role_code: '',
      state: 1
    });
    setErrors({});
    onClose();
    onPluginEvent();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            minHeight: '40vh',
            maxHeight: '40vh',
            minWidth: '30vw'
          }
        }
      }}
    >
      <DialogTitle>{pluginData?.role?.id ? '编辑角色信息' : '新增角色信息'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          {/* 角色编码 */}
          <TextField
            label="角色编码"
            value={formData.role_code}
            size="small"
            disabled
            fullWidth
            variant="outlined"
          />
          {/* 角色名称 */}
          <TextField
            label="角色名称"
            size="small"
            value={formData.role_name}
            onChange={(e) => handleInputChange('role_name', e.target.value)}
            error={!!errors.role_name}
            helperText={errors.role_name}
            required
            fullWidth
            variant="outlined"
          />

          {/* 状态 */}
          <FormControl fullWidth size="small">
            <FormLabel sx={{ mb: 1 }}>状态</FormLabel>
            <Select
              value={formData.state}
              onChange={(e) => handleInputChange('state', parseInt(e.target.value))}
              variant="outlined"
            >
              <MenuItem value={1}>启用</MenuItem>
              <MenuItem value={0}>禁用</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        padding: '20px', 
        display: 'flex', 
        justifyContent: 'center',
        gap: '10px'
      }}>
        <Button onClick={handleSave} variant="contained">保存</Button>
        {pluginData?.role?.id && (
          <Button 
            onClick={handleDelete}
            variant="outlined" 
            color="error"
          >
            删除
          </Button>
        )}
        <Button onClick={handleClose} variant="outlined">取消</Button>
        
      </DialogActions>
    </Dialog>
  );
};

export default RoleInfoPlug;