import React, { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { Box, TextField, Chip, IconButton } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const ChatInputPlug = ({ pluginData, onPluginEvent }) => {
  const [text, setText] = useState('');
  // 规范化标签结构并提供默认标签
  const [tags, setTags] = useState(() => {
    let list = Array.isArray(pluginData?.tags) ? pluginData.tags : [];
    list = list.map((t) => (typeof t === 'string' ? { title: t, content: '', isClose: false } : t));
    return list;
  });

  // 当外部传入的 pluginData.tags 变化时，更新本地 tags（让 AidenOntology 通过总线注入的标签可见）
  useEffect(() => {
    let list = Array.isArray(pluginData?.tags) ? pluginData.tags : [];
    list = list.map((t) => (typeof t === 'string' ? { title: t, content: '', isClose: false } : t));
    setTags(list);
    // 仅依赖 tags 引用变化，避免不必要的重复计算
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pluginData?.tags]);

  // 根据标签实际高度自适应输入区域的顶部内边距，避免重叠
  const tagsRef = useRef(null);
  // 初始给一个合理的内边距，避免首帧重叠闪动
  const [tagsPad, setTagsPad] = useState(() => (Array.isArray(tags) && tags.length ? 36 : 0));

  const recalcPad = () => {
    const h = tagsRef.current?.offsetHeight || 0;
    // 额外加上基础顶部留白，确保光标/占位与标签不重合
    setTagsPad(h ? h + 28 : 0);
  };

  useLayoutEffect(() => {
    recalcPad();
  }, [tags]);

  useEffect(() => {
    const onResize = () => recalcPad();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const safeEmit = (eventName, eventData) => {
    if (typeof onPluginEvent === 'function') {
      onPluginEvent(eventName, eventData);
    }
  };

  const handleSend = useCallback(() => {
    const content = text.trim();
    if (!content) return;
    safeEmit('send', { text: content, tags });
    setText('');
  }, [text, tags]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{  bgcolor: 'grey.50' }}>
      <Box sx={{ position: 'relative' }}>
        {tags?.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              left: 14,
              right: 56, // 预留右侧发送按钮空间
              display: 'flex',
              gap: 0.5,
              flexWrap: 'wrap',
              zIndex: 1
            }}
            ref={tagsRef}
          >
            {tags.map((t, idx) => (
              <Chip
                key={`${t?.title || 'tag'}-${idx}`}
                label={t?.title || ''}
                size="small"
                onDelete={t?.isClose ? () => setTags((prev) => prev.filter((_, i) => i !== idx)) : undefined}
              />
            ))}
          </Box>
        )}
        <TextField
          fullWidth
          multiline
          minRows={5}
          maxRows={10}
          placeholder={pluginData?.placeholder || '请输入内容，Enter 发送，Shift+Enter 换行'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            '& .MuiOutlinedInput-root': {
              pr: 6, // 为右下角发送按钮预留内边距
            },
            '& .MuiOutlinedInput-inputMultiline': {
              pr: 6,
              paddingTop: `${tagsPad}px`, // 根据标签高度自适应
            },
          }}
        />
        
        <IconButton
          title="发送"
          color="primary"
          onClick={handleSend}
          disabled={!text.trim()}
          sx={{ position: 'absolute', right: 2, bottom: 8 }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatInputPlug;
