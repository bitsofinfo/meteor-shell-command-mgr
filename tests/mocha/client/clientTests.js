if (!(typeof MochaWeb === 'undefined')){
  MochaWeb.testOnly(function(){

    beforeEach(function(done){
      Meteor.call('cleanAllCollections');
      done();
    });

    describe("Command UI tests", function(){

      it("Should have zero command in list on startup", function(){

        // there should be zero rows (commands in this view)
        var totalCommands = $("#commandsListContainer table tbody tr").length;
        chai.assert.equal(totalCommands, 0);

      });

      it("Add/delete command no arguments", function() {

        $("#commandName").val("unitTestCmd1");
        $("#command").val("cmd1");
        $("#returnType").val("json");

        //$("#commandFormContainer saveCommandForm returnType").value = "json";
        $("#commandFormContainer #btnSaveCommand").click();

        // there should be zero rows (commands in this view)
        var resultCells = $("#commandsListContainer tbody tr td")
        chai.assert.equal(resultCells.length,5);
        chai.assert.equal(resultCells[0].innerHTML, "unitTestCmd1");
        chai.assert.equal(resultCells[1].innerHTML, "cmd1");
        chai.assert.equal(resultCells[2].innerHTML, "json");

        var removeButtons = $("#commandListPanelBody").find("button.btnRemoveCommand");
        chai.assert.equal(removeButtons.length,1);

        var removeButton = removeButtons[0];
        removeButton.click();

        // should pop modal dialog
        var modalDialog = $(".modal-dialog");
        chai.expect(modalDialog);

        chai.expect(modalDialog.find(".bootbox-body").first().html(),"Are you sure you want to delete this command?");

        // hit ok
        modalDialog.find("button.btn-primary").click();

        // now we should have zero commands again
        var totalCommands = $("#commandsListContainer table tbody tr").length;
        chai.assert.equal(totalCommands, 0);

      });

    });
  });
}
