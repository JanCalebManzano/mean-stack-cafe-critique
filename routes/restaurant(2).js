const Restaurant = require( `../models/restaurant` );
const User = require( `../models/user` );
const ObjectID = require( `mongodb` ).ObjectID;
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

const express = require( `express` );
const router = express.Router();



// Routes
router.get( `/`, (req, res) => {
    const logger = req.logger || null;

    Restaurant.find( { isActive: true }, (error, restaurants) => {
        if( error ) {
            logger.error( error );
            return res.status(500).json( {
                error: true,
                errors: [ error ]
            } );
        } else {
            if( ! restaurants || restaurants.length === 0 ) {
                return res.status(404).json( {
                    error: true,
                    errors: [ {
                        msg: `There are no restaurants yet`
                    } ]
                } );
            } else {
                return res.status(200).json( {
                    error: false,
                    data: restaurants
                } );
            }
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
        Restaurant.findOne( { _id:ObjectID(_id), isActive:true }, (error, restaurant) => {
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
                            msg: `ID "${_id}" is not associated to any restaurant`
                        } ]
                    } );
                } else {
                    return res.status(200).json( {
                        error: false,
                        data: restaurant
                    } );
                }
            }
        } );
    }

} );

// GET BY NAME
router.get( `/name=:name`, (req, res) => {
    const logger = req.logger || null;
    let name = req.params.name;
 
    Restaurant.find( { name:name, isActive:true }, (error, restaurants) => {
        if( error ) {
            logger.error( error );
            return res.status(500).json( {
                error: true,
                errors: [ error ]
            } );
        } else {
            if( ! restaurants || restaurants.length === 0 ) {
                return res.status(404).json( {
                    error: true,
                    errors: [ {
                        msg: `"${name}" is not associated to any restaurant`
                    } ]
                } );
            } else {
                return res.status(200).json( {
                    error: false,
                    data: restaurants
                } );
            }
        }
    } );

} );

// GET BY RESTAURATEUR
router.get( `/restaurateur=:restaurateur`, (req, res) => {
    const logger = req.logger || null;
    let restaurateur = req.params.restaurateur;

    User.findOne( { username:restaurateur, userType:`restaurateur` }, ( error, user ) => {
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
                        msg: `Username "@${restaurateur}" is not associated to any restaurateur account`
                    } ]
                } );
            } else {
                Restaurant.find( { restaurateur:restaurateur, isActive:true }, (error, restaurants) => {
                    if( error ) {
                        logger.error( error );
                        return res.status(500).json( {
                            error: true,
                            errors: [ error ]
                        } );
                    } else {
                        if( ! restaurants || restaurants.length === 0 ) {
                            return res.status(404).json( {
                                error: true,
                                errors: [ {
                                    msg: `Restaurateur "@${restaurateur}" is not associated to any restaurant`
                                } ]
                            } );
                        } else {
                            return res.status(200).json( {
                                error: false,
                                data: restaurants
                            } );
                        }
                    }
                } );
            }
        }
    } );
} );

// EDIT
router.put( `/_id=:_id`, [
    body(`name`).trim().escape(),
    body(`description`).trim().escape(),
    body(`location`).trim().escape(),
    body(`restaurateur`).trim().escape(),
    body(`isActive`).isBoolean(),
    body(`restaurateur`).custom( (value) => {
        return User.findOne( { username:value, userType:`restaurateur` } ).then( (user) => {
            if( ! user ) {
                throw new Error( `Username "@${value}" is not associated to any restaurateur account` );
            }
        } );
    } ),
    sanitizeBody(`notifyOnReply`).toBoolean()
], (req, res) => {
    const logger = req.logger || null;
    let _id = req.params._id;

    if( ! ObjectID.isValid(_id) ) {
        return res.status(400).json( {
            error: true,
            errors: [ {
                msg: `ID is invalid`
            } ]
        } );
    }

    req.checkBody( `name`, `You must provide a name`).notEmpty();
    req.checkBody( `name`, `Name must have numbers and letters only`).matches(/^[a-zA-Z\d ]+$/);;
    req.checkBody( `name`, `Name must have at least 5 characters but no more than 50`).isLength( {min:5, max:50} );

    req.checkBody( `description`, `You must provide a description`).notEmpty();
    req.checkBody( `description`, `Description must have no more than 255 characters`).isLength( {max:255} );

    req.checkBody( `location`, `You must provide a location`).notEmpty();
    req.checkBody( `location`, `Location must have no more than 255 characters`).isLength( {max:255} );

    req.checkBody( `restaurateur`, `You must provide a restaurateur`).notEmpty();
    req.checkBody( `restaurateur`, `Restaurateur must have numbers and letters only` ).isAlphanumeric();
    req.checkBody( `restaurateur`, `Name must have at least 8 characters but no more than 15`).isLength( {min:8, max:15} );

    req.checkBody( `isActive`, `You must provide active field`).notEmpty();

    let errors = req.validationErrors();
    if( errors ) {
        return res.status(400).json( {
            error: true,
            errors: errors
        } );
    } else {
        let restaurant = {
            name: capitalizeEachWord( req.body.name ),
            description: req.body.description,
            location: req.body.location,
            restaurateur: req.body.restaurateur.toLowerCase(),
            isActive: req.body.isActive
        };
        Restaurant.updateOne( { _id:ObjectID(_id) }, restaurant, (error, results) => {
            if( error ) {
                logger.error( error );
                return res.status(500).json( {
                    error: true,
                    errors: [ error ]
                } );
            } else {
                return res.status(200).json( {
                    error: false,
                    data: restaurant,
                    msg: `Restaurant was successfully updated`
                } );
            }
        } );
    }
} );

