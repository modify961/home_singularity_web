// src/context/DialogContext.js
import React, { createContext, useState, useCallback } from 'react';
import { Alert, AlertTitle } from '@mui/material';
import Snackbar from '@mui/material/Snackbar'; // 新增 Snackbar
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

export const DialogContext = createContext();

export const DialogProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    open: false,
    message: '',
    severity: 'info', // 'success' | 'error' | 'warning' | 'info'
    callback: null,
  });

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  const [toastState, setToastState] = useState({
    open: false,
    message: '',
    severity: 'info', // 'success' | 'error' | 'warning' | 'info'
    duration: 3000, // 默认3秒
  });

  const showAlert = useCallback((message, severity = 'info', callback = null) => {
    setAlertState({
      open: true,
      message,
      severity,
      callback,
    });
  }, []);

  const showConfirm = useCallback((title, message, onConfirm, onCancel = null) => {
    setConfirmState({
      open: true,
      title,
      message,
      onConfirm,
      onCancel,
    });
  }, []);

  // 新增 showToast 接口
  const showToast = useCallback((message, severity = 'info', duration = 3000) => {
    setToastState({
      open: true,
      message,
      severity,
      duration,
    });
  }, []);

  const handleAlertClose = () => {
    setAlertState((prev) => ({
      ...prev,
      open: false,
    }));
    if (alertState.callback) {
      alertState.callback();
    }
  };

  const handleConfirmClose = (confirmed) => {
    setConfirmState((prev) => ({
      ...prev,
      open: false,
    }));
    if (confirmed && confirmState.onConfirm) {
      confirmState.onConfirm();
    } else if (!confirmed && confirmState.onCancel) {
      confirmState.onCancel();
    }
  };

  const handleToastClose = () => {
    setToastState((prev) => ({
      ...prev,
      open: false,
    }));
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showToast }}>
      {children}

      {/* Alert Dialog */}
      <Dialog
        open={alertState.open}
        onClose={handleAlertClose}
        aria-labelledby="alert-dialog-title"
      >
        <Alert 
          severity={alertState.severity}
          sx={{ m: 2, minWidth: 300 }}
          onClose={handleAlertClose}
        >
          <AlertTitle>
            {alertState.severity.charAt(0).toUpperCase() + alertState.severity.slice(1)}
          </AlertTitle>
          {alertState.message}
        </Alert>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmState.open}
        onClose={() => handleConfirmClose(false)}
        aria-labelledby="confirm-dialog-title"
      >
        <DialogTitle id="confirm-dialog-title">
          {confirmState.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmState.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirmClose(false)}>取消</Button>
          <Button 
            onClick={() => handleConfirmClose(true)} 
            variant="contained"
            autoFocus
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Snackbar */}
      <Snackbar
        open={toastState.open}
        autoHideDuration={toastState.duration}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={toastState.severity}
          onClose={handleToastClose}
          sx={{ minWidth: 300 }}
        >
          {toastState.message}
        </Alert>
      </Snackbar>
    </DialogContext.Provider>
  );
};