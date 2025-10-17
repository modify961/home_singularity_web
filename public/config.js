// Default config for local development
// This file is loaded by public/index.html before the app bundle.
// Production builds will overwrite this file in Docker using config.template.js.
window._CONFIG = {};
window._CONFIG['type'] = 'dev';
window._CONFIG['BASE_URL'] = 'http://127.0.0.1:8600';
window._CONFIG['WS_URL'] = 'ws://127.0.0.1:8600';

