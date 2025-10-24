import React, { Suspense, useState, useRef } from 'react';
import { Box, Drawer, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import usePluginComponent from './PluginComponent';
import AidenOntology from '../view/aiden/AidenOntology';
import MainPortalPlug from '../view/portal/main/MainPortalPlug';
import { useBus, useSubscribe } from '../utils/BusProvider';

const PluginWrapper = ({ plugin, pluginData, onPluginEvent }) => {
  const PluginComponent = usePluginComponent(plugin);
  return (
    <Suspense fallback={<div>加载插件中...</div>}>
      <PluginComponent pluginData={pluginData} onPluginEvent={onPluginEvent} />
    </Suspense>
  );
};

const PortalPlugin = ({ pluginData, onPluginEvent }) => {
  // 右侧抽屉打开的插件信息
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [activePlugin, setActivePlugin] = useState(null);
  const [activePluginData, setActivePluginData] = useState(null);

  // 获取全局总线
  const bus = useBus();

  // 订阅“打开插件”消息
  useSubscribe({ type: 'plugin/open', to: { component: 'PortalPlugin' } }, (evt) => {
    const p = evt?.payload || {};
    const key = p.plugin;
    if (!key) return;
    setActivePlugin(key);
    setActivePluginData(p.pluginData || {});
    setDrawerTitle(p.title || '插件');
    setDrawerOpen(true);
  });

  // 订阅“关闭插件”消息
  useSubscribe({ type: 'plugin/close', to: { component: 'PortalPlugin' } }, () => {
    setDrawerOpen(false);
  });

  // 关闭抽屉
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    // 对外广播一个关闭事件（可选）
    bus && bus.publish({
      type: 'plugin/event',
      source: { component: 'PortalPlugin' },
      payload: { event: 'drawer.close', data: { plugin: activePlugin } },
    });
  };

  // 左侧容器引用：限制 Drawer 只在左侧区域内打开
  const leftRef = useRef(null);

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* 左侧区域 - 75%宽度（Drawer 挂载于此，不覆盖右侧 AidenOntology） */}
      <Box ref={leftRef} sx={{ width: '75%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <MainPortalPlug />
      </Box>

      {/* 右侧区域 - 25%宽度：AidenOntology */}
      <Box sx={{ width: '25%', height: '100%' }}>
        <AidenOntology pluginData={pluginData} onPluginEvent={onPluginEvent} />
      </Box>

      {/* 左侧抽屉：仅在左侧容器内显示，不覆盖右侧 AidenOntology */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        // 避免遮罩挡住右侧 AidenOntology：隐藏遮罩，并将容器限制为左侧面板
        ModalProps={{ container: () => leftRef.current, keepMounted: true, hideBackdrop: true }}
        // 纸张宽度使用左侧容器的 100%（左容器本身占页面 75%）
        sx={{ '& .MuiDrawer-paper': { width: '75%', boxSizing: 'border-box' } }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* 抽屉标题栏：标题居左，右侧提供关闭按钮 */}
          <Box sx={{ height: 44, display: 'flex', alignItems: 'center', px: 1, borderBottom: '1px solid #eee', fontWeight: 600 }}>
            <Box sx={{ flex: 1, textAlign: 'left' }}>{drawerTitle}</Box>
            <IconButton size="small" onClick={handleCloseDrawer} title="关闭">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            {activePlugin && (
              <PluginWrapper
                plugin={activePlugin}
                pluginData={activePluginData}
                onPluginEvent={(eventName, eventData) => {
                  // 插件内部事件统一转发为“plugin/event”
                  bus && bus.publish({
                    type: 'plugin/event',
                    source: { component: String(activePlugin) },
                    payload: { event: eventName, data: eventData },
                  });
                }}
              />
            )}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default PortalPlugin;
