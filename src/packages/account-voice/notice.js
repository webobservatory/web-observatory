/**
 * Created by xgfd on 10/07/2017.
 */
if (Package['accounts-ui']
    && !Package['service-configuration']
    && !Package.hasOwnProperty('voice-config-ui')) {
    console.warn(
        "Note: You're using accounts-ui and accounts-voice,\n" +
        "but didn't install the configuration UI for the Innovvoice\n" +
        "OAuth. You can install it with:\n" +
        "\n" +
        "    meteor add voice-config-ui" +
        "\n"
    );
}
