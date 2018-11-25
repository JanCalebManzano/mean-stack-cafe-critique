const mongoose = require( `mongoose` );
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const reactionSchema = new Schema( {
    type: { type: String, required: true }, // "yum", "yuck"
    blog: { type: String, required: true }, // blogID
    username: { type: String, lowercase: true, minlength: 8, maxlength: 15, required: true },
    timestamp: { type: Date, required: true }
} );



module.exports = mongoose.model( `Reaction`, reactionSchema );