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
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useDialog } from '../../components/tips/useDialog';
import { allMarkets, getSnapshotByMarkets } from './api';
import * as echarts from 'echarts';

const GoldSnapshot = ({ pluginData, onPluginEvent }) => {
  const { toast } = useDialog();

  const [loading, setLoading] = useState(false);
  const [markets, setMarkets] = useState([]);
  const [marketKey, setMarketKey] = useState('');

  const [snapshots, setSnapshots] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  const [filters, setFilters] = useState({
    start_date: new Date(),
    end_date: new Date(),
  });

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
  }, [marketKey, page, pageSize]);

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
    list.sort((a, b) => new Date(a.snapshot_time) - new Date(b.snapshot_time));
    return list;
  }, [snapshots]);

  // Map snapshot key -> chart index
  const chartIndexMap = useMemo(() => {
    const map = new Map();
    sortedSnapshots.forEach((it, idx) => {
      const key = it?.id ?? it?.snapshot_time;
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
      const hi = it?.highest != null ? Number(it.highest) : null;
      const lo = it?.lowest != null ? Number(it.lowest) : null;
      if (hi != null && !Number.isNaN(hi)) {
        if (!maxItem || hi > maxItem.value) maxItem = { value: hi, time: it.snapshot_time, item: it };
      }
      if (lo != null && !Number.isNaN(lo)) {
        if (!minItem || lo < minItem.value) minItem = { value: lo, time: it.snapshot_time, item: it };
      }
    }
    return { max: maxItem, min: minItem, count: list.length };
  }, [snapshots]);

  // Update chart when data changes (K-line)
  useEffect(() => {
    if (!chartRef.current) return;
    const list = sortedSnapshots;

    const categories = list.map(it => {
      try { return new Date(it.snapshot_time).toLocaleString('zh-CN'); } catch { return String(it.snapshot_time); }
    });
    const ohlc = list.map(it => [
      it.open != null ? Number(it.open) : null,
      it.price != null ? Number(it.price) : null,  // treat price as close
      it.lowest != null ? Number(it.lowest) : null,
      it.highest != null ? Number(it.highest) : null,
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
    const key = String(row.id ?? row.snapshot_time);
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
    };
    const { start_date, end_date } = filters;
    if (start_date || end_date) {
      query.snapshot_time = [
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
    setFilters({ start_date: new Date(), end_date: new Date() });
    setPage(0);
    setTimeout(() => fetchSnapshots(), 0);
  };

  const formatDateTime = (v) => {
    if (!v) return '-';
    try {
      return new Date(v).toLocaleString('zh-CN');
    } catch {
      return v;
    }
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
            onChange={(e) => setMarketKey(e.target.value)}
          >
            {markets.map((m) => (
              <MenuItem key={m.market_key} value={m.market_key}>
                {m.market_name || m.market_key}
              </MenuItem>
            ))}
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
      </Box>

      {/* 图表 + 摘要 */}
      <Paper sx={{ mb: 1, p: 1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            统计区间：{pageSummary.count || 0} 条
          </Typography>
          <Typography variant="body2" color="text.secondary">
            最高：{pageSummary.max ? `${pageSummary.max.value} @ ${new Date(pageSummary.max.time).toLocaleString('zh-CN')}` : '-'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            最低：{pageSummary.min ? `${pageSummary.min.value} @ ${new Date(pageSummary.min.time).toLocaleString('zh-CN')}` : '-'}
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
                <TableCell>时间</TableCell>
                <TableCell>市场</TableCell>
                <TableCell align="right">价格</TableCell>
                <TableCell align="right">涨跌</TableCell>
                <TableCell align="right">涨跌幅</TableCell>
                <TableCell align="right">开盘</TableCell>
                <TableCell align="right">最高</TableCell>
                <TableCell align="right">最低</TableCell>
                <TableCell align="right">昨结</TableCell>
                <TableCell>来源更新时间</TableCell>
                <TableCell>备注/合约</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {snapshots.map((row) => (
                <TableRow
                  key={row.id || `${row.market_key}-${row.snapshot_time}` }
                  hover
                  onMouseEnter={() => showTipForRow(row)}
                  onMouseLeave={clearTip}
                >
                  <TableCell>{formatDateTime(row.snapshot_time)}</TableCell>
                  <TableCell>{row.market_name || row.market_key || '-'}</TableCell>
                  <TableCell align="right">{formatNum(row.price)}</TableCell>
                  <TableCell align="right">{formatNum(row.change)}</TableCell>
                  <TableCell align="right">{row.change_percentage || '-'}</TableCell>
                  <TableCell align="right">{formatNum(row.open)}</TableCell>
                  <TableCell align="right">{formatNum(row.highest)}</TableCell>
                  <TableCell align="right">{formatNum(row.lowest)}</TableCell>
                  <TableCell align="right">{formatNum(row.previous_settlement)}</TableCell>
                  <TableCell>{row.update_time || '-'}</TableCell>
                  <TableCell>{row.date || '-'}</TableCell>
                </TableRow>
              ))}
              {snapshots.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={11} align="center">
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
