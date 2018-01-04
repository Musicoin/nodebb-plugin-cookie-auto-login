const { appURL, forumURL } = require('../config');
const { getLogger } = require('../logger');
const logger = getLogger('extend-config');

module.exports = function extendConfig(config, callback) {

  logger.info({ method: 'extendConfig', input: config, type: 'start' });

  config.appURL = appURL;
  config.forumURL = forumURL;

  logger.info({ method: 'extendConfig', output: config, type: 'end' });

  return callback(null, config);

};