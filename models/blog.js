const mongoose = require( `mongoose` );
const ObjectID = require( `mongodb` ).ObjectID;
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const blogSchema = new Schema( {
    title: { type: String, maxlength: 255, required: true },
    content: { type: String, required: true },
    restaurant: { type: ObjectID, required: true },                                               // restaurant._id
    blogger: { type: String, lowercase: true, minlength: 8, maxlength: 15, required: true },    // user.username | user.userType="blogger"
    timestamp: { type: Date, required: true },
    coverImage: { type: String, required: true }
} );



module.exports = mongoose.model( `Blog`, blogSchema );