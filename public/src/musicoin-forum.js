require(['components'], function(components) {
  components.get('user/logout').on('click', function() {
  	windown.location.href = config.appURL + '/logout?returnTo=' + config.forumURL;
  });
});