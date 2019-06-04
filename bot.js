'use strict';

const settings = require('./settings.json');
const credentials = require('./credentials.json');
const discord = require('discord.js');
const bot = new discord.Client();
const fs = require('fs');

bot.commands = new discord.Collection;
function loadCommands() {
    fs.readdir('./Commands/', (err, files) => {
        if (err) console.log(err);

        let commandFiles = files.filter(filename => filename.split('.').pop() === 'js');
        if (commandFiles.length <= 0) {
            console.log("Couldn't find commands.");
            return process.exit(1);
        }

        commandFiles.forEach((file, i) => {
            delete require.cache[require.resolve(`./Commands/${file}`)];
            let props = require(`./Commands/${file}`);
            bot.commands.set(props.help.name, props);
        });
    });

    console.log(`Loaded all commands.`);
}

bot.on('ready', () => {
    if (bot.guilds.size === 1) {
        console.log(`${bot.user.username} is online on 1 server.`);
        loadCommands();
    }
    else {
        console.log("Error: Bot must be on only one server.");
        return process.exit(2);
    }
});

bot.on('message', async message => {
    // Prevent bot from responding to its own messages.
    if (message.author === bot.user) return;

    let config = require('./config.json');

    if ((config.hiddenPlayers.length > 0 || config.concealedPlayer.member !== null || config.playersDeafened)
        && message.content.startsWith(settings.commandPrefix) && message.channel.type !== 'dm') {
        const special = require('./House-Data/special.js');
        special.determineBehavior(bot, config, message);
    }

    if (message.content.startsWith(settings.commandPrefix)) {
        const commandSplit = message.content.substring(1).split(" ");
        const args = commandSplit.slice(1);
        let commandFile = bot.commands.get(commandSplit[0]);
        if (commandFile) commandFile.run(bot, config, message, args).then(() => { message.delete().catch(); });
    }
        
});

bot.login(credentials.discord.token);