'use strict';

const settings = require('./settings.json');
const credentials = require('./credentials.json');
const discord = require('discord.js');
const bot = new discord.Client();
const fs = require('fs');

bot.commands = new discord.Collection();
bot.configs = new discord.Collection();
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
            bot.configs.set(props.config.name, props.config);
        });
    });

    console.log(`Loaded all commands.`);
}

bot.on('ready', async () => {
    if (bot.guilds.size === 1) {
        console.log(`${bot.user.username} is online on 1 server.`);
        loadCommands();
        if (settings.testing) {
            const tests = require("./Tests/run_tests.js");
            await tests.runTests(bot);
        }
        if (settings.debug) {
            bot.user.setActivity("NWP Debugger.exe");
            bot.user.setStatus("dnd");
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

    let game = require('./game.json');
    game.guild = bot.guilds.first();
    game.logChannel = game.guild.channels.find(channel => channel.id === settings.logChannel);
    /*
    if ((game.hiddenPlayers.length > 0 || game.hearingPlayers.length > 0 || game.concealedPlayer.member !== null || game.playersDeafened)
        && !(message.content.startsWith(settings.commandPrefix) && message.content.charAt(1) !== '.') && message.channel.type !== 'dm') {
        const special = require('./House-Data/special.js');
        special.determineBehavior(bot, game, message);
    }
    */
    if (message.content.startsWith(settings.commandPrefix)) {
        const command = message.content.substring(settings.commandPrefix.length);
        let commandHandler = require('./commandHandler.js');
        commandHandler.execute(command, bot, game, message);
    }   
});

bot.login(credentials.discord.token);
