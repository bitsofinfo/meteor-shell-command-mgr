Commands = new Mongo.Collection("commands");
Arguments = new Mongo.Collection("arguments");



if (Meteor.isClient) {

  Session.set('commandFormErrors',[]);
  Session.set('argumentFormErrors',[]);
  Session.set('arguments',{});

  Template.commandForm.helpers({
      commandFormErrors: function() {
        return Session.get('commandFormErrors');
      }
  });

  Template.argumentsForm.helpers({
      argumentFormErrors: function() {
        return Session.get('argumentFormErrors');
      }
  });

  Template.commandsList.helpers({
      commands: function () {
        return Commands.find({}, {sort: {createdAt: -1}});
      }
  });

  // @see https://github.com/meteor/meteor/issues/2194
  Template.argumentsForm.helpers({
      arguments: function () {
        var toReturn = [];
        var args = Session.get('arguments');
        for (key in args) {
          var argObj = args[key];
          toReturn.push(argObj);
        }
        return toReturn;
      }
  });


  Template.commandForm.events({


    // Send the command and arguments to the server
    // to be persisted
    "click #btnSaveCommand": function (event) {


      $('#commandName').parent().removeClass('has-feedback has-error');
      $('#command').parent().removeClass('has-feedback has-error');

      var form = Template.instance().find('#saveCommandForm');
      var commandName = form.commandName.value;
      var command = form.command.value;
      var returnType = form.returnType.value;

      var arguments = Session.get('arguments');

      Meteor.call("addCommand", commandName, command, returnType, arguments, function(error,result) {

        if (error) {
          $('#commandName').parent().addClass('has-feedback has-error');
          $('#command').parent().addClass('has-feedback has-error');
          Session.set('commandFormErrors',[{'msg':error.message,'stack':error.stack}]);

        } else {
          form.commandName.value = "";
          form.command.value = "";
          form.returnType.value = "";

          Session.set('arguments',{});
          Session.set('errors',[]);
        }

      });

      // Prevent default form submit
      return false;
    },



    // add a new argument to the command (no persistence)
    // just adds an argument to the session
    "click #btnAddArgument": function (event) {

      Session.set('argumentFormErrors',[]);

      $('#ctrlArgumentName').parent().removeClass('has-feedback has-error');
      $('#ctrlDefaultValue').parent().removeClass('has-feedback has-error');

      var template = Template.instance();
      var argumentName = template.find('#ctrlArgumentName').value;
      var defaultValue = template.find('#ctrlDefaultValue').value;
      var isQuoted = template.find('#ctrlIsQuoted').checked;
      var isValued = template.find('#ctrlIsValued').checked;

      var hasErrors = false;

      if (argumentName.trim().length == 0) {
        $('#ctrlArgumentName').parent().addClass('has-feedback has-error');
        var errors = Session.get('argumentFormErrors');
        errors.push({'msg':'argument name is required'});
        Session.set('argumentFormErrors',errors);
        hasErrors = true;
      }

      if (!isValued && defaultValue.trim().length > 0) {
        $('#ctrlDefaultValue').parent().addClass('has-feedback has-error');
        var errors = Session.get('argumentFormErrors');
        errors.push({'msg':'is valued is not checked, yet default value is defined!'});
        Session.set('argumentFormErrors',errors);
        hasErrors = true;
      }

      if (hasErrors) {
        return false;
      }

      var arguments = Session.get('arguments');

      var argId = Random.id();

      arguments[argId] = {
                        '_id': argId,
                        'argumentName':argumentName,
                        'defaultValue':defaultValue,
                        'isQuoted':isQuoted,
                        'isValued':isValued
                        };

      Session.set('arguments',arguments);

      template.find('#ctrlArgumentName').value = '';
      template.find('#ctrlDefaultValue').value = '';
      template.find('#ctrlIsQuoted').checked = false;
      template.find('#ctrlIsValued').checked = false;

      // Prevent default form submit
      return false;
    },


    // add a new argument to the command (no persistence)
    // just removes an argument by id from session
    "click .btnRemoveArgument": function (event) {

      var toRemoveId = event.target.id;
      var arguments = Session.get('arguments');

      delete arguments[toRemoveId];

      Session.set('arguments',arguments);

      // Prevent default form submit
      return false;
    },


    // add a new argument to the command (no persistence)
    // just removes an argument by id from session
    "click .btnRemoveCommand": function (event) {

      var toRemoveId = event.target.id;

      Meteor.call("deleteCommand", toRemoveId, function(error,result) {

        if (error) {
          Session.set('errors',[{'msg':error.message,'stack':error.stack}]);
        }

      });

      // Prevent default form submit
      return false;
    }


  });

  Template.commandsList.events({


    // add a new argument to the command (no persistence)
    // just removes an argument by id from session
    "click .btnRemoveCommand": function (event) {

      var toRemoveId = event.target.id;

      Meteor.call("deleteCommand", toRemoveId, function(error,result) {

        if (error) {
          Session.set('errors',[{'msg':error.message,'stack':error.stack}]);
        }

      });

      // Prevent default form submit
      return false;
    }


  });

}



Meteor.methods({

  deleteCommand: function (commandId) {

    Commands.remove({'_id':commandId});
    Arguments.remove({'commandId':commandId});

  },


  addCommand: function (commandName, command, returnType, arguments) {

    var cmd = Commands.findOne({commandName: commandName});
    if (typeof(cmd) != 'undefined') {
      throw new Meteor.Error("cmd-exists", "addCommand() command "
            + commandName + " already exists");
    }

    if (commandName.length == 0) {
      throw new Meteor.Error("cmd-name-req", "addCommand() commandName is required");
    }

    if (command.length == 0) {
      throw new Meteor.Error("cmd-name-req", "addCommand() command is required");
    }

    var commandId = Commands.insert({
                      'commandName': commandName,
                      'command': command,
                      'returnType': returnType,
                      'createdAt': new Date()
                    });

    if (typeof(arguments) != 'undefined') {

      for (argName in arguments) {
        var arg = arguments[argName];
        Arguments.insert({
                          commandId: commandId,
                          argumentName: arg.argumentName,
                          defaultValue: arg.defaultValue,
                          isQuoted: arg.isQuoted,
                          isValued: arg.isValued,
                          createdAt: new Date()
                        });
      }
    }

    return commandId;

  },


  addArgument: function (commandId, argumentName, defaultValue, isQuoted, isValued) {

    var command = Commands.findOne({commandId: commandId});
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






if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
