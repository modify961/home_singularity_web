const pluginConfig = {
    menuandrole: {
      loader: () => import('../view/base/MeunAndRolePlug'),
      type: 'menu'
    },
    syncinfo: {
      loader: () => import('../view/platform/SyncInfoPlug'),
      type: 'menu'
    },
    goldnew: {
      loader: () => import('../view/gold/GoldNewPlug'),
      type: 'menu'
    },
  };

  export default pluginConfig;
