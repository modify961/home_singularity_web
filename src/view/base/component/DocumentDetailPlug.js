import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Button,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const DocumentDetailPlug = ({ pluginData, onPluginEvent }) => {
  const detail = pluginData?.document || null;
  const loading = !!pluginData?.loading;
  const langFromParent = pluginData?.lang || null;

  const [lang, setLang] = React.useState('cn');

  // 当外部传入默认语言或文档变化时，重置当前语言
  React.useEffect(() => {
    if (langFromParent) {
      setLang(langFromParent);
      return;
    }
    if (!detail) {
      setLang('cn');
      return;
    }
    if (detail.document_md_cn && String(detail.document_md_cn).trim()) {
      setLang('cn');
    } else {
      setLang('en');
    }
  }, [detail?.id, langFromParent]);

  const currentMarkdown = useMemo(() => {
    if (!detail) return '';
    if (lang === 'cn') {
      return detail.document_md_cn || '';
    }
    return detail.document_md_en || '';
  }, [detail, lang]);

  const handleEdit = () => {
    if (!detail?.id) return;
    if (typeof onPluginEvent === 'function') {
      onPluginEvent('edit', { id: detail.id });
    }
  };

  const handleLangChange = (event, value) => {
    if (!value) return;
    setLang(value);
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* 顶部工具栏：标题、分类、语言切换、编辑按钮 */}
      <Box
        sx={{
          p: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="subtitle1" noWrap>
            {detail?.document_name || '未选择文档'}
          </Typography>
          {detail && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {(detail.document_kind_one || '-') +
                ' / ' +
                (detail.document_kind_two || '-')}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {detail && (
            <ToggleButtonGroup
              size="small"
              exclusive
              value={lang}
              onChange={handleLangChange}
            >
              <ToggleButton value="cn">中文</ToggleButton>
              <ToggleButton value="en">English</ToggleButton>
            </ToggleButtonGroup>
          )}
          <Button
            variant="outlined"
            size="small"
            onClick={handleEdit}
            disabled={!detail?.id}
          >
            编辑
          </Button>
        </Box>
      </Box>

      {/* 下方左右布局：左侧 Markdown，右侧预留 */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          minHeight: 0,
          bgcolor: '#fafafa',
        }}
      >
        {/* 左侧 Markdown 展示 */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            borderRight: '1px solid',
            borderColor: 'divider',
            overflow: 'auto',
          }}
        >
          {loading ? (
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
          ) : detail && currentMarkdown ? (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: '#fff',
                '& h1, & h2, & h3, & h4, & h5, & h6': {
                  mt: 2,
                  mb: 1,
                },
                '& p': { mb: 1.5 },
                '& ul, & ol': { pl: 3, mb: 1.5 },
                '& code': {
                  fontFamily: 'monospace',
                  bgcolor: 'grey.100',
                  px: 0.5,
                  borderRadius: 0.5,
                },
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentMarkdown}
              </ReactMarkdown>
            </Paper>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {detail
                  ? '当前语言没有内容'
                  : '请选择左侧文档或新增文档'}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 右侧预留区域：暂不展示内容 */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            overflow: 'auto',
          }}
        >
          {/* 预留区：根据后续需求扩展 */}
        </Box>
      </Box>
    </Box>
  );
};

export default DocumentDetailPlug;

