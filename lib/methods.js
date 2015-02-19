Meteor.methods({

  // only called by tests
  cleanAllCollections: function () {
    Commands.remove({'_id': /.*/});
    Arguments.remove({'_id': /.*/});
  },

  getCommand: function (commandId) {
    return Commands.findOne({'_id':commandId});

  },

  getArgumentsBy: function (selector,sort) {

    return Arguments.find(selector,sort).fetch();

  },

  deleteCommand: function (commandId) {

    Commands.remove({'_id':commandId});
    Arguments.remove({'commandId':commandId});

  },


  saveCommand: function (targetCommandId, commandName, command, returnType, arguments) {

    var cmdIsNew = true;

    // if no command id, duplicate check
    if (!targetCommandId || targetCommandId.trim() == '') {
      cmdIsNew = false;

      var cmd = Commands.findOne({commandName: commandName});
      if (typeof(cmd) != 'undefined') {
        throw new Meteor.Error("cmd-exists", "addCommand() command "
              + commandName + " already exists");
      }
    }

    if (commandName.length == 0) {
      throw new Meteor.Error("cmd-name-req", "addCommand() commandName is required");
    }

    if (command.length == 0) {
      throw new Meteor.Error("cmd-name-req", "addCommand() command is required");
    }

    var commandId = targetCommandId;
    var result = Commands.upsert({'_id' : targetCommandId },
                    {
                      'commandName': commandName,
                      'command': command,
                      'returnType': returnType,
                      'modifiedAt': new Date()
                    });

    // if blank command id then it is new
    if (!commandId || commandId.trim() == '') {
      commandId = result.insertedId;
    }


    var argumentIdsToRetain = [];

    if (typeof(arguments) != 'undefined') {

      for (argName in arguments) {
        var arg = arguments[argName];

        var result = Arguments.upsert({'_id': arg._id },
                                 {
                                  'commandId': commandId,
                                  'argumentName': arg.argumentName,
                                  'defaultValue': arg.defaultValue,
                                  'isQuoted': arg.isQuoted,
                                  'isValued': arg.isValued,
                                  'modifiedAt': new Date()
                                });


        if (typeof(result.insertedId) != 'undefined') {
          argumentIdsToRetain.push(result.insertedId);
        } else {
          argumentIdsToRetain.push(arg._id);
        }
      }
    }

    // purge arguments no longer relevant for the command
    Arguments.remove({
                      "commandId": commandId,
                      "_id": {
                          "$not": {
                              "$in": argumentIdsToRetain
                          }
                      }});

    return commandId;

  },


  addArgument: function (commandId, argumentName, defaultValue, isQuoted, isValued) {

    var command = Commands.findOne({'_id': commandId});
    if (typeof(command) == 'undefined') {
      throw new Meteor.Error("cmd-not-found", "addArgument() command " + commandId + " not found");
    }

    var argumentId = Arguments.insert({
                      commandId: commandId,
                      argumentName: argumentName,
                      defaultValue: defaultValue,
                      isQuoted: isQuoted,
                      isValued: isValued,
                      createdAt: new Date()
                    });

    return argumentId;

  },

  generateCommandRegistry: function() {

    var registry = {};

    var commands = Commands.find({},{sort: {createdAt: -1}}).fetch();

    for (var i=0; i<commands.length; i++) {
      var cmd = commands[i];
      var registryCmd = {'command' : cmd.command,
                         'return' : {'type': cmd.returnType}
                         };

      var args = Arguments.find({'commandId':cmd._id}).fetch();

      var arguments = {};

      for (var j=0; j<args.length; j++) {
        var arg = args[j];
        var argObj = {};
        if (arg.defaultValue != '') {
          argObj['defaultValue'] = arg.defaultValue;
        }

        argObj['quoted'] = arg.isQuoted;
        argObj['valued'] = arg.isValued;

        arguments[arg.argumentName] = argObj;
      }

      registryCmd['arguments'] = arguments;
      registry[cmd.commandName] = registryCmd;
    }

    return registry;
  }


});
