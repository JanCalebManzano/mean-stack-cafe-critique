const express = require( `express` );
const mongoose = require( `mongoose` );
const bodyParser = require( `body-parser` );
const expressValidator = require( `express-validator` );
const cors = require( `cors` );

const configServer = require( `./config/server` );
const configApp = require( `./config/app` );
const configDatabase = require( `./config/database` );

const app = express();
const router = express.Router();
const authentication = require( `./routes/authentication` );



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



// Middlewares
    // Body Parser
    app.use( bodyParser.urlencoded( {extended:false} ) );
    app.use( bodyParser.json() );    
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



// Routes
app.get( `/`, (req, res, next) => {
    return res.send( `Hello world` );
} );



const userRoutes = require( `./routes/user` );
const restaurantRoutes = require( `./routes/restaurant` );

app.use( `/authentication`, authentication );
app.use( `/user`, userRoutes );
app.use( `/restaurant`, restaurantRoutes );



module.exports = app;