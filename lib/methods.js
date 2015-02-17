Meteor.methods({

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



});
