const Discord = require("discord.js");
const Utils = require("../../modules/utils.js")
const Embed = Utils.Embed;
const {config, lang, embeds} = Utils.variables;

module.exports = {
  name: 'ip',
  run: async (bot, message, args) => {
    message.channel.send(Utils.setupEmbed({
      configPath: embeds.Embeds.IP
    }));
  },
  description: "View the Minecraft server's IP",
  usage: 'ip',
  aliases: [
    'serverip'
  ]
}

// https://directleaks.net