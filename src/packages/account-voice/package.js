Package.describe({
    name: 'account-voice',
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
    // api.use(['underscore', 'random']);
    api.use('accounts-base');

    api.use('accounts-oauth', ['client', 'server']);
    api.use('voice-oauth');

    api.use(
        ['accounts-ui', 'voice-config-ui'],
        ['client', 'server'],
        {weak: true}
    );
    api.mainModule('voice.js');
});

