import React, { useState, useEffect } from 'react';
import {
  Box, 
  Typography, 
  Chip, 
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
  TextField,
  Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { syncInfoForPage } from './api';
import { useDialog } from '../../components/tips/useDialog';

const SyncInfoPlug = ({ pluginData, onPluginEvent }) => {
  const { confirm, alert, toast } = useDialog();
  const [loading, setLoading] = useState(false);
  const [syncData, setSyncData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  
  // 过滤条件
  const [filters, setFilters] = useState({
    sync_data_type: '',
    origin: '',
    is_success: '',
    sync_type: '',
    start_date: new Date(),
    end_date: new Date()
  });

  useEffect(() => {
    fetchSyncInfo();
  }, [page, pageSize]);

  const fetchSyncInfo = async () => {
    setLoading(true);
    try {
      const queryParams = {
        page: page + 1, // API 从1开始，组件从0开始
        page_size: pageSize,
        order_by: 'sync_date',
        order_direction: 'DESC',
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => {
            if (key === 'start_date' || key === 'end_date') {
              return value !== null;
            }
            return value !== '';
          }).map(([key, value]) => {
            if ((key === 'start_date' || key === 'end_date') && value) {
              return [key, value.toISOString()];
            }
            return [key, value];
          })
        )
      };

      const response = await syncInfoForPage(queryParams);
      if (response && response.data) {
        setSyncData(response.data.data || []);
        setTotalCount(response.data.pagination.total || 0);
      } else {
        toast(response.message || '获取同步日志失败', 'error');
      }
    } catch (error) {
      console.error('获取同步日志失败:', error);
      toast('获取同步日志失败', 'error');
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

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    setPage(0);
    fetchSyncInfo();
  };

  const handleClearFilters = () => {
    setFilters({
      sync_data_type: '',
      origin: '',
      is_success: '',
      sync_type: '',
      start_date: new Date(),
      end_date: new Date()
    });
    setPage(0);
    // 清空后自动重新获取数据
    setTimeout(() => {
      fetchSyncInfo();
    }, 0);
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    return new Date(dateTime).toLocaleString('zh-CN');
  };

  const getStatusChip = (isSuccess) => {
    return (
      <Chip
        label={isSuccess ? '成功' : '失败'}
        color={isSuccess ? 'success' : 'error'}
        size="small"
      />
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative' }}>
      {/* 过滤条件 */}
      <Box sx={{ 
        p: 1, 
        pl: 0, 
        borderBottom: '1px solid #e0e0e0', 
      }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2, 
            alignItems: 'center' 
          }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>同步状态</InputLabel>
              <Select
                value={filters.is_success}
                label="同步状态"
                onChange={(e) => handleFilterChange('is_success', e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">全部</MenuItem>
                <MenuItem value={true}>成功</MenuItem>
                <MenuItem value={false}>失败</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="操作类型"
              value={filters.sync_type}
              onChange={(e) => handleFilterChange('sync_type', e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <DatePicker
              label="开始时间"
              value={filters.start_date}
              onChange={(newValue) => handleFilterChange('start_date', newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { minWidth: 200 }
                }
              }}
            />
            <DatePicker
              label="结束时间"
              value={filters.end_date}
              onChange={(newValue) => handleFilterChange('end_date', newValue)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { minWidth: 200 }
                }
              }}
            />
            <Button 
              variant="contained" 
              onClick={handleSearch}
              sx={{ ml: 1 }}
            >
              查询
            </Button>
            <Button 
              variant="outlined" 
              onClick={handleClearFilters}
              sx={{ ml: 1 }}
            >
              清空
            </Button>
          </Box>
        </LocalizationProvider>
      </Box>

      {/* 数据表格 */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TableContainer sx={{ 
          flex: 1, 
          overflow: 'auto',
          maxHeight: 'calc(100vh - 150px)' // 根据需要调整高度
        }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>数据源</TableCell>
                <TableCell>同步时间</TableCell>
                <TableCell>操作类型</TableCell>
                <TableCell>数据类型</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>同步消息</TableCell>
                <TableCell>错误消息</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {syncData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.origin || '-'}</TableCell>
                  <TableCell>{formatDateTime(row.sync_date)}</TableCell>
                  <TableCell>{row.sync_type || '-'}</TableCell>
                  <TableCell>{row.sync_data_type || '-'}</TableCell>
                  <TableCell>{getStatusChip(row.is_success)}</TableCell>
                  <TableCell 
                    sx={{ 
                      maxWidth: 200, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={row.sync_message}
                  >
                    {row.sync_message || '-'}
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      maxWidth: 200, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={row.error_message}
                  >
                    {row.error_message || '-'}
                  </TableCell>
                </TableRow>
              ))}
              {syncData.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      暂无数据
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 分页 - 固定在底部 */}
        <Box sx={{ 
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#fafafa'
        }}>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handlePageSizeChange}
            rowsPerPageOptions={[25, 50, 100]}
            labelRowsPerPage="每页显示:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count} 条`}
          />
        </Box>
      </Paper>

      {/* 加载遮罩 */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>
  );
};

export default SyncInfoPlug;