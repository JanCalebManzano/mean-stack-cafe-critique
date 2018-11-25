const mongoose = require( `mongoose` );
const ObjectID = require( `mongodb` ).ObjectID;
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const ratingSchema = new Schema( {
    stars: { type: Number, min: 0, max: 5, required: true },
    restaurant: { type: ObjectID, required: true },                                               // restaurant._id
    blogger: { type: String, lowercase: true, minlength: 8, maxlength: 15, required: true },    // user.username | user.userType="blogger"
    timestamp: { type: Date, required: true }
} );



module.exports = mongoose.model( `Rating`, ratingSchema );