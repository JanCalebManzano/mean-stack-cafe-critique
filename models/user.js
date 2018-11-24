const mongoose = require( `mongoose` );
mongoose.Promise = global.Promise;
const Schema = mongoose.Schema;
const bcrypt = require( `bcrypt-nodejs` );

const userSchema = new Schema( {
    username: { type: String, unique: true, lowercase: true, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, unique: true, lowercase: true, required: true },
    userType: { type: String, lowercase: true, required: true }
} );

userSchema.pre( `save`, function(next) {
    if( ! this.isModified(`password`) ) {
        return next();
    } else {
        bcrypt.hash( this.password, null, null, (error, hash) => {
            if(error) {
                return next( error );
            } else {
                this.password = hash;
                next();
            }
        } );
    }
} );

userSchema.methods.comparePassword = function(password) {
    return bcrypt.compareSync( password, this.password );
};

userSchema.methods.compareUserType = function(userType) {
    return ( userType == this.userType );
};

userSchema.methods.getUserTypes = () => {
    return [
        `blogger`,
        `restaurateur`,
        `user`
    ];
};



module.exports = mongoose.model( `User`, userSchema );