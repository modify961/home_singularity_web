import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Box
} from '@mui/material';
import { addOrEditJob } from '../api';

// 统一的弹窗接口要求：pluginData = {}, onPluginEvent, isOpen = false, onClose
const SchedulerInfoPlug = ({ pluginData = {}, onPluginEvent, isOpen = false, onClose }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (isOpen && pluginData && pluginData.id) {
      setFormData({
        id: pluginData.id,
        job_key: pluginData.job_key || '',
        name: pluginData.name || '',
        target: pluginData.target || '',
        cron: pluginData.cron || '',
        timezone:'Asia/Shanghai',
        args_json: pluginData.args_json || '',
        kwargs_json: pluginData.kwargs_json || '',
        max_instances: pluginData.max_instances ?? 1,
        misfire_grace_time: pluginData.misfire_grace_time ?? 900,
        sort_num: pluginData.sort_num ?? 10,
        enabled: pluginData.enabled ?? 1,
        notes: pluginData.notes || ''
      });
    } else if (isOpen) {
      setFormData({
        job_key: '',
        name: '',
        target: '',
        cron: '',
        timezone: 'Asia/Shanghai',
        args_json: '',
        kwargs_json: '',
        max_instances: 1,
        misfire_grace_time: 900,
        sort_num: 10,
        enabled: 1,
        notes: ''
      });
    }
    setErrors({});
  }, [pluginData, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.job_key?.trim()) newErrors.job_key = '任务Key不能为空';
    if (!formData.name?.trim()) newErrors.name = '任务名称不能为空';
    if (!formData.target?.trim()) newErrors.target = '执行目标不能为空';
    if (!formData.cron?.trim()) newErrors.cron = 'Cron 表达式不能为空';
    if (
      formData.sort_num === '' ||
      formData.sort_num === undefined ||
      formData.sort_num === null ||
      Number.isNaN(Number(formData.sort_num))
    ) {
      newErrors.sort_num = '序号不能为空';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    const payload = { ...formData };
    // 空字符串转 null，便于后端处理
    if (payload.args_json === '') payload.args_json = null;
    if (payload.kwargs_json === '') payload.kwargs_json = null;

    await addOrEditJob(payload);
    onPluginEvent && onPluginEvent('refresh');
  };

  const handleClose = () => {
    setFormData({});
    setErrors({});
    onClose && onClose();
    onPluginEvent && onPluginEvent();
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: { minHeight: '60vh', maxHeight: '80vh', minWidth: '50vw' }
        }
      }}
    >
      <DialogTitle>{pluginData?.id ? '编辑定时任务' : '新增定时任务'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="任务编码"
            size="small"
            value={formData.job_key || ''}
            onChange={(e) => handleInputChange('job_key', e.target.value)}
            error={!!errors.job_key}
            helperText={errors.job_key}
            required
            fullWidth
          />
          <TextField
            label="任务名称"
            size="small"
            value={formData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            required
            fullWidth
          />
          <TextField
            label="序号"
            size="small"
            type="number"
            value={formData.sort_num ?? 10}
            onChange={(e) => {
              const v = e.target.value;
              handleInputChange('sort_num', v === '' ? '' : parseInt(v, 10));
            }}
            error={!!errors.sort_num}
            helperText={errors.sort_num}
            required
            fullWidth
          />
          <TextField
            label="执行代码（module.function）"
            size="small"
            value={formData.target || ''}
            onChange={(e) => handleInputChange('target', e.target.value)}
            error={!!errors.target}
            helperText={errors.target}
            required
            fullWidth
          />
          <TextField
            label="任务执行设置：Cron（分 时 日 月 周，5段）"
            size="small"
            value={formData.cron || ''}
            onChange={(e) => handleInputChange('cron', e.target.value)}
            error={!!errors.cron}
            helperText={errors.cron}
            required
            fullWidth
          />
          <TextField
            label="最大并发数"
            size="small"
            type="number"
            value={formData.max_instances ?? 1}
            onChange={(e) => handleInputChange('max_instances', parseInt(e.target.value || '0', 10))}
            fullWidth
          />
          <TextField
            label="误触发宽限(秒)"
            size="small"
            type="number"
            value={formData.misfire_grace_time ?? 0}
            onChange={(e) => handleInputChange('misfire_grace_time', parseInt(e.target.value || '0', 10))}
            fullWidth
          />
          <TextField
            select
            label="状态"
            size="small"
            value={formData.enabled ?? 1}
            onChange={(e) => handleInputChange('enabled', parseInt(e.target.value, 10))}
            fullWidth
          >
            <MenuItem value={1}>启用</MenuItem>
            <MenuItem value={0}>禁用</MenuItem>
          </TextField>
          <TextField
            label="备注"
            size="small"
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'center', gap: 1 }}>
        <Button onClick={handleSave} variant="contained">保存</Button>
        <Button onClick={handleClose} variant="outlined">取消</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SchedulerInfoPlug;
