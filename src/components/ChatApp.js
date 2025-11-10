// src/components/ChatApp.js
import React, { useState } from 'react';
import { Box, IconButton, Drawer } from '@mui/material';
import * as Icons from '@mui/icons-material';
import ToolMenu from './menu';
import { useBus } from '../utils/BusProvider';
import PortalPlugin from './PortalPlugin';

function ChatApp() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bus = useBus();

  const handleMenuClick = (menuItem) => {
    try {
      const toolCode = menuItem?.tool_code;
      const title = menuItem?.tool_name || '插件';
      const operateType = menuItem?.operate_type || 'none';
      let operateParameter = {};
      try {
        operateParameter = menuItem?.operate_parameter ? JSON.parse(menuItem.operate_parameter) : {};
      } catch (_) {
        operateParameter = {};
      }
      const pluginData = { type: operateType, data: operateParameter };
      bus && bus.publish({
        type: 'drawer/open',
        source: { component: 'ChatApp' },
        target: { component: 'PortalPlugin' },
        payload: { plugin: toolCode, pluginData, title }
      });
    } finally {
      setDrawerOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: 'white' }}>
      <Drawer
        anchor="left"
        open={drawerOpen}
        sx={{
          '& .MuiDrawer-paper': {
            width: '10%',
            boxSizing: 'border-box',
            overflow: 'hidden',
          },
        }}
        onClose={() => setDrawerOpen(false)}
      >
        <ToolMenu onMenuClick={handleMenuClick} width={100} />
      </Drawer>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{ 
            position: 'fixed', 
            left: 20, 
            bottom: 20,
            zIndex: 1000,
            bgcolor: '#1976d2',
            color: 'white',
            boxShadow: 3,
            padding: '12px',
            '&:hover': { bgcolor: '#1565c0' }
          }}
        >
          <Icons.Menu fontSize="large" />
        </IconButton>
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden'}}>
          <PortalPlugin />
        </Box>
      </Box>
    </Box>
  );
}

export default ChatApp;
