// src/hooks/useDialog.js
import { useContext } from 'react';
import { DialogContext } from './DialogProvider';

export const useDialog = () => {
  const { showAlert, showConfirm, showToast} = useContext(DialogContext);
  
  return {
    alert: (message, severity = 'info', callback) => 
      showAlert(message, severity, callback),
    confirm: (title, message, onConfirm, onCancel) => 
      showConfirm(title, message, onConfirm, onCancel),
    toast: (message, severity = 'info', duration = 3000) => 
      showToast(message, severity, duration), // 新增 toast 接口
  };
};