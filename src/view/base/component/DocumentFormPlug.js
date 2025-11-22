import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  MenuItem,
} from '@mui/material';
import MDEditor from '@uiw/react-md-editor';
import { useDialog } from '../../../components/tips/useDialog';
import { getDocumentById, saveDocument, deleteDocument } from '../api';

// 简单内置的分类字典，可根据需要扩展或替换为后端字典
export const KIND_ONE_OPTIONS = [
  { value: '金融', label: '金融' },
  { value: '编程', label: '编程' },
  { value: '其他', label: '其他' },
];

export const KIND_TWO_OPTIONS = {
  金融: [
    { value: '黄金', label: '黄金' },
    { value: '股票', label: '股票' },
    { value: '基金', label: '基金' },
  ],
  编程: [
    { value: 'Python', label: 'Python' },
    { value: 'JavaScript', label: 'JavaScript' },
    { value: '其他编程', label: '其他编程' },
  ],
  其他: [{ value: '其他', label: '其他' }],
};

// 原文语言字典
export const ORIGINAL_LANG_OPTIONS = [
  { value: 'cn', label: '中文原文' },
  { value: 'en', label: '英文原文' },
];

const emptyDocument = {
  id: null,
  document_kind_one: '',
  document_kind_two: '',
  document_name: '',
  document_md_en: '',
  document_md_cn: '',
  document_file_name: '',
  original_language: '',
  sort_number: 0,
  status: 1,
  remark: '',
};

