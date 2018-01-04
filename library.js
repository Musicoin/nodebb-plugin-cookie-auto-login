const async = require('async');

const User = module.parent.require('./user');
const authenticationController = module.parent.require('./controllers/authentication');
const groups = module.parent.require('../src/groups');
const controllerIndex = module.parent.require('./controllers');

exports.load = function load(params, callback) {

  async.series([
    (done) => require('./lib/auto-login')({User: User, authenticationController: authenticationController, groups: groups}, params, done)
  ], callback);

};

exports.overrideLoginController = function overrideLoginController(params, callback) {

  async.series([
    (done) => require('./lib/login-page-override')({controllerIndex: controllerIndex}, params, done)
  ], callback);

};

exports.extendConfig = function extendConfig(config, callback) {

  require('./lib/extend-config')(config, callback);

};