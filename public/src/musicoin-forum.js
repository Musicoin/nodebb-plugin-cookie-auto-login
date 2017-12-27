require(['components'], function(components) {
	console.log('Overriding logout');
  components.get('user/logout').on('click', function() {
  	windown.location.href = config.appURL + '/logout?returnTo=' + config.forumURL;
  });
});