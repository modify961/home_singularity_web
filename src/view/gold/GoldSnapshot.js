import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Backdrop,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Checkbox,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useDialog } from '../../components/tips/useDialog';
import { allMarkets, getSnapshotByMarkets } from './api';
import * as echarts from 'echarts';
import { useBus } from '../../utils/BusProvider';
import { toLocalDate, formatLocalDateTime } from '../../utils/time';

const GoldSnapshot = ({ pluginData, onPluginEvent }) => {
  const { toast } = useDialog();
  const bus = useBus();

  const [loading, setLoading] = useState(false);
  const [markets, setMarkets] = useState([]);
  const [marketKey, setMarketKey] = useState('');
  const [klineType, setKlineType] = useState('5min');

  const [snapshots, setSnapshots] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  const [filters, setFilters] = useState({
    start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end_date: new Date(),
  });

  // 表格选择：选中行的 key 集合（当前页）
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());

  // 行唯一 key（优先 id，其次 组合键）
  const rowKey = (row) => String(row.id ?? `${row.market_key}-${row.time}`);

  // 切换单行选中
  const toggleRow = (row) => {
    const key = rowKey(row);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // 全选/取消全选（针对当前页）
  const toggleAll = () => {
    const keys = snapshots.map(rowKey);
    const allChecked = keys.length > 0 && keys.every((k) => selectedKeys.has(k));
    setSelectedKeys(() => (allChecked ? new Set() : new Set(keys)));
  };

  // 时间处理改为使用 utils/time

  // 将选中行转为 AI 标签并通过总线发送给 AidenOntology
  const sendSelectedAsTags = () => {
    const list = snapshots.filter((r) => selectedKeys.has(rowKey(r)));
    if (!list.length) return;
    const tags = list.map((r) => buildTagFromRow(r));
    bus && bus.publish({
      type: 'aiden/tags.add',
      source: { component: 'GoldSnapshot' },
      target: { component: 'AidenOntology' },
      payload: { tags },
    });
    toast && toast(`已添加 ${tags.length} 条标签到 AI 输入区`, 'success');
  };

  // 取值助手：优先使用人民币/克字段，兼容旧字段
  const getOpen = (r) => (r?.open_cny_per_g ?? r?.open ?? null);
  const getHigh = (r) => (r?.high_cny_per_g ?? r?.highest ?? r?.high ?? null);
  const getLow = (r) => (r?.low_cny_per_g ?? r?.lowest ?? r?.low ?? null);
  const getClose = (r) => (r?.close_cny_per_g ?? r?.price ?? r?.close ?? null);

  // 涨跌与涨跌幅（基于开盘/收盘）
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

  // 将一条快照数据构造成标签（title + markdown 内容）
  const buildTagFromRow = (row) => {
    const title = `${row.market_name || row.market_key || '-'} @ ${formatLocalDateTime(row.time)}`;
    const md = [
      `### 黄金价格快照`,
      `- 市场: ${row.market_name || row.market_key || '-'}`,
      `- 时间: ${formatLocalDateTime(row.time)}`,
      `- 价格(元/克): ${formatNum(getClose(row))}  涨跌: ${formatNum(computeChange(row))}  涨跌幅: ${formatPercent(computeChangePct(row))}`,
      `- 开盘(元/克): ${formatNum(getOpen(row))}  最高(元/克): ${formatNum(getHigh(row))}  最低(元/克): ${formatNum(getLow(row))}  昨结: ${formatNum(row.previous_settlement)}`,
      `- 来源更新时间: ${row.update_time || '-'}`,
      row.date ? `- 备注/合约: ${row.date}` : null,
    ].filter(Boolean).join('\n');
    return { title, content: md, isClose: true };
  };

  // ECharts refs
  const chartElRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    // 初始化加载交易市场
    const load = async () => {
      setLoading(true);
      try {
        const resp = await allMarkets();
        const list = (resp && resp.data) || [];
        setMarkets(list);
        if (list && list.length > 0) {
          setMarketKey(list[0].market_key || '');
        }
      } catch (e) {
        console.error(e);
        toast && toast('获取交易市场失败', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!marketKey) return;
    fetchSnapshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketKey, page, pageSize, klineType]);

  // Init chart once
  useEffect(() => {
    if (!chartElRef.current) return;
    chartRef.current = echarts.init(chartElRef.current, undefined, { renderer: 'canvas' });
    const handleResize = () => chartRef.current && chartRef.current.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.dispose();
        chartRef.current = null;
      }
    };
  }, []);

  // Sorted snapshots for chart (ASC by time)
  const sortedSnapshots = useMemo(() => {
    const list = Array.isArray(snapshots) ? [...snapshots] : [];
    list.sort((a, b) => toLocalDate(a.time) - toLocalDate(b.time));
    return list;
  }, [snapshots]);

  // Map snapshot key -> chart index
  const chartIndexMap = useMemo(() => {
    const map = new Map();
    sortedSnapshots.forEach((it, idx) => {
      const key = it?.id ?? it?.time;
      if (key != null) map.set(String(key), idx);
    });
    return map;
  }, [sortedSnapshots]);

  // Summary for current page
  const pageSummary = useMemo(() => {
    const list = Array.isArray(snapshots) ? snapshots : [];
    let maxItem = null;
    let minItem = null;
    for (const it of list) {
      const hiV = getHigh(it);
      const loV = getLow(it);
      const hi = hiV != null ? Number(hiV) : null;
      const lo = loV != null ? Number(loV) : null;
      if (hi != null && !Number.isNaN(hi)) {
        if (!maxItem || hi > maxItem.value) maxItem = { value: hi, time: it.time, item: it };
      }
      if (lo != null && !Number.isNaN(lo)) {
        if (!minItem || lo < minItem.value) minItem = { value: lo, time: it.time, item: it };
      }
    }
    return { max: maxItem, min: minItem, count: list.length };
  }, [snapshots]);

  // Update chart when data changes (K-line)
  useEffect(() => {
    if (!chartRef.current) return;
    const list = sortedSnapshots;

    const categories = list.map(it => {
      try { return toLocalDate(it.time).toLocaleString('zh-CN'); } catch { return String(it.time); }
    });
    const ohlc = list.map(it => [
      getOpen(it) != null ? Number(getOpen(it)) : null,
      getClose(it) != null ? Number(getClose(it)) : null,
      getLow(it) != null ? Number(getLow(it)) : null,
      getHigh(it) != null ? Number(getHigh(it)) : null,
    ]);

    const option = {
      animation: true,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      grid: { left: 40, right: 20, top: 30, bottom: 30 },
      legend: { data: ['K线'] },
      xAxis: {
        type: 'category',
        data: categories,
        boundaryGap: true,
        axisLine: { onZero: false },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: { formatter: '{value}' },
        splitLine: { show: true },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, start: 0, end: 100 },
        { type: 'slider', xAxisIndex: 0, height: 20 },
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: ohlc,
          itemStyle: {
            color: '#f44336',       // up (close > open) - red
            color0: '#26a69a',      // down
            borderColor: '#f44336',
            borderColor0: '#26a69a',
          },
          markPoint: {
            symbolSize: 55,
            label: { formatter: (params) => `${params.name}\n${params.value}` },
            data: [
              { type: 'max', name: '最高', valueDim: 'highest' },
              { type: 'min', name: '最低', valueDim: 'lowest' },
            ],
          },
          markLine: {
            symbol: ['none', 'none'],
            lineStyle: { type: 'dashed', color: '#999' },
            data: [
              { type: 'max', name: '最高线', valueDim: 'highest' },
              { type: 'min', name: '最低线', valueDim: 'lowest' },
            ],
          },
        },
      ],
    };
    chartRef.current.setOption(option, { notMerge: true });
    setTimeout(() => chartRef.current && chartRef.current.resize(), 0);
  }, [sortedSnapshots]);

  // Row -> Chart highlight linkage
  const lastHighlightIdxRef = useRef(null);
  const showTipForRow = (row) => {
    if (!chartRef.current || !row) return;
    const key = String(row.id ?? row.time);
    const idx = chartIndexMap.get(key);
    if (idx == null) return;
    if (lastHighlightIdxRef.current != null) {
      chartRef.current.dispatchAction({ type: 'downplay', seriesIndex: 0, dataIndex: lastHighlightIdxRef.current });
    }
    chartRef.current.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: idx });
    chartRef.current.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: idx });
    lastHighlightIdxRef.current = idx;
  };
  const clearTip = () => {
    if (!chartRef.current) return;
    chartRef.current.dispatchAction({ type: 'hideTip' });
    if (lastHighlightIdxRef.current != null) {
      chartRef.current.dispatchAction({ type: 'downplay', seriesIndex: 0, dataIndex: lastHighlightIdxRef.current });
      lastHighlightIdxRef.current = null;
    }
  };

  const buildQuery = () => {
    const query = {
      page: page + 1, // API 从1开始
      page_size: pageSize,
      market_key: marketKey,
      kline_type: klineType
    };
    const { start_date, end_date } = filters;
    if (start_date || end_date) {
      query.time = [
        start_date ? new Date(start_date).toISOString() : null,
        end_date ? new Date(end_date).toISOString() : null,
      ];
    }
    return query;
  };

  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const resp = await getSnapshotByMarkets(buildQuery());
      if (resp && resp.data) {
        setSnapshots(resp.data.data || []);
        setTotalCount((resp.data.pagination && resp.data.pagination.total) || 0);
      } else {
        toast && toast(resp?.message || '获取交易快照失败', 'error');
      }
    } catch (e) {
      console.error(e);
      toast && toast('获取交易快照失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    fetchSnapshots();
  };

  const handleClear = () => {
    setFilters({ start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end_date: new Date() });
    setPage(0);
    setTimeout(() => fetchSnapshots(), 0);
  };

  const formatNum = (v, d = 2) => {
    if (v === null || v === undefined || v === '') return '-';
    const n = Number(v);
    if (Number.isNaN(n)) return String(v);
    return n.toFixed(d);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative', p: 1 }}>
      {/* 顶部筛选栏 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel id="market-select-label">交易市场</InputLabel>
          <Select
            labelId="market-select-label"
            label="交易市场"
            value={marketKey}
            onChange={(e) => {
              setMarketKey(e.target.value);
              setPage(0);
            }}
          >
            {markets.map((m) => (
              <MenuItem key={m.market_key} value={m.market_key}>
                {m.market_name || m.market_key}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="kline-type-select-label">K线周期</InputLabel>
          <Select
            labelId="kline-type-select-label"
            label="K线周期"
            value={klineType}
            onChange={(e) => {
              setKlineType(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value="5min">5分钟</MenuItem>
            {marketKey === 'XAUUSD' && <MenuItem value="4h">4小时</MenuItem>}
            <MenuItem value="daily">日线</MenuItem>
          </Select>
        </FormControl>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="开始时间"
            value={filters.start_date}
            onChange={(v) => setFilters((prev) => ({ ...prev, start_date: v }))}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } } }}
          />
          <DatePicker
            label="结束时间"
            value={filters.end_date}
            onChange={(v) => setFilters((prev) => ({ ...prev, end_date: v }))}
            slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } } }}
          />
        </LocalizationProvider>

        <Button variant="contained" onClick={handleSearch}>查询</Button>
        <Button variant="outlined" onClick={handleClear}>清空</Button>
        <Box sx={{ flex: 1 }} />
        <Button size="small" variant="contained" onClick={sendSelectedAsTags} disabled={!selectedKeys || selectedKeys.size === 0}>
          加入AI标签
        </Button>
      </Box>

      {/* 图表 + 摘要 */}
      <Paper sx={{ mb: 1, p: 1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            统计区间：{pageSummary.count || 0} 条
          </Typography>
          <Typography variant="body2" color="text.secondary">
            最高：{pageSummary.max ? `${pageSummary.max.value} @ ${formatLocalDateTime(pageSummary.max.time)}` : '-'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            最低：{pageSummary.min ? `${pageSummary.min.value} @ ${formatLocalDateTime(pageSummary.min.time)}` : '-'}
          </Typography>
        </Box>
        <Box ref={chartElRef} sx={{ width: '100%', height: 360 }} />
      </Paper>

      {/* 表格 */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TableContainer sx={{ flex: 1, overflow: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={snapshots.length > 0 && !snapshots.every((r) => selectedKeys.has(String(r.id ?? `${r.market_key}-${r.time}`))) && selectedKeys.size > 0}
                    checked={snapshots.length > 0 && snapshots.every((r) => selectedKeys.has(String(r.id ?? `${r.market_key}-${r.time}`)))}
                    onChange={toggleAll}
                  />
                </TableCell>
                <TableCell>时间</TableCell>
                <TableCell align="right">价格(元/克)</TableCell>
                <TableCell align="right">涨跌</TableCell>
                <TableCell align="right">涨跌幅</TableCell>
                <TableCell align="right">开盘</TableCell>
                <TableCell align="right">最高</TableCell>
                <TableCell align="right">最低</TableCell>
                <TableCell align="right">收盘</TableCell>
                <TableCell>市场</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {snapshots.map((row) => (
                <TableRow
                  key={row.id || `${row.market_key}-${row.time}` }
                  hover
                  onMouseEnter={() => showTipForRow(row)}
                  onMouseLeave={clearTip}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedKeys.has(String(row.id ?? `${row.market_key}-${row.time}`))}
                      onChange={() => toggleRow(row)}
                    />
                  </TableCell>
                  <TableCell>{formatLocalDateTime(row.time)}</TableCell>
                  <TableCell align="right">{formatNum(getClose(row))}</TableCell>
                  <TableCell align="right">{formatNum(computeChange(row))}</TableCell>
                  <TableCell align="right">{formatPercent(computeChangePct(row))}</TableCell>
                  <TableCell align="right">{formatNum(getOpen(row))}</TableCell>
                  <TableCell align="right">{formatNum(getHigh(row))}</TableCell>
                  <TableCell align="right">{formatNum(getLow(row))}</TableCell>
                  <TableCell align="right">{formatNum(row.close_cny_per_g)}</TableCell>
                  <TableCell>{row.symbol }</TableCell>
                </TableRow>
              ))}
              {snapshots.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={12} align="center">
                    <Typography variant="body2" color="text.secondary">暂无数据</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handlePageSizeChange}
            rowsPerPageOptions={[50, 100, 200]}
            labelRowsPerPage="每页显示:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共${count} 条`}
          />
        </Box>
      </Paper>

      <Backdrop sx={{ color: '#fff', zIndex: (t) => t.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default GoldSnapshot;
