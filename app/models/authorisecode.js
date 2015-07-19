var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AuthoriseCodeSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    clientId: {
        type: Schema.Types.ObjectId,
        ref: 'Client'
    },
    token: {
        type: String,
        unique: true,
        required: true
    },
    redirectURI: String,
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AuthoriseCode', AuthoriseCodeSchema);
