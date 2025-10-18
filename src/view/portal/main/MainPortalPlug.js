import React from 'react';
import { Box } from '@mui/material';
import { useDialog } from '../../../components/tips/useDialog';
import GoldInfoPlug from './component/GoldInfoPlug';

const MainPortalPlug = ({ pluginData, onPluginEvent }) => {
  const { confirm, alert, toast } = useDialog();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', bgcolor: 'white' }}>
      <Box sx={{ 
        flexDirection: 'row',
        overflow: 'hidden' ,
        p: 1
      }}>
        {/* 第一行：黄金信息占满整行 */}
        <Box sx={{ 
            padding: '8px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
            <GoldInfoPlug />
        </Box>
      </Box>
    </Box>
  );
};

export default MainPortalPlug;
