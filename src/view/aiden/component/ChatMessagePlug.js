import React from 'react';
import { Box, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { styled } from '@mui/material/styles';

const MessageContent = styled(Typography)(() => ({
  '& p': {
    marginBlockEnd: '0px !important',
    marginBlockStart: '0px !important',
  },
}));

// 仅负责展示 AI 消息（loading + markdown 渲染）
// 统一插件参数：pluginData, onPluginEvent（本组件暂不使用回调，但保留）
const ChatMessagePlug = ({ pluginData, onPluginEvent }) => {
  const message = pluginData?.message ?? pluginData;
  const isLoading = message?.isLoading && !message?.content;
  const content = message?.content || '';

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
        <CircularProgress size={16} thickness={5} />
        <Typography variant="body2">正在思考...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      '& p': { m: 0 },
      '& pre': { bgcolor: '#f8f9fa', color: '#495057', p: 1, borderRadius: 1, overflowX: 'auto', border: '1px solid #e9ecef' },
      '& code': { bgcolor: '#f8f9fa', color: '#495057', px: 0.5, py: 0.25, borderRadius: 0.5, border: '1px solid #e9ecef' }
    }}>
      <ReactMarkdown
        children={content}
        remarkPlugins={[remarkBreaks, remarkGfm]}
        components={{
          p: ({ children }) => <MessageContent variant="body2">{children}</MessageContent>,
          code: ({ children }) => (
            <code style={{
              backgroundColor: '#f8f9fa',
              color: '#495057',
              padding: '2px 4px',
              borderRadius: '3px',
              fontSize: '0.875em',
              border: '1px solid #e9ecef'
            }}>{children}</code>
          ),
          pre: ({ children }) => (
            <pre style={{
              backgroundColor: '#f8f9fa',
              color: '#495057',
              padding: '12px',
              borderRadius: '6px',
              overflowX: 'auto',
              fontSize: '0.875em',
              border: '1px solid #e9ecef'
            }}>{children}</pre>
          ),
          table: ({ children }) => <table style={{ borderCollapse: 'collapse', width: '100%', margin: '16px 0' }}>{children}</table>,
          thead: ({ children }) => <thead style={{ backgroundColor: '#f5f5f5' }}>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{children}</th>,
          td: ({ children }) => <td style={{ border: '1px solid #ddd', padding: '8px' }}>{children}</td>
        }}
      />
    </Box>
  );
};

export default ChatMessagePlug;
