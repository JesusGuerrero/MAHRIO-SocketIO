

module.exports = function( socket, users ) {
  /**
   * User updates his name
   */
  socket.on( 'event:users:update', function( name ) {
    var prevName = users[ socket.id ].name;
    users[ socket.id ].name = name;
    socket.emit( 'event:users:update', {name: name} ); // confirm onboarding the one socket that connected

    console.log('User (' + prevName + ') is now called ' + name);
  });
};