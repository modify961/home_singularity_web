// 通用ID生成工具
// 提供稳定的唯一ID生成：优先使用 crypto.randomUUID，
// 回退到随机数 + 时间戳 + 计数器，避免高并发下重复。

let __idCounter = 0;

class IdUtil {
  static genId(prefix = 'id') {
    __idCounter = (__idCounter + 1) >>> 0;
    try {
      if (typeof crypto !== 'undefined') {
        if (typeof crypto.randomUUID === 'function') {
          return `${prefix}-${crypto.randomUUID()}`;
        }
        if (typeof crypto.getRandomValues === 'function') {
          const buf = new Uint32Array(4);
          crypto.getRandomValues(buf);
          const part = Array.from(buf)
            .map((n) => n.toString(16).padStart(8, '0'))
            .join('');
          return `${prefix}-${part.slice(0, 8)}-${part.slice(8, 16)}-${part.slice(16, 24)}-${part.slice(24, 32)}`;
        }
      }
    } catch (_) {
      // ignore and fallback
    }
    const now = Date.now().toString(16);
    const perf =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? Math.floor(performance.now() * 1000).toString(16)
        : '';
    const rand = Math.random().toString(16).slice(2);
    const cnt = __idCounter.toString(16);
    return `${prefix}-${now}-${perf}-${rand}-${cnt}`;
  }
}

// 允许全局访问（保持与 fetchs.js 风格一致）
try {
  if (typeof window !== 'undefined') {
    window.IdUtil = IdUtil;
  }
  if (typeof global !== 'undefined') {
    global.IdUtil = IdUtil;
  }
} catch (_) {}

export default IdUtil;
export const genId = IdUtil.genId;

