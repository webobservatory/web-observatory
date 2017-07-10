Package.describe({
    name: 'voice-oauth',
    version: '0.0.1',
    // Brief, one-line summary of the package.
    summary: '',
    // URL to the Git repository containing the source code for this package.
    git: '',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.4.2.1');
    api.use('ecmascript');
    api.use('oauth2', ['client', 'server']);
    api.use('oauth', ['client', 'server']);
    api.use('http', ['server']);
    api.use(['underscore', 'service-configuration'], ['client', 'server']);
    // api.use('random', 'client');
    api.mainModule('voice_client.js', 'client');
    api.mainModule('voice_server.js', 'server');
    api.export("Voice");
});

// Package.onTest(function(api) {
//   api.use('ecmascript');
//   api.use('tinytest');
//   api.use('voice-oauth');
//   api.mainModule('voice-oauth-tests.js');
// });
