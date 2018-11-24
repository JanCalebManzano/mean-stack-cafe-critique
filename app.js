const express = require( `express` );
const mongoose = require( `mongoose` );

const configServer = require( `./config/server` );
const configApp = require( `./config/app` );
const configDatabase = require( `./config/database` );

const app = express();



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
app.get( `/`, (req, res, next) => {
    return res.send( `Hello world` );
} );



module.exports = app;