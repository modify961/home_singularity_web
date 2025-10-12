import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, IconButton, Typography, Paper } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ChatInputPlug from './component/ChatInputPlug';
import ChatMessagePlug from './component/ChatMessagePlug';
import IdUtil from '../../utils/IdUtil';

const SSE_API_URL = '/chat_to_aiden/chat_to_aiden_steam'
const AidenOntology = ({ pluginData, onPluginEvent }) => {
  const [messages, setMessages] = useState(() => {
    const initial = pluginData?.messages || [];
    return Array.isArray(initial) ? initial : [];
  });
  const containerRef = useRef(null);
  const [lastAidenResponse, setLastAidenResponse] = useState({}); // 存储后端返回的 AidenResponse
  const [chatInputPluginData, setChatInputPluginData] = useState([]);
  // 会话ID：初始化时分配，整个对话周期使用；新建对话时重置
  const [chatId, setChatId] = useState(() => IdUtil.genId('chat'));

  const safeEmit = (eventName, eventData) => {
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
      const userMsg = { id: IdUtil.genId('user'), sender: 'user', content: text };
      const aiMsgId = IdUtil.genId('ai');
      const aiMsg = { id: aiMsgId, sender: 'assistant', content: '', isLoading: true };
      setMessages((prev) => [...prev, userMsg, aiMsg]);
      let aidenrRequest = {
        chat_id: chatId,
        message: text,
        history: lastAidenResponse.history || []
      }
      // 启动流式对话
      try {
        window.chatWithLLMSteam(
          SSE_API_URL,
          aidenrRequest,
          (partialText) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, content: partialText, isLoading: false } : m
              )
            );
          },
          (finalText, resp) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, content: finalText, isLoading: false } : m
              )
            );
            if (resp) {
              setLastAidenResponse(resp);
              console.log('resp', resp);
            }
          }
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: '系统繁忙，请稍后再试', isLoading: false }
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
            <ChatMessagePlug pluginData={{ message: msg }} onPluginEvent={safeEmit} />
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
        <IconButton
          size="small"
          title="新建对话"
          onClick={() => {
            setMessages([]);
            setChatId(IdUtil.genId('chat'));
          }}
        >
          <AddCircleOutlineIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Chat log */}
      <Box ref={containerRef} sx={{ flex: 1, overflowY: 'auto', py: 1, px: 0.5 }}>
        {messages.map(renderMessage)}
      </Box>

      {/* Input */}
      <Box sx={{  bgcolor: 'grey.50' }}>
        <ChatInputPlug
          pluginData={chatInputPluginData}
          onPluginEvent={handleInputEvent}
        />
      </Box>
    </Box>
  );
};

export default AidenOntology;
