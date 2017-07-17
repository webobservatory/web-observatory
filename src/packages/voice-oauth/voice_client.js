/**
 * Created by xgfd on 10/07/2017.
 */
Voice = {};

// Request Voice credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Voice.requestCredential = function (options, credentialRequestCompleteCallback) {
    // support both (options, callback) and (callback).
    if (!credentialRequestCompleteCallback && typeof options === 'function') {
        credentialRequestCompleteCallback = options;
        options = {};
    }

    var config = ServiceConfiguration.configurations.findOne({service: 'innovvoice'});
    if (!config) {
        credentialRequestCompleteCallback && credentialRequestCompleteCallback(
            new ServiceConfiguration.ConfigError());
        return;
    }
    var credentialToken = Random.secret();

    var loginStyle = OAuth._loginStyle('innovvoice', config, options);

    var loginUrl =
        'https://www.innovvoice.com/api/sso/access' +
        '?client_id=' + config.clientId +
        "&response_type=code" +
        "&redirect_uri=" + OAuth._redirectUri('innovvoice', config);

    OAuth.launchLogin({
        loginService: "innovvoice",
        loginStyle: loginStyle,
        loginUrl: loginUrl,
        credentialRequestCompleteCallback: credentialRequestCompleteCallback,
        credentialToken: credentialToken
    });
};