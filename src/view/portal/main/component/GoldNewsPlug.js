import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, TextField, List, ListItem, ListItemText, Typography, CircularProgress, Button, IconButton, Chip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useDialog } from '../../../../components/tips/useDialog';
import { nyToBeijing } from '../../../../utils/time';
import { allNews, newById, updateReadStatus } from '../../../gold/api';
import { useBus } from '../../../../utils/BusProvider';

const GoldNewsPlug = ({ pluginData, onPluginEvent }) => {
  const { toast } = useDialog();
  const bus = useBus();
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 15;
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const detailCache = useRef(new Map());
  const requestSeq = useRef(0);

  const sortNewsList = (list = []) => {
    const parseTime = (value) => {
      const t = value ? Date.parse(value) : NaN;
      return Number.isNaN(t) ? 0 : t;
    };
    return [...list].sort((a, b) => {
      const ra = a?.is_read || 0;
      const rb = b?.is_read || 0;
      if (ra !== rb) return ra - rb;
      const ta = parseTime(a?.published_at);
      const tb = parseTime(b?.published_at);
      return tb - ta;
    });
  };

  const loadNews = async (autoSelectFirst = false, targetPage = page) => {
    setLoading(true);
    try {
      const resp = await allNews({ page: targetPage, page_size: pageSize });
      const list = (resp && resp.data && resp.data.data) || [];
      const t = (resp && resp.data && resp.data.pagination && resp.data.pagination.total) || 0;
      setTotal(t);
      setPage(targetPage);
      const sortedList = sortNewsList(list);
      setNews(sortedList);
      if (autoSelectFirst && sortedList.length > 0) {
        const firstId = sortedList[0]?.id;
        if (firstId) {
          handleSelect(firstId);
        }
      }
    } catch (e) {
      console.error(e);
      toast && toast('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews(false, 1);
  }, []);

  const filteredNews = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return news;
    return news.filter(n => (n.title || '').toLowerCase().includes(key));
  }, [news, search]);

  const handleSelect = async (id) => {
    setSelectedId(id);
    const markReadSilently = async () => {
      const item = news.find(n => n.id === id);
      if (!item || item.is_read === 1) return;
      setNews(prev => sortNewsList(prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)));
      if (detailCache.current.has(id)) {
        const cached = detailCache.current.get(id) || {};
        detailCache.current.set(id, { ...cached, is_read: 1 });
      }
      try {
        await updateReadStatus({ id, is_read: 1 });
      } catch (err) {
        // ignore silently; UI 已更新
      }
    };
    markReadSilently();
    if (detailCache.current.has(id)) {
      const data = detailCache.current.get(id);
      bus && bus.publish({
        type: 'drawer/open',
        source: { component: 'GoldInfoPlug' },
        target: { component: 'PortalPlugin' },
        payload: {
            plugin: 'goldnewcontent',
            pluginData: { 
                article:data ,
                loadingDetail:false
            },
            ui: 'drawer',
            title: data.summary,
        },
      });
      return;
    }
    setLoadingDetail(true);
    const seq = ++requestSeq.current;
    try {
      const resp = await newById(id);
      const dataRaw = (resp && resp.data) || null;
      const data = dataRaw && news.find(n => n.id === id && n.is_read === 1)
        ? { ...dataRaw, is_read: 1 }
        : dataRaw;
      if (seq === requestSeq.current) {
        if (data) {
          detailCache.current.set(id, data);
        }
        bus && bus.publish({
            type: 'drawer/open',
            source: { component: 'GoldInfoPlug' },
            target: { component: 'PortalPlugin' },
            payload: {
                plugin: 'goldnewcontent',
                pluginData: { 
                    article:data ,
                    loadingDetail:false
                },
                ui: 'drawer',
                title: data.summary,
            },
        });
      }
    } catch (e) {
      toast && toast('数据异常');
    } finally {
      if (requestSeq.current === seq) {
        setLoadingDetail(false);
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
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
                      <Chip
                        size="small"
                        label={item.is_read === 0 ? "未读" : "已读"}
                        variant="outlined"
                        sx={{
                          height: 20,
                          fontSize: '0.72rem',
                          bgcolor: 'grey.50',
                          borderColor: item.is_read === 0 ? 'uccess.main' : 'error.main'
                        }}
                      />
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
                      {!!(item.topic && String(item.topic).trim()) && (
                        <Chip
                          size="small"
                          label={String(item.topic).trim()}
                          variant="outlined"
                          sx={{
                            height: 20,
                            fontSize: '0.72rem',
                            bgcolor: 'grey.50',
                          }}
                        />
                      )}
                      {!!(item.source && String(item.source).trim()) && (
                        <Chip
                          size="small"
                          label={String(item.source).trim()}
                          variant="outlined"
                          sx={{
                            height: 20,
                            fontSize: '0.72rem',
                            bgcolor: 'grey.50',
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
          onClick={() => { if (page > 1) { const p = page - 1; loadNews(false, p); } }}
        >
          上一页
        </Button>
        <Button
          variant="outlined"
          size="small"
          disabled={loading || (page * pageSize) >= total}
          onClick={() => { if ((page * pageSize) < total) { const p = page + 1; loadNews(false, p); } }}
        >
          下一页
        </Button>
      </Box>
    </Box>
  );
};

export default GoldNewsPlug;
