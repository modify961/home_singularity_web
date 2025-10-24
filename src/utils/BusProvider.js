// BusProvider：把事件总线注入到 React 应用
// 提供：
//  - <BusProvider>：作为根组件包裹全局
//  - useBus()：在任意组件中获取总线实例
//  - useSubscribe(selector, handler)：便捷订阅，组件卸载时自动清理

import React, { useContext, useEffect, useMemo } from 'react';
import { BusContext, EventBus } from './bus';

export const BusProvider = ({ children, bus }) => {
  // bus 可注入外部实现；默认创建一个新的 EventBus 实例
  const value = useMemo(() => bus || new EventBus(), [bus]);
  return <BusContext.Provider value={value}>{children}</BusContext.Provider>;
};

export const useBus = () => useContext(BusContext);

export const useSubscribe = (selector, handler) => {
  const bus = useBus();
  useEffect(() => {
    if (!bus || typeof handler !== 'function') return undefined;
    // 订阅并在卸载时清理
    const off = bus.subscribe(handler, selector || {});
    return () => {
      try { off && off(); } catch {}
    };
    // selector 转为稳定依赖：浅序列化足够（不要在高频更新中传大对象）
  }, [bus, handler, JSON.stringify(selector || {})]);
};

