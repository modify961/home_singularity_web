import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, TextField, List, ListItem, ListItemText, Paper, Typography, CircularProgress, Button, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { allNews, newById,updateDeletedStatus } from './api';
import { useDialog } from '../../components/tips/useDialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const GoldNewPlug = ({ pluginData, onPluginEvent }) => {
  const { toast,confirm } = useDialog();
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [article, setArticle] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const detailCache = useRef(new Map());
  const requestSeq = useRef(0);

  // 加载全部新闻的方法
  const loadNews = async (autoSelectFirst = false) => {
    setLoading(true);
    try {
      const resp = await allNews();
      const list = (resp && resp.data) || [];
      setNews(list);
      
      // 只在需要时自动选中第一条
      if (autoSelectFirst && list.length > 0) {
        const firstId = list[0]?.id;
        if (firstId) {
          handleSelect(firstId);
        }
      }
    } catch (e) {
      console.error(e);
      toast && toast('加载新闻失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载全部新闻
  useEffect(() => {
    loadNews(true); // 初始化时自动选中第一条
  }, []); 

  const filteredNews = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return news;
    return news.filter(n => (n.title || '').toLowerCase().includes(key));
  }, [news, search]);

  const handleSelect = async (id) => {
    if (!id || id === selectedId) return;
    setSelectedId(id);
    // 命中缓存则直接渲染，避免不必要请求
    if (detailCache.current.has(id)) {
      setArticle(detailCache.current.get(id));
      return;
    }
    setLoadingDetail(true);
    const seq = ++requestSeq.current;
    try {
      const resp = await newById(id);
      const data = (resp && resp.data) || null;
      
      // 仅处理最新的一次请求结果，避免竞态条件
      if (seq === requestSeq.current) {
        setArticle(data);
        if (data) {
          detailCache.current.set(id, data);
        }
      }
    } catch (e) {
      toast && toast('加载文章详情失败');
    } finally {
      // 只有当前请求才设置loading状态
      if (requestSeq.current === seq) {
        setLoadingDetail(false);
      }
    }
  };

  const handleDelete = () => {
    if (!selectedId) return;
    
    confirm(
      '确认删除',
      '确认要删除这篇文章吗？',
      async () => {
        setDeleting(true);
        try {
          const response = await updateDeletedStatus({
            id: selectedId,
            is_deleted: true
          });
          
          if (response?.code === 200) {
            toast('删除成功');
            const updatedNews = news.filter(item => item.id !== selectedId);
            setNews(updatedNews);
            detailCache.current.delete(selectedId);
            const currentIndex = news.findIndex(item => item.id === selectedId);
            let nextSelectedId = null;
            
            if (updatedNews.length > 0) {
              if (currentIndex < updatedNews.length) {
                nextSelectedId = updatedNews[currentIndex]?.id;
              } else if (currentIndex > 0) {
                nextSelectedId = updatedNews[currentIndex - 1]?.id;
              } else {
                nextSelectedId = updatedNews[0]?.id;
              }
            }
            setSelectedId(nextSelectedId);
            if (nextSelectedId) {
              handleSelect(nextSelectedId);
            } else {
              setArticle(null);
            }
          } else {
            toast('删除失败');
          }
        } catch (error) {
          console.error('删除失败:', error);
          toast('删除失败');
        } finally {
          setDeleting(false);
        }
      }
    );
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', position: 'relative' }}>
      {/* 左侧：新闻列表 + 搜索 */}
      <Box sx={{ width: 320, minWidth: 280, maxWidth: 400, borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0', display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="搜索标题"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { height: 34, borderRadius: 0 } }}
          />
          <IconButton
            size="small"
            onClick={() => loadNews(false)}
            disabled={loading}
            sx={{ width: 34, height: 34, borderRadius: 0 }}
            title="刷新列表"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {filteredNews.map((item) => (
                <ListItem
                  key={item.id}
                  selected={selectedId === item.id}
                  onClick={() => handleSelect(item.id)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedId === item.id ? '#f0f7ff !important' : 'transparent',
                    borderLeft: selectedId === item.id ? '3px solid #1976d2' : '3px solid transparent',
                    '&:hover': { 
                      backgroundColor: selectedId === item.id ? '#f0f7ff !important' : '#f5f5f5 !important' 
                    }
                  }}
                >
                  <ListItemText
                    slotProps={{
                      primary: { noWrap: true },
                      secondary: { noWrap: true }
                    }}
                    primary={item.title || '-'}
                    secondary={item.source || ''}
                  />
                  {loadingDetail && selectedId === item.id && (
                    <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={16} />
                    </Box>
                  )}
                </ListItem>
              ))}
              {filteredNews.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  无匹配新闻
                </Typography>
              )}
            </List>
          )}
        </Box>
      </Box>

      {/* 右侧：文章内容区域 */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {loadingDetail ? (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1
          }}>
            <CircularProgress size={32} />
          </Box>
        ) : null}
        {/* 顶部操作栏 */}
        <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',px: 2, }}>
          <Typography sx={{ fontWeight: 500, flex: 1, minWidth: 0 }} noWrap>
            {article?.title || '请选择文章'}
            {article?.url && (
              <Button
                variant="text"
                size="small"
                onClick={() => window.open(article.url, '_blank')}
                sx={{ 
                  flexShrink: 0,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  color: '#1976d2',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }}
              >
                点击查看原文
              </Button>
            )}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            
            <Button 
              variant="outlined" 
              color="error" 
              size="small"
              onClick={handleDelete}
              disabled={!selectedId || deleting}
              sx={{ flexShrink: 0 }}
            >
              {deleting ? '删除中...' : '删除'}
            </Button>
          </Box>
        </Box>

        {/* 下方内容区域：中文译文和英文原文 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>
          {/* 中文译文 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0e0e0', overflow: 'auto' }}>
           {article && article.content_markdown_cn ? (
              <Paper elevation={0} sx={{ p: 2, border: 'none', borderRadius: 0, height: '100%' }}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children, ...props }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                        {children}
                      </a>
                    )
                  }}
                >
                  {article.content_markdown_cn}
                </ReactMarkdown>
              </Paper>
            ) : (
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">请选择左侧文章</Typography>
              </Box>
            )}
          </Box>

          {/* 英文原文 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            {article && article.content_markdown ? (
              <Paper elevation={0} sx={{ p: 2, border: 'none', borderRadius: 0, height: '100%' }}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children, ...props }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                        {children}
                      </a>
                    )
                  }}
                >
                  {article.content_markdown}
                </ReactMarkdown>
              </Paper>
            ) : (
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">请选择左侧文章</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default GoldNewPlug;
