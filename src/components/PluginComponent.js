// src/hooks/usePluginComponent.js
import React, { useMemo } from 'react';
import pluginConfig from './PluginConfig'

function usePluginComponent(pluginKey) {
  const PluginComponent = useMemo(() => {
    if (pluginKey && pluginConfig[pluginKey]) {
      return React.lazy(pluginConfig[pluginKey].loader);
    }
    return null;
  }, [pluginKey]);

  return PluginComponent;
}

export default usePluginComponent;
