import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, TextField, List, ListItem, ListItemText, Paper, Typography, CircularProgress, Button } from '@mui/material';
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

  // 鍔犺浇鍏ㄩ儴鏂伴椈鐨勬柟娉?  const loadNews = async () => {
    setLoading(true);
    try {
      const resp = await allNews();
      const list = (resp && resp.data) || [];
      setNews(list);
      if (list && list.length > 0) {
        // 榛樿閫変腑绗竴鏉?        const nextId = list[0]?.id;
        if (nextId && nextId !== selectedId) {
          handleSelect(nextId);
        }
      }
    } catch (e) {
      console.error(e);
      toast && toast('鍔犺浇鏂伴椈澶辫触');
    } finally {
      setLoading(false);
    }
  };

  // 鍒濆鍖栧姞杞藉叏閮ㄦ柊闂?  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!cancelled) {
        await loadNews();
      }
    };
    load();
    return () => { cancelled = true; };
  }, []); 

  const filteredNews = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return news;
    return news.filter(n => (n.title || '').toLowerCase().includes(key));
  }, [news, search]);

  const handleSelect = async (id) => {
    if (!id) return;
    setSelectedId(id);
    // 鍛戒腑缂撳瓨鍒欑洿鎺ユ覆鏌擄紝閬垮厤涓嶅繀瑕佽姹?    if (detailCache.current.has(id)) {
      setArticle(detailCache.current.get(id));
      return;
    }
    try {
      setLoadingDetail(true);
      const seq = ++requestSeq.current;
      const resp = await newById(id);
      const data = (resp && resp.data) || null;
      // 浠呭鐞嗘渶鏂扮殑涓€娆¤姹傜粨鏋?      if (seq === requestSeq.current) {
        setArticle(data);
        if (data) {
          detailCache.current.set(id, data);
        }
      }
    } catch (e) {
      console.error(e);
      toast && toast('鍔犺浇鏂囩珷璇︽儏澶辫触');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = () => {
    confirm(
      '纭鍒犻櫎',
      '纭瑕佽繖绡囨枃绔犲悧锛?,
      async () => {
        const del_info = {
          id:selectedId,
          is_deleted:true
        }
        setDeleting(true);
        const response = await updateDeletedStatus(del_info);
        
        if (response?.code === 200) {
          toast('鍒犻櫎鎴愬姛');
          // 鏈湴鏇存柊鍒楄〃涓庨€変腑锛岄伩鍏嶅啀娆¤姹傚垪琛ㄦ帴鍙?          setNews((prev) => {
            const idx = prev.findIndex((n) => n.id === selectedId);
            const nextList = prev.filter((n) => n.id !== selectedId);
            // 娓呯悊褰撳墠鏂囩珷缂撳瓨
            detailCache.current.delete(selectedId);
            if (nextList.length === 0) {
              setSelectedId(null);
              setArticle(null);
            } else {
              const nextIndex = idx < nextList.length ? idx : nextList.length - 1;
              const nextId = nextList[nextIndex]?.id;
              if (nextId) {
                handleSelect(nextId);
              }
            }
            return nextList;
          });
          // 鍒犻櫎鎴愬姛鍚庯紝璧版湰鍦扮姸鎬佹洿鏂帮紝閬垮厤鏁磋〃閲嶈浇
        }
      }
    );
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', position: 'relative' }}>
      {/* 宸︿晶锛氭柊闂诲垪琛?+ 鎼滅储 */}
      <Box sx={{ width: 320, minWidth: 280, maxWidth: 400, borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0' }}>
          <TextField
            size="small"
            placeholder="鎼滅储鏍囬"
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
                  鏃犲尮閰嶆柊闂?                </Typography>
              )}
            </List>
          )}
        </Box>
      </Box>

      {/* 鍙充晶锛氭枃绔犲唴瀹瑰尯鍩?*/}
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
        {/* 椤堕儴鎿嶄綔鏍?*/}
        <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',px: 2, }}>
          <Typography sx={{ fontWeight: 500, flex: 1, minWidth: 0 }} noWrap>
            {article?.title || '璇烽€夋嫨鏂囩珷'}
          </Typography>
          <Button 
            variant="outlined" 
            color="error" 
            size="small"
            onClick={handleDelete}
            sx={{ ml: 2, flexShrink: 0 }}
          >
            鍒犻櫎
          </Button>
        </Box>

        {/* 涓嬫柟鍐呭鍖哄煙锛氫腑鏂囪瘧鏂囧拰鑻辨枃鍘熸枃 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row', minHeight: 0 }}>
          {/* 涓枃璇戞枃 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0e0e0', overflow: 'auto' }}>
           {article && article.content_markdown_cn ? (
              <Paper elevation={0} sx={{ p: 2, border: 'none', borderRadius: 0, height: '100%' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content_markdown_cn}</ReactMarkdown>
              </Paper>
            ) : (
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">璇烽€夋嫨宸︿晶鏂囩珷</Typography>
              </Box>
            )}
          </Box>

          {/* 鑻辨枃鍘熸枃 */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            {article && article.content_markdown ? (
              <Paper elevation={0} sx={{ p: 2, border: 'none', borderRadius: 0, height: '100%' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content_markdown}</ReactMarkdown>
              </Paper>
            ) : (
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body2" color="text.secondary">璇烽€夋嫨宸︿晶鏂囩珷</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default GoldNewPlug;

