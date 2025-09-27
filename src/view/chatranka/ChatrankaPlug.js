import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { useAuth } from '../../utils/AuthContext';

const ChatrankaPlug = ({ pluginData, onPluginEvent }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return (
    <Box>
      333333
    </Box>
  );
};

export default React.memo(ChatrankaPlug);