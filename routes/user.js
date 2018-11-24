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

// GET BY _ID
router.get( `/_id=:_id`, (req, res) => {
    const logger = req.logger || null;
    let _id = req.params._id;

    if( ! ObjectID.isValid(_id) ) {
        return res.status(400).json( {
            error: true,
            errors: [ {
                msg: `ID is invalid`
            } ]
        } );
    } else {
        User.findOne( { _id:ObjectID(_id) }, {password:0}, (error, user) => {
            if( error ) {
                logger.error( error );
                return res.status(500).json( {
                    error: true,
                    errors: [ error ]
                } );
            } else {
                return res.status(200).json( {
                    error: false,
                    data: user
                } );
            }
        } );
    }

} );

// GET BY USERNAME
router.get( `/username=:username`, (req, res) => {
    const logger = req.logger || null;
    let username = req.params.username;

    User.findOne( { username:username }, {password:0}, (error, user) => {
        if( error ) {
            logger.error( error );
            return res.status(500).json( {
                error: true,
                errors: [ error ]
            } );
        } else {
            return res.status(200).json( {
                error: false,
                data: user
            } );
        }
    } );
} );




module.exports = router;