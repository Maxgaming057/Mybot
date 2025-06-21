const Utils = require('../modules/utils');
const Embed = Utils.Embed;
const { lang, config } = Utils.variables;

module.exports = (bot, channel) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 ) {
        if (!channel.guild || !config.Logs.Enabled.includes("ChannelPinsUpdated")) return;

        const logs = Utils.findChannel(config.Logs.Channels.ChannelPinsUpdated, channel.guild);

        logs.send(Embed({
            title: lang.LogSystem.ChannelPinsUpdated.Title,
            fields: [
                {
                    name: lang.LogSystem.ChannelPinsUpdated.Fields[0],
                    value: `<#${channel.id}>`
                }
            ],
            timestamp: Date.now()
        }))
    }
}
// https://directleaks.net