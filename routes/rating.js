const Rating = require( `../models/rating` );
const Restaurant = require( `../models/restaurant` );
const User = require( `../models/user` );
const ObjectID = require( `mongodb` ).ObjectID;

const { body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

const express = require( `express` );
const router = express.Router( {mergeParams: true} );



// Routes
router.get( `/`, (req, res) => {
    const logger = req.logger || null;
    const restaurant_id = req.params.restaurant_id;

    if( ! ObjectID.isValid(restaurant_id) ) {
        return res.status(400).json( {
            error: true,
            errors: [ {
                msg: `ID is invalid`
            } ]
        } );
    } else {
        Restaurant.findOne( { _id:ObjectID(restaurant_id), isActive:true }, (error, restaurant) => {
            if( error ) {
                logger.error( error );
                return res.status(500).json( {
                    error: true,
                    errors: [ error ]
                } );
            } else {
                if( ! restaurant ) {
                    return res.status(404).json( {
                        error: true,
                        errors: [ {
                            msg: `ID "${restaurant_id}" is not associated to any restaurant`
                        } ]
                    } );
                } else {
                    Rating.find( { restaurant:ObjectID(restaurant_id) }, (error, ratings) => {
                        if( error ) {
                            logger.error( error );
                            return res.status(500).json( {
                                error: true,
                                errors: [ error ]
                            } );
                        } else {
                            if( ! ratings || ratings.length === 0 ) {
                                return res.status(404).json( {
                                    error: true,
                                    errors: [ {
                                        msg: `There are no ratings yet`
                                    } ]
                                } );
                            } else {
                                return res.status(200).json( {
                                    error: false,
                                    data: ratings
                                } );
                            }
                        }
                    } );
                }
            }
        } );
    }
} );

// ADD RATINGS
router.post( `/`, [
    body(`blogger`).trim().escape(),
    body(`blogger`).custom( (value) => {
        return User.findOne( { username:value, userType:`blogger` } ).then( (user) => {
            if( ! user ) {
                throw new Error( `Username "@${value}" is not associated to any blogger account` );
            }
        } );
    } ),
    sanitizeBody(`notifyOnReply`).toBoolean()
], (req, res) => {
    const logger = req.logger || null;
    const restaurant_id = req.params.restaurant_id;
    const blogger = req.body.blogger;

    if( ! ObjectID.isValid(restaurant_id) ) {
        return res.status(400).json( {
            error: true,
            errors: [ {
                msg: `ID is invalid`
            } ]
        } );
    }

    req.checkBody( `stars`, `You must provide a star rating` ).notEmpty();
    req.checkBody( `stars`, `Star rating must have numbers only` ).isNumeric();
    req.checkBody( `stars`, `Star rating must be from 1 to 5 only` ).isInt( {min:1, max:5} );

    req.checkBody( `blogger`, `You must provide a blogger username` ).notEmpty();
    req.checkBody( `timestamp`, `You must provide a timestamp` ).notEmpty();
    req.checkBody( `timestamp`, `You must provide valid timestamp` ).isISO8601();

    let errors = req.validationErrors();
    if( errors ) {
        return res.status(400).json( {
            error: true,
            errors: errors
        } );
    } else {
        Restaurant.findOne( { _id:ObjectID(restaurant_id), isActive:true }, (error, restaurant) => {
            if( error ) {
                logger.error( error );
                return res.status(500).json( {
                    error: true,
                    errors: [ error ]
                } );
            } else {
                if( ! restaurant ) {
                    return res.status(404).json( {
                        error: true,
                        errors: [ {
                            msg: `ID "${restaurant_id}" is not associated to any restaurant`
                        } ]
                    } );
                } else {
                    Rating.findOne( { restaurant:ObjectID(restaurant_id), blogger: blogger }, (error, rating) => {
                        if( error ) {
                            logger.error( error );
                            return res.status(500).json( {
                                error: true,
                                errors: [ error ]
                            } );
                        } else {
                            let newRating = new Rating( {
                                stars: req.body.stars,
                                restaurant: restaurant_id,
                                blogger: req.body.blogger,
                                timestamp: req.body.timestamp
                            } );

                            // NEW RATING
                            if( ! rating ) {
                                newRating.save( (error) => {
                                    if( error ) {
                                        logger.error( error );
                                        return res.status(500).json( {
                                            error: true,
                                            errors: [ {
                                                msg: `Could not save rating`
                                            } ]
                                        } );
                                    } else {
                                        return res.status(200).json( {
                                            error: false,
                                            errors: [ {
                                                msg: `Rating added successfully`
                                            } ]
                                        } );
                                    }
                                } );
                            // UPDATE RATING
                            } else {
                                rating.stars = newRating.stars;
                                rating.timestamp = newRating.timestamp;

                                rating.save( (error) => {
                                    if( error ) {
                                        logger.error( error );
                                        return res.status(500).json( {
                                            error: true,
                                            errors: [ {
                                                msg: `Could not update rating`
                                            } ]
                                        } );
                                    } else {
                                        return res.status(200).json( {
                                            error: false,
                                            errors: [ {
                                                msg: `Rating updated successfully`
                                            } ]
                                        } );
                                    }
                                } );
                            }
                        }
                    } );
                }
            }
        } );
    }
} );

// DELETE RATINGS
router.delete( `/`, [
    body(`blogger`).trim().escape(),
    body(`blogger`).custom( (value) => {
        return User.findOne( { username:value, userType:`blogger` } ).then( (user) => {
            if( ! user ) {
                throw new Error( `Username "@${value}" is not associated to any blogger account` );
            }
        } );
    } ),
    sanitizeBody(`notifyOnReply`).toBoolean()
], (req, res) => {
    const logger = req.logger || null;
    const restaurant_id = req.params.restaurant_id;
    const blogger = req.body.blogger;

    if( ! ObjectID.isValid(restaurant_id) ) {
        return res.status(400).json( {
            error: true,
            errors: [ {
                msg: `ID is invalid`
            } ]
        } );
    }

    req.checkBody( `blogger`, `You must provide a blogger username` ).notEmpty();

    let errors = req.validationErrors();
    if( errors ) {
        return res.status(400).json( {
            error: true,
            errors: errors
        } );
    } else {
        Restaurant.findOne( { _id:ObjectID(restaurant_id), isActive:true }, (error, restaurant) => {
            if( error ) {
                logger.error( error );
                return res.status(500).json( {
                    error: true,
                    errors: [ error ]
                } );
            } else {
                if( ! restaurant ) {
                    return res.status(404).json( {
                        error: true,
                        errors: [ {
                            msg: `ID "${restaurant_id}" is not associated to any restaurant`
                        } ]
                    } );
                } else {
                    Rating.findOne( { restaurant:ObjectID(restaurant_id), blogger: blogger }, (error, rating) => {
                        if( error ) {
                            logger.error( error );
                            return res.status(500).json( {
                                error: true,
                                errors: [ error ]
                            } );
                        } else {
                            if( ! rating ) {
                                return res.status(404).json( {
                                    error: true,
                                    errors: [ {
                                        msg: `Could not delete rating. Rating does not exist`
                                    } ]
                                } );
                            } else {
                                rating.remove( (error) => {
                                    if( error ) {
                                        logger.error( error );
                                        return res.status(500).json( {
                                            error: true,
                                            errors: [ {
                                                msg: `Could not delete rating`
                                            } ]
                                        } );
                                    } else {
                                        return res.status(200).json( {
                                            error: false,
                                            errors: [ {
                                                msg: `Rating deleted successfully`
                                            } ]
                                        } );
                                    }
                                } );
                            }
                        }
                    } );
                }
            }
        } );
    }

} );



module.exports = router;