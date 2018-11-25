const mongoose = require( `mongoose` );
const ObjectID = require( `mongodb` ).ObjectID;
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const commentSchema = new Schema( {
    content: { type: String, required: true },
    blog: { type: ObjectID, required: true },                                                     // blog._id
    username: { type: String, lowercase: true, minlength: 8, maxlength: 15, required: true },   // user.username | user.userType="blogger" OR "restaurateur"
    timestamp: { type: Date, required: true }
} );



module.exports = mongoose.model( `Comment`, commentSchema );