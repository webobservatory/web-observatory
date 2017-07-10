/**
 * Created by xgfd on 10/07/2017.
 */
import "./notice.js";
Accounts.oauth.registerService('innovvoice');

if (Meteor.isClient) {
    const loginWithVoice = function (options, callback) {
        // support a callback without options
        if (!callback && typeof options === "function") {
            callback = options;
            options = null;
        }

        var credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback);
        Voice.requestCredential(options, credentialRequestCompleteCallback);
    };
    Accounts.registerClientLoginFunction('innovvoice', loginWithVoice);
    Meteor.loginWithInnovvoice = function () {
        return Accounts.applyLoginFunction('innovvoice', arguments);
    };
} else {
    Accounts.addAutopublishFields({
        // publish all fields including access token, which can legitimately
        // be used from the client (if transmitted over ssl or on
        // localhost). https://developers.innovvoice.com/docs/concepts/login/access-tokens-and-types/,
        // "Sharing of Access Tokens"
        forLoggedInUser: ['services.innovvoice'],
        forOtherUsers: [
            'services.innovvoice.id'
        ]
    });
}