router.post(`/restaurant`, [
    body(`name`).trim().escape(),
    body(`description`).trim().escape(),
    body(`location`).trim().escape(),
    body(`restaurateur`).trim().escape(),
    body(`isActive`).isBoolean(),
    body(`restaurateur`).trim().escape(),
    sanitizeBody(`notifyOnReply`).toBoolean()
], (req, res) => {

    const logger = req.logger || null;

    req.checkBody( `name`, `You must provide a name`).notEmpty();
    req.checkBody( `name`, `Name must have numbers and letters only`).matches(/^[a-zA-Z\d ]+$/);;
    req.checkBody( `name`, `Name must have at least 5 characters but no more than 50`).isLength( {min:5, max:50} );

    req.checkBody( `description`, `You must provide a description`).notEmpty();
    req.checkBody( `description`, `Description must have no more than 255 characters`).isLength( {max:255} );

    req.checkBody( `location`, `You must provide a location`).notEmpty();
    req.checkBody( `location`, `Location must have no more than 255 characters`).isLength( {max:255} );

    req.checkBody( `restaurateur`, `You must provide a restaurateur`).notEmpty();
    req.checkBody( `restaurateur`, `Restaurateur must have numbers and letters only` ).isAlphanumeric();
    req.checkBody( `restaurateur`, `Name must have at least 8 characters but no more than 15`).isLength( {min:8, max:15} );

    req.checkBody( `isActive`, `You must provide active field`).notEmpty();

    let errors = req.validationErrors();
    if( errors ) {
        return res.status(400).json( {
            error: true,
            errors: errors
        } );
    } else {
        upload(req, res, (err) => {
            if(err){
              return res.status(400).json( {
                error: true,
                errors: error
            } );
            } else {
              if(req.file == undefined){
                return res.status(400).json( {
                  error: true,
                  errors: [ {
                      msg: `No file Selected`
                  } ]
              } );
              } else {
                let restaurant = new Restaurant({
                  name: capitalizeEachWord( req.body.name ),
                  description: req.body.description,
                  location: req.body.location,
                  restaurateur: req.body.restaurateur.toLowerCase(),
                  coverImage: req.file.filename,
                  isActive:true
                });
                restaurant.save( (error,result) => {
                  if( error ) {
                      if( error.code === 11000 ) {
                          return res.status(400).json( {
                              error: true,
                              errors: [ {
                                  msg: `Restaurant already exists`
                              } ]
                          } );
                      } else {
                          logger.error( error );
                          return res.status(500).json( {
                              error: true,
                              errors: [ {
                                  msg: `Could not create restaurant`
                              } ]
                          } );
                      }
                  } else {
                      return res.json( {
                          error: false,
                          result, result,
                          msg: `restaurant created`
                      } );
                  }
              });
              }
            }
          });
}
});

// MY FUNCTIONS
const capitalizeEachWord = ( text ) => {
    return text.toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');
};

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function( req, file, cb ){
        cb( null,file.fieldname + '-' + Date.now() + path.extname(file.originalname) );
    }
});
  
const upload = multer({
    storage: storage,
    limits:{ fileSize: 1000000 },
    fileFilter: function( req, file, cb ){
        checkFileType(file, cb);
    }
}).single( 'myImage' );
  
function checkFileType( file, cb ){
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test( path.extname( file.originalname ).toLowerCase() );
    const mimetype = filetypes.test( file.mimetype );
    if( mimetype && extname ){
      return cb( null,true );
    } else {
      cb( 'Error: Images Only!' );
    }
  }

module.exports = router;