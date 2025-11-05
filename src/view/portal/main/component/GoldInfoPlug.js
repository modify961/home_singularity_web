import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, IconButton } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useDialog } from '../../../../components/tips/useDialog';
import { latestSnapshot,latestBriefs } from '../../api';
import { useBus } from '../../../../utils/BusProvider';
import ReactMarkdown from 'react-markdown';
import { formatLocalDateTime } from '../../../../utils/time';

const formatNum = (v) => {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toFixed(2);
};

const toColor = (change) => {
  const n = Number(change);
  if (Number.isNaN(n) || n === 0) return '#666';
  return n > 0 ? '#d32f2f' : '#2e7d32';
};

// 计算涨跌与涨跌幅（基于开盘/收盘，单位：%）
const getOpen = (r) => (r?.open_cny_per_g ?? r?.open ?? null);
const getClose = (r) => (r?.close_cny_per_g ?? r?.close ?? r?.price ?? null);
const computeChange = (r) => {
  const o = getOpen(r); const c = getClose(r);
  if (o == null || c == null) return null;
  const on = Number(o); const cn = Number(c);
  if (Number.isNaN(on) || Number.isNaN(cn)) return null;
  return cn - on;
};
const computeChangePct = (r) => {
  const o = getOpen(r); const c = getClose(r);
  if (o == null || c == null) return null;
  const on = Number(o); const cn = Number(c);
  if (Number.isNaN(on) || Number.isNaN(cn) || on === 0) return null;
  return ((cn - on) / on) * 100;
};
const formatPercent = (v) => {
  if (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) return '-';
  return `${formatNum(v)}%`;
};

const GoldInfoPlug = () => {
  const { toast } = useDialog();
  const bus = useBus();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);
  const [brief, setBrief] = useState(null);

  // 独立加载：最新快照
  useEffect(() => {
    let mounted = true;
    const loadSnapshots = async () => {
      setLoading(true);
      try {
        const resp = await latestSnapshot();
        const list = (resp && resp.data) || [];
        if (mounted) setItems(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        toast && toast('获取黄金最新快照失败', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadSnapshots();
    return () => { mounted = false; };
  }, []);

  // 独立加载：最新简报（XAUUSD）
  useEffect(() => {
    let mounted = true;
    const loadBrief = async () => {
      setBriefLoading(true);
      try {
        // 优先按对象传参；若后端期望原始字符串，尝试回退
        let resp = await latestBriefs("XAUUSD");
        const data = (resp && resp.data) || null;
        if (mounted) setBrief(data);
      } catch (e) {
        console.error(e);
        toast && toast('获取黄金简报失败', 'error');
      } finally {
        if (mounted) setBriefLoading(false);
      }
    };
    loadBrief();
    return () => { mounted = false; };
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        bgcolor: 'white',
        height: '100%',
      }}
    >
      {/* 标题栏 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          py: 1,
          borderBottom: '1px solid #eee',
          bgcolor: '#fafafa',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          黄金交易基本信息
        </Typography>
        <IconButton size="small" onClick={() => setCollapsed((v) => !v)}>
          {collapsed ? <ExpandMore /> : <ExpandLess />}
        </IconButton>
      </Box>

      {/* 内容区域 */}
      {!collapsed && (
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '65% 35%' }, gap: 2 }}>
            {/* 左侧：最新简报 */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>最新简报</Typography>
                <Typography variant="caption" color="text.secondary">
                  {brief && (brief.report_date || brief.created_at) ? `报告日期：${brief.report_date || brief.created_at}` : ''}
                </Typography>
              </Box>
              {briefLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={22} />
                </Box>
              ) : brief && brief.summary_markdown ? (
                <Box sx={{ p: 1.25, border: '1px solid #eee', borderRadius: 1, bgcolor: '#fafafa' }}>
                  <ReactMarkdown>{brief.summary_markdown}</ReactMarkdown>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">暂无简报</Typography>
              )}
            </Box>

            {/* 右侧：两个快照垂直排列 */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>最新快照</Typography>
              </Box>
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (!items || items.length === 0) ? (
                <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>暂无数据</Box>
              ) : (
                (() => {
                  const list = Array.isArray(items) ? items : [];
                  const findBy = (kw) => list.find((it) => {
                    const s = `${it.market_name || ''} ${it.market_key || ''}`;
                    return new RegExp(kw, 'i').test(s);
                  });
                  const sh = findBy('上.?海|SH');
                  const ny = findBy('纽.?约|NY|COMEX|New York');
                  const picked = [];
                  if (sh) picked.push(sh);
                  if (ny && ny !== sh) picked.push(ny);
                  for (const it of list) {
                    if (picked.length >= 2) break;
                    if (!picked.includes(it)) picked.push(it);
                  }
                  return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {picked.slice(0, 2).map((it) => {
                        const key = it.id ?? `${it.market_key}-${it.time}`;
                        return (
                          <Box
                            key={key}
                            sx={{
                              p: 1.5,
                              border: '1px solid #eee',
                              borderRadius: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.75,
                              boxSizing: 'border-box',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              bus && bus.publish({
                                type: 'plugin/open',
                                source: { component: 'GoldInfoPlug' },
                                target: { component: 'PortalPlugin' },
                                payload: {
                                  plugin: 'goldsnapshot',
                                  pluginData: { type: 'open_from_portal', data: { market_key: it.market_key } },
                                  ui: 'drawer',
                                  title: '金价快照',
                                },
                              });
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {it.market_name || it.symbol || it.market_key || '-'}
                                </Typography>
                                {(() => {
                                  const pct = computeChangePct(it);
                                  const chg = computeChange(it);
                                  return (
                                    <Typography variant="caption" sx={{ ml: 1, color: toColor(chg) }}>
                                      {formatPercent(pct)}
                                    </Typography>
                                  );
                                })()}
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {formatLocalDateTime(it.time)}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1 }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="caption" color="text.secondary">开盘</Typography>
                                <Typography variant="body2">{formatNum(it.open_cny_per_g)}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="caption" color="text.secondary">最高</Typography>
                                <Typography variant="body2">{formatNum(it.high_cny_per_g)}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="caption" color="text.secondary">最低</Typography>
                                <Typography variant="body2">{formatNum(it.low_cny_per_g)}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="caption" color="text.secondary">收盘</Typography>
                                <Typography variant="body2">{formatNum(it.close_cny_per_g)}</Typography>
                              </Box>
                            </Box>

                            <Typography variant="caption" color="text.secondary">
                              {it.date || ''} {it.snapshot_time ? `@ ${formatLocalDateTime(it.snapshot_time)}` : ''}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })()
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default GoldInfoPlug;
