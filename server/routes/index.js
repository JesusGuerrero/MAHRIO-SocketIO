'use strict';


module.exports = function( server ) {
  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply.view('index');
    }
  });
  
  server.route({
    method: 'GET',
    path: '/bower_components/{params*}',
    handler: {
      directory: {
        path: '../public/bower_components'
      }
    }
  });
  server.route({
    method: 'GET',
    path: '/assets/js/{params*}',
    handler: {
      directory: {
        path: '../public/js'
      }
    }
  });
  server.route({
    method: 'GET',
    path: '/assets/css/{params*}',
    handler: {
      directory: {
        path: '../public/css'
      }
    }
  });
  server.route({
    method: 'GET',
    path: '/partials/{params*}',
    handler: {
      directory: {
        path: '../public/html'
      }
    }
  })
};