import React, { Suspense, useState } from 'react';
import {Box, Drawer, Button, IconButton} from '@mui/material';
import usePluginComponent from './PluginComponent';
import AidenOntology from '../view/aiden/AidenOntology';


const PluginWrapper = ({ plugin, pluginData, onPluginEvent }) => {
  const PluginComponent = usePluginComponent(plugin);
  return (
    <Suspense fallback={<div>加载插件中...</div>}>
      <PluginComponent pluginData={pluginData} onPluginEvent={onPluginEvent} />
    </Suspense>
  );
};

const PortalPlugin = ({ pluginData, onPluginEvent }) => {
  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* 左侧区域 - 75%宽度 */}
      <Box sx={{ width: '75%', height: '100%' }}>
        {/* 左侧内容区域 */}
      </Box>
      
      {/* 右侧区域 - 25%宽度 */}
      <Box sx={{ width: '25%', height: '100%' }}>
        <AidenOntology pluginData={pluginData} onPluginEvent={onPluginEvent} />
      </Box>
    </Box>
  );
};

export default PortalPlugin;
