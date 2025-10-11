import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, IconButton, Typography, Paper } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ReactMarkdown from 'react-markdown';
import ChatInputPlug from './component/ChatInputPlug';

const SSE_API_URL = '/chat_to_aiden/chat_to_aiden_steam'
const AidenOntology = ({ pluginData, onPluginEvent }) => {

  const [messages, setMessages] = useState(() => {
    const initial = pluginData?.messages || [];
    return Array.isArray(initial) ? initial : [];
  });

  const containerRef = useRef(null);
  const safeEmit = (eventName, eventData) => {
    if (typeof onPluginEvent === 'function') {
      onPluginEvent(eventName, eventData);
    }
  };

  useEffect(() => {
    // Auto scroll to bottom on new message
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputEvent = (eventName, eventData) => {
    if (eventName === 'send') {
      const text = (eventData?.text || '').trim();
      if (!text) return;

      // 先加入用户消息
      const userMsg = { id: Date.now(), sender: 'user', content: text };
      // 为助手占位一条消息，后续流式更新其内容
      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg = { id: aiMsgId, sender: 'assistant', content: '' };
      setMessages((prev) => [...prev, userMsg, aiMsg]);

      // 向宿主同步事件
      safeEmit('send', { text, tags: eventData?.tags || [] });

      // 启动流式对话
      try {
        window.chatWithLLMSteam(
          SSE_API_URL,
          { message: text },
          // onProgress: 持续更新助手消息内容
          (partialText) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? { ...m, content: partialText } : m))
            );
          },
          // onComplete: 最终文本（可与 onProgress 等价）
          (finalText) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? { ...m, content: finalText } : m))
            );
          }
        );
      } catch (err) {
        // 出错时给出友好提示
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: '系统繁忙，请稍后再试' }
              : m
          )
        );
        console.error('chatWithLLMSteam error:', err);
      }
    }
  };

  const renderMessage = (msg) => {
    const isUser = msg.sender === 'user';
    return (
      <Box key={msg.id || Math.random()} sx={{ display: 'flex', mb: 1, px: 1, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
        <Paper elevation={0} sx={{
          px: 1.5,
          py: 1,
          maxWidth: '80%',
          bgcolor: isUser ? 'primary.main' : 'grey.100',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderRadius: 2
        }}>
          {isUser ? (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.content}
            </Typography>
          ) : (
            <Box sx={{
              '& p': { m: 0 },
              '& pre': { bgcolor: 'grey.900', color: 'common.white', p: 1, borderRadius: 1, overflowX: 'auto' },
              '& code': { bgcolor: 'grey.200', px: 0.5, borderRadius: 0.5 }
            }}>
              <ReactMarkdown>{msg.content || ''}</ReactMarkdown>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', border: '1px solid #e0e0e0', overflow: 'hidden', bgcolor: 'background.paper' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, height: 40, px: 1, borderBottom: '1px solid #e0e0e0', bgcolor: 'grey.50' }}>
        <IconButton size="small" title="查看历史" onClick={() => safeEmit('view_history')}>
          <HistoryIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" title="新建对话" onClick={() => { setMessages([]); safeEmit('new_conversation'); }}>
          <AddCircleOutlineIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Chat log */}
      <Box ref={containerRef} sx={{ flex: 1, overflowY: 'auto', py: 1, px: 0.5 }}>
        {messages.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
            暂无对话，开始提问吧~
          </Typography>
        )}
        {messages.map(renderMessage)}
      </Box>

      {/* Input */}
      <Box sx={{  bgcolor: 'grey.50' }}>
        <ChatInputPlug
          pluginData={useMemo(() => {
            // 规范化并注入默认标签
            const raw = pluginData || {};
            let tags = Array.isArray(raw.tags) ? raw.tags : [];
            // 将字符串标签转为对象结构
            tags = tags.map((t) =>
              typeof t === 'string' ? { title: t, content: '', isClose: false } : t
            );
            if (!tags.length) {
              tags = [{ title: '理财咨询', content: '', isClose: true }];
            }
            return { ...raw, tags };
          }, [pluginData])}
          onPluginEvent={handleInputEvent}
        />
      </Box>
    </Box>
  );
};

export default AidenOntology;
