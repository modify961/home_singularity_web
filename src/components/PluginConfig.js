const pluginConfig = {
    menuandrole: {
      loader: () => import('../view/base/MeunAndRolePlug'),
      type: 'menu'
    },
    scheduler: {
      loader: () => import('../view/base/SchedulerPlug'),
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
    goldnewcontent: {
      loader: () => import('../view/gold/component/GoldNewInfoPlug'),
      type: 'menu'
    },
    goldsnapshot: {
      loader: () => import('../view/gold/GoldSnapshot'),
      type: 'menu'
    },
    stockinfo: {
      loader: () => import('../view/stock/StockInfoPlug'),
      type: 'menu'
    }
  };

  export default pluginConfig;
