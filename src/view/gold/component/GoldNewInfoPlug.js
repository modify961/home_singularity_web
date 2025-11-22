import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, CircularProgress, IconButton, Chip, Button } from '@mui/material';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { newById, updateDeletedStatus, generateSummaryCards, updateReadStatus } from '../api';
import { useDialog } from '../../../components/tips/useDialog';

const GoldNewInfoPlug = ({ pluginData, onPluginEvent }) => {
  const { toast, confirm } = useDialog();
  const incomingArticle = pluginData?.article || null;
  const baseLoadingDetail = !!pluginData?.loadingDetail;

  const [article, setArticle] = useState(incomingArticle);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const lastAutoReadIdRef = useRef(null);

  useEffect(() => {
    setArticle(incomingArticle || null);
  }, [incomingArticle]);

  // 左侧内容语言切换：默认中文，可切换到英文
  const [langCN, setLangCN] = useState(true);

  const leftContent = langCN ? article?.content_markdown_cn : article?.content_markdown;

  // 对右侧 cards 进行排序：将 summary_type 为 article_summary 的卡片置顶
  const sortedCards = Array.isArray(article?.cards)
    ? [...article.cards].sort((a, b) => {
        const pa = a && a.summary_type === 'article_summary' ? 0 : 1;
        const pb = b && b.summary_type === 'article_summary' ? 0 : 1;
        return pa - pb;
      })
    : [];

  const overlayLoading = baseLoadingDetail || localLoading;

  const handleUpdateReadStatus = async (targetStatus = true, options = {}) => {
    const id = article?.id;
    if (!id || markingRead) return;
    setMarkingRead(true);
    try {
      const resp = await updateReadStatus({ id, is_read: targetStatus });
      if (resp?.code === 200) {
        setArticle(prev => (prev && prev.id === id ? { ...prev, is_read: !!targetStatus } : prev));
        if (!options?.silent) {
          toast && toast(targetStatus ? '已标记已读' : '已标记未读');
        }
        onPluginEvent && onPluginEvent('refresh', { type: 'read', id, is_read: targetStatus });
      } else if (!options?.silent) {
        toast && toast('更新已读状态失败');
      }
    } catch (error) {
      if (!options?.silent) {
        toast && toast('更新已读状态失败');
      }
    } finally {
      setMarkingRead(false);
    }
  };

  useEffect(() => {
    const id = article?.id;
    if (!id || article?.is_read !== false) return;
    if (lastAutoReadIdRef.current === id) return;
    lastAutoReadIdRef.current = id;
    handleUpdateReadStatus(true, { silent: true });
  }, [article?.id, article?.is_read]);

  const handleGenerateSummary = () => {
    const id = article?.id;
    if (!id || generating) return;
    confirm(
      '是否总结条码',
      '是否总结条码',
      async () => {
        setGenerating(true);
        try {
          const response = await generateSummaryCards(id);
          if (response?.code === 200) {
            toast && toast('生成成功');
            try {
              setLocalLoading(true);
              const detailResp = await newById(id);
              const data = (detailResp && detailResp.data) || null;
              setArticle(data);
            } catch (e) {
              toast && toast('总结异常');
            } finally {
              setLocalLoading(false);
            }
            onPluginEvent && onPluginEvent('refresh', { type: 'generate', id });
          } else {
            toast && toast('总结异常');
          }
        } catch (error) {
          toast && toast('总结异常');
        } finally {
          setGenerating(false);
        }
      }
    );
  };

  const handleDelete = () => {
    const id = article?.id;
    if (!id || deleting) return;
    confirm(
      '是否删除',
      '删除文章?',
      async () => {
        setDeleting(true);
        try {
          const response = await updateDeletedStatus({ id, is_deleted: true });
          if (response?.code === 200) {
            toast && toast('删除成功');
            setArticle(null);
            onPluginEvent && onPluginEvent('refresh', { type: 'delete', id });
          } else {
            toast && toast('删除异常');
          }
        } catch (error) {
          toast && toast('删除异常');
        } finally {
          setDeleting(false);
        }
      }
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', position: 'relative', bgcolor: '#fafafa' }}>
      {overlayLoading && (
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.8)', zIndex: 2
        }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {/* 左侧：中文/英文内容，默认中文，悬浮切换按钮（右侧中部） */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider', overflow: 'hidden', position: 'relative', bgcolor: '#fff' }}>
        {/* 可滚动内容区域 */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {article && leftContent ? (
            <Paper elevation={0} sx={{ p: 2, pr: 6, border: 'none', borderRadius: 0, minHeight: '100%', boxSizing: 'border-box', bgcolor: 'transparent',
              '&': { color: 'text.primary' },
              '& h1, & h2, & h3': { mt: 2, mb: 1 },
              '& p': { my: 1, lineHeight: 1.75, fontSize: '0.95rem' },
              '& a': { color: 'primary.main', textDecoration: 'none' },
              '& a:hover': { textDecoration: 'underline' },
              '& img': { maxWidth: '100%', borderRadius: 1 },
              '& pre, & code': { bgcolor: 'grey.100', p: 0.5, borderRadius: 1 }
            }}>
              <ReactMarkdown 
                remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                components={{
                  a: ({ href, children, ...props }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  )
                }}
              >
                {leftContent}
              </ReactMarkdown>
            </Paper>
          ) : (
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="body2" color="text.secondary">请选择左侧文章</Typography>
            </Box>
          )}
        </Box>

        {/* 悬浮切换按钮：位于右侧中部，独立于滚动 */}
        <IconButton
          size="small"
          onClick={() => setLangCN(!langCN)}
          sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 1, bgcolor: '#fff', border: '1px solid', borderColor: 'divider', boxShadow: 'none',
            '&:hover': { bgcolor: '#fff', borderColor: 'grey.300' } }}
          title={langCN ? '切换到英文' : '切换到中文'}
          aria-label="language-toggle"
        >
          <GTranslateIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* 右侧：cards 摘要卡片 */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', bgcolor: '#fafafa' }}>
        {/* 操作按钮栏：左侧“查看原文”，右侧“生成摘要/删除”（置于卡片上方） */}
        {article && (
          <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {article?.url && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => window.open(article.url, '_blank')}
                  sx={{ 
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.04)' }
                  }}
                >
                  查看原文
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                color={article?.is_read ? 'warning' : 'success'}
                size="small"
                onClick={() => handleUpdateReadStatus(!article?.is_read)}
                disabled={markingRead}
                startIcon={markingRead ? <CircularProgress size={14} /> : null}
              >
                {markingRead ? '更新中...' : (article?.is_read ? '标记未读' : '标记已读')}
              </Button>
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleGenerateSummary}
                disabled={generating}
                startIcon={generating ? <CircularProgress size={14} /> : null}
              >
                {generating ? '解析..' : '生成摘要'}
              </Button>
              <Button 
                variant="outlined" 
                color="error" 
                size="small"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? '删除中..' : '删除'}
              </Button>
            </Box>
          </Box>
        )}
        {!article ? (
          <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">请选择左侧文章</Typography>
          </Box>
        ) : Array.isArray(article.cards) && article.cards.length > 0 ? (
          <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {sortedCards.map(card => (
              <Paper key={card.card_id || card.title} elevation={0} sx={{ p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: '#fff' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }} noWrap>
                  {card.title || '摘要'}
                </Typography>
                {/* 中文摘要 */}
                {card.summary_cn && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>摘要（中文）</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                      {card.summary_cn}
                    </Typography>
                  </>
                )}
                {/* 英文摘要 */}
                {card.summary_en && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Summary (EN)</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
                      {card.summary_en}
                    </Typography>
                  </>
                )}

                {/* 关键词 Chips */}
                {(Array.isArray(card.keywords) && card.keywords.length > 0) || (card.emotion && String(card.emotion).trim()) ? (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>关键词</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                      {/* 情绪优先显示，红色背景 */}
                      {!!(card.emotion && String(card.emotion).trim()) && (
                        <Chip
                          key={`emotion_${card.card_id || card.title}`}
                          size="small"
                          label={String(card.emotion).trim()}
                          color={
                            String(card.emotion).trim() === '积极' ? 'error' :
                            (String(card.emotion).trim() === '中性' ? 'warning' :
                            (String(card.emotion).trim() === '消极' ? 'success' : 'default'))
                          }
                          variant="outlined"
                          sx={{
                            borderColor:
                              (String(card.emotion).trim() === '积极' ? 'success.main' :
                              (String(card.emotion).trim() === '中性' ? 'warning.main' :
                              (String(card.emotion).trim() === '消极' ? 'error.main' : 'divider'))),
                            color:
                              (String(card.emotion).trim() === '积极' ? 'success.main' :
                              (String(card.emotion).trim() === '中性' ? 'warning.main' :
                              (String(card.emotion).trim() === '消极' ? 'error.main' : 'text.secondary')))
                          }}
                        />
                      )}
                      {Array.isArray(card.keywords) && card.keywords.map((kw, idx) => (
                        <Chip key={`${String(kw)}_${idx}`} size="small" label={kw}
                          variant="outlined"
                          sx={{ borderColor: 'divider', bgcolor: 'grey.50' }}
                        />
                      ))}
                    </Box>
                  </>
                ) : null}

                {/* 相关问题 */}
                {Array.isArray(card.questions) && card.questions.length > 0 && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>相关问题</Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0, mt: 0.5 }}>
                      {card.questions.map((q, idx) => (
                        <Box component="li" key={`${String(q)}_${idx}`}>
                          <Typography variant="body2" sx={{ lineHeight: 1.7 }}>{q}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </Paper>
            ))}
          </Box>
        ) : (
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">尚未进行摘要处理</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default GoldNewInfoPlug;
