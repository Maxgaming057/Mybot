const Utils = require('../modules/utils');
const { config, lang } = Utils.variables;

module.exports = async (bot, role) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0 ) {
        if (!Utils.variables.config.Logs.Enabled.includes("RoleCreated")) return;

        const logs = Utils.findChannel(Utils.variables.config.Logs.Channels.RoleCreated, role.guild);

        if (logs) logs.send(Utils.Embed({
            title: lang.LogSystem.RoleCreated.Title,
            fields: [
                {
                    name: lang.LogSystem.RoleCreated.Field,
                    value: `<@&${role.id}>`
                }
            ]
        }))
    }
}
// https://directleaks.net