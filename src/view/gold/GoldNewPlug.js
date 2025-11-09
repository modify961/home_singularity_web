import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, TextField, List, ListItem, ListItemText, Typography, CircularProgress, Button, IconButton, Chip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import GoldNewInfoPlug from './component/GoldNewInfoPlug';
import { allNews, newById,updateDeletedStatus,generateSummaryCards } from './api';
import { nyToBeijing } from '../../utils/time';
import { useDialog } from '../../components/tips/useDialog';

const GoldNewPlug = ({ pluginData, onPluginEvent }) => {
  const { toast,confirm } = useDialog();
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [article, setArticle] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const detailCache = useRef(new Map());
  const requestSeq = useRef(0);

  const loadNews = async (autoSelectFirst = false, targetPage = page) => {
    setLoading(true);
    try {
      const resp = await allNews({ page: targetPage, page_size: pageSize });
      const list = (resp && resp.data && resp.data.data) || [];   
      const t = (resp && resp.data && resp.data.pagination && resp.data.pagination.total) || 0;
      setTotal(t);      
      setPage(targetPage);
      setNews(list);    
      if (autoSelectFirst && list.length > 0) {
        const firstId = list[0]?.id;
        if (firstId) {
          handleSelect(firstId);
        }
      }
    } catch (e) {
      console.error(e);
      toast && toast('鍔犺浇鏂伴椈澶辫触');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews(true, 1); 
  }, []); 

  const filteredNews = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return news;
    return news.filter(n => (n.title || '').toLowerCase().includes(key));
  }, [news, search]);

  const handleSelect = async (id) => {
    if (!id || id === selectedId) return;
    setSelectedId(id);  
    if (detailCache.current.has(id)) {
      setArticle(detailCache.current.get(id));
      return;
    }
    setLoadingDetail(true);
    const seq = ++requestSeq.current;
    try {
      const resp = await newById(id);
      const data = (resp && resp.data) || null;
        
      if (seq === requestSeq.current) {
        setArticle(data);
        if (data) {
          detailCache.current.set(id, data);
        }
      }
    } catch (e) {
      toast && toast('数据异常');
    } finally {  
      if (requestSeq.current === seq) {
        setLoadingDetail(false);
      }
    }
  };

  const handleGenerateSummary = () => {
    if (!selectedId || generating) return;
    const id = selectedId;
    confirm(
      '是否删除',
      '是否删除',
      async () => {
        setGenerating(true);
        try {
          const response = await generateSummaryCards(id);
          if (response?.code === 200) {
            toast && toast('删除成功');
            try {
              setLoadingDetail(true);
              const detailResp = await newById(id);
              const data = (detailResp && detailResp.data) || null;
              if (data) {
                detailCache.current.set(id, data);
              }
              if (id === selectedId) {
                setArticle(data);
              }
            } catch (e) {
              toast && toast('删除异常');
            } finally {
              setLoadingDetail(false);
            }
          } else {
            toast && toast('删除异常');
          }
        } catch (error) {
          toast && toast('删除异常');
        } finally {
          setGenerating(false);
        }
      }
    );
  };


  const handleDelete = () => {
    if (!selectedId) return;
    confirm(
      '是否删除',
      '删除文章?',
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
            toast('删除异常');
          }
        } catch (error) {
          console.error('删除异常:', error);
          toast('删除异常');
        } finally {
          setDeleting(false);
        }
      }
    );
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', position: 'relative' }}>
      <Box sx={{ width: 320, minWidth: 280, maxWidth: 400, borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0', display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            placeholder="搜索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { height: 34, borderRadius: 0 } }}
          />
          <IconButton
            size="small"
            onClick={() => loadNews(false, page)}
            disabled={loading}
            sx={{ width: 34, height: 34, borderRadius: 0 }}
            title="刷新"
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
            <List>
              {filteredNews.map((item) => (
                <ListItem
                  key={item.id}
                  selected={selectedId === item.id}
                  onClick={() => handleSelect(item.id)}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedId === item.id ? '#f0f7ff !important' : 'transparent',
                    borderLeft: selectedId === item.id ? '3px solid #1976d2' : '3px solid transparent',
                    py: 1,
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
                    primary={item.summary || '-'}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, mt: 0.25 }}>
                        {!!(item.emotion && String(item.emotion).trim()) && (
                          <Chip
                            size="small"
                            label={String(item.emotion).trim()}
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: '0.72rem',
                              bgcolor: 'grey.50',
                              borderColor:
                                (String(item.emotion).trim() === '积极' ? 'success.main' :
                                (String(item.emotion).trim() === '中性' ? 'warning.main' :
                                (String(item.emotion).trim() === '消极' ? 'error.main' : 'divider'))),
                              color:
                                (String(item.emotion).trim() === '积极' ? 'success.main' :
                                (String(item.emotion).trim() === '中性' ? 'warning.main' :
                                (String(item.emotion).trim() === '消极' ? 'error.main' : 'text.secondary')))
                            }}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {`${item.source && item.published_at ? ' · ' : ''}${item.published_at ? nyToBeijing(item.published_at) : ''}`}
                        </Typography>
                      </Box>
                    }
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
                  没有文章            
                </Typography>
              )}
            </List>
          )}
        </Box>
      
        <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 1, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            size="small"
            disabled={loading || page <= 1}
            onClick={() => { if (page > 1) { const p = page - 1; loadNews(true, p); } }}
          >
            上一页
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={loading || (page * pageSize) >= total}
            onClick={() => { if ((page * pageSize) < total) { const p = page + 1; loadNews(true, p); } }}
          >
            下一页
          </Button>
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',px: 2, }}>
          <Typography sx={{ fontWeight: 500, flex: 1, minWidth: 0 }} noWrap>
            {article?.title || '无'}
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
                查看原文
              </Button>
            )}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={handleGenerateSummary}
              disabled={!selectedId || generating}
              sx={{ flexShrink: 0 }}
              startIcon={generating ? <CircularProgress size={14} /> : null}
            >
              {generating ? '解析..' : '生成摘要'}
            </Button>


            <Button 
              variant="outlined" 
              color="error" 
              size="small"
              onClick={handleDelete}
              disabled={!selectedId || deleting}
              sx={{ flexShrink: 0 }}
            >
              {deleting ? '删除中..' : '删除'}
            </Button>
          </Box>
        </Box>
        <Box sx={{height: 'calc(100vh - 48px)' }}>
          <GoldNewInfoPlug 
            pluginData={{ article, loadingDetail }} 
            onPluginEvent={onPluginEvent} 
          />
        </Box>
      </Box>
    </Box>
  );
};

export default GoldNewPlug;
