const pino = require('pino')({ level: 'info' });
const request = require('superagent');
const User = module.parent.require('./user');
const Groups = module.parent.require('./groups');
const meta = module.parent.require('./meta');
const db = module.parent.require('../src/database');
const passport = module.parent.require('passport');
const fs = module.parent.require('fs');
const path = module.parent.require('path');
const nconf = module.parent.require('nconf');
const winston = module.parent.require('winston');
const async = module.parent.require('async');
const authenticationController = module.parent.require('./controllers/authentication');
const groups = module.parent.require('../src/groups');

exports.extendConfig = function extendConfig(config, callback) {

  pino.info({ method: 'extendConfig', input: config, type: 'start' });

  config.appURL = process.env.NODE_ENV === 'development' ? 'https://staging.musicoin.org' : 'https://musicoin.org';
  config.forumURL = process.env.NODE_ENV === 'development' ? 'https://forum-staging.musicoin.org' : 'https://forum.musicoin.org';

  pino.info({ method: 'extendConfig', output: config, type: 'end' });

  return callback(null, config);

};

exports.load = function(params, callback) {
  let router = params.router;

  function autoLogin(req, res, next) {

    getUserUid(req.headers, function(error, uid) {

      // error meaning, session not found
      if (error) {
        //req.uid exists meaning, musicoin session is invalidated and forum session not
        if (req.uid) {
          // invalidate forum session too
          req.logout();
          // return res.redirect('/');
        }
        return next();
      }

      // if musicoin session found & forum session also found
      if (req.uid) {
        // skip logging again
        return next();
      }

      //this will cover some errors
      if (!req.session) {
        req.session = {};
      }

      authenticationController.doLogin(req, uid, (error) => {

        if (error) {
          return next(error);
        }

        res.redirect('/'); // Redirect first time to refresh session. 

      });

    });

  }

  router.use(autoLogin);

  callback();
}

function doGetUserFromRemote(headers, callback) {

  pino.info({ method: 'doGetUserFromRemote', input: headers.cookie, type: 'start' });

  request.get('https://staging.musicoin.org/json-api/profile/me').set('Cookie', (headers.cookie || '')).end((error, res) => {

    if (error) {
      let result = JSON.parse(res.text);
      pino.error({ method: 'doGetUserFromRemote', input: headers.cookie, error: result, type: 'end' });
      return callback(result);
    }

    let result = JSON.parse(res.text);
    pino.info({ method: 'doGetUserFromRemote', input: headers.cookie, output: result, type: 'end' });
    callback(null, result);

  });

}

function getUserUid(headers, callback) {

  pino.info({ method: 'getUserUid', input: headers.cookie, type: 'start' });

  async.waterfall([function getUserFromRemote(done) {
    doGetUserFromRemote(headers, done);
  }, function findInLocal(user, done) {
    if (!user) {
      return done(new Error('Invalid Session'));
    }
    doFindOrCreateUser(user, done);
  }], (error, uid) => {
    if (error) {
      pino.error({ method: 'getUserUid', input: headers.cookie, error: error.toString(), type: 'end' });
      return callback(error);
    }
    pino.info({ method: 'getUserUid', input: headers.cookie, output: uid, type: 'end' });
    callback(null, uid);
  });

}

function doCreateUser(data, callback) {

  pino.info({ method: 'doCreateUser', input: data, type: 'start' });

  return User.create(data, (error, result) => {

    if (error) {
      pino.error({ method: 'doCreateUser', input: data, error: error.toString(), type: 'end' });
      return callback(error);
    }

    pino.info({ method: 'doCreateUser', input: data, output: result, type: 'end' });
    callback(null, result);

  });
}

function doFindOrCreateUser(user, callback) {

  pino.info({ method: 'doFindOrCreateUser', input: user, type: 'start' });

  async.waterfall([function findUser(done) {

    User.getUidByEmail(user.username, (error, uid) => done(error, uid ? uid : null));

  }, function tryCreateUser(uid, done) {

    if (!uid) {
      return doCreateUser({
        fullname: user.fullname,
        email: user.username,
        username: user.fullname
      }, done);
    }
    return done(null, uid);

  }, function tryJoinGroupIfUserAdmin(uid, callback) {
    if (isAdmin(user.username)) {
      return groups.join('administrators', uid, function(err) {
        callback(err, uid)
      });
    }
    callback(null, uid);
  }], (error, uid) => {

    if (error) {
      pino.error({ method: 'doFindOrCreateUser', input: user, error: error.toString(), type: 'end' });
      return callback(error);
    }

    pino.info({ method: 'doFindOrCreateUser', input: user, output: uid, type: 'end' });
    callback(null, uid);

  });

}

function isAdmin(username) {
  return (username && username.endsWith("@musicoin.org"));
}