module.exports = function loginPageOverride(dependencies, params, callback) {

  const { getLogger } = require('../logger');
  const { appURL, forumURL } = require('../config');
  const logger = getLogger('login-page-override');

  let oldLoginController = dependencies.controllerIndex.login;
  let redirectURL = `${appURL}/login?returnTo=${forumURL}`;

  dependencies.controllerIndex.login = function loginOverride(req, res, next) {

    logger.debug({method: 'login', uid: req.uid});

    if (req.uid) {
      return oldLoginController(req, res, next);
    }

    logger.debug({method: 'login', uid: req.uid, message: 'redirecting'});

    return res.redirect(redirectURL);
    
  };

  logger.debug({message: 'Login page override installed!'});

  callback();

};
