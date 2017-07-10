/**
 * Created by xgfd on 10/07/2017.
 */
Voice = {};

OAuth.registerService('innovvoice', 2, null, function (query) {

    var accessToken = getAccessToken(query);
    var profile = getIdentity(accessToken);
    console.log("voice profile:", profile);
    var primaryEmail = _.findWhere(emails, {primary: true});

    return {
        serviceData: {
            id: profile.id,
            accessToken: OAuth.sealSecret(accessToken),
            email: profile.email || (primaryEmail && primaryEmail.email) || '',
            username: profile.login
        },
        options: {profile: {name: profile.name}}
    };
});

var getAccessToken = function (query) {
    var config = ServiceConfiguration.configurations.findOne({service: 'innovvoice'});
    if (!config)
        throw new ServiceConfiguration.ConfigError();

    var response;
    try {
        response = HTTP.post(
            "https://www.innovvoice.com/api/sso/token", {
                headers: {
                    Accept: 'application/json',
                    // "User-Agent": userAgent
                },
                params: {
                    code: query.code,
                    client_id: config.clientId,
                    client_secret: OAuth.openSecret(config.secret)
                    // redirect_uri: OAuth._redirectUri('innovvoice', config),
                    // state: query.state
                }
            });
    } catch (err) {
        throw _.extend(new Error("Failed to complete OAuth handshake with Voice. " + err.message),
            {response: err.response});
    }
    if (response.data.error) { // if the http response was a json object with an error attribute
        throw new Error("Failed to complete OAuth handshake with innovvoice. " + response.data.error);
    } else {
        return response.data.access_token;
    }
};

var getIdentity = function (accessToken) {
    try {
        return HTTP.get(
            "https://www.innovvoice.com/api/sso/userInfo", {
                headers: {"User-Agent": userAgent}, // http://developer.innovvoice.com/v3/#user-agent-required
                params: {access_token: accessToken}
            }).data;
    } catch (err) {
        throw _.extend(new Error("Failed to fetch identity from Voice. " + err.message),
            {response: err.response});
    }
};

Voice.retrieveCredential = function (credentialToken, credentialSecret) {
    return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
