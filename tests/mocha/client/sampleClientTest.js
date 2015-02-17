if (!(typeof MochaWeb === 'undefined')){
  MochaWeb.testOnly(function(){

    describe("basic ui test", function(){

      it("should have command in list", function(){

        Meteor.call("saveCommand", null, 'testCommand1', 'command1', 'none', null);
        var commands = Commands.find().fetch();
        chai.expect(commands.length).to.equal(1);

        var x= $("#commandsListContainer").find("td").first().text();
        console.log(x);
        chai.assert.equal(x, 'testCommand1');

        
      });
    });
  });
}
