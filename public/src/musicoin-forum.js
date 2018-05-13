require(['components'], function(components) {
  components.get('user/logout').on('click', function() {
  	window.location.href = config.appURL + '/logout?returnTo=' + config.forumURL;
  });
});
