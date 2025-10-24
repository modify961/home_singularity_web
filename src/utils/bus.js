// 事件总线：提供发布/订阅与请求/响应能力
// 设计目标：
// 1）任意组件可通过总线向其他组件发送消息
// 2）组件可选择性接收（通过选择性的订阅过滤），不订阅则不接收
// 3）对于需要的场景，支持请求/响应（可选使用）

import React from 'react';

let __seq = 0;
const genId = (p = 'msg') => `${p}_${Date.now()}_${++__seq}`;

// 事件总线主体
export class EventBus {
  constructor() {
    // 订阅表：id -> { fn, sel }
    this.subs = new Map();
  }

  // 订阅事件
  // handler: (evt) => void
  // selector: { type?, from?, to?, filter?(evt) }
  subscribe(handler, selector = {}) {
    const id = genId('sub');
    this.subs.set(id, { fn: handler, sel: selector });
    // 返回取消订阅函数
    return () => {
      this.subs.delete(id);
    };
  }

  // 发布事件：返回事件ID
  publish(msg) {
    // 统一封装“信封”
    const envelope = {
      id: genId('evt'),
      meta: { timestamp: Date.now(), ...(msg && msg.meta ? msg.meta : {}) },
      ...msg,
    };
    // 广播给匹配的订阅者
    for (const { fn, sel } of this.subs.values()) {
      try {
        if (this._match(envelope, sel)) {
          fn(envelope);
        }
      } catch (e) {
        // 防御订阅回调中的异常，避免影响其他订阅者
        // 仅日志打印，不中断
        console.error('bus handler error:', e);
      }
    }
    return envelope.id;
  }

  // 请求/响应模式（可选）
  // 约定：响应事件满足以下之一即可匹配：
  //  - evt.meta.correlationId === correlationId 且 evt.type 以 '/reply' 结尾
  //  - evt.meta.correlationId === correlationId 且 evt.meta.isReply === true
  request(msg, { timeout = 8000 } = {}) {
    const correlationId = genId('corr');
    const req = {
      ...(msg || {}),
      meta: { ...(msg && msg.meta ? msg.meta : {}), correlationId },
    };
    return new Promise((resolve, reject) => {
      const off = this.subscribe((evt) => {
        const okId = evt?.meta?.correlationId === correlationId;
        const okType = typeof evt?.type === 'string' && evt.type.endsWith('/reply');
        const okMeta = evt?.meta?.isReply === true;
        if (okId && (okType || okMeta)) {
          off();
          resolve(evt);
        }
      });
      this.publish(req);
      const t = setTimeout(() => {
        off();
        reject(new Error('bus request timeout'));
      }, timeout);
      // 返回的 Promise 自身不暴露 t 与 off，以避免误用
    });
  }

  // 订阅选择器匹配逻辑
  _match(evt, sel) {
    if (!sel) return true;
    if (sel.type && sel.type !== evt.type) return false;
    if (sel.from?.component && sel.from.component !== evt.source?.component) return false;
    if (sel.to?.component && sel.to.component !== evt.target?.component) return false;
    if (typeof sel.filter === 'function') {
      try {
        if (!sel.filter(evt)) return false;
      } catch (e) {
        console.error('bus selector filter error:', e);
        return false;
      }
    }
    return true;
  }
}

// React Context：便于在函数组件中使用总线
export const BusContext = React.createContext(new EventBus());

