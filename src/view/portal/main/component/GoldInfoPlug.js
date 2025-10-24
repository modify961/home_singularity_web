import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, IconButton } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { useDialog } from '../../../../components/tips/useDialog';
import { latestSnapshot } from '../../api';
import { useBus } from '../../../../utils/BusProvider';

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

const GoldInfoPlug = () => {
  const { toast } = useDialog();
  const bus = useBus();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
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
    load();
    return () => {
      mounted = false;
    };
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
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              {(!items || items.length === 0) ? (
                <Box sx={{ textAlign: 'center', color: 'text.secondary', py: 3 }}>暂无数据</Box>
              ) : (
                <Box sx={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden', display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 1.5 }}>
                  {items.map((it) => {
                    const key = it.id ?? `${it.market_key}-${it.snapshot_time}`;
                    const chgColor = toColor(it.change);
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
                          cursor: 'pointer', // 支持点击打开右侧抽屉
                        }}
                        onClick={() => {
                          // 点击卡片：在右侧抽屉中打开 GoldSnapshot 插件
                          bus && bus.publish({
                            type: 'plugin/open',
                            source: { component: 'GoldInfoPlug' },
                            target: { component: 'PortalPlugin' },
                            payload: {
                              plugin: 'goldsnapshot',
                              pluginData: {
                                type: 'open_from_portal',
                                data: { market_key: it.market_key },
                              },
                              ui: 'drawer',
                              title: '金价快照',
                            },
                          });
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {it.market_name || it.market_key || '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {it.update_time || '-'}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                          <Typography variant="h5" sx={{ lineHeight: 1, color: chgColor }}>
                            {formatNum(it.price)}
                          </Typography>
                          <Typography variant="body2" sx={{ color: chgColor }}>
                            {`${formatNum(it.change)} (${it.change_percentage || '-'})`}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 1 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" color="text.secondary">开盘</Typography>
                            <Typography variant="body2">{formatNum(it.open)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" color="text.secondary">最高</Typography>
                            <Typography variant="body2">{formatNum(it.highest)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" color="text.secondary">最低</Typography>
                            <Typography variant="body2">{formatNum(it.lowest)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" color="text.secondary">昨结</Typography>
                            <Typography variant="body2">{formatNum(it.previous_settlement)}</Typography>
                          </Box>
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                          {it.date || ''} {it.snapshot_time ? `@ ${new Date(it.snapshot_time).toLocaleString('zh-CN')}` : ''}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default GoldInfoPlug;
