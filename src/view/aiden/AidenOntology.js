import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, IconButton, Typography, Paper } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ChatInputPlug from './component/ChatInputPlug';
import ChatMessagePlug from './component/ChatMessagePlug';
import IdUtil from '../../utils/IdUtil';
import { useBus, useSubscribe } from '../../utils/BusProvider';

// 与后端进行 SSE 流式对话的接口地址
const SSE_API_URL = '/chat_to_aiden/chat_to_aiden_steam'

// AidenOntology：右侧对话区域
// 负责：
//  - 展示用户与 AI 的对话记录
//  - 接收外部“添加标签”消息，填充到底部输入区
//  - 根据 AI 返回的组件调用指令，发布“plugin/open”消息，驱动右侧抽屉打开插件
const AidenOntology = ({ pluginData, onPluginEvent }) => {
  // 对话消息列表
  const [messages, setMessages] = useState(() => {
    const initial = pluginData?.messages || [];
    return Array.isArray(initial) ? initial : [];
  });
  const containerRef = useRef(null);

  // 最近一次 Aiden 返回的原始响应
  const [lastAidenResponse, setLastAidenResponse] = useState({});
  // 输入组件的数据：主要是 tags
  const [chatInputPluginData, setChatInputPluginData] = useState({});
  // 会话ID：初始化时分配，整个对话周期使用；新建对话时重置
  const [chatId, setChatId] = useState(() => IdUtil.genId('chat'));

  // 全局事件总线
  const bus = useBus();

  // 订阅：接收外部组件发送过来的“添加标签”消息，并合并到输入区
  useSubscribe({ type: 'aiden/tags.add', to: { component: 'AidenOntology' } }, (evt) => {
    const inTags = Array.isArray(evt?.payload?.tags) ? evt.payload.tags : [];
    if (!inTags.length) return;
    setChatInputPluginData((prev) => {
      const prevTags = Array.isArray(prev?.tags) ? prev.tags : [];
      const map = new Map();
      [...prevTags, ...inTags].forEach((t) => {
        const obj = typeof t === 'string' ? { title: t, content: '', isClose: true } : t;
        if (!obj || !obj.title) return;
        map.set(obj.title, { title: obj.title, content: obj.content || '', isClose: obj.isClose !== false });
      });
      return { ...prev, tags: Array.from(map.values()) };
    });
  });

  // 内部事件向外发布（可供外部观察、调试）
  const safeEmit = (eventName, eventData) => {
    bus && bus.publish({
      type: 'aiden/event',
      source: { component: 'AidenOntology' },
      payload: { event: eventName, data: eventData },
    });
  };

  // 新消息后自动滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // 处理输入组件发来的事件（目前只关心 send）
  const handleInputEvent = (eventName, eventData) => {
    if (eventName === 'send') {
      const text = (eventData?.text || '').trim();
      if (!text) return;
      const userMsg = { id: IdUtil.genId('user'), sender: 'user', content: text };
      const aiMsgId = IdUtil.genId('ai');
      const aiMsg = { id: aiMsgId, sender: 'assistant', content: '', isLoading: true };
      setMessages((prev) => [...prev, userMsg, aiMsg]);

      // 组织请求参数（可按后端要求扩展）
      const aidenrRequest = {
        chat_id: chatId,
        // 对大模型的消息：在原始用户输入基础上，追加“上下文标签”内容（以 Markdown 形式）
        // 这样即使后端不识别 context 字段，也能通过 message 读到标签内容
        message: (() => {
          const tags = Array.isArray(eventData?.tags) ? eventData.tags : [];
          if (!tags.length) return text;
          const ctx = tags.map((t) => {
            const title = t?.title || '';
            const content = t?.content || '';
            return `#### 标签: ${title}\n${content}`;
          }).join('\n\n');
          return `${text}\n\n---\n上下文标签\n\n${ctx}`;
        })(),
        // 若后端支持额外上下文字段，可一并传递
        context: (() => {
          const tags = Array.isArray(eventData?.tags) ? eventData.tags : [];
          if (!tags.length) return '';
          return tags.map((t) => `#### 标签: ${t?.title || ''}\n${t?.content || ''}`).join('\n\n');
        })(),
        history: lastAidenResponse.history || []
      };

      // 启动流式对话
      try {
        window.chatWithLLMSteam(
          SSE_API_URL,
          aidenrRequest,
          // 流式中间片段
          (partialText) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? { ...m, content: partialText, isLoading: false } : m))
            );
          },
          // 最终文本与完整响应
          (finalText, resp) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? { ...m, content: finalText, isLoading: false } : m))
            );
            if (resp) {
              setLastAidenResponse(resp);
              console.log('resp', resp);
              // 如果后端响应中包含“打开插件”的指令，这里尝试解析并转发给 PortalPlugin
              try {
                const cmd = resp?.command || resp?.plugin || resp?.call_plugin;
                const action = cmd?.action || cmd?.type;
                const pluginKey = cmd?.plugin || cmd?.name || cmd?.key;
                if (action && pluginKey && String(action).toLowerCase().includes('open')) {
                  bus && bus.publish({
                    type: 'plugin/open',
                    source: { component: 'AidenOntology' },
                    target: { component: 'PortalPlugin' },
                    payload: {
                      plugin: pluginKey,
                      pluginData: cmd?.props || cmd?.pluginData || {},
                      ui: 'drawer',
                      title: cmd?.title || '插件',
                    },
                  });
                }
              } catch (e) {
                console.warn('解析 AI 指令失败（可忽略或按需调整）', e);
              }
            }
          }
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, content: '系统繁忙，请稍后再试', isLoading: false } : m))
        );
        console.error('chatWithLLMSteam error:', err);
      }
    }
  };

  // 渲染单条消息
  const renderMessage = (msg) => {
    const isUser = msg.sender === 'user';
    return (
      <Box
        key={msg.id || Math.random()}
        sx={{ display: 'flex', mb: 1, px: 1, justifyContent: isUser ? 'flex-end' : 'flex-start' }}
      >
        <Paper
          elevation={0}
          sx={{
            px: 1.5,
            py: 1,
            maxWidth: '80%',
            bgcolor: isUser ? 'primary.main' : 'grey.100',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
          }}
        >
          {isUser ? (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.content}
            </Typography>
          ) : (
            <ChatMessagePlug pluginData={{ message: msg }} onPluginEvent={safeEmit} />
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        borderLeft: '1px solid #e0e0e0',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {/* 顶部工具栏 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 0.5,
          height: 40,
          px: 1,
          borderBottom: '1px solid #e0e0e0',
          bgcolor: 'grey.50',
        }}
      >
        <IconButton size="small" title="查看历史" onClick={() => safeEmit('view_history')}>
          <HistoryIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          title="新建对话"
          onClick={() => {
            setMessages([]);
            setLastAidenResponse({});
            setChatId(IdUtil.genId('chat'));
          }}
        >
          <AddCircleOutlineIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* 对话消息区 */}
      <Box ref={containerRef} sx={{ flex: 1, overflowY: 'auto', py: 1, px: 0.5 }}>
        {messages.map(renderMessage)}
      </Box>

      {/* 输入区 */}
      <Box>
        <ChatInputPlug pluginData={chatInputPluginData} onPluginEvent={handleInputEvent} />
      </Box>
    </Box>
  );
};

export default AidenOntology;
