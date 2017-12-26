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

exports.load = function (params, callback) {
  let router = params.router;

  function autoLogin(req, res, next) {

    if (req.uid) {
      return next();
    }

    getUserUid(req.headers, function (error, uid) {

      if (error) {
        // req.session.returnTo = 'https://staging.musicoin.org';
        return next();
      }

      //this will cover some errors
      if (!req.session) {
        req.session = {};
      }
      req.session.returnTo = 'https://forum-staging.musicoin.org/';
      authenticationController.doLogin(req, uid, next);
    });

  }

  router.use(autoLogin);

  callback();
}

function doGetUserFromRemote(headers, callback) {

  pino.info({ method: 'doGetUserFromRemote', input: headers.cookie, type: 'start' });

  request.get('https://staging.musicoin.org/json-api/profile/me').set('Cookie', (headers.cookie || '')).end((error, res) => {
    try {
      var result = JSON.parse(res.text);
      callback(null, result);
      pino.info({ method: 'doGetUserFromRemote', input: headers.cookie, output: result, type: 'end' });
    } catch (e) {
      pino.error({ method: 'doGetUserFromRemote', input: headers.cookie, error: e, type: 'end' });
      callback(error, null);
    }
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
      pino.error({ method: 'getUserUid', input: headers.cookie, error: error, type: 'end' });
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
      pino.error({ method: 'doCreateUser', input: data, error: error, type: 'end' });
      return callback(error);
    }

    pino.info({ method: 'doCreateUser', input: data, output: result, type: 'end' });
    callback(null, data.username, result);

  });
}

function doFindOrCreateUser(user, callback) {

  pino.info({ method: 'doFindOrCreateUser', input: user, type: 'start' });

  async.waterfall([function findUser(done) {

    User.getUidByUsername(user.username, (error, uid) => done(error, uid ? uid : null));

  }, function tryCreateUser(uid, done) {

    if (!uid) {
      return doCreateUser({
        fullname: user.fullname,
        username: user.username
      }, done);
    }
    return done(null, uid);

  }, function tryJoinGroupIfUserAdmin(uid, callback) {
    if (isAdmin(user.username)) {
      groups.join('administrators', uid, function (err) {
        return callback(err, uid)
      });
    }
    callback(null, uid);
  }
  ], (error, uid) => {

    if (error) {
      pino.error({ method: 'doFindOrCreateUser', input: user, error: error, type: 'end' });
      return callback(error);
    }

    pino.info({ method: 'doFindOrCreateUser', input: user, output: uid, type: 'end' });
    callback(null, uid);

  });

}
function isAdmin(username) {
  return (username && username.endsWith("@musicoin.org"));
}