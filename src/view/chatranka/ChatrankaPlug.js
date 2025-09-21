import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { checkLoginStatus, redirectToLogin } from '../../utils/login';

const ChatrankaPlug = ({ pluginData, onPluginEvent }) => {
  useEffect(() => {
    if (!checkLoginStatus()) {
      redirectToLogin();
    }
  }, []);
  return (
    <Box>
      333333
    </Box>
  );
};

export default React.memo(ChatrankaPlug);