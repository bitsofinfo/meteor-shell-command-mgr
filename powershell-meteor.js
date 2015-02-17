Commands = new Mongo.Collection("commands");
Arguments = new Mongo.Collection("arguments");



if (Meteor.isClient) {


  UI.registerHelper('outputIfEq', function(toOutput,val1,val2) {
    return (val1 == val2) ? toOutput : '';
  });

  var initSessionVars = function() {
    Session.set('arguments',{});
    Session.set('commandFormErrors',[]);
    Session.set('argumentFormErrors',[]);
    Session.set('currentEditCommand',null);
  }


  initSessionVars();


  Template.commandFormBody.helpers({
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
  Template.argumentsTable.helpers({

      arguments: function (loadArgumentsFrom, commandId) {

        if (loadArgumentsFrom == 'session') {

          var toReturn = [];
          var args = Session.get('arguments');
          for (key in args) {
            var argObj = args[key];
            toReturn.push(argObj);
          }
          return toReturn;


        } else {
          return Arguments.find({'commandId':commandId}, {sort : {createdAt:1}});
        }

      }
  });


  Template.commandEditorModal.helpers({

    currentEditCommand: function (mode, commandId) {

        var currentEditCommand = Session.get('currentEditCommand');

        if (typeof(currentEditCommand) != 'undefinded' && currentEditCommand) {
          return currentEditCommand;

        } else {
          return {};
        }

      }
  });

  var clearCommandFormErrors = function() {
    $('#commandName').parent().removeClass('has-feedback has-error');
    $('#command').parent().removeClass('has-feedback has-error');
  }

  var clearArgumentFormErrors = function() {
    $('#ctrlArgumentName').parent().removeClass('has-feedback has-error');
    $('#ctrlDefaultValue').parent().removeClass('has-feedback has-error');
  }


  Template.commandFormBody.events({


    // Send the command and arguments to the server
    // to be persisted
    "click #btnSaveCommand": function (event) {

      clearCommandFormErrors();

      var form = Template.instance().find('#saveCommandForm');
      var commandName = form.commandName.value;
      var command = form.command.value;
      var returnType = form.returnType.value;
      var targetCommandId = form.targetCommandId.value;

      var arguments = Session.get('arguments');

      Meteor.call("saveCommand", targetCommandId, commandName,
                            command, returnType, arguments, function(error,result) {

        if (error) {
          $('#commandName').parent().addClass('has-feedback has-error');
          $('#command').parent().addClass('has-feedback has-error');
          Session.set('commandFormErrors',[{'msg':error.message,'stack':error.stack}]);

        } else {
          form.commandName.value = null;
          form.command.value = null;
          form.returnType.value = null;

          initSessionVars();

          $('#commandEditorModal').modal('hide');
        }

      });

      // Prevent default form submit
      return false;
    }

  });

  Template.argumentsForm.events({


      // add a new argument to the command (no persistence)
      // just adds an argument to the session
      "click #btnAddArgument": function (event) {

        Session.set('argumentFormErrors',[]);

        clearArgumentFormErrors();

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

        template.find('#ctrlArgumentName').value = null;
        template.find('#ctrlDefaultValue').value = null;
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
      }


  });



  Template.commandsList.events({


    // add a new argument to the command (no persistence)
    // just removes an argument by id from session
    "click .btnRemoveCommand": function (event) {

        bootbox.confirm('Are you sure you want to delete this command?', function(result){

          if (result) {
            var toRemoveId = event.target.id;

            Meteor.call("deleteCommand", toRemoveId, function(error,result) {

              if (error) {
                Session.set('errors',[{'msg':error.message,'stack':error.stack}]);
              }

            });

            return true;
          }

        });

      },

      // launches edit command modal
      "click .btnEditCommand": function (event) {

          $("#commandFormPanelBody").collapse('hide');

          initSessionVars();
          clearCommandFormErrors();
          clearArgumentFormErrors();

          var toEditId = event.target.id;
          var command = Commands.findOne({'_id':toEditId});
          var argCursor = Arguments.find({'commandId':toEditId}, {sort : {createdAt:1}});
          var arguments = argCursor.fetch();

          var sessionArgs = {};
          for (var i=0; i<arguments.length; i++) {
            var argObj = arguments[i];
            sessionArgs[argObj._id] = argObj;
          }


          // put current command and arguments in session
          Session.set('currentEditCommand',command);
          Session.set('arguments',sessionArgs);

          // clear stateful items for the form if it closes
          $('#commandEditorModal').on('hidden.bs.modal', function (e) {
            initSessionVars();
            clearCommandFormErrors();
            clearArgumentFormErrors();
          })

        },



  });

}



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






if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
