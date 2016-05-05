

module.exports = function( socket, rooms, users ) {
  socket.on('event:message:private', function( message ) {
    if( users[ message.to ] ) {

      // Send/Forward Private Message
      socket.broadcast.to( message.to ).emit( 'event:message:private', {
        from: socket.id,
        message: message.data
      });

      // Send Back Acknowledgement
      socket.emit( 'event:message:private', {
        to: message.to,
        message: message.data
      });

      console.log('User ('+socket.id+') has sent message to ' + message.to);
      
    } 
    // else user does not exist, do nothing
  });

  socket.on('event:message:room', function( message ){
    if( rooms[ message.to ] ) {
      
      // Send/Forward Room Message
      socket.broadcast.to( message.to ).emit( 'event:message:room', {
        from: socket.id,
        name: message.to,
        message: message.data
      });

      console.log('User ('+socket.id+') has sent message to room ' + message.to);
    }
    // else room does not exist, do nothing
  });
};