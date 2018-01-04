module.exports = function loginPageOverride(dependencies, params, callback) {

  const { getLogger } = require('../logger');
  const { appURL, forumURL } = require('../config');
  const logger = getLogger('login-page-override');

  let oldLoginController = dependencies.controllerIndex.login;
  let redirectURL = `${appURL}/login?returnTo=${forumURL}`;
  console.log('oldLoginController', oldLoginController);
  dependencies.controllerIndex.login = function loginOverride(req, res, next) {
    logger.debug({method: 'login', uid: req.uid});
    if (req.uid) {
      return oldLoginController(req, res, next);
    }
    logger.debug({method: 'login', uid: req.uid, message: 'redirecting'});
    return res.redirect(redirectURL);
  };
  console.log('oldLoginController', dependencies.controllerIndex.login);
  logger.debug({message: 'Login page override installed!'});

  callback();

};
