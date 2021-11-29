'use strict';
global.include = require('app-root-path').require;

const settings = include('settings.json');
const credentials = include('credentials.json');
const messageHandler = include(`${settings.modulesDir}/messageHandler.js`);
const commandHandler = include(`${settings.modulesDir}/commandHandler.js`);
const dialogHandler = include(`${settings.modulesDir}/dialogHandler.js`);
const saver = include(`${settings.modulesDir}/saver.js`);

const fs = require('fs');
const fetch = require('node-fetch');
var moment = require('moment');
moment().format();
const discord = require('discord.js');
const bot = new discord.Client({
    retryLimit: Infinity,
    partials: [
        "USER",
        "CHANNEL",
        "GUILD_MEMBER",
        "MESSAGE",
        "REACTION"
    ],
    intents: [
        discord.Intents.FLAGS.GUILDS,
        discord.Intents.FLAGS.GUILD_MEMBERS,
        discord.Intents.FLAGS.GUILD_WEBHOOKS,
        discord.Intents.FLAGS.GUILD_MESSAGES,
        discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        discord.Intents.FLAGS.DIRECT_MESSAGES,
        discord.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
    ]
});

var game = include(`game.json`);
game.messageHandler = messageHandler;

bot.commands = new discord.Collection();
bot.configs = new discord.Collection();
function loadCommands() {
    const commandsDir = `./${settings.commandsDir}/`;
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

function updateStatus() {
    var numPlayersOnline = game.players_alive.reduce(function (total, player) {
        return total + (player.online ? 1 : 0);
    }, 0);
    var onlineString = " - " + numPlayersOnline + " player" + (numPlayersOnline !== 1 ? "s" : "") + " online";

    if (settings.debug)
        bot.user.setPresence({ status: "dnd", activities: [{ name: settings.debugModeActivity.string + onlineString, type: settings.debugModeActivity.type }] });
    else {
        bot.user.setStatus("online");
        if (game.inProgress && !game.canJoin)
            bot.user.setPresence({ status: "online", activities: [{ name: settings.gameInProgressActivity.string + onlineString, type: settings.gameInProgressActivity.type, url: settings.gameInProgressActivity.url }] });
        else
            bot.user.setPresence({ status: "online", activities: [{ name: settings.onlineActivity.string, type: settings.onlineActivity.type }] });
    }
}

async function checkVersion() {
    const masterPackage = await fetch('https://raw.githubusercontent.com/MolSnoo/Alter-Ego/master/package.json').then(response => response.json()).catch();
    const localPackage = include('package.json');
    if (masterPackage.version !== localPackage.version && !localPackage.version.endsWith("d"))
        game.commandChannel.send(`This version of Alter Ego is out of date. Please download the latest version from https://github.com/MolSnoo/Alter-Ego at your earliest convenience.`);
}

bot.on('ready', async () => {
    if (bot.guilds.cache.size === 1) {
        messageHandler.clientID = bot.user.id;
        game.guild = bot.guilds.cache.first();
        game.commandChannel = game.guild.channels.cache.find(channel => channel.id === settings.commandChannel);
        game.logChannel = game.guild.channels.cache.find(channel => channel.id === settings.logChannel);
        console.log(`${bot.user.username} is online on 1 server.`);
        loadCommands();
        updateStatus();
        checkVersion();
    }
    else {
        console.log("Error: Bot must be on one and only one server.");
        return process.exit(2);
    }

    // Save data periodically.
    setInterval(() => {
        if (game.inProgress && !game.editMode) saver.saveGame();
    }, settings.autoSaveInterval * 1000);

    // Send messages in message queue periodically.
    setInterval(() => {
        game.messageHandler.sendQueuedMessages();
    }, settings.messageQueueInterval * 1000);

    // Run online players check periodically.
    setInterval(() => {
        updateStatus();
    }, settings.onlinePlayersStatusInterval * 1000);

    // Check for any events that are supposed to trigger at this time of day.
    setInterval(() => {
        if (game.inProgress) {
            const now = moment();
            for (let i = 0; i < game.events.length; i++) {
                if (!game.events[i].ongoing) {
                    for (let j = 0; j < game.events[i].triggerTimes.length; j++) {
                        const time = game.events[i].triggerTimes[j];
                        if (now.hour() === time.hour() && now.minute() === time.minute()) {
                            game.events[i].trigger(bot, game, true);
                            break;
                        }
                    }
                }
            }
        }
    }, 60000);
});

bot.on('messageCreate', async message => {
    // Prevent bot from responding to its own messages.
    if (message.author === bot.user) return;
    if (settings.debug && message.channel.type === 'DM') console.log(message.author.username + ': "' + message.content + '"');

    // If the message begins with the command prefix, attempt to run a command.
    // If the command is run successfully, the message will be deleted.
    if (message.content.startsWith(settings.commandPrefix)) {
        const command = message.content.substring(settings.commandPrefix.length);
        var isCommand = await commandHandler.execute(command, bot, game, message);
    }
    if (message && !isCommand && game.inProgress && (settings.roomCategories.includes(message.channel.parentId) || message.channel.parentId === settings.whisperCategory || message.channel.id === settings.announcementChannel)) {
        await dialogHandler.execute(bot, game, message, true);
    }
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

bot.login(credentials.discord.token);
