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

// 计算指定时区在给定时刻的相对 UTC 偏移（分钟）
const getTimeZoneOffsetMinutes = (date, timeZone) => {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const parts = dtf.formatToParts(date).reduce((acc, p) => {
      acc[p.type] = p.value; return acc;
    }, {});
    const asUTC = Date.UTC(
      Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour), Number(parts.minute), Number(parts.second)
    );
    // asUTC 是在指定时区显示的时间所对应的 UTC 时间戳
    // 与原始 date（按系统/UTC 解释）比较即可得到偏移
    return (asUTC - date.getTime()) / 60000;
  } catch {
    // 兜底：无法计算时，返回 0（不做偏移）
    return 0;
  }
};

// 解析无时区的 ISO-like 字符串：YYYY-MM-DDTHH:mm[:ss]
const parseIsoLocal = (s) => {
  if (!s) return null;
  const m = String(s).trim().replace(' ', 'T').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return {
    y: Number(m[1]), mon: Number(m[2]), d: Number(m[3]),
    H: Number(m[4]), M: Number(m[5]), S: Number(m[6] || 0)
  };
};

// 将“某时区的本地时间字符串”转换为“另一时区的时间字符串（YYYY-MM-DD HH:mm:ss）”
export const convertZoneLocalString = (localStr, fromTimeZone, toTimeZone) => {
  const parts = parseIsoLocal(localStr);
  if (!parts) return localStr || '';

  // 先构造一个“按 UTC 解释的同构时间”，再根据 fromTimeZone 的偏移修正为真正 UTC
  const naiveUTC = Date.UTC(parts.y, parts.mon - 1, parts.d, parts.H, parts.M, parts.S);
  const offsetMin = getTimeZoneOffsetMinutes(new Date(naiveUTC), fromTimeZone);
  const realUTCms = naiveUTC - offsetMin * 60000;
  const date = new Date(realUTCms);

  // 在 toTimeZone 下格式化为 YYYY-MM-DD HH:mm:ss
  try {
    const dtf = new Intl.DateTimeFormat('zh-CN', {
      timeZone: toTimeZone,
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const p = dtf.formatToParts(date).reduce((acc, x) => { acc[x.type] = x.value; return acc; }, {});
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
  } catch {
    // 兜底：直接返回本地 toLocaleString
    return date.toLocaleString('zh-CN', { timeZone: toTimeZone, hour12: false });
  }
};

// 特化：纽约时间字符串（无时区） -> 北京时间字符串
export const nyToBeijing = (nyLocalStr) => convertZoneLocalString(nyLocalStr, 'America/New_York', 'Asia/Shanghai');
