const Reaction = require( `../models/reaction` );
const Blog = require( `../models/blog` );
const User = require( `../models/user` );

const ObjectID = require( `mongodb` ).ObjectID;
const { body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

const express = require( `express` );
const router = express.Router( {mergeParams: true} );



// Routes
router.get( `/`, (req, res) => {
    const logger = req.logger || null;
    let blog_id = req.params.blog_id;

    if( ! ObjectID.isValid( blog_id ) ) {
        return res.status(400).json( {
            error: true,
            errors: [ {
                msg: `ID is invalid`
            } ]
        } );
    } else {
        Blog.findOne( { _id:ObjectID(blog_id) }, (error, blog) => {
            if( error ) {
                logger.error( error );
                return res.status(500).json( {
                    error: true,
                    errors: [ error ]
                } );
            } else {
                if( ! blog ) {
                    return res.status(404).json( {
                        error: true,
                        errors: [ {
                            msg: `ID "${blog_id}" is not associated to any blog`
                        } ]
                    } );
                } else {
                    Reaction.find( { blog:ObjectID(blog_id) }, (error, reactions) => {
                        if( error ) {
                            logger.error( error );
                            return res.status(500).json( {
                                error: true,
                                errors: [ error ]
                            } );
                        } else {
                            if( ! reactions || reactions.length === 0 ) {
                                return res.status(404).json( {
                                    error: true,
                                    errors: [ {
                                        msg: `There are no reactions yet`
                                    } ]
                                } );
                            } else {
                                return res.status(200).json( {
                                    error: false,
                                    data: reactions,
                                    msg: `Reactions successfully fetched`
                                } );
                            }
                        }
                    } );
                }
            }
        } );
    }
} );

router.get( `/:reaction_id`, (req, res) => {
    const logger = req.logger || null;
    let blog_id = req.params.blog_id;
    let reaction_id = req.params.reaction_id;

    if( ! ObjectID.isValid( blog_id ) ) {
        return res.status(400).json( {
            error: true,
            errors: [ {
                msg: `ID is invalid`
            } ]
        } );
    } else {
        if( ! ObjectID.isValid( reaction_id ) ) {
            return res.status(400).json( {
                error: true,
                errors: [ {
                    msg: `ID is invalid`
                } ]
            } );
        } else {
            Blog.findOne( { _id:ObjectID(blog_id) }, (error, blog) => {
                if( error ) {
                    logger.error( error );
                    return res.status(500).json( {
                        error: true,
                        errors: [ error ]
                    } );
                } else {
                    if( ! blog ) {
                        return res.status(404).json( {
                            error: true,
                            errors: [ {
                                msg: `ID "${blog_id}" is not associated to any blog`
                            } ]
                        } );
                    } else {
                        Reaction.findOne( { _id:ObjectID(reaction_id), blog:ObjectID(blog_id) }, (error, reaction) => {
                            if( error ) {
                                logger.error( error );
                                return res.status(500).json( {
                                    error: true,
                                    errors: [ error ]
                                } );
                            } else {
                                if( ! reaction ) {
                                    return res.status(404).json( {
                                        error: true,
                                        errors: [ {
                                            msg: `ID "${blog_id}" is not associated to any reaction`
                                        } ]
                                    } );
                                } else {
                                    return res.status(200).json( {
                                        error: false,
                                        data: reaction,
                                        msg: `Reaction fetched successfully`
                                    } );
                                }
                            }
                        } );
                    }
                }
            } );
        }
    }
} );

// ADD/EDIT
router.post( `/`, [
    body(`type`).trim().escape(),
    body(`username`).custom( (value) => {
        return User.findOne( { username:value, userType: { $in: [`user`,`blogger`,`restaurateur`] } } ).then( (user) => {
            if( ! user ) {
                throw new Error( `Username "@${value}" is not associated to any user account` );
            }
        } );
    } ),
    sanitizeBody(`notifyOnReply`).toBoolean()
], (req, res) => {
    const logger = req.logger || null;
    let blog_id = req.params.blog_id;
    let username = req.body.username;

    if( ! ObjectID.isValid( blog_id ) ) {
        return res.status(400).json( {
            error: true,
            errors: [ {
                msg: `ID is invalid`
            } ]
        } );
    } 

    req.checkBody( `type`, `You must provide a reaction type`).notEmpty();
    req.checkBody( `type`, `Reaction must be one of the following: yummy, yucky`).isIn( [`yummy`,`yucky`] );
    
    req.checkBody( `username`, `You must provide a username`).notEmpty();
    req.checkBody( `username`, `Username must have at least 8 characters but no more than 15` ).isLength( {min:8, max:15} );

    let errors = req.validationErrors();
    if( errors ) {
        return res.status(400).json( {
            error: true,
            error: errors
        } );
    } else {
        Blog.findOne( { _id:ObjectID(blog_id) }, (error, blog) => {
            if( error ) {
                logger.error( error );
                return res.status(500).json( {
                    error: true,
                    errors: [ error ]
                } );
            } else {
                if( ! blog ) {
                    return res.status(404).json( {
                        error: true,
                        errors: [ {
                            msg: `ID "${blog_id}" is not associated to any blog`
                        } ]
                    } );
                } else {
                    // CHECK EXISTING REACTIONS
                    Reaction.findOne( { blog:ObjectID(blog_id), username:username }, (error, reaction) => {
                        if( error ) {
                            logger.error( error );
                            return res.status(500).json( {
                                error: true,
                                errors: [ error ]
                            } );
                        } else {
                            let newReaction = new Reaction( {
                                type: req.body.type.toLowerCase(),
                                blog: blog_id,
                                username: username.toLowerCase(),
                                timestamp: Date.now()
                            } );
                            // NO REACTIONS YET, ADD NEW
                            if( ! reaction ) {                                
                                newReaction.save( (error,result) => {
                                    if( error ) {
                                        logger.error( error );
                                        return res.status(500).json( {
                                            error: true,
                                            errors: [ {
                                                msg: `Could not add reaction`
                                            } ]
                                        } );
                                    } else {
                                        return res.json( {
                                            error: false,
                                            result, result,
                                            msg: `Reaction successfully added`
                                         } );
                                    }
                                });
                            }
                            // WITH EXISTING REACTION, UPDATE
                            else {
                                reaction.type = newReaction.type;
                                reaction.timestamp = newReaction.timestamp;
                                
                                reaction.save( (error,result) => {
                                    if( error ) {
                                        logger.error( error );
                                        return res.status(500).json( {
                                            error: true,
                                            errors: [ {
                                                msg: `Could not update reaction`
                                            } ]
                                        } );
                                    } else {
                                        return res.json( {
                                            error: false,
                                            result, result,
                                            msg: `Reaction successfully updated`
                                         } );
                                    }
                                });
                            }
                        }
                    } );
                }
            }
        } );
    }
} );



module.exports = router;