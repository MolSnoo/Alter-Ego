'use strict';
global.include = require('app-root-path').require;

const settings = include('settings.json');
const credentials = include('credentials.json');
const messageHandler = include(`${settings.modulesDir}/messageHandler.js`);
const commandHandler = include(`${settings.modulesDir}/commandHandler.js`);
const dialogHandler = include(`${settings.modulesDir}/dialogHandler.js`);
const saver = include(`${settings.modulesDir}/saver.js`);

const discord = require('discord.js');
const bot = new discord.Client();
const fs = require('fs');
var moment = require('moment');
moment().format();

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

    if (settings.debug) {
        bot.user.setActivity(settings.debugModeActivity.string + onlineString, { type: settings.debugModeActivity.type });
        bot.user.setStatus("dnd");
    }
    else {
        if (game.inProgress && !game.canJoin)
            bot.user.setActivity(settings.gameInProgressActivity.string + onlineString, { type: settings.gameInProgressActivity.type, url: settings.gameInProgressActivity.url });
        else
            bot.user.setActivity(settings.onlineActivity.string, { type: settings.onlineActivity.type });
        bot.user.setStatus("online");
    }
}

bot.on('ready', async () => {
    if (bot.guilds.size === 1) {
        console.log(`${bot.user.username} is online on 1 server.`);
        loadCommands();
        if (settings.testing) {
            const tests = require(`./${settings.testsDir}/run_tests.js`);
            await tests.runTests(bot);
        }
        updateStatus();
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

bot.on('message', async message => {
    // Prevent bot from responding to its own messages.
    if (message.author === bot.user) return;
    if (settings.debug && message.channel.type === 'dm') console.log(message.author.username + ': "' + message.content + '"');

    game.guild = bot.guilds.first();
    game.commandChannel = game.guild.channels.find(channel => channel.id === settings.commandChannel);
    game.logChannel = game.guild.channels.find(channel => channel.id === settings.logChannel);

    // If the message begins with the command prefix, attempt to run a command.
    // If the command is run successfully, the message will be deleted.
    if (message.content.startsWith(settings.commandPrefix)) {
        const command = message.content.substring(settings.commandPrefix.length);
        var isCommand = await commandHandler.execute(command, bot, game, message);
    }
    if (message && !isCommand && game.inProgress && (settings.roomCategories.includes(message.channel.parentID) || message.channel.parentID === settings.whisperCategory || message.channel.id === settings.announcementChannel)) {
        await dialogHandler.execute(bot, game, message, true);
    }
});

bot.login(credentials.discord.token);
