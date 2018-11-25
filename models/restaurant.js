const mongoose = require( `mongoose` );
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;

const restaurantSchema = new Schema( {
    name: { type: String, minlength: 5, maxlength: 50, required: true },
    description: { type: String, maxlength: 255, required: true },
    location: { type: String, maxlength: 255, required: true },
    restaurateur: { type: String, lowercase: true, minlength: 8, maxlength: 15, required: true },
    coverImage: { type: String, required: true },
    isActive: { type: Boolean, required: true }
} );



module.exports = mongoose.model( `Restaurant`, restaurantSchema );