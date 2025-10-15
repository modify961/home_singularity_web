import React, { useState, useEffect, useMemo } from 'react';
import { Box, TextField, List, ListItem, ListItemText, Paper, Typography, CircularProgress } from '@mui/material';
import { allNews, newById } from './api';
import { useDialog } from '../../components/tips/useDialog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const GoldNewPlug = ({ pluginData, onPluginEvent }) => {
  const { toast } = useDialog();
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [article, setArticle] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 初始化加载全部新闻
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const resp = await allNews();
        const list = (resp && resp.data) || [];
        if (!cancelled) {
          setNews(list);
          if (list && list.length > 0) {
            // 默认选中第一条
            handleSelect(list[0].id);
          }
        }
      } catch (e) {
        console.error(e);
        toast && toast('加载新闻失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredNews = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return news;
    return news.filter(n => (n.title || '').toLowerCase().includes(key));
  }, [news, search]);

  const handleSelect = async (id) => {
    if (!id) return;
    setSelectedId(id);
    try {
      setLoadingDetail(true);
      const resp = await newById(id);
      setArticle((resp && resp.data) || null);
    } catch (e) {
      console.error(e);
      toast && toast('加载文章详情失败');
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', position: 'relative' }}>
      {/* 左侧：新闻列表 + 搜索 */}
      <Box sx={{ width: 320, minWidth: 280, maxWidth: 400, borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0' }}>
          <TextField
            size="small"
            placeholder="搜索标题"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { height: 34, borderRadius: 0 } }}
          />
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
                  button
                  selected={selectedId === item.id}
                  onClick={() => handleSelect(item.id)}
                  sx={{
                    cursor: 'pointer',
                    '&.Mui-selected': { backgroundColor: '#f0f7ff', borderLeft: '3px solid #1976d2' },
                    '&:hover': { backgroundColor: '#f5f5f5' }
                  }}
                >
                  <ListItemText
                    primaryTypographyProps={{ noWrap: true }}
                    secondaryTypographyProps={{ noWrap: true }}
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

      {/* 中间：中文译文 content_markdown_cn */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderLeft: '1px solid #e0e0e0' }}>
        <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2">中文译文</Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {loadingDetail ? (
            <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : article && article.content_markdown_cn ? (
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #eee', borderRadius: 0 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content_markdown_cn}</ReactMarkdown>
            </Paper>
          ) : (
            <Typography variant="body2" color="text.secondary">请选择左侧文章</Typography>
          )}
        </Box>
      </Box>
      

      {/* 右侧：英文原文 content_markdown */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2">英文原文</Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {loadingDetail ? (
            <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : article && article.content_markdown ? (
            <Paper elevation={0} sx={{ p: 2, border: '1px solid #eee', borderRadius: 0 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content_markdown}</ReactMarkdown>
            </Paper>
          ) : (
            <Typography variant="body2" color="text.secondary">请选择左侧文章</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default GoldNewPlug;
