const User = require( `../models/user` );
const configDatabase = require( `../config/database` );
const express = require( `express` );
const router = express.Router();

const { body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
const jwt = require( `jsonwebtoken` );



// Routes
router.post( `/register`, [
    body(`username`).trim().escape(),
    body(`name`).trim().escape(),
    body(`email`).normalizeEmail(),
    body(`userType`).trim().escape(),
    sanitizeBody(`notifyOnReply`).toBoolean()
], (req, res) => {

    const logger = req.logger || null;
    
    req.checkBody( `username`, `You must provide a username`).notEmpty();
    req.checkBody( `username`, `Username must have numbers and letters only` ).isAlphanumeric();
    req.checkBody( `username`, `Username must have at least 8 characters but no more than 15` ).isLength( {min:8, max:15} );

    req.checkBody(  `password`, `You must provide a password`).notEmpty();
    req.checkBody( `password`, `Password must have numbers and letters only` ).isAlphanumeric();
    req.checkBody( `password`, `Password must have at least 8 characters but no more than 15` ).isLength( {min:8, max:15} );
    
    req.checkBody( `name`, `You must provide a name`).notEmpty();
    req.checkBody( `name`, `Name must have letters only` ).matches(/^[a-zA-Z ]+$/);
    req.checkBody( `name`, `Name must have no more than 50 characters` ).isLength( {max:50} );
    
    req.checkBody( `email`, `You must provide an e-mail`).notEmpty();
    req.checkBody( `email`, `Email must be valid`).isEmail().normalizeEmail();

    req.checkBody( `userType`, `You must provide a user type` ).notEmpty();
    req.checkBody( `userType`, `User type must be one of the following: Blogger, Restaurateur, Typical User` ).isIn( new User().getUserTypes() );
    

    let errors = req.validationErrors();
    if( errors ) {
        logger.error( errors[0].msg );
        return res.status(400).json( {
            error: true,
            errors: errors
        } );
    } else {
        let user = new User( {
            username: req.body.username.toLowerCase(),
            password: req.body.password,
            name: capitalizeEachWord( req.body.name ),
            email: req.body.email.toLowerCase(),
            userType: req.body.userType
        } );

        user.save( (error) => {
            if( error ) {
                if( error.code === 11000 ) {
                    return res.status(400).json( {
                        error: true,
                        errors: [ {
                            msg: `Username or e-mail already exists`
                        } ]
                    } );
                } else {
                    logger.error( error );
                    return res.status(500).json( {
                        error: true,
                        errors: [ {
                            msg: `Could not register account`
                        } ]
                    } );
                }
            } else {
                return res.json( {
                    error: false,
                    msg: `Account registered`
                } );
            }
        } );
    }

} );

// LOGIN
router.post( `/login`, [
    body(`username`).trim().escape(),
    body(`userType`).trim().escape(),
    sanitizeBody(`notifyOnReply`).toBoolean()
], (req, res) => {
    
    const logger = req.logger || null;
    
    req.checkBody( `username`, `You must provide a username`).notEmpty();
    req.checkBody( `username`, `Username must have numbers and letters only` ).isAlphanumeric();
    req.checkBody( `username`, `Username must have at least 8 characters but no more than 15` ).isLength( {min:8, max:15} );

    req.checkBody(  `password`, `You must provide a password`).notEmpty();
    req.checkBody( `password`, `Password must have numbers and letters only` ).isAlphanumeric();
    req.checkBody( `password`, `Password must have at least 8 characters but no more than 15` ).isLength( {min:8, max:15} );
    
    req.checkBody( `userType`, `You must provide a user type` ).notEmpty();
    req.checkBody( `userType`, `User type must be one of the following: Blogger, Restaurateur, Typical User` ).isIn( new User().getUserTypes() );

    let errors = req.validationErrors();
    if( errors ) {
        logger.error( errors[0].msg );
        return res.status(400).json( {
            error: true,
            errors: errors
        } );
    } else {
        User.findOne( {username:req.body.username}, (error, user) => {
            if( error ) {
                logger.error( error );
                return res.status(500).json( {
                    error: true,
                    errors: [ error ]
                } );
            } else {
                if( ! user ) {
                    return res.status(400).json( {
                        error: true,
                        errors: [ {
                            msg: `"${req.body.username}" is not associated to any account`
                        } ]
                    } );
                } else {
                    const isUserTypeValid = user.compareUserType( req.body.userType );

                    if( ! isUserTypeValid ) {
                        return res.status(400).json( {
                            error: true,
                            errors: [ {
                                msg: `"${req.body.username}" is not associated to any "${(req.body.userType == 'user') ? "typical user":req.body.userType}" account`
                            } ]
                        } );
                    } else {
                        const isValidPassword = user.comparePassword( req.body.password );
                        if( ! isValidPassword ) {
                            return res.status(400).json( {
                                error: true,
                                errors: [ {
                                    msg: `Password is invalid`
                                } ]
                            } );
                        } else {
                            const token = jwt.sign( { userId: user._id }, configDatabase.secret, { expiresIn: `24h` } );

                            return res.status(200).json( {
                                error: false,
                                msg: `Login successful`,
                                token: token,
                                user: {
                                    username: user.username,
                                    userType: user.userType
                                }
                            } );
                        }
                    }

                }
            }
        } );
    }
    
} );

router.post( `/isUsernameAvailable`, [
    body(`username`).trim().escape(),
    sanitizeBody(`notifyOnReply`).toBoolean()
], (req, res) => {

    const logger = req.logger || null;

    let errors = req.validationErrors();
    if( errors ) {
        logger.error( errors );
        return res.status(400).json( {
            error: true,
            errors: errors
        } );
    } else {
        User.findOne( {username:req.body.username}, (error, user) => {
            if( error ) {
                logger.error( error );
                return res.status(500).json( {
                    error: true,
                    errors: [ error ]
                } );
            } else {
                if( user ) {
                    return res.status(400).json( {
                        error: true,
                        errors: [ {
                            msg: `Username is already taken`
                        } ]
                    } );
                } else {
                    return res.status(200).json( {
                        error: false,
                        errors: [ {
                            msg: `Username is available`
                        } ]
                    } );
                }
            }
        } );
    }

} );

router.get( `/profile`, (req, res) => {

} );



// MY FUNCTIONS
const capitalizeEachWord = ( text ) => {
    return text.toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');
};



module.exports = router;