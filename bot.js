'use strict';

import settings from './Configs/settings.json' with { type: 'json' };
import credentials from './Configs/credentials.json' with { type: 'json' };
import serverconfig from './Configs/serverconfig.json' with { type: 'json' };

import BotContext from './Classes/BotContext.js';
import GuildContext from './Classes/GuildContext.js';
import GameSettings from './Classes/GameSettings.js';
import Game from './Data/Game.js';

import BotCommand from './Classes/BotCommand.js';
import ModeratorCommand from './Classes/ModeratorCommand.js';
import PlayerCommand from './Classes/PlayerCommand.js';
import EligibleCommand from './Classes/EligibleCommand.js';

import { validateServerConfig } from './Modules/serverManager.js';
import { default as autoUpdate } from './Modules/updateHandler.js';
import { editSpectatorMessage } from './Modules/messageHandler.js';
import { default as executeCommand } from './Modules/commandHandler.js';
import { default as handleDialog } from './Modules/dialogHandler.js';

import { Client, Collection, ChannelType, GatewayIntentBits, Partials, TextChannel, Role} from 'discord.js';
import { readdir, readFileSync } from 'fs';

const client = new Client({
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

/** @type {BotContext} */
let botContext;
/** @type {GuildContext} */
let guildContext;
/** @type {GameSettings} */
let gameSettings;
/** @type {Game} */
let game;

let commands = new Collection();
let commandConfigs = new Collection();
async function loadCommands() {
    const commandsDir = `./Commands/`;
    readdir(commandsDir, (err, files) => {
        if (err) console.log(err);

        let commandFiles = files.filter(filename => filename.split('.').pop() === 'js');
        if (commandFiles.length <= 0) {
            console.log("Error: Couldn't find commands.");
            return process.exit(1);
        }

        commandFiles.forEach(file => {
            import(`${commandsDir}${file}`).then(commandProps => {
                const config = commandProps.config;
                let command;
                if (config.usableBy === "Bot")
                    command = new BotCommand(config, commandProps.execute);
                else if (config.usableBy === "Moderator")
                    command = new ModeratorCommand(config, commandProps.execute);
                else if (config.usableBy === "Player")
                    command = new PlayerCommand(config, commandProps.execute);
                else if (config.usableBy === "Eligible")
                    command = new EligibleCommand(config, commandProps.execute);
                else {
                    console.log(`Error: Invalid command at ${commandsDir}${file}`);
                    return process.exit(1);
                }
                commands.set(config.name, command);
                commandConfigs.set(config.name, config);
            });
        });
    });

    console.log(`Loaded all commands.`);
}

/** @returns {Promise<boolean>} */
async function createGuildContext() {
    if (client.guilds.cache.size === 1) {
        const guild = client.guilds.cache.first();
        let firstBootMessage = await validateServerConfig(guild);
        const commandChannel = guild.channels.resolve(serverconfig.commandChannel);
        const logChannel = guild.channels.resolve(serverconfig.logChannel);
        const announcementChannel = guild.channels.resolve(serverconfig.announcementChannel);
        const testingChannel = guild.channels.resolve(serverconfig.testingChannel);
        const generalChannel = guild.channels.resolve(serverconfig.generalChannel);
        let errors = [];
        if (!(commandChannel instanceof TextChannel))
            errors.push("Error: commandChannel in serverconfig is not a TextChannel.");
        if (!(logChannel instanceof TextChannel))
            errors.push("Error: logChannel in serverconfig is not a TextChannel.");
        if (!(announcementChannel instanceof TextChannel))
            errors.push("Error: announcementChannel in serverconfig is not a TextChannel.");
        if (!(testingChannel instanceof TextChannel))
            errors.push("Error: testingChannel in serverconfig is not a TextChannel.");
        if (!(generalChannel instanceof TextChannel))
            errors.push("Error: generalChannel in serverconfig is not a TextChannel.");
        if (!(commandChannel instanceof TextChannel && logChannel instanceof TextChannel && announcementChannel instanceof TextChannel && testingChannel instanceof TextChannel && generalChannel instanceof TextChannel)) {
            console.log(errors.join('\n'));
            return process.exit(3);
        }
        errors = [];
        const testerRole = guild.roles.resolve(serverconfig.testerRole);
        const eligibleRole = guild.roles.resolve(serverconfig.eligibleRole);
        const playerRole = guild.roles.resolve(serverconfig.playerRole);
        const freeMovementRole = guild.roles.resolve(serverconfig.headmasterRole);
        const moderatorRole = guild.roles.resolve(serverconfig.moderatorRole);
        const deadRole = guild.roles.resolve(serverconfig.deadRole);
        const spectatorRole = guild.roles.resolve(serverconfig.spectatorRole);
        if (!(testerRole instanceof Role))
            errors.push("Error: testerRole in serverconfig is not a Role.");
        if (!(eligibleRole instanceof Role))
            errors.push("Error: eligibleRole in serverconfig is not a Role.");
        if (!(playerRole instanceof Role))
            errors.push("Error: playerRole in serverconfig is not a Role.");
        if (!(freeMovementRole instanceof Role))
            errors.push("Error: freeMovementRole in serverconfig is not a Role.");
        if (!(moderatorRole instanceof Role))
            errors.push("Error: moderatorRole in serverconfig is not a Role.");
        if (!(deadRole instanceof Role))
            errors.push("Error: deadRole in serverconfig is not a Role.");
        if (!(spectatorRole instanceof Role))
            errors.push("Error: spectatorRole in serverconfig is not a Role.");
        if (errors.length > 0) {
            console.log(errors.join('\n'));
            return process.exit(3);
        }
        guildContext = new GuildContext(
            guild,
            commandChannel,
            logChannel,
            announcementChannel,
            testingChannel,
            generalChannel,
            serverconfig.roomCategories.split(','),
            serverconfig.whisperCategory,
            serverconfig.spectateCategory,
            testerRole,
            eligibleRole,
            playerRole,
            freeMovementRole,
            moderatorRole,
            deadRole,
            spectatorRole
        );
        if (firstBootMessage && commandChannel) return true;
        else return false;
    }
    else {
        console.log("Error: Bot must be on one and only one server.");
        return process.exit(2);
    }
}

function loadGameSettings() {
    let errors = [];
    const staminaUseRate = settings.staminaUseRate;
    if (staminaUseRate > 0)
        errors.push("Error: staminaUseRate setting is not a negative number.");
    const diceMin = settings.diceMin;
    const diceMax = settings.diceMax;
    if (diceMin >= diceMax)
        errors.push("Error: diceMin setting must be less than diceMax.");
    const embedColor = settings.embedColor;
    const embedColorRegex = /^[\dA-F]{6}$/i;
    if (!embedColorRegex.test(embedColor))
        errors.push("Error: embedColor setting is not a valid hex color code. If it contains a # character, remove it.");
    /** @type Activity */
    const onlineActivity = {
        name: settings.onlineActivity.string,
        type: BotContext.getActivityType(settings.onlineActivity.type)
    };
    /** @type Activity */
    const debugModeActivity = {
        name: settings.debugModeActivity.string,
        type: BotContext.getActivityType(settings.debugModeActivity.type)
    };
    /** @type Activity */
    const gameInProgressActivity = {
        name: settings.gameInProgressActivity.string,
        type: BotContext.getActivityType(settings.gameInProgressActivity.type),
        url: settings.gameInProgressActivity.url
    };
    if (errors.length > 0) {
        console.log(errors.join('\n'));
        return process.exit(4);
    }

    gameSettings = new GameSettings(
        settings.commandPrefix,
        settings.debug,
        settings.spreadsheetID,
        settings.pixelsPerMeter,
        staminaUseRate,
        settings.heatedSlowdownRate,
        settings.autoSaveInterval,
        settings.diceMin,
        settings.diceMax,
        settings.defaultDropObject,
        settings.defaultRoomIconURL,
        settings.autoDeleteWhisperChannels,
        embedColor,
        settings.showOnlinePlayerCount,
        onlineActivity,
        debugModeActivity,
        gameInProgressActivity
    );
}

async function sendFirstBootMessage() {
    let moderatorRole = guildContext.guild.roles.resolve(serverconfig.moderatorRole);
    guildContext.commandChannel.send(
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
    const localPackage = JSON.parse(readFileSync('./package.json').toString())
    if (masterPackage.version !== localPackage.version && !localPackage.version.endsWith("d"))
        guildContext.commandChannel.send(`This version of Alter Ego is out of date. Please update using Docker or download the latest version from https://github.com/MolSnoo/Alter-Ego at your earliest convenience.`);
}

client.on('clientReady', async () => {
    console.log(`${client.user.username} is online on ${client.guilds.cache.size} server${client.guilds.cache.size !== 1 ? 's' : ''}.`);
    const doSendFirstBootMessage = await createGuildContext();
    await loadCommands();
    await checkVersion();
    await autoUpdate();
    loadGameSettings();
    game = new Game(botContext, guildContext, gameSettings);
    botContext = new BotContext(client, commands, commandConfigs, game);
    botContext.updatePresence();
    if (doSendFirstBootMessage) sendFirstBootMessage();
});

client.on('messageCreate', async message => {
    // Prevent bot from responding to its own messages.
    if (message.author === client.user) return;
    if (game.settings.debug && message.channel.type === ChannelType.DM) console.log(message.author.username + ': "' + message.content + '"');

    // If the message begins with the command prefix, attempt to run a command.
    // If the command is run successfully, the message will be deleted.
    let isCommand;
    if (message.content.startsWith(game.settings.commandPrefix)) {
        const command = message.content.substring(game.settings.commandPrefix.length);
        isCommand = await executeCommand(command, botContext, game, message);
    }
    if (message.channel.type !== ChannelType.DM && !isCommand && game.inProgress
        && (game.guildContext.roomCategories.includes(message.channel.parentId)
            || message.channel.parentId === game.guildContext.whisperCategory
            || message.channel.id === game.guildContext.announcementChannel.id)) {
        await handleDialog(botContext, game, message, true);
    }
});

client.on('messageUpdate', async (messageOld, messageNew) => {
    if (messageOld.partial || messageNew.partial || messageOld.author.bot || messageOld.content === messageNew.content) return;

    if (messageOld.channel.type !== ChannelType.DM && game.inProgress
        && (game.guildContext.roomCategories.includes(messageOld.channel.parentId)
            || messageOld.channel.parentId === game.guildContext.whisperCategory
            || messageOld.channel.id === game.guildContext.announcementChannel.id)) {
        editSpectatorMessage(messageOld, messageNew);
    }
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(credentials.discord.token);
