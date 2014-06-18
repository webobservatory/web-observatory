var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AccessTokenSchema = new Schema({
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
    created: {
        type: Date,
        default: Date.now
    }
});

module.exports=mongoose.model('AccessToken', AccessTokenSchema);
