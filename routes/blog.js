const Blog = require( `../models/blog` );
const Restaurant = require( `../models/restaurant` );
const User = require( `../models/user` );
const ObjectID = require( `mongodb` ).ObjectID;
const { body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

const express = require( `express` );
const router = express.Router();
const commentRouter = require( `./comment` );
const reactionRouter = require( `./reaction` );



// SUBRESOURCE
router.use( `/:blog_id/comment`, commentRouter );
router.use( `/:blog_id/reaction`, reactionRouter );



// Routes
router.get( `/`, (req, res) => {
    const logger = req.logger || null;   

    Blog.find( {}, (error, blogs) => {
        if( error ) {
            logger.error( error );
            return res.status(500).json( {
                error: true,
                errors: [ error ]
            } );
        } else {
            if( ! blogs || blogs.length === 0 ) {
                return res.status(404).json( {
                    error: true,
                    errors: [ {
                        msg: `There are no blogs yet`
                    } ]
                } );
            } else {
                const result = [];
                blogs.forEach( (blog, index) => {                    
                    Restaurant.findOne( { _id:ObjectID(blog.restaurant), isActive:true }, (error, restaurant) => {
                        if( error ) {
                            logger.error( error );
                            return res.status(500).json( {
                                error: true,
                                errors: [ error ]
                            } );
                        } else {
                            if( restaurant ) {
                                result.push( blog );                                
                            }
                        }
                        
                        if( (index+1) == blogs.length ) {
                            return res.status(200).json( {
                                error: false,
                                data: result
                            } );
                        }
                    } );
                } );
            }
        }
    } );
} );

router.get( `/:blog_id`, (req, res) => {
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
                    return res.status(200).json( {
                        error: false,
                        data: blog,
                        msg: `Blog successfully fetched`
                    } );
                }
            }
        } );
    }

} );

router.get( `/restaurant_id=:restaurant_id`, (req, res) => {
    let restaurant_id = req.params.restaurant_id;
    const logger = req.logger || null;

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
                    Blog.find({ restaurant:ObjectID(restaurant_id) }, (error, blogs) => {
                        if( error ) {
                            logger.error( error );
                            return res.status(500).json( {
                                error: true,
                                errors: [ error ]
                            } );
                        } else {
                            if( ! blogs || blogs.length === 0 ) {
                                return res.status(404).json( {
                                    error: true,
                                    errors: [ {
                                        msg: `There are no blogs yet`
                                    } ]
                                } );
                            } else {
                                return res.status(200).json( {
                                    error: false,
                                    data: blogs
                                } );
                            }
                        }
                    } );
                }
            }
        } );
    }
} );

router.post( `/`, [
    body(`title`).trim().escape(),
    body(`content`).trim().escape(),
    body(`restaurant`).trim().escape(),
    body(`restaurant`).custom( (value) => {
        return Restaurant.findOne( { _id:ObjectID(value), isActive:true } ).then( (restaurant) => {
            if( ! restaurant ) {
                throw new Error( `ID "@${value}" is not associated to any restaurant` );
            }
        } );
    } ),
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

    if( ! ObjectID.isValid( req.body.restaurant ) ) {
        return res.status(400).json( {
            error: true,
            error: [ {
                msg: `ID is invalid`
            } ]
        } );
    }

    req.checkBody( `title`, `You must provide a title`).notEmpty();
    req.checkBody( `title`, `Title must have no more than 255 characters`).isLength( {max:255} );

    req.checkBody( `content`, `You must provide a content`).notEmpty();

    req.checkBody( `restaurant`, `You must provide a restaurant`).notEmpty();

    req.checkBody( `blogger`, `You must provide a blogger`).notEmpty();
    req.checkBody( `blogger`, `Username must have at least 8 characters but no more than 15` ).isLength( {min:8, max:15} );

    let errors = req.validationErrors();
    if( errors ) {
        return res.status(400).json( {
            error: true,
            error: errors
        } );
    } else {
        var start = Date.now();
        let blog = new Blog({
            title: capitalizeEachWord( req.body.title ),
            content: req.body.content,
            restaurant: req.body.restaurant,
            blogger: req.body.blogger,
            timestamp: start
        });
        blog.save( (error,result) => {
            if( error ) {
                logger.error( error );
                return res.status(500).json( {
                    error: true,
                    errors: [ {
                        msg: `Could not create blog`
                    } ]
                } );
                } else {
                    return res.json( {
                        error: false,
                        result, result,
                        msg: `Blog created`
                } );
                }
        });
    }
});

router.delete( `/:blog_id`, (req, res) => {
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
                    blog.remove( (error) => {
                        if( error ) {
                            logger.error( error );
                            return res.status(500).json( {
                                error: true,
                                errors: [ {
                                    msg: `Could not delete blog`
                                } ]
                            } );
                        } else {
                            return res.status(200).json( {
                                error: false,
                                errors: [ {
                                    msg: `Blog deleted successfully`
                                } ]
                            } );
                        }
                    } );
                }
            }
        } );
    }
} );

// MY FUNCTIONS
const capitalizeEachWord = ( text ) => {
    return text.toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');
};

module.exports = router;