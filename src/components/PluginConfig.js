const pluginConfig = {
    menuandrole: {
      loader: () => import('../view/base/MeunAndRolePlug'),
      type: 'menu'
    },
    syncinfo: {
      loader: () => import('../view/platform/SyncInfoPlug'),
      type: 'menu'
    },
  };

  export default pluginConfig;
