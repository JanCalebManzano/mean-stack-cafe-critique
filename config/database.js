const crypto = require( `crypto` ).randomBytes(256).toString(`hex`);

module.exports = {
    url: `mongodb://localhost:27017/db_cafe_critique`,
    secret: crypto,
    db: `db_cafe_critique`
};