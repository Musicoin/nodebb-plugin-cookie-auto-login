# NodeBB Cookie Auto Login

NodeBB Plugin that allows users to login to forum automatically, if they are logged into main site already.
This plugin works by sharring cookies across all subdomains of a main domain. On page load, this plugin makes an API call with cookies to main server. The cookies allows the main server to recognize the user & user data is returned. 

Using the returned data, nodebb creates an user if not created already & logs in automatically.

## How to Adapt

1. Change the url to get user data at line 54.
2. That's it

## Trouble?

Find us on [the community forums](http://community.nodebb.org)!