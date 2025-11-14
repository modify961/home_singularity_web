import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useDialog } from '../../../../components/tips/useDialog';
import { latestSnapshot, latestBriefs } from '../../api';
import ReactMarkdown from 'react-markdown';
import { formatLocalDateTime } from '../../../../utils/time';

const formatNum = (v) => {
  if (v === null || v === undefined) return '-';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toFixed(2);
};

const GoldInfoPlug = () => {
  const { toast } = useDialog();
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
        const resp = await latestBriefs('XAUUSD');
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

  // 顶部数据栏所需数据
  const list = Array.isArray(items) ? items : [];
  const rateItem = list.find((it) => it && it.usd_cny_rate != null);
  const usdCnyRate = rateItem ? rateItem.usd_cny_rate : null;
  const matchStr = (it) => `${it?.market_name || ''} ${it?.symbol || ''} ${it?.market_key || ''}`;
  const xau = list.find((it) => matchStr(it).toUpperCase().includes('XAUUSD')) || null;
  const seg = list.find((it) => {
    const s = matchStr(it).toUpperCase();
    return s.includes('SEG') || s.includes('SGE') || /上.?海|SHANGHAI|\bSH\b/i.test(matchStr(it));
  }) || null;
  const currentUsd = (r) => (r?.close ?? r?.price ?? null);
  const currentCny = (r) => (r?.close_cny_per_g ?? r?.price_cny_per_g ?? null);
  const priceTime = (r) => (r?.time || r?.snapshot_time || null);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', bgcolor: 'white', height: '100%' }}>
      {/* 标题栏 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, borderBottom: '1px solid #eee', bgcolor: '#fafafa' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>黄金交易基本信息</Typography>
      </Box>

      {/* 内容区域 */}
      {!collapsed && (
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              left: 0,
              right: 0,
              borderBottom: '1px solid #eee',
              bgcolor: '#fafafa',
              color: 'text.primary',
              px: 1.25,
              py: 0.75,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: 13,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>人民币兑美元汇率</Typography>
            <Typography variant="body2" sx={{ mr: 2 }}>{usdCnyRate != null ? formatNum(usdCnyRate) : '-'}</Typography>

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>|</Typography>

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>纽约黄金交易</Typography>
            <Typography variant="body2">USD {xau ? formatNum(currentUsd(xau)) : '-'}$/盎司</Typography>
            <Typography variant="body2" sx={{ ml: 1 }}> {xau ? formatNum(currentCny(xau)) : '-'}￥/克</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {xau && priceTime(xau) ? `@ ${formatLocalDateTime(priceTime(xau))}` : ''}
            </Typography>

            <Typography variant="caption" sx={{ color: 'text.secondary', mx: 2 }}>|</Typography>

            <Typography variant="caption" sx={{ color: 'text.secondary' }}>上海黄金交易所</Typography>
            <Typography variant="body2">CNY/克 {seg ? formatNum(currentCny(seg)) : '-'}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {seg && priceTime(seg) ? `@ ${formatLocalDateTime(priceTime(seg))}` : ''}
            </Typography>
          </Box>

          {/* 最新简报 */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>最新简报</Typography>
              <Typography variant="caption" color="text.secondary">{brief && (brief.report_date || brief.created_at) ? `报告日期：${brief.report_date || brief.created_at}` : ''}</Typography>
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

          
        </Box>
      )}
    </Box>
  );
};

export default GoldInfoPlug;
