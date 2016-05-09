var socket = io();

angular.module('mahrio', ['ngRoute'])
  .config(['$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/chat', {
        templateUrl: '/partials/chat-list.html',
        controller: 'ChatCtrl as vm'
      }).when('/chat/members', {
        templateUrl: '/partials/chat-detail.html',
        controller: 'ChatDetailCtrl as vm'
      }).otherwise({
        redirectTo: '/chat'
      });
    }
  ])
  .value( '_socket', socket )
  .run( ['$rootScope', 'GlobalEvents', function( $rootScope, GlobalEvents ) {
    GlobalEvents.provision();
  }])
  .service('GlobalEvents', [ '$rootScope', '_socket', 'Chat', function( $rootScope, _socket, Chat ) {
    this.provision = function() {
      _socket.on( 'connect', function(){
        console.log('we are socket.on -> connected');
        $rootScope.$broadcast( 'event:connected' );
        $rootScope.$apply( function(){
          _socket.connected = true;
        });
        _socket.emit( 'event:room:join', 'lobby' );
      });
      _socket.on( 'disconnect', function(){
        console.log('disconnected');
        $rootScope.$broadcast( 'event:disconnected' );
      });

      _socket.on('event:room:join', function( room ){
        if( Chat.myRooms[ room.name ] ) { //we already in room, so someone else is joining
          Chat.myRooms[ room.name ].members[ room.user.id ] = room.user;
          console.log( 'User ' + room.user.name  + ' has joined room ' + room.name );
        } else { //we are joining the room
          Chat.myRooms[ room.name ] = {
            members: room.users,
            messages: []
          };
        }
        Chat.currentRoom = room.name;
        $rootScope.$broadcast('event:currentMembers' );

      });
      _socket.on('event:room:leave', function( obj ) {
        console.log( 'User ' + Chat.myRooms[ obj.name ].members[ obj.user ].name  + ' has left room ' + obj.name );
        delete Chat.myRooms[ obj.name ].members[ obj.user ];
        $rootScope.$broadcast('event:currentMembers' );
      });


      _socket.on('event:message:room', function( message ){
        Chat.myRooms[ message.room ].messages.push( message );
        $rootScope.$broadcast('event:currentMessage' );
      });

    };
  }])
  .service('Chat', [ function(){
    this.myRooms = {};
    this.currentRoom = null;

    this.users = {};
    this.rooms = {};

    var that = this;
    this.disconnect = function() {
      that.myRooms = {};
      that.currentRoom = null;

      that.users = {};
      that.rooms = {};
    };
  }])
  .factory('Socket', [ '_socket', 'Chat', function( _socket, Chat ) {
    return {
      connect: function(){
        _socket.connect();
      },
      disconnect: function(){
        _socket.disconnect();
        Chat.disconnect();
      },
      connected: function(){
        return _socket.connected;
      },
      sendMessageToRoom: function( msg ) {
        _socket.emit('event:message:room', msg );
      },
      myId: function(){
        return _socket.id;
      }
    };
  }])
  .controller('NavCtrl', [ '$scope', '$rootScope', 'Socket', function( $scope, $rootScope, Socket ){
    var that = this;

    that.toggleRoom = function(){
      $rootScope.$broadcast('event:showRooms');
    };
    that.toggleMembers = function(){
      $rootScope.$broadcast('event:showMembers');
    };
    that.ping = function(){
      Socket.pingAll( );
    };
    that.connect = function(){
      Socket.connect();
      that.connected = true;
    };
    that.disconnect = function(){
      Socket.disconnect();
      that.connected = false;
    };
    that.connected = Socket.connected();

    $scope.$watch( function(){ return Socket.connected(); }, function( nw ){
      that.connected = nw;
    });
  }])
  .controller('ChatCtrl', [ '$scope', '$rootScope', 'Chat', 'Socket', function( $scope, $rootScope, Chat, Socket ) {
    var that = this;
    that.provisioned = false;
    that.chats = [];
    that.currentMembers = {};

    var pills = $('ul.nav-tabs li a');

    var watchMessaged = null,
      joinedRoom = null;

    function listen(){
      joinedRoom = $scope.$watch( function(){ return Chat.currentRoom; }, function( nw ){
        if( nw ) {
          joinedRoom();
          watchMessaged = $scope.$watch( function(){ return Chat.myRooms[ Chat.currentRoom ].messages.length; }, function( nw ){
            if( nw ) {
              that.chats = Chat.myRooms[ Chat.currentRoom ].messages;
            }
          });
        }
      });
    };
    listen();
    $scope.$watch( function(){ return Socket.connected(); }, function( nw ){
      if( nw ) {
        that.connected = nw;
        that.provisioned = true;
      }
    });
    $scope.$on('event:disconnected', function(){
      that.connected = false;
      that.chats = [];
      that.currentMembers = {};
      if( typeof watchMessaged === 'function' ) {
        watchMessaged();
      }
    });
    $scope.$on('event:connected', function(){
      that.connected = true;
      listen();
    });

    $scope.$on('event:showRooms', function(){
      $('a#roomsPill').click();
    });
    $scope.$on('event:showMembers', function(){
      $('a#membersPill').click();
    });
    $scope.$on('event:currentMembers', function( ) {
      $scope.$apply( function(){
        that.currentMembers = Chat.myRooms[ Chat.currentRoom ].members;
      });
    });
    $scope.$on('event:currentMessage', function( ) {
      $scope.$apply( function(){
        that.chats = Chat.myRooms[ Chat.currentRoom ].messages;
      });
    });

    that.connect = function(){
      Socket.connect();
    };
    that.disconnect = function(){
      Socket.disconnect();
    };
    pills.click(function (e) {
      e.preventDefault();
      $(this).tab('show');
    });
  }])
  .directive('chatInput',[ 'Chat', 'Socket', '$rootScope', function( Chat, Socket, $rootScope ){
    return {
      restrict: 'E',
      replace: true,
      templateUrl: '/partials/chat-input.html',
      link: function( $scope ) {
        $scope.sendMessage = function(){
          Chat.myRooms[ Chat.currentRoom ].messages.push( {from: '/#' + Socket.myId(), message: $scope.message } );
          Socket.sendMessageToRoom( {to: Chat.currentRoom, data: $scope.message } );
          delete $scope.message;
        };
        $scope.$on('event:disconnected', function(){
          $scope.connected = false;
        });
        $scope.$on('event:connected', function(){
          $scope.connected = true;
        });
      }
    }
  }]);