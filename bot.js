'use strict';

const settings = require('./settings.json');
const credentials = require('./credentials.json');
const discord = require('discord.js');
const bot = new discord.Client();
const fs = require('fs');

class Command {
    constructor(run, attr) {
        this.run = run;
        this.attr = attr;
    }
}

bot.commands = new discord.Collection();
bot.aliases = new discord.Collection();
function loadCommands() {
    const commandsDir = './Modules/';
    fs.readdir(commandsDir, (err, files) => {
        if (err) console.log(err);

        let commandFiles = files.filter(filename => filename.split('.').pop() === 'js');
        if (commandFiles.length <= 0) {
            console.log("Couldn't find commands.");
            return process.exit(1);
        }

        commandFiles.forEach((file, i) => {
            delete require.cache[require.resolve(`${commandsDir}${file}`)];
            let props = require(`${commandsDir}${file}`);
            bot.commands.set(props.config.name, props);
            props.config.aliases.forEach(alias => {
                bot.aliases.set(alias, props.config.name);
            });
        });
    });

    console.log(`Loaded all commands.`);
}

bot.on('ready', () => {
    if (bot.guilds.size === 1) {
        console.log(`${bot.user.username} is online on 1 server.`);
        loadCommands();
        if (settings.debug) {
            bot.user.setActivity("NWP Debugger.exe");
            bot.user.setStatus("dnd");
            const tests = require("./Tests/run_tests.js");
            tests.runTests();
        }
        else {
            bot.user.setActivity("Future Foundation HQ", { type: 'LISTENING' });
            bot.user.setStatus("online");
        }
    }
    else {
        console.log("Error: Bot must be on only one server.");
        return process.exit(2);
    }
});

bot.on('message', async message => {
    // Prevent bot from responding to its own messages.
    if (message.author === bot.user) return;
    if (settings.debug && message.channel.type === 'dm') console.log(message.author.username + ': "' + message.content + '"');

    let config = require('./config.json');

    if ((config.hiddenPlayers.length > 0 || config.hearingPlayers.length > 0 || config.concealedPlayer.member !== null || config.playersDeafened)
        && !(message.content.startsWith(settings.commandPrefix) && message.content.charAt(1) !== '.') && message.channel.type !== 'dm') {
        const special = require('./House-Data/special.js');
        special.determineBehavior(bot, config, message);
    }

    if (message.content.startsWith(settings.commandPrefix)) {
        const commandSplit = message.content.substring(1).split(" ");
        const args = commandSplit.slice(1);
        let commandFile = bot.commands.get(commandSplit[0]) || bot.commands.get(bot.aliases.get(commandSplit[0]));
        if (commandFile) commandFile.run(bot, config, message, args).then(() => { if (!settings.debug) message.delete().catch(); });
    }   
});

bot.login(credentials.discord.token);