import React from 'react';
import { Box } from '@mui/material';
import GoldNewsPlug from './component/GoldNewsPlug';
import GoldInfoPlug from './component/GoldInfoPlug';


const MainPortalPlug = ({ pluginData, onPluginEvent }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', position: 'relative', bgcolor: 'white' }}>
      <Box sx={{ width: 400, minWidth: 400, maxWidth: 400, borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
        <GoldNewsPlug pluginData={pluginData} onPluginEvent={onPluginEvent} />
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <GoldInfoPlug />
      </Box>
    </Box>
  );
};

export default MainPortalPlug;
