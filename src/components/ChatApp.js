// src/components/ChatApp.js
import React, { useState, Suspense, useRef } from 'react';
import { Box, IconButton, Drawer } from '@mui/material';
import usePluginComponent from './PluginComponent';
import * as Icons from '@mui/icons-material';
import ToolMenu from './menu';
import { v4 as uuidv4 } from 'uuid';

const PluginWrapper = ({ plugin, pluginData, onPluginEvent }) => {
  const PluginComponent = usePluginComponent(plugin);
  return (
    <Suspense fallback={<div>加载插件中...</div>}>
      <PluginComponent pluginData={pluginData} onPluginEvent={onPluginEvent} />
    </Suspense>
  );
};

function ChatApp() {
  const [leftPlugin, setLeftPlugin] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showFunctionMenu, setShowFunctionMenu] = useState(true);
  const [iconArray, setIconArray] = useState([]);

  const currentPlugRef = useRef({});

  const handleMenuClick = (menuItem) => {
    handMessageWithOutTool("",menuItem)
    setDrawerOpen(false)
  };
  const handlePluginEvent = (pluginKey, eventName, eventData) => {
    if(!eventName)
    if(eventName==='initComplete'){
      const icons = eventData.icons||[]
      setIconArray(icons)
    }
  };

  const getIconComponent = (iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent /> : null;
  };

  const handMessageWithOutTool = async (message,pluginInfo=null) => {
    let user_content = message
    if(!user_content.trim()&&!pluginInfo)
      return
    let pluginCallInfo = null
    pluginCallInfo = pluginInfo
    let toolCode = pluginCallInfo.tool_code|| 'none'
    let operateType = pluginCallInfo.operate_type|| 'none'
    let operateParameter = pluginCallInfo.operate_parameter|| "{}"
    operateParameter = JSON.parse(operateParameter)
    let pluginData={
      type: operateType,
      data: operateParameter
    }
    currentPlugRef.current = pluginCallInfo;
    let systemMessage = { sender: 'system',id:uuidv4(), plugin: toolCode, pluginData: pluginData };
    setLeftPlugin(systemMessage)
    toggleToolMenu()
    
  };
  
  const toggleToolMenu = () => {
    setShowFunctionMenu((prev) => !prev);
    setDrawerOpen(false);
  };
  const closeToolMenu= () => {
    setShowFunctionMenu(true);
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
      
      {showFunctionMenu && (
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
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100vh' }}>
          </Box>
        </Box>
      )}
      {!showFunctionMenu &&
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column',  overflow: 'hidden' }}>
          <Box sx={{
            height: '30px',
            paddingTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                onClick={() => closeToolMenu()}
                sx={{ ml: 1 }}
              >
                <Icons.Close />
              </IconButton>
            </Box>
            {iconArray?.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                {iconArray.map((item, index) => (
                  <IconButton
                    key={index}
                    onClick={item.onClick}
                    sx={{ ml: 1 }}
                  >
                    {getIconComponent(item.icon)}
                  </IconButton>
                ))}
              </Box>
            )}
          </Box>
          <Box sx={{ height: 'calc(100vh - 40px)', width: '100%', overflow: 'hidden', paddingBottom:"0px" }}>
            <PluginWrapper
              plugin={leftPlugin.plugin}
              pluginData={leftPlugin.pluginData}
              onPluginEvent={(eventName, eventData) =>
                handlePluginEvent(leftPlugin.plugin, eventName, eventData)
              }
            />
          </Box>
        </Box>
      }
    </Box>
  );
}

export default ChatApp;
