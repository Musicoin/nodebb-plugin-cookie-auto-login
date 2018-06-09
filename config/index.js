
const appURL = process.env.NODE_ENV === 'development' ? 'https://staging.musicoin.org' : 'https://staging.musicoin.org';
const forumURL = process.env.NODE_ENV === 'development' ? 'https://forum-staging.musicoin.org' : 'https://forum.musicoin.org';

module.exports = {
	appURL: appURL,
	forumURL: forumURL,
	logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
};
