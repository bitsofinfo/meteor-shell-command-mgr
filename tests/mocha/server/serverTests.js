if (!(typeof MochaWeb === 'undefined')){

  MochaWeb.testOnly(function(){

    beforeEach(function(done){
      Commands.remove({'_id': /.*/});
      Arguments.remove({'_id': /.*/});
      done();
    });

    describe("Server initialization", function(){
      it("should have a Meteor version defined", function(){
        chai.assert(Meteor.release);
      });
    });

    describe("Commands collection", function() {

      it("Should exist and have no data", function(){
        var commandsCursor = Commands.find();
        chai.assert(typeof(commandsCursor) != 'undefined');
        var expect = chai.expect;
        var commands = commandsCursor.fetch();
        expect(commands.length).to.equal(0);

      });
    });


    describe("Arguments collection", function() {

      it("Should exist and have no data", function(){
        var cursor = Arguments.find();
        chai.assert(typeof(cursor) != 'undefined');
        var expect = chai.expect;
        var results = cursor.fetch();
        expect(results.length).to.equal(0);

      });
    });

    var newArgument = function(postfix) {
      return {'argumentName':('arg'+postfix), 'defaultValue': ('v'+postfix), 'isValued':true, 'isQuoted':true};
    }

    var createCommandsArgsValidate = function(totalArgs) {
      var args = {};
      for (var i=0; i<totalArgs; i++) {
        args['arg'+i] = newArgument(i);
      }

      Meteor.call("saveCommand", null, 'testCommand1', 'command1', 'none', args);
      var commands = Commands.find().fetch();
      chai.expect(commands.length).to.equal(1);

      var command = commands[0];

      var args = Arguments.find({'commandId':command._id}).fetch();
      chai.expect(args.length).to.equal(totalArgs);

      return command;
    }

    var argumentsArrayToHash = function(arguments) {
      var argHash = {};
      for (var i=0; i<arguments.length; i++) {
        var arg = arguments[i];
        argHash[arg.argumentName] = arg;
      }
      return argHash;
    }

    describe("Meteor.methods", function() {

      it("saveCommand - create new command no arguments", function(){

        Meteor.call("saveCommand", null, 'testCommand1', 'command1', 'none', null);
        var commands = Commands.find().fetch();
        chai.expect(commands.length).to.equal(1);

      });

      it("saveCommand - create new command 2 arguments", function(){
        createCommandsArgsValidate(2);
      });

      it("saveCommand/deleteCommand - create new command 2 arguments then delete all", function(){

        var command = createCommandsArgsValidate(2);
        Meteor.call('deleteCommand', command._id);

        var commands = Commands.find().fetch();
        chai.expect(commands.length).to.equal(0);
        var arguments = Arguments.find().fetch();
        chai.expect(arguments.length).to.equal(0);

      });


      it("saveCommand - lifecycle", function(){

        var command = createCommandsArgsValidate(2);

        var arguments = Meteor.call('getArgumentsBy',{'commandId':command._id});
        chai.expect(arguments[0].argumentName).to.equal('arg0');
        chai.expect(arguments[1].argumentName).to.equal('arg1');

        // convert to has (which is what app stores in session)
        var argHash = argumentsArrayToHash(arguments);

        // get rid of 0 and add 3
        delete argHash['arg0'];
        argHash['arg3'] = newArgument(3);

        // update
        Meteor.call("saveCommand", command._id, command.commandName,
          command.command, command.returnType, argHash);

        var commands = Commands.find().fetch();
        chai.expect(commands.length).to.equal(1);

        arguments = Meteor.call('getArgumentsBy',{'commandId':command._id});
        chai.expect(arguments[0].argumentName).to.equal('arg1');
        chai.expect(arguments[1].argumentName).to.equal('arg3');


      });


    });

  });
}
