'use strict';
global.include = require('app-root-path').require;

const settings = include('Configs/settings.json');
const constants = include('Configs/constants.json');
const credentials = include('Configs/credentials.json');
const serverconfig = include('Configs/serverconfig.json');
const serverManager = include(`${constants.modulesDir}/serverManager.js`);
const messageHandler = include(`${constants.modulesDir}/messageHandler.js`);
const commandHandler = include(`${constants.modulesDir}/commandHandler.js`);
const dialogHandler = include(`${constants.modulesDir}/dialogHandler.js`);
const saver = include(`${constants.modulesDir}/saver.js`);

const fs = require('fs');
const fetch = require('node-fetch');
var moment = require('moment');
moment().format();
const discord = require('discord.js');
const { ActivityType, ChannelType } = require('./node_modules/discord-api-types/v10');
const bot = new discord.Client({
    retryLimit: Infinity,
    partials: [
        discord.Partials.User,
        discord.Partials.Channel,
        discord.Partials.GuildMember,
        discord.Partials.Message,
        discord.Partials.Reaction
    ],
    intents: [
        discord.GatewayIntentBits.Guilds,
        discord.GatewayIntentBits.GuildMembers,
        discord.GatewayIntentBits.GuildWebhooks,
        discord.GatewayIntentBits.GuildPresences,
        discord.GatewayIntentBits.GuildMessages,
        discord.GatewayIntentBits.GuildMessageReactions,
        discord.GatewayIntentBits.MessageContent,
        discord.GatewayIntentBits.DirectMessages,
        discord.GatewayIntentBits.DirectMessageReactions
    ]
});

var game = include(`game.json`);
game.messageHandler = messageHandler;

bot.commands = new discord.Collection();
bot.configs = new discord.Collection();
function loadCommands() {
    const commandsDir = `./${constants.commandsDir}/`;
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

function getActivityType(type) {
    switch (type) {
        case "PLAYING":
            return ActivityType.Playing;
        case "STREAMING":
            return ActivityType.Streaming;
        case "LISTENING":
            return ActivityType.Listening;
        case "WATCHING":
            return ActivityType.Watching;
        case "COMPETING":
            return ActivityType.Competing;
    }
}

function updateStatus() {
    var numPlayersOnline = game.players_alive.reduce(function (total, player) {
        return total + (player.online ? 1 : 0);
    }, 0);
    var onlineString = " - " + numPlayersOnline + " player" + (numPlayersOnline !== 1 ? "s" : "") + " online";

    if (settings.debug)
        bot.user.setPresence({ status: "dnd", activities: [{ name: settings.debugModeActivity.string + onlineString, type: getActivityType(settings.debugModeActivity.type) }] });
    else {
        bot.user.setStatus("online");
        if (game.inProgress && !game.canJoin)
            bot.user.setPresence({ status: "online", activities: [{ name: settings.gameInProgressActivity.string + onlineString, type: getActivityType(settings.gameInProgressActivity.type), url: settings.gameInProgressActivity.url }] });
        else
            bot.user.setPresence({ status: "online", activities: [{ name: settings.onlineActivity.string, type: getActivityType(settings.onlineActivity.type) }] });
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
        await serverManager.validateServerConfig(game.guild);
        game.commandChannel = game.guild.channels.cache.find(channel => channel.id === serverconfig.commandChannel);
        game.logChannel = game.guild.channels.cache.find(channel => channel.id === serverconfig.logChannel);
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
    }, constants.messageQueueInterval * 1000);

    // Run online players check periodically.
    setInterval(() => {
        updateStatus();
    }, constants.onlinePlayersStatusInterval * 1000);

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
    if (settings.debug && message.channel.type === ChannelType.DM) console.log(message.author.username + ': "' + message.content + '"');

    // If the message begins with the command prefix, attempt to run a command.
    // If the command is run successfully, the message will be deleted.
    if (message.content.startsWith(settings.commandPrefix)) {
        const command = message.content.substring(settings.commandPrefix.length);
        var isCommand = await commandHandler.execute(command, bot, game, message);
    }
    if (message && !isCommand && game.inProgress && (serverconfig.roomCategories.includes(message.channel.parentId) || message.channel.parentId === serverconfig.whisperCategory || message.channel.id === serverconfig.announcementChannel)) {
        await dialogHandler.execute(bot, game, message, true);
    }
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

bot.login(credentials.discord.token);
