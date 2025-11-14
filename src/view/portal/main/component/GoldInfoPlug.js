import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
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

const computeChange = (current, previous) => {
  const c = Number(current);
  const p = Number(previous);
  if (!Number.isFinite(c) || !Number.isFinite(p)) return null;
  const diff = c - p;
  const ratio = p !== 0 ? diff / p : 0;
  const dir = diff > 0 ? 'up' : (diff < 0 ? 'down' : 'flat');
  return {
    dir,
    ratio,
    color: dir === 'up' ? 'error.main' : (dir === 'down' ? 'success.main' : 'text.secondary'),
  };
};

const formatPercent = (v) => {
  if (v === null || v === undefined) return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  return `${(n * 100).toFixed(2)}%`;
};

const GoldInfoPlug = () => {
  const { toast } = useDialog();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [briefLoading, setBriefLoading] = useState(false);
  const [brief, setBrief] = useState(null);

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

  const list = Array.isArray(items) ? items : [];
  const rateItem = list.find((it) => it && it.usd_cny_rate != null);
  const usdCnyRate = rateItem ? rateItem.usd_cny_rate : null;
  const xau = list.find((it) => (String(it?.symbol || '').toUpperCase()) === 'XAUUSD') || null;
  const seg = list.find((it) => ['SEG', 'SGE'].includes(String(it?.symbol || '').toUpperCase())) || null;
  const currentUsd = (r) => (r?.close ?? r?.price ?? null);
  const currentCny = (r) => (r?.close_cny_per_g ?? r?.price_cny_per_g ?? null);
  const priceTime = (r) => (r?.time || r?.snapshot_time || null);

  // 优先 price vs close；没有 price 时用 close vs open 作为当前周期涨跌
  const xauChange = xau ? (
    (xau?.price != null && xau?.close != null)
      ? computeChange(xau?.price, xau?.close)
      : (xau?.close != null && xau?.open != null)
        ? computeChange(xau?.close, xau?.open)
        : null
  ) : null;
  const segChange = seg ? (
    (seg?.price_cny_per_g != null && seg?.close_cny_per_g != null)
      ? computeChange(seg?.price_cny_per_g, seg?.close_cny_per_g)
      : (seg?.close_cny_per_g != null && seg?.open_cny_per_g != null)
        ? computeChange(seg?.close_cny_per_g, seg?.open_cny_per_g)
        : null
  ) : null;

  const ChangeInline = ({ change }) => {
    if (!change) return null;
    return (
      <Box sx={{ ml: 0.75, display: 'inline-flex', alignItems: 'center', color: change.color }}>
        {change.dir === 'up' && <ArrowDropUpIcon fontSize="small" />}
        {change.dir === 'down' && <ArrowDropDownIcon fontSize="small" />}
        <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1 }}>
          {formatPercent(change.ratio)}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', bgcolor: 'white', height: '100%' }}>
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
            fontSize: 14,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>人民币兑美元汇率</Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>{usdCnyRate != null ? formatNum(usdCnyRate) : '-'}</Typography>

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>|</Typography>

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>纽约黄金交易</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {xau && priceTime(xau) ? `@ ${formatLocalDateTime(priceTime(xau))}` : ''}
          </Typography>
          <Typography variant="body2">USD {xau ? formatNum(currentUsd(xau)) : '-'}$/盎司</Typography>
          <ChangeInline change={xauChange} />
          <Typography variant="body2" sx={{ ml: 1 }}>{xau ? formatNum(currentCny(xau)) : '-'}元/克</Typography>
          

          <Typography variant="caption" sx={{ color: 'text.secondary', mx: 2 }}>|</Typography>

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>上海黄金交易所</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {seg && priceTime(seg) ? `@ ${formatLocalDateTime(priceTime(seg))}` : ''}
          </Typography>
          <Typography variant="body2">{seg ? formatNum(currentCny(seg)) : '-'}元/克</Typography>
          <ChangeInline change={segChange} />
          
        </Box>

        <Box>
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
    </Box>
  );
};

export default GoldInfoPlug;

