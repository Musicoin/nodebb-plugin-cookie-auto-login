const request = require('superagent');
const async = require('async');

const { appURL } = require('../config');
const { getLogger } = require('../logger');

const logger = getLogger('auto-login');

module.exports = function setupAutoLogin(dependencies, params, callback) {

  let router = params.router;

  function autoLogin(req, res, next) {

    if (!req.baseUrl && req.path === '/email_not_found') {
      return next();
    }

    async.waterfall([(done) => {
      getUser(req.headers, done);
    }, (user, done) => {
      if (req.uid) {
        return done(null, false);
      }
      doLogin(req, user, done);
    }], (error, user, loggedInNow) => {
      res.session = res.session || {};

      if (error) {

        if (error.message === 'INVALID_EMAIL') {
          return res.redirect('/email_not_found');
        }

        // req.uid exists meaning, musicoin session is invalidated and forum session not
        if (req.uid) {
          // invalidate forum session too
          req.logout();
        }

        return next();

      }

      if (loggedInNow) {
        // Redirect first time to refresh session.
        return res.redirect('/');
      }

      return next();

    });

  }

  router.use(autoLogin);

  router.get('/email_not_found', function(req, res) {

    getSessionUser(req.headers, (error, user) => {

      if (error) {
        // user not found. Redirect to home page.
        return res.redirect('/');
      }

      res.render('email_not_found', { fullname: user.fullname, appURL: appURL });

    });

  });

  callback();

  function getSessionUser(headers, callback) {

    logger.info({ method: 'getSessionUser', input: headers.cookie, type: 'start' });

    request.get(appURL + '/json-api/profile/me').set('Cookie', (headers.cookie || '')).end((error, res) => {

      if (error) {
        let result = JSON.parse(res.text);
        logger.error({ method: 'getSessionUser', input: headers.cookie, error: result, type: 'end' });
        return callback(result);
      }

      let result = JSON.parse(res.text);
      logger.info({ method: 'getSessionUser', input: headers.cookie, output: result, type: 'end' });
      callback(null, result);

    });

  }

  function getUser(headers, callback) {

    logger.info({ method: 'getUser', input: headers.cookie, type: 'start' });

    async.waterfall([function getUserFromRemote(done) {
      getSessionUser(headers, done);
    }, function findInLocal(user, done) {
      if (!user) {
        return done(new Error('Invalid Session'));
      }
      doFindOrCreateUser(user, done);
    }], (error, user) => {
      if (error) {
        logger.error({ method: 'getUser', input: headers.cookie, error: error.toString(), type: 'end' });
        return callback(error);
      }
      logger.info({ method: 'getUser', input: headers.cookie, output: user, type: 'end' });
      callback(null, user);
    });

  }

  function doCreateUser(data, callback) {

    logger.info({ method: 'doCreateUser', input: data, type: 'start' });

    return dependencies.User.create(data, (error, result) => {

      if (error) {
        logger.error({ method: 'doCreateUser', input: data, error: error.toString(), type: 'end' });
        return callback(error);
      }

      logger.info({ method: 'doCreateUser', input: data, output: result, type: 'end' });
      callback(null, result);

    });
  }

  function doFindOrCreateUser(user, callback) {

    logger.info({ method: 'doFindOrCreateUser', input: user, type: 'start' });

    if (!user.primaryEmail) {
      return callback(new Error('INVALID_EMAIL'), null);
    }

    async.waterfall([function findUser(done) {

      dependencies.User.getUidByEmail(user.primaryEmail, (error, uid) => done(error, uid ? uid : null));

    }, function tryCreateUser(uid, done) {

      if (!uid) {
        return doCreateUser({
          fullname: user.fullname || '',
          email: user.primaryEmail,
          username: doGetUserNameFromData(user)
        }, done);
      }
      return done(null, uid);

    }, function tryJoinGroupIfUserAdmin(uid, callback) {
      if (isAdmin(user.primaryEmail)) {
        return dependencies.groups.join('administrators', uid, function(err) {
          callback(err, uid);
        });
      }
      callback(null, uid);
    }], (error, uid) => {

      if (error) {
        logger.error({ method: 'doFindOrCreateUser', input: user, error: error.toString(), type: 'end' });
        return callback(error);
      }

      user.uid = uid;

      logger.info({ method: 'doFindOrCreateUser', input: user, output: user, type: 'end' });

      callback(null, user);

    });

  }

  function doLogin(req, user, callback) {

    logger.info({ method: 'doLogin', input: user, type: 'start' });

    dependencies.authenticationController.doLogin(req, user.uid, (error) => {

      if (error) {

        logger.error({ method: 'doLogin', input: user, error: error.toString(), type: 'end' });
        return callback(error);

      }

      let loggedInNow = true;

      logger.info({ method: 'doLogin', input: user, output: {}, type: 'end' });
      callback(null, user, loggedInNow);

    });
  }

  function isAdmin(email) {
    return (email && email.endsWith('@musicoin.org'));
  }

  function doGetUserNameFromData(user) {
    // no problem fullname can be username
    if (user.fullname && user.fullname.trim().length > 1) {
      return user.fullname;
    }
    // this will get username from email
    var index = user.primaryEmail.indexOf('@');
    return user.primaryEmail.substring(0, index);
  }

};