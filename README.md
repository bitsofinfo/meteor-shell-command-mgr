## meteor-shell-command-mgr

Functioning demo available at [meteor-shell-command-mgr.meteor.com](http://meteor-shell-command-mgr.meteor.com)

This small Meteor/Bootstrap app was an experiment to manage a little database of commands
 and their argument configs, which is rendered as a JSON "command registry"
intended to used with [powershell-command-executor](https://github.com/bitsofinfo/powershell-command-executor).

The intent being to expand this app to be able to invoke the respective commands
in the registry, similar to [powershell-command-executor-ui](https://github.com/bitsofinfo/powershell-command-executor-ui) or eventually just replace it all-together with this version using Meteor. This app could be extended to provide the same
test execution functionality for all commands being built by the registry.

Note when running on meteor.com this app cleans out the "database" of
accumulated test-data every 2 hours. If you are running locally you will want
to comment out the auto-cleaning code in *server/index.js*.

Secondly, this will run w/ the latest underlying version of Node, but if you want the unit-tests to work w/ velocity you need to be running node `v0.10.33`

Also note that when deploying to meteor.com you need to run the following command
prior to `meteor deploy` until this velocity related bug [https://github.com/meteor/meteor/issues/3761](https://github.com/meteor/meteor/issues/3761) is fixed.

```
meteor remove mike:mocha
```
