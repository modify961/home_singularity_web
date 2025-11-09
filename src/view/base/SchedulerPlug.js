import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography, Chip, Button,
  CircularProgress, Backdrop,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, FormControl, InputLabel, Select, MenuItem, Switch
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
// removed global enable/disable button; using per-row Switch instead
import { useDialog } from '../../components/tips/useDialog';
import {
  jobsForPage,
  deleteJob,
  enableJob,
  runJobOnce,
  schedulerLogs
} from './api';
import SchedulerInfoPlug from './component/SchedulerInfoPlug';

const SchedulerPlug = ({ pluginData, onPluginEvent }) => {
  const { confirm, toast } = useDialog();

  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoData, setInfoData] = useState({});
  // 任务分页
  const [jobPage, setJobPage] = useState(0); // 0-based
  const [jobPageSize, setJobPageSize] = useState(20);
  const [totalJobs, setTotalJobs] = useState(0);

  // 日志相关状态
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logPage, setLogPage] = useState(0);
  const [logPageSize, setLogPageSize] = useState(20);
  const [logFilters, setLogFilters] = useState({ status: '', start_date: new Date(), end_date: new Date() });

  useEffect(() => {
    fetchJobs();
  }, [jobPage, jobPageSize]);

  useEffect(() => {
    // 初始化与选择变化时都加载日志；当无选中任务时，job_key 置空，加载全部
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJob, logPage, logPageSize]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await jobsForPage({ page: jobPage + 1, page_size: jobPageSize, order_by: 'sort_num', order_direction: 'ASC' });
      const list = (res && res.data && (res.data.data || res.data.list || res.data)) || [];
      const total = (res && res.data && res.data.pagination && res.data.pagination.total) || (Array.isArray(list) ? list.length : 0);
      setJobs(Array.isArray(list) ? list : []);
      setTotalJobs(total);
      // 保留当前选中项；若不在当前页则清空选中
      setSelectedJob(prev => {
        if (!prev) return null;
        const exists = (Array.isArray(list) ? list : []).find(j => j.id === prev.id);
        return exists || null;
      });
    } catch (e) {
      console.error('获取任务列表失败', e);
      toast('获取任务列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    if (!selectedJob) return;
    setLoading(true);
    try {
      const buildDateISO = (d, end = false) => {
        if (!d) return null;
        const dt = new Date(d);
        if (Number.isNaN(dt.getTime())) return null;
        if (end) dt.setHours(23, 59, 59, 999);
        else dt.setHours(0, 0, 0, 0);
        return dt.toISOString();
      };

      const query = {
        page: logPage + 1,
        page_size: logPageSize,
        job_key: (selectedJob && selectedJob.job_key) ? selectedJob.job_key : '',
      };
      if (logFilters.status) query.status = logFilters.status;
      if (logFilters.start_date) query.start_time = buildDateISO(logFilters.start_date, false);
      if (logFilters.end_date) query.end_time = buildDateISO(logFilters.end_date, true);
      const res = await schedulerLogs(query);
      const rows = res?.data?.data || [];
      const total = res?.data?.pagination?.total || 0;
      setLogs(rows);
      setTotalLogs(total);
    } catch (e) {
      console.error('获取任务日志失败', e);
      toast('获取任务日志失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setInfoData({});
    setIsInfoOpen(true);
  };

  const handleEditRow = (row) => {
    setInfoData(row);
    setIsInfoOpen(true);
  };

  const handleDeleteRow = (row) => {
    confirm(
      '确认删除',
      `删除任务「${row.name || row.job_key}」将无法恢复，确定继续？`,
      async () => {
        setLoading(true);
        try {
          await deleteJob(row.id);
          toast('删除成功', 'success');
          await fetchJobs();
        } catch (e) {
          console.error('删除任务失败', e);
          toast('删除失败', 'error');
        } finally {
          setLoading(false);
        }
      },
      () => {}
    );
  };

  const handleToggleEnableRow = async (row, toEnabled) => {
    setLoading(true);
    try {
      await enableJob(row.id, !!toEnabled);
      toast(!!toEnabled ? '已启用' : '已禁用', 'success');
      await fetchJobs();
    } catch (e) {
      console.error('切换状态失败', e);
      toast('切换状态失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunOnceRow = async (row) => {
    confirm(
      '确认执行',
      `确认执行任务「${row.name}」？`,
      async () => {
        setLoading(true);
        try {
            await runJobOnce(row.id);
            toast('已触发执行', 'success');
            if (selectedJob && selectedJob.id === row.id) {
                setLogPage(0);
                await fetchLogs();
            }
        } catch (e) {
            console.error('触发执行失败', e);
            toast('触发执行失败', 'error');
        } finally {
            setLoading(false);
        }
      },
      () => {}
    );
    
  };

  const onInfoEvent = async (eventName) => {
    if (eventName === 'refresh') {
      await fetchJobs();
    }
    setIsInfoOpen(false);
  };

  const formatDateTime = (dt) => {
    if (!dt) return '-';
    try {
      return new Date(dt).toLocaleString('zh-CN');
    } catch (e) { return String(dt); }
  };

  const handleLogSearch = () => {
    setLogPage(0);
    fetchLogs();
  };

  const handleLogClear = () => {
    setLogFilters({ status: '', start_date: new Date(), end_date: new Date() });
    setLogPage(0);
    setTimeout(fetchLogs, 0);
  };

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100%', position: 'relative', gap: 1 }}>
      {/* 左侧：任务管理 */}
      <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #eee' }}>
        {/* 操作栏（右对齐） */}
        <Box sx={{pr:1,  borderBottom: '1px solid #e0e0e0', minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>新增</Button>
        </Box>
        {/* 表格：任务列表 */}
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>名称</TableCell>
                  <TableCell>任务Key</TableCell>
                  <TableCell>序号</TableCell>
                  <TableCell>Cron</TableCell>
                  <TableCell>时区</TableCell>
                  <TableCell>启用</TableCell>
                  <TableCell>操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(jobs || []).map(row => {
                  const isSelected = selectedJob && row.id === selectedJob.id;
                  const enabledOn = row.enabled === 1 || row.enabled === true;
                  return (
                    <TableRow key={row.id} hover selected={!!isSelected} onClick={() => setSelectedJob(row)} sx={{ cursor: 'pointer' }}>
                      <TableCell>{row.name || '-'}</TableCell>
                      <TableCell>{row.job_key || '-'}</TableCell>
                      <TableCell>{row.sort_num || '-'}</TableCell>
                      <TableCell>{row.cron || '-'}</TableCell>
                      <TableCell>{row.timezone || '-'}</TableCell>
                      <TableCell>
                        <Switch size="small" checked={!!enabledOn} onChange={(e) => { e.stopPropagation(); handleToggleEnableRow(row, e.target.checked); }} />
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="text" startIcon={<EditIcon />} onClick={(e) => { e.stopPropagation(); handleEditRow(row); }}>编辑</Button>
                        <Button size="small" variant="text" color="error" startIcon={<DeleteIcon />} onClick={(e) => { e.stopPropagation(); handleDeleteRow(row); }}>删除</Button>
                        <Button size="small" variant="text" startIcon={<PlayArrowIcon />} onClick={(e) => { e.stopPropagation(); handleRunOnceRow(row); }}>执行一次</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {jobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">暂无任务</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
            <TablePagination
              component="div"
              count={totalJobs}
              page={jobPage}
              onPageChange={(e, p) => setJobPage(p)}
              rowsPerPage={jobPageSize}
              onRowsPerPageChange={(e) => { setJobPageSize(parseInt(e.target.value, 10)); setJobPage(0); }}
              rowsPerPageOptions={[20]}
              labelRowsPerPage="每页显示:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count} 条`}
            />
          </Box>
        </Paper>
      </Box>

      {/* 右侧：日志 */}
      <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{pr:1,  borderBottom: '1px solid #e0e0e0', minHeight: 56, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>状态</InputLabel>
            <Select label="状态" value={logFilters.status} onChange={(e) => setLogFilters(prev => ({ ...prev, status: e.target.value }))}>
              <MenuItem value="">全部</MenuItem>
              <MenuItem value="success">success</MenuItem>
              <MenuItem value="error">error</MenuItem>
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="开始日期"
              value={logFilters.start_date}
              onChange={(v) => setLogFilters(prev => ({ ...prev, start_date: v }))}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 170 } } }}
            />
            <DatePicker
              label="结束日期"
              value={logFilters.end_date}
              onChange={(v) => setLogFilters(prev => ({ ...prev, end_date: v }))}
              slotProps={{ textField: { size: 'small', sx: { minWidth: 170 } } }}
            />
          </LocalizationProvider>
          <Button size="small" variant="contained" onClick={handleLogSearch}>查询</Button>
          <Button size="small" variant="outlined" onClick={handleLogClear}>清空</Button>
        </Box>
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>开始</TableCell>
                  <TableCell>结束</TableCell>
                  <TableCell>耗时(ms)</TableCell>
                  <TableCell>消息</TableCell>
                  <TableCell>异常</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(logs || []).map(row => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      <Chip size="small" color={row.status === 'success' ? 'success' : (row.status ? 'error' : 'default')} label={row.status || '-'} />
                    </TableCell>
                    <TableCell>{formatDateTime(row.started_at)}</TableCell>
                    <TableCell>{formatDateTime(row.finished_at)}</TableCell>
                    <TableCell>{row.duration_ms ?? '-'}</TableCell>
                    <TableCell title={row.message || ''} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.message || '-'}</TableCell>
                    <TableCell title={row.exception || ''} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.exception || '-'}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">{selectedJob ? '暂无日志' : '请先选择任务'}</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
            <TablePagination
              component="div"
              count={totalLogs}
              page={logPage}
              onPageChange={(e, p) => setLogPage(p)}
              rowsPerPage={logPageSize}
              onRowsPerPageChange={(e) => { setLogPageSize(parseInt(e.target.value, 10)); setLogPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage="每页显示:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count} 条`}
            />
          </Box>
        </Paper>
      </Box>

      {/* 弹窗：新增/编辑任务 */}
      <SchedulerInfoPlug
        pluginData={infoData || {}}
        onPluginEvent={onInfoEvent}
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />

      {/* 加载遮罩 */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default SchedulerPlug;
