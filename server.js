const http = require( "http" );
const app = require( "./app" );

const port = require( `./config/server` ).port;
const server = http.createServer( app );

server.listen( port, function() {
    console.log( `Server started on port ${port}...` );
} );