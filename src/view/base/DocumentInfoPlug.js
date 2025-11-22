import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import { useDialog } from '../../components/tips/useDialog';
import { listDocuments, getDocumentById } from './api';
import DocumentFormPlug from './component/DocumentFormPlug';
import DocumentDetailPlug from './component/DocumentDetailPlug';

const DocumentInfoPlug = ({ pluginData, onPluginEvent }) => {
  const { toast } = useDialog();

  const [documents, setDocuments] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [search, setSearch] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLang, setDetailLang] = useState('cn');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoadingList(true);
    try {
      const resp = await listDocuments({ page: 1, page_size: 200 });
      const list = (resp && resp.data && resp.data.data) || [];
      setDocuments(list);
    } catch (e) {
      console.error(e);
      toast && toast('加载文档列表失败', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  const loadDetail = async (id) => {
    if (!id) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    try {
      const resp = await getDocumentById(id);
      const data = (resp && resp.data) || null;
      setDetail(data || null);
      if (data) {
        const lang =
          data.document_md_cn && String(data.document_md_cn).trim()
            ? 'cn'
            : 'en';
        setDetailLang(lang);
      }
    } catch (e) {
      console.error(e);
      toast && toast('加载文档详情失败', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    const key = (search || '').trim().toLowerCase();
    if (!key) return documents;
    return documents.filter((doc) => {
      const name = (doc.document_name || '').toLowerCase();
      const k1 = (doc.document_kind_one || '').toLowerCase();
      const k2 = (doc.document_kind_two || '').toLowerCase();
      return name.includes(key) || k1.includes(key) || k2.includes(key);
    });
  }, [documents, search]);

  const handleSelect = (id) => {
    setSelectedId(id || null);
    loadDetail(id || null);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (idFromDetail) => {
    const targetId = idFromDetail || selectedId;
    if (!targetId) {
      toast && toast('请先选择要编辑的文档', 'warning');
      return;
    }
    setEditingId(targetId);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleFormEvent = (event, payload) => {
    if (event === 'saved') {
      loadDocuments();
      const id = payload && payload.id;
      if (id) {
        setSelectedId(id);
        loadDetail(id);
      }
    } else if (event === 'deleted') {
      loadDocuments();
      const id = payload && payload.id;
      if (id && id === selectedId) {
        setSelectedId(null);
        setDetail(null);
      } else if (selectedId) {
        loadDetail(selectedId);
      }
    }

    if (typeof onPluginEvent === 'function') {
      onPluginEvent(event, payload);
    }
  };

  const handleDetailEvent = (event, payload) => {
    if (event === 'edit') {
      const id = payload && payload.id;
      handleOpenEdit(id);
    }
    if (typeof onPluginEvent === 'function') {
      onPluginEvent(event, payload);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* 左侧文档列表 */}
      <Box
        sx={{
          width: 320,
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Box sx={{ p: 1 }}>
          <TextField
            size="small"
            fullWidth
            label="搜索文档（名称或分类）"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
        <Box sx={{ px: 1, pb: 1, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleOpenNew}
          >
            新增文档
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={loadDocuments}
          >
            刷新
          </Button>
        </Box>
        <Divider />
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loadingList ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List dense>
              {filteredDocuments.map((doc) => (
                <ListItem
                  key={doc.id}
                  button
                  selected={doc.id === selectedId}
                  onClick={() => handleSelect(doc.id)}
                  sx={{
                    alignItems: 'flex-start',
                    py: 1,
                  }}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          noWrap
                          sx={{ maxWidth: 180 }}
                        >
                          {doc.document_name || '-'}
                        </Typography>
                        <Chip
                          size="small"
                          label={doc.language === 'cn' ? '中文' : '英文'}
                          color={
                            doc.language === 'cn' ? 'primary' : 'default'
                          }
                        />
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {doc.document_kind_one || '-'}/
                        {doc.document_kind_two || '-'}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
              {filteredDocuments.length === 0 && !loadingList && (
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    暂无文档
                  </Typography>
                </Box>
              )}
            </List>
          )}
        </Box>
      </Box>

      {/* 右侧：文档详情展示与操作 */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <DocumentDetailPlug
          pluginData={{
            document: detail,
            loading: detailLoading,
            lang: detailLang,
          }}
          onPluginEvent={handleDetailEvent}
        />
      </Box>

      {/* 新增 / 编辑弹窗 */}
      <DocumentFormPlug
        pluginData={{ id: editingId }}
        onPluginEvent={handleFormEvent}
        isOpen={dialogOpen}
        onClose={handleDialogClose}
      />
    </Box>
  );
};

export default DocumentInfoPlug;

