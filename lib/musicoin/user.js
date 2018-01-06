const request = require('superagent');

const { appURL } = require('../../config');
const { getLogger } = require('../../logger');

const logger = getLogger('Musicoin/user');

exports.getSessionUser = function getSessionUser(session, callback) {

  logger.info({ method: 'getSessionUser', input: session.cookie, type: 'start' });

  request.get(appURL + '/json-api/profile/me').set('Cookie', (session.cookie || '')).end((error, res) => {

    if (error) {
      let result = JSON.parse(res.text);
      logger.error({ method: 'getSessionUser', input: session.cookie, error: result, type: 'end' });
      return callback(result);
    }

    let result = JSON.parse(res.text);
    
    logger.info({ method: 'getSessionUser', input: session.cookie, output: result, type: 'end' });

    callback(null, result);

  });

};

exports.getUserByEmail = function getUserByEmail(session, options, callback) {

  logger.info({ method: 'getUserByEmail', input: session.cookie, type: 'start' });

  request.get(appURL + '/json-api/user/email/' + options.email).set('Cookie', (session.cookie || '')).end((error, res) => {

    if (error) {
      let result = JSON.parse(res.text);
      logger.error({ method: 'getUserByEmail', input: session.cookie, error: result, type: 'end' });
      return callback(result);
    }

    let result = JSON.parse(res.text);
    
    logger.info({ method: 'getUserByEmail', input: session.cookie, output: result, type: 'end' });

    callback(null, result);

  });

};