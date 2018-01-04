const { logLevel } = require('../config');
const pino = require('pino')({ level: logLevel, app: 'MusicoinForum' });

exports.getLogger = function getLogger(module) {
  return pino.child({ module: module });
};