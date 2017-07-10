Package.describe({
    name: 'voice-config-ui',
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
    api.use('templating', 'client');
    api.addFiles(
        'voice_configure.html',
        'client'
    );
    api.mainModule('voice-config-ui.js', 'client');
});

// Package.onTest(function (api) {
//     api.use('ecmascript');
//     api.use('tinytest');
//     api.use('voice-config-ui');
//     api.mainModule('voice-config-ui-tests.js');
// });
