if (Meteor.isServer) {
  Meteor.startup(function () {

      // clean it out every hour
      // this is only here for when deployed
      // to meteor.com for the demo
      Meteor.setInterval( function () {
          Meteor.call("cleanAllCollections");
      }, (60000 * 120) );

  });
}
