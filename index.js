if (process.platform !== "win32") require("child_process").exec("npm install n && n lts");
if (+process.version.slice(1).split('.')[0] < 12) {
  console.log("\u001b[31mCorebot requires Node JS version 12 or higher. Please go to https://nodejs.org/en/ then download and install the LTS version.\033[0m")
  process.exit()
}
(async () => {
  require('console-stamp')(console, { label: false, pattern: 'HH:MM:ss', colors: { stamp: 'gray' } })
  const Utils = require('./modules/utils.js');
  const variables = Utils.variables;

  let config;
  let lang;
  let commands;
  let embeds;
  let TLDs;

  try {
    config = await Utils.yml('./config.yml');
    lang = await Utils.yml('./lang.yml');
    commands = await Utils.yml('./commands.yml')
    embeds = await Utils.yml('./embeds.yml')
    TLDs = await Utils.yml('./TLDs.yml');
  } catch (e) {
    if (['YAMLSemanticError', 'YAMLSyntaxError'].includes(e.name)) console.log(Utils.errorPrefix + "An error has occured while loading the config or lang file. Bot shutting down..." + Utils.color.Reset)
    else console.log(e);

    return process.exit();
  }

  variables.set('config', config);
  variables.set('lang', lang);
  variables.set('commands', commands)
  variables.set('embeds', embeds)
  variables.set('TLDs', TLDs);
  variables.set('tempChannels', new Map())

  // DATABASE
  const Database = await require('./modules/database.js').setup(config);

  // Set variables
  variables.set('usersInVoiceChannel', []);
  variables.set('errors', []);
  variables.set('db', Database)

  const Discord = require("discord.js");
  const fs = require('fs');

  const Embed = require('./modules/embed.js');
  const bot = new Discord.Client({ autoReconnect: true });

  variables.set('bot', bot);

  // COMMAND HANDLER
  const CommandHandler = require('./modules/handlers/CommandHandler').init();

  // EVENT HANDLER
  const EventHandler = require('./modules/handlers/EventHandler').init(bot);

  const error = require('./modules/error');
  process.on('uncaughtException', (err) => {
    return;
  })

  const { inspect } = require("util");
  process.on('unhandledRejection', async function (reason, promise) {
    const promiseText = inspect(promise) || "";
    try {
      error(reason.toString(), promiseText, !!promiseText ? promiseText.split("\n")[2].split(" ")[8].split(/\/|\\/).pop().replace(/\)|\(/g, '') : "Unknown");
    } catch (err) {
      error(reason.toString(), "Unknown", promiseText);
    }
  })

  Utils.yml('./config.yml')
    .then(config => {
      bot.login(config.Token).catch(error => {
        console.log(Utils.errorPrefix + "Your bot token is incorrect! Shutting down...")
        process.exit()
      })
      variables.set('bot', bot);
    })


  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', (input) => {
    if (input == 'stop') {
      console.log('Bot shutting down...');
      process.exit();
    }
  });

  if (Utils.getStartupParameters().includes("clear-errors")) {
    if (fs.existsSync("./errors.txt")) {
      fs.unlink("./errors.txt", (err) => {
        if (err) console.log(err);
        else {
          console.log(Utils.infoPrefix + 'Cleared errors.txt');
        }
      })
    }
  }

  if (Utils.getStartupParameters().includes("clear-backups")) {
    if (fs.existsSync("./backup")) {
      const backups = fs.readdirSync("./backup");

      backups.forEach(backup => {
        fs.rmdirSync(`./backup/${backup}`, {
          recursive: true
        });
      });

      console.log(Utils.infoPrefix + 'Cleared backups');
    }
  }
})();
// https://directleaks.net