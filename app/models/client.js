var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ClientSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    clientSecret: {
        type: String,
        required: true
    },
    redirectURI: String,
    owner: String,//owner's email
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Client", ClientSchema);
