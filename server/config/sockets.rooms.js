
var counter = 0;
module.exports = function( socket, rooms, users ) {

  socket.on('event:room:create', function( room ){
    var newRoom = 'room' + counter;
    rooms[ newRoom ] = {
      owner: socket.id,
      members: {},
      name: room.name,
      private: room.private || false
    };
    rooms[ newRoom ].members[ socket.id ] = users[ socket.id ];

    socket.emit( 'event:room:create' );

    console.log('User ('+socket.id+') has created a room; ' + newRoom);
  });

  socket.on( 'event:room:member:add', function(){
    //only room owner can add
  });

  socket.on( 'event:room:member:remove', function(){
    //only room owner can remove
  });

  socket.on('event:room:join', function( name ) {
    if ( rooms[ name ] ) {

      /**
       * Add User to Room
       */
      rooms[ name ].members[ socket.id ] = users[ socket.id ];

      /**
       * Add Room to User
       */
      if( users[ socket.id ].rooms && users[ socket.id ].rooms.length ) {
        users[ socket.id ].rooms.push( name );
      } else {
        users[ socket.id ].rooms = [ name ];
      }

      // Socket joins room namespace
      socket.join( name );

      // Send Back Acknowledgement + Room & Members
      socket.emit('event:room:join', { name: name, users: rooms[ name ].members } );

      // Notify Room + Room & Members
      socket.broadcast.to( name ).emit( 'event:room:join', { name: name, user: rooms[ name ].members[ socket.id ] } );

      console.log('User ('+socket.id+') has joined room; ' + name);

    }
    // else room does not exist, do nothing

  });
  socket.on('event:room:leave', function( name ) {
    if ( rooms[ name ] ) {

      /**
       *  Remove User from Room
       */
      delete rooms[ name ].members[ socket.id ];

      /**
       *  Remove Room from User
       */
      var roomIndex = users[ socket.id ].rooms.indexOf( name );
      if( roomIndex !== -1 ) {
        users[ socket.id ].rooms.splice( roomIndex, 1 );
      }

      // Notify Room members
      socket.broadcast.to( name ).emit( 'event:room:leave', {name: name, user: socket.id } );

      // Socket leaves room namespace
      socket.leave( name );

      console.log('User ('+socket.id+') has left room; ' + name);

    }
    // else room does not exist, do nothing
    
  });
};