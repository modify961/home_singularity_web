// 时间工具：将后端 UTC 或无时区时间转换为本地时间，并格式化

// 将各种时间值转换为 Date（本地时区显示），
// - 若字符串不带时区信息，按 UTC 解释（追加 Z）
export const toLocalDate = (v) => {
  if (!v) return null;
  try {
    if (v instanceof Date) return v;
    if (typeof v === 'number') return new Date(v);
    let s = String(v).trim();
    // 已带时区/偏移，直接解析
    if (/Z|[+-]\d{2}:?\d{2}/i.test(s)) return new Date(s);
    // 兼容 'YYYY-MM-DD HH:mm:ss'
    if (/^\d{4}-\d{2}-\d{2} /.test(s)) s = s.replace(' ', 'T');
    return new Date(s + 'Z');
  } catch {
    try { return new Date(v); } catch { return null; }
  }
};

export const formatLocalDateTime = (v, locale = 'zh-CN') => {
  const d = toLocalDate(v);
  if (!d) return '-';
  try { return d.toLocaleString(locale); } catch { return String(v); }
};

