import React, { useState } from 'react';
import { Box, Paper, Typography, CircularProgress, IconButton, Chip } from '@mui/material';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const GoldNewInfoPlug = ({ pluginData, onPluginEvent }) => {
  const article = pluginData?.article || null;
  const loadingDetail = !!pluginData?.loadingDetail;

  // 左侧内容语言切换：默认中文，可切换到英文
  const [langCN, setLangCN] = useState(true);

  const leftContent = langCN ? article?.content_markdown_cn : article?.content_markdown;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', position: 'relative', bgcolor: '#fafafa' }}>
      {loadingDetail && (
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
        {!article ? (
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">请选择左侧文章</Typography>
          </Box>
        ) : Array.isArray(article.cards) && article.cards.length > 0 ? (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {article.cards.map(card => (
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
                {Array.isArray(card.keywords) && card.keywords.length > 0 && (
                  <>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>关键词</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                      {card.keywords.map((kw, idx) => (
                        <Chip key={`${String(kw)}_${idx}`} size="small" label={kw}
                          variant="outlined"
                          sx={{ borderColor: 'divider', bgcolor: 'grey.50' }}
                        />
                      ))}
                    </Box>
                  </>
                )}

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
