var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ClientSchema = Schema({
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
    owner: String//owner's email
});

module.exports = mongoose.model("Client", ClientSchema);
