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

const appURL = process.env.NODE_ENV === 'development' ? 'https://staging.musicoin.org' : 'https://musicoin.org';
const forumURL = process.env.NODE_ENV === 'development' ? 'https://forum-staging.musicoin.org' : 'https://forum.musicoin.org';

exports.extendConfig = function extendConfig(config, callback) {

  pino.info({ method: 'extendConfig', input: config, type: 'start' });

  config.appURL = appURL;
  config.forumURL = forumURL;

  pino.info({ method: 'extendConfig', output: config, type: 'end' });

  return callback(null, config);

};

exports.load = function(params, callback) {

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
          res.session.temp = user;
          return res.redirect('/email_not_found');
        }

        //req.uid exists meaning, musicoin session is invalidated and forum session not
        if (req.uid) {
          // invalidate forum session too
          req.logout();
        }

        return next();

      }

      if (loggedInNow) {
        return res.redirect('/'); // Redirect first time to refresh session. 
      }

      return next();

    });

  }

  router.use(autoLogin);

  router.get('/email_not_found', function(req, res) {
    res.render('email_not_found', { fullname: req.session.temp.fullname || req.session.temp.username, appURL: appURL });
    delete req.session.temp;
  });

  callback();
}

function doGetUserFromRemote(headers, callback) {

  pino.info({ method: 'doGetUserFromRemote', input: headers.cookie, type: 'start' });

  request.get(appURL + '/json-api/profile/me').set('Cookie', (headers.cookie || '')).end((error, res) => {

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

function getUser(headers, callback) {

  pino.info({ method: 'getUser', input: headers.cookie, type: 'start' });

  async.waterfall([function getUserFromRemote(done) {
    doGetUserFromRemote(headers, done);
  }, function findInLocal(user, done) {
    if (!user) {
      return done(new Error('Invalid Session'));
    }
    doFindOrCreateUser(user, done);
  }], (error, user) => {
    if (error) {
      pino.error({ method: 'getUser', input: headers.cookie, error: error.toString(), type: 'end' });
      return callback(error);
    }
    pino.info({ method: 'getUser', input: headers.cookie, output: user, type: 'end' });
    callback(null, user);
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


  if (!user.primaryEmail) {
    return callback(new Error("INVALID_EMAIL"), null);
  }


  async.waterfall([function findUser(done) {

    User.getUidByEmail(user.primaryEmail, (error, uid) => done(error, uid ? uid : null));

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

    user.uid = uid;

    pino.info({ method: 'doFindOrCreateUser', input: user, output: user, type: 'end' });

    callback(null, user);

  });

}

function doLogin(req, user, callback) {

  pino.info({ method: 'doLogin', input: user, type: 'start' });

  authenticationController.doLogin(req, user.uid, (error) => {

    if (error) {

      pino.error({ method: 'doLogin', input: user, error: error.toString(), type: 'end' });
      return callback(error);

    }

    let loggedInNow = true;

    pino.info({ method: 'doLogin', input: user, output: {}, type: 'end' });
    callback(null, user, loggedInNow);

  });
}

function isAdmin(email) {
  return (email && email.endsWith("@musicoin.org"));
}

function doGetUserNameFromData(user) {
  //no problem fullname can be username
  if (user.fullname && user.fullname.trim().length > 1) {
    return user.fullname;
  }
  //this will get username from email
  var index = user.primaryEmail.indexOf("@");
  return user.primaryEmail.substring(0, index);
}