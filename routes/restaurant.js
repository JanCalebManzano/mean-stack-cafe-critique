const User = require( `../models/user` );
const configDatabase = require( `../config/database` );
const ObjectID = require( `mongodb` ).ObjectID;

const express = require( `express` );
const router = express.Router();



// Routes
router.get( `/`, (req, res) => {
    const logger = req.logger || null;

    User.find( {}, {password:0}, (error, users) => {
        if( error ) {
            logger.error( error );
            return res.status(500).json( {
                error: true,
                errors: [ error ]
            } );
        } else {
            return res.status(200).json( {
                error: false,
                data: users
            } );
        }
    } );
} );




module.exports = router;