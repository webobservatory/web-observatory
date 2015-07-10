var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var LicenseSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    URL: String,
});

module.exports = mongoose.model("License", LicenseSchema);