const DocumentFormPlug = ({ pluginData = {}, onPluginEvent, isOpen = false, onClose }) => {
  const { alert, toast, confirm } = useDialog();
  const [form, setForm] = useState(emptyDocument);
  const [errors, setErrors] = useState({});

  const documentId = pluginData?.id || null;

  useEffect(() => {
    const reset = () => {
      setForm(emptyDocument);
      setErrors({});
    };

    if (!isOpen) {
      reset();
      return;
    }

    if (!documentId) {
      reset();
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const resp = await getDocumentById(documentId);
        const data = (resp && resp.data) || null;
        if (cancelled) return;
        if (data) {
          setForm({
            id: data.id || null,
            document_kind_one: data.document_kind_one || '',
            document_kind_two: data.document_kind_two || '',
            document_name: data.document_name || '',
            document_md_en: data.document_md_en || '',
            document_md_cn: data.document_md_cn || '',
            document_file_name: data.document_file_name || '',
            original_language: data.original_language || '',
            sort_number:
              typeof data.sort_number === 'number' ? data.sort_number : 0,
            status: typeof data.status === 'number' ? data.status : 1,
            remark: data.remark || '',
          });
        } else {
          reset();
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          toast && toast('加载文档失败', 'error');
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isOpen, documentId]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev };
      if (field === 'sort_number') {
        const num = value === '' ? 0 : Number(value);
        next.sort_number = Number.isNaN(num) ? 0 : num;
      } else if (field === 'document_kind_one') {
        next.document_kind_one = value;
        next.document_kind_two = '';
      } else {
        next[field] = value;
      }
      return next;
    });
    // 清除对应字段的错误信息
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleMarkdownChange = (value) => {
    const lang = form.original_language || 'cn';
    if (lang === 'cn') {
      handleFieldChange('document_md_cn', value);
    } else {
      handleFieldChange('document_md_en', value);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.document_name?.trim()) newErrors.document_name = '文档名称不能为空';
    if (!form.original_language?.trim()) newErrors.original_language = '原文语言不能为空';
    if (!form.document_kind_one?.trim()) newErrors.document_kind_one = '一级分类不能为空';
    if (!form.document_kind_two?.trim()) newErrors.document_kind_two = '二级分类不能为空';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      const resp = await saveDocument(form);
      if (resp && resp.code === 200) {
        toast && toast('保存成功', 'success');
        const newId =
          typeof resp.data === 'number' && resp.data > 0
            ? resp.data
            : form.id;
        onPluginEvent && onPluginEvent('saved', { id: newId || form.id });
        onClose && onClose();
      } else {
        toast && toast('保存失败', 'error');
      }
    } catch (e) {
      console.error(e);
      toast && toast('保存异常', 'error');
    }
  };

  const handleDelete = () => {
    if (!form.id) {
      alert && alert('当前没有可删除的文档');
      return;
    }
    confirm &&
      confirm('确认删除', '确定要删除该文档吗？', async () => {
        try {
          const resp = await deleteDocument(form.id);
          if (resp && resp.code === 200) {
            toast && toast('删除成功', 'success');
            onPluginEvent && onPluginEvent('deleted', { id: form.id });
            onClose && onClose();
          } else {
            toast && toast('删除失败', 'error');
          }
        } catch (e) {
          console.error(e);
          toast && toast('删除异常', 'error');
        }
      });
  };

  const handleClose = () => {
    onClose && onClose();
  };

  const secondLevelOptions =
    KIND_TWO_OPTIONS[form.document_kind_one] || [];

  const editorLang = form.original_language || 'cn';
  const currentMarkdown =
    editorLang === 'cn'
      ? form.document_md_cn || ''
      : form.document_md_en || '';

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      slotProps={{
        paper: {
          sx: {
            height: '90vh',
            minWidth: '90vw',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <DialogTitle>
        {form.id ? '编辑文档' : '新增文档'}
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          height: 'calc(90vh - 64px - 68px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
            pt: 1,
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* 左侧：基本信息编辑，一行一个元素 */}
          <Box
            sx={{
              flex: '0 0 40%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              height: '100%',
            }}
          >
            <TextField
              size="small"
              label="文档名称"
              value={form.document_name}
              onChange={(e) =>
                handleFieldChange('document_name', e.target.value)
              }
              error={!!errors.document_name}
              helperText={errors.document_name}
              required
              fullWidth
            />
            <TextField
              select
              size="small"
              label="原文语言"
              value={form.original_language || ''}
              onChange={(e) =>
                handleFieldChange('original_language', e.target.value)
              }
              error={!!errors.original_language}
              helperText={errors.original_language}
              required
              fullWidth
            >
              {ORIGINAL_LANG_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="一级分类"
              value={form.document_kind_one || ''}
              onChange={(e) =>
                handleFieldChange('document_kind_one', e.target.value)
              }
              error={!!errors.document_kind_one}
              helperText={errors.document_kind_one}
              required
              fullWidth
            >
              {KIND_ONE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="二级分类"
              value={form.document_kind_two || ''}
              onChange={(e) =>
                handleFieldChange('document_kind_two', e.target.value)
              }
              error={!!errors.document_kind_two}
              helperText={errors.document_kind_two}
              required
              fullWidth
            >
              {secondLevelOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

           

            <TextField
              size="small"
              label="排序号"
              type="number"
              value={
                typeof form.sort_number === 'number' ? form.sort_number : 0
              }
              onChange={(e) =>
                handleFieldChange('sort_number', e.target.value)
              }
              fullWidth
            />

            <TextField
              size="small"
              label="备注（可选）"
              multiline
              minRows={5}
              fullWidth
              value={form.remark || ''}
              onChange={(e) =>
                handleFieldChange('remark', e.target.value)
              }
            />
          </Box>

          {/* 右侧：大编辑框，绑定原文语言对应的内容 */}
          <Box
            sx={{
              flex: '0 0 60%',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              minHeight: 0,
              height: 'calc(100% - 8px)',
            }}
          >
            <MDEditor
              value={currentMarkdown}
              onChange={(val) => handleMarkdownChange(val || '')}
              height="100%"
              data-color-mode="light"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          padding: '10px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          {form.id && (
            <Button
              color="error"
              variant="outlined"
              onClick={handleDelete}
            >
              删除
            </Button>
          )}
          <Button onClick={handleClose} variant="outlined">
            取消
          </Button>
          <Button onClick={handleSave} variant="contained">
            保存
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentFormPlug;

