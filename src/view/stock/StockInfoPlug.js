import React, { useState, useEffect } from 'react';
import {Box, TextField, List, ListItem, ListItemText, Paper} from '@mui/material';
import { obtainByCodeOrName } from './api';
import { useDialog } from '../../components/tips/useDialog';

const StockInfoPlug = ({ pluginData, onPluginEvent }) => {
  const { confirm, alert, toast } = useDialog();
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchStocks, setSearchStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);

  // 处理输入框变化
  const handleSearchChange = async (event) => {
    const value = event.target.value;
    setSearchValue(value);
    if (value.trim()) {
      const response = await obtainByCodeOrName(value.trim());
      if (response && response.data) {
        setSearchStocks(response.data || []);
      }else {
        setSearchStocks([]);
      }
    } else {
      setSearchStocks([]);
    }
  };

  // 处理股票选择
  const handleStockSelect = (stock) => {
    setSelectedStock(stock);
    setSearchValue(`${stock.stock_name}(${stock.stock_code})`);
    setSearchStocks([]);
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative' }}>
      {/* 菜单栏 */}
      <Box sx={{ display: 'flex', alignItems: 'center',  gap: 0.5, height: 40, px: 1, borderBottom: '1px solid #e0e0e0'}}>
        <Box sx={{ position: 'relative', minWidth: 500 }}>
          <TextField
            size="small"
            placeholder="请输入股票代码或名称"
            value={searchValue}
            onChange={handleSearchChange}
            disabled={loading}
            sx={{ 
              width: '100%',
              '& .MuiOutlinedInput-root': {
                height: 32,
                borderRadius: 0
              }
            }}
          />
          {/* 搜索结果下拉列表 */}
          {searchStocks.length > 0 && (
            <Paper
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                overflow: 'auto',
                mt: 0.5,
                borderRadius: 0,
                border: '1px solid #e0e0e0',
                borderTop: 'none'
              }}
            >
              <List dense>
                {searchStocks.map((stock, index) => (
                  <ListItem
                    key={index}
                    button
                    onClick={() => handleStockSelect(stock)}
                    sx={{
                      '&:hover': {
                        backgroundColor: '#f5f5f5'
                      }
                    }}
                  >
                    <ListItemText
                      primary={`${stock.stock_name}(${stock.stock_code})`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Box>
      
      {/* 主内容区域 */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        padding: 2
      }}>
        {/* 暂时留空 */}
      </Box>
    </Box>
  );
};

export default StockInfoPlug;