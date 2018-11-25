const Comment = require( `../models/comment` );
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
                    Comment.find( { blog:ObjectID(blog_id) }, (error, comments) => {
                        if( error ) {
                            logger.error( error );
                            return res.status(500).json( {
                                error: true,
                                errors: [ error ]
                            } );
                        } else {
                            if( ! comments || comments.length === 0 ) {
                                return res.status(404).json( {
                                    error: true,
                                    errors: [ {
                                        msg: `There are no comments yet`
                                    } ]
                                } );
                            } else {
                                return res.status(200).json( {
                                    error: false,
                                    data: comments,
                                    msg: `Comments successfully fetched`
                                } );
                            }
                        }
                    } );
                }
            }
        } );
    }
} );

router.get( `/:comment_id`, (req, res) => {
    const logger = req.logger || null;
    const blog_id = req.params.blog_id;
    const comment_id = req.params.comment_id;

    if( ! ObjectID.isValid( blog_id ) ) {
        return res.status(400).json( {
            error: true,
            errors: [ {
                msg: `ID is invalid`
            } ]
        } );
    } else {
        if( ! ObjectID.isValid( comment_id ) ) {
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
                        Comment.findOne( { _id:ObjectID(comment_id), blog:ObjectID(blog_id) }, (error, comment) => {
                            if( error ) {
                                logger.error( error );
                                return res.status(500).json( {
                                    error: true,
                                    errors: [ error ]
                                } );
                            } else {
                                if( ! comment ) {
                                    return res.status(404).json( {
                                        error: true,
                                        errors: [ {
                                            msg: `ID "${blog_id}" is not associated to any comment`
                                        } ]
                                    } );
                                } else {
                                    return res.status(200).json( {
                                        error: false,
                                        data: comment,
                                        msg: `Comment fetched successfully`
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

router.post( `/`, [
    body(`content`).trim().escape(),
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

    if( ! ObjectID.isValid( blog_id ) ) {
        return res.status(400).json( {
            error: true,
            errors: [ {
                msg: `ID is invalid`
            } ]
        } );
    } 

    req.checkBody( `content`, `You must provide a content`).notEmpty();
    
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
                    var start = Date.now();
                    let comment = new Comment( {
                        content: req.body.content,
                        blog: blog_id,
                        username: req.body.username,
                        timestamp: start
                    } );
                    comment.save( (error,result) => {
                        if( error ) {
                            logger.error( error );
                            return res.status(500).json( {
                                error: true,
                                errors: [ {
                                  msg: `Could not create comment`
                                } ]
                            } );
                          } else {
                              return res.json( {
                                  error: false,
                                  result, result,
                                  msg: `Comment created`
                            } );
                         }
                    });
                }
            }
        } );
    }
} );

// DELETE COMMENT
router.delete( `/:comment_id`, (req, res) => {
    const logger = req.logger || null;
    const blog_id = req.params.blog_id;
    const comment_id = req.params.comment_id;

    if( ! ObjectID.isValid( blog_id ) ) {
        return res.status(400).json( {
            error: true,
            errors: [ {
                msg: `ID is invalid`
            } ]
        } );
    } else {
        if( ! ObjectID.isValid( comment_id ) ) {
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
                        Comment.findOne( { _id:ObjectID(comment_id), blog:ObjectID(blog_id) }, (error, comment) => {
                            if( error ) {
                                logger.error( error );
                                return res.status(500).json( {
                                    error: true,
                                    errors: [ error ]
                                } );
                            } else {
                                if( ! comment ) {
                                    return res.status(404).json( {
                                        error: true,
                                        errors: [ {
                                            msg: `ID "${blog_id}" is not associated to any comment`
                                        } ]
                                    } );
                                } else {
                                    comment.remove( (error) => {
                                        if( error ) {
                                            logger.error( error );
                                            return res.status(500).json( {
                                                error: true,
                                                errors: [ {
                                                    msg: `Could not delete comment`
                                                } ]
                                            } );
                                        } else {
                                            return res.status(200).json( {
                                                error: false,
                                                msg: `Comment deleted successfully`
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
    }
} );


module.exports = router;