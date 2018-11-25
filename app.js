const express = require( `express` );
const mongoose = require( `mongoose` );
const bodyParser = require( `body-parser` );
const expressValidator = require( `express-validator` );
const cors = require( `cors` );
const path = require( `path` );
const methodOverride = require('method-override');

const configServer = require( `./config/server` );
const configApp = require( `./config/app` );
const configDatabase = require( `./config/database` );

const app = express();
const authentication = require( `./routes/authentication` );



// Middlewares
    // Body Parser
    app.use( bodyParser.urlencoded( {extended:false} ) );
    app.use( bodyParser.json() );
    // Method Override
    app.use( methodOverride(`_method`) );
    // Express Validator
    app.use( expressValidator( {
    errorFormatter: ( param, msg, value ) => {
        var namespace = param.split("."),
            root = namespace.shift(),
            formParam = root;

        while( namespace.length ) {
            formParam += `[${namespace.shift()}]`;
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        }
    }
    } ) );
    // CORS
    app.use( cors() );


    
// Winston Logger
const { createLogger, format, transports } = require(`winston`);
const { combine, timestamp, label, printf } = format;
const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`;
});
const logger = createLogger({
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    // new transports.File({ filename: 'combined.log' }),
    new transports.File({ filename: `error.log`, level: `error` }),
    new transports.Console()
  ]
});



// Database Connection
mongoose.Promise = global.Promise;
mongoose.connect( configDatabase.url, { useNewUrlParser: true }, (error) => {
    if( error ) {
        logger.error( `Could not connect to the database...`, err );        
    } else {
        logger.info( `Connected to database: ${configDatabase.db}`);                
    }
} );
mongoose.set('useCreateIndex', true);



// STATIC PATHS
app.use( express.static( path.join( __dirname, `/public` ) ) );
app.use( `/public`, express.static( path.join( __dirname, `/public` ) ) );
app.use( `/js`, express.static( path.join( __dirname, `/public/js` ) ) );
app.use( `/css`, express.static( path.join( __dirname, `/public/css` ) ) );
app.use( `/controllers`, express.static( path.join( __dirname, `/public/controllers` ) ) );
app.use( `/vendor`, express.static( path.join( __dirname, `/public/vendor` ) ) );



app.get( `/`, (req, res) => {
    return res.sendFile( path.join( __dirname, `/public/views/index.html` ) );
} );

app.get( `/upload`, (req, res) => {
    return res.sendFile( path.join( __dirname, `/public/views/upload.html` ) );
} );



// GLOBALS
app.get( `*`, ( req, res, next ) => {
  res.locals.user = req.user || null;
  res.locals.configApp = configApp;
  next();
} );



// Make our db accessible to our router
app.use( ( req, res, next ) => {
//   req.con = con;
  req.logger = logger;
  next();
} );



// Routes
// app.get( `/upload`, (req, res, next) => {
//     return res.sendFile( `public/views/index.html` );
// } );



const userRoutes = require( `./routes/user` );
const restaurantRoutes = require( `./routes/restaurant` );
const blogRoutes = require( `./routes/blog` );

app.use( `/authentication`, authentication );
app.use( `/user`, userRoutes );
app.use( `/restaurant`, restaurantRoutes );
app.use( `/blog`, blogRoutes );



module.exports = app;