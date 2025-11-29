'use strict';

import settings from './Configs/settings.json' with { type: 'json' };
import constants from './Configs/constants.json' with { type: 'json' };
import credentials from './Configs/credentials.json' with { type: 'json' };
import serverconfig from './Configs/serverconfig.json' with { type: 'json' };
import { validateServerConfig } from './Modules/serverManager.js';
import { default as autoUpdate } from './Modules/updateHandler.js';
import * as messageHandler from './Modules/messageHandler.js';
import { default as executeCommand } from './Modules/commandHandler.js';
import { default as handleDialog } from './Modules/dialogHandler.js';
import { saveGame } from './Modules/saver.js';

import Event from './Data/Event.js';

import { readdir } from 'fs';
import fetch from 'node-fetch';
import moment from 'moment';
moment().format();
import { Client, Collection, ActivityType, ChannelType, GatewayIntentBits, Partials} from 'discord.js';

const bot = new Client({
    retryLimit: Infinity,
    partials: [
        Partials.User,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.Reaction
    ],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions
    ]
});

import game from './game.json' with { type: 'json' };
game.messageHandler = messageHandler;

bot.commands = new Collection();
bot.configs = new Collection();
bot.commandLog = [];
function loadCommands() {
    const commandsDir = `./${constants.commandsDir}/`;
    readdir(commandsDir, (err, files) => {
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

async function sendFirstBootMessage() {
    let moderatorRole = await game.guild.roles.fetch(serverconfig.moderatorRole);
    game.commandChannel.send(
        `Alter Ego is now ready for use. To get started, give yourself the ${moderatorRole.name} role and use the `
        + `${settings.commandPrefix}help command to learn what you can do. You can issue commands in this channel.\n\n`
        + `If this is your first time using Alter Ego, use the ${settings.commandPrefix}setupdemo command to generate `
        + `a demo environment on the spreadsheet you supplied in the settings. Then, you can invite another account to `
        + `the server and use the ${settings.commandPrefix}startgame command to add them as a Player so that you can `
        + `get a feel for Neo World Program gameplay.\n\n`
        + `For documentation and tutorials on how to use Alter Ego, check out the official docs:\n`
        + `https://molsnoo.github.io/Alter-Ego/\n\n`
        + `Good luck, and have fun!`
    );
}

async function checkVersion() {
    const masterPackage = await fetch('https://raw.githubusercontent.com/MolSnoo/Alter-Ego/master/package.json').then(response => response.json()).catch();
    const localPackage = require('./package.json');
    if (masterPackage.version !== localPackage.version && !localPackage.version.endsWith("d"))
        game.commandChannel.send(`This version of Alter Ego is out of date. Please update using Docker or download the latest version from https://github.com/MolSnoo/Alter-Ego at your earliest convenience.`);
}

bot.on('clientReady', async () => {
    if (bot.guilds.cache.size === 1) {
        //messageHandler.clientID = bot.user.id;
        game.guild = bot.guilds.cache.first();
        let firstBootMessage = await validateServerConfig(game.guild);
        game.commandChannel = game.guild.channels.cache.find(channel => channel.id === serverconfig.commandChannel);
        game.logChannel = game.guild.channels.cache.find(channel => channel.id === serverconfig.logChannel);
        game.flags = new Map();
        console.log(`${bot.user.username} is online on 1 server.`);
        if (firstBootMessage && game.commandChannel) sendFirstBootMessage();
        //loadCommands();
        updateStatus();
        //checkVersion();
        autoUpdate();
    }
    else {
        console.log("Error: Bot must be on one and only one server.");
        return process.exit(2);
    }

    // Save data periodically.
    setInterval(() => {
        if (game.inProgress && !game.editMode) saveGame();
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
                        const time = moment(game.events[i].triggerTimes[j], Event.formats);
                        if (now.month() === time.month() && now.weekday() === time.weekday() && now.date() === time.date() && now.hour() === time.hour() && now.minute() === time.minute()) {
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
        var isCommand = await executeCommand(command, bot, game, message);
    }
    if (message && !isCommand && game.inProgress && (serverconfig.roomCategories.includes(message.channel.parentId) || message.channel.parentId === serverconfig.whisperCategory || message.channel.id === serverconfig.announcementChannel)) {
        await handleDialog(bot, game, message, true);
    }
});

bot.on('messageUpdate', async (messageOld, messageNew) => {
    if (messageOld.partial || messageNew.partial || messageOld.author.bot || messageOld.content === messageNew.content) return;

    if (messageOld && game.inProgress && (serverconfig.roomCategories.includes(messageOld.channel.parentId) || messageOld.channel.parentId === serverconfig.whisperCategory || messageOld.channel.id === serverconfig.announcementChannel)) {
        messageHandler.editSpectatorMessage(messageOld, messageNew);
    }
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

bot.login(credentials.discord.token);
