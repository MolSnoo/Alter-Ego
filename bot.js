'use strict';

import BotContext from './Classes/BotContext.ts';
import GuildContext from './Classes/GuildContext.ts';
import Game from './Data/Game.ts';

import BotCommand from './Classes/BotCommand.ts';
import ModeratorCommand from './Classes/ModeratorCommand.ts';
import PlayerCommand from './Classes/PlayerCommand.ts';
import EligibleCommand from './Classes/EligibleCommand.ts';

import {createServerConfigFileIfNotExists, loadServerConfig, validateServerConfig} from './Modules/serverManager.ts';
import { default as autoUpdate } from './Modules/updateHandler.js';
import { editSpectatorMessage, deleteSpectatorMessage, processIncomingMessage } from './Modules/messageHandler.js';
import { executeCommand } from './Modules/commandHandler.ts';

import { Client, Collection, ChannelType, Events, GatewayIntentBits, Partials, TextChannel, Role, PermissionFlagsBits } from 'discord.js';
import { readdir, readFileSync } from 'fs';
import { loadDotEnv } from "./Modules/envLoader.ts";
import { loadGameSettings, loadPlayerDefaults } from "./Modules/settingsLoader.ts";
import GameSettings from "./Classes/GameSettings.js";
import { loadCredentials } from "./Modules/credentialsLoader.ts";

if (process.env.STACK_TRACE_LIMIT && Number.isInteger(parseInt(process.env.STACK_TRACE_LIMIT))) {
    Error.stackTraceLimit = Math.min(Math.max(10, Math.round(parseInt(process.env.STACK_TRACE_LIMIT))), 200);
}

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
/** @type {Game} */
let game;

/** @type {Collection<string, BotCommand>} */
let botCommands = new Collection();
/** @type {Collection<string, ModeratorCommand>} */
let moderatorCommands = new Collection();
/** @type {Collection<string, PlayerCommand>} */
let playerCommands = new Collection();
/** @type {Collection<string, EligibleCommand>} */
let eligibleCommands = new Collection();

let initialized = false;

async function loadCommands() {
    const commandsDir = `./Commands/`;
    readdir(commandsDir, async (error, files) => {
        if (error) console.log(error);

        const commandFiles = files.filter(filename => filename.split('.').pop() === 'js');
        if (commandFiles.length <= 0) {
        console.log("Error: Couldn't find commands.");
            return process.exit(1);
        }
        await Promise.all(commandFiles.map(async file => {
            await import(`${commandsDir}${file}`).then(commandProps => {
                const config = commandProps.config;
                if (config.usableBy === "Bot")
                    botCommands.set(config.name, new BotCommand(config, commandProps.usage, commandProps.execute));
                else if (config.usableBy === "Moderator")
                    moderatorCommands.set(config.name, new ModeratorCommand(config, commandProps.usage, commandProps.execute));
                else if (config.usableBy === "Player")
                    playerCommands.set(config.name, new PlayerCommand(config, commandProps.usage, commandProps.execute));
                else if (config.usableBy === "Eligible")
                    eligibleCommands.set(config.name, new EligibleCommand(config, commandProps.usage, commandProps.execute));
                else {
                    console.log(`Error: Invalid command at ${commandsDir}${file}`);
                    return process.exit(1);
                }
            });
        })).then(() => {
            console.log(`Loaded ${botCommands.size + moderatorCommands.size + playerCommands.size + eligibleCommands.size} commands.`);
        });
    });
}
/** @returns {Promise<boolean>} */
async function createGuildContext(){
    if (client.guilds.cache.size === 1) {
        const guild = client.guilds.cache.first();
        await createServerConfigFileIfNotExists();
        let serverConfig = await loadServerConfig();
        let firstBootMessage = await validateServerConfig(guild, serverConfig);
        const commandChannel = guild.channels.resolve(serverConfig.commandChannel);
        const logChannel = guild.channels.resolve(serverConfig.logChannel);
        const announcementChannel = guild.channels.resolve(serverConfig.announcementChannel);
        const testingChannel = guild.channels.resolve(serverConfig.testingChannel);
        const generalChannel = guild.channels.resolve(serverConfig.generalChannel);
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
        const testerRole = guild.roles.resolve(serverConfig.testerRole);
        const eligibleRole = guild.roles.resolve(serverConfig.eligibleRole);
        const playerRole = guild.roles.resolve(serverConfig.playerRole);
        const freeMovementRole = guild.roles.resolve(serverConfig.freeMovementRole);
        const moderatorRole = guild.roles.resolve(serverConfig.moderatorRole);
        const deadRole = guild.roles.resolve(serverConfig.deadRole);
        const spectatorRole = guild.roles.resolve(serverConfig.spectatorRole);
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
        const adminRoles = guild.members.me.roles.cache.filter(role => role.permissions.has(PermissionFlagsBits.Administrator));
        if (adminRoles.size === 0) {
            console.log("Error: Bot must have the Administrator permission.");
            return process.exit(4);
        }
        const adminRole = adminRoles.sort((a, b) => b.position - a.position).first();
        if (adminRole.comparePositionTo(testerRole) < 0)
            errors.push("Error: Bot's Administrator role must be higher than testerRole in the role list.");
        if (adminRole.comparePositionTo(eligibleRole) < 0)
            errors.push("Error: Bot's Administrator role must be higher than eligibleRole in the role list.");
        if (adminRole.comparePositionTo(playerRole) < 0)
            errors.push("Error: Bot's Administrator role must be higher than playerRole in the role list.");
        if (adminRole.comparePositionTo(freeMovementRole) < 0)
            errors.push("Error: Bot's Administrator role must be higher than freeMovementRole in the role list.");
        if (adminRole.comparePositionTo(deadRole) < 0)
            errors.push("Error: Bot's Administrator role must be higher than deadRole in the role list.");
        if (adminRole.comparePositionTo(spectatorRole) < 0)
            errors.push("Error: Bot's Administrator role must be higher than spectatorRole in the role list.");
        if (errors.length > 0) {
            console.log(errors.join('\n'));
            return process.exit(4);
        }
        guildContext = new GuildContext(
            guild,
            commandChannel,
            logChannel,
            announcementChannel,
            testingChannel,
            generalChannel,
            serverConfig.roomCategories.split(','),
            serverConfig.whisperCategory,
            serverConfig.spectateCategory,
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

/**
 * Loads game settings and player defaults.
 *
 * @returns {GameSettings} The loaded game settings.
 */
function loadSettings() {
    /** @type string[] */
    let errors = [];

    let [gs, gsErr] = loadGameSettings();
    errors.push(...gsErr);

    let [, pdErr] = loadPlayerDefaults();
    errors.push(...pdErr);

    if (errors.length > 0) {
        throw new Error(errors.join('\n'));
    }

    return gs;
}

/**
 *
 * @param {GameSettings} settings
 * @returns {Promise<void>}
 */
async function sendFirstBootMessage(settings) {
    let moderatorRole = guildContext.guild.roles.resolve(guildContext.moderatorRole);
    await guildContext.commandChannel.send(
        `Alter Ego is now ready for use. To get started, give yourself the <@&${moderatorRole.id}> role and use the `
        + `\`${settings.commandPrefix}help\` command to learn what you can do. You can issue commands in this channel.\n\n`
        + `If this is your first time using Alter Ego, use the \`${settings.commandPrefix}setupdemo\` command to generate `
        + `a demo environment on the spreadsheet you supplied in your \`.env\` file. Then, you can invite another account `
        + `to the server and use the \`${settings.commandPrefix}addplayer\` or \`${settings.commandPrefix}startgame\` `
        + `command to add them as a player so that you can get a feel for gameplay.\n\n`
        + `For documentation and tutorials on how to use Alter Ego, check out the official docs:\n`
        + `https://msvblank.github.io/Alter-Ego/\n\n`
        + `Good luck, and have fun!`
    );
}

async function checkVersion() {
    const masterPackage = await fetch('https://raw.githubusercontent.com/MsVBLANK/Alter-Ego/master/package.json').then(response => response.json()).catch();
    const localPackage = JSON.parse(readFileSync('./package.json').toString())
    if (masterPackage.version !== localPackage.version && !localPackage.version.endsWith("d"))
        guildContext.commandChannel.send(`This version of Alter Ego is out of date. Please update using Docker or download the latest version from https://github.com/MsVBLANK/Alter-Ego at your earliest convenience.`);
}

function sendStartupLog() {
    let imageTag = process.env.IMAGE_TAG;
    let imageCommit = process.env.IMAGE_COMMIT;
    if (imageTag && imageCommit) {
        console.log(`Alter Ego ${imageTag.split(":")[1]} (${imageCommit})`);
    } else if (imageTag) {
        console.log(`Alter Ego Dev (commit ${imageCommit})`);
    } else {
        console.log(`Alter Ego ${JSON.parse(readFileSync("./package.json").toString()).version}`);
    }
    console.log("Starting Alter Ego...");
}

client.on('clientReady', async () => {
    const doSendFirstBootMessage = await createGuildContext();
    console.log(`${client.user.username} is online in ${client.guilds.cache.first().name}.`);
    await loadCommands();
    await checkVersion();
    await autoUpdate(gameSettings);
    game = new Game(guildContext, gameSettings);
    botContext = BotContext.Instance(client, botCommands, moderatorCommands, playerCommands, eligibleCommands, game);
    game.setBotContext();
    botContext.updatePresence();
    if (doSendFirstBootMessage) await sendFirstBootMessage(gameSettings);
    if (game.settings.autoLoad) {
        // Commands seem to need time to "settle". The snippet below breaks if run synchronously.
        setTimeout(() => {
            let loadCommand = botContext.moderatorCommands.get("load_moderator");
            if (loadCommand)
                loadCommand.execute(game, undefined, "lar", []);
        }, 0);
    }
    setTimeout(async () => {
        const everyone = guildContext.guild.roles.everyone;
        if (everyone.permissions.has(PermissionFlagsBits.ReadMessageHistory) !== game.settings.readMessageHistory) {
            if (game.settings.readMessageHistory) {
                await everyone.setPermissions(everyone.permissions.add(PermissionFlagsBits.ReadMessageHistory));
            } else {
                await everyone.setPermissions(everyone.permissions.remove(PermissionFlagsBits.ReadMessageHistory));
            }
        }
    }, 0);
    initialized = true;
});

client.on('messageCreate', async message => {
    if (!initialized) return;
    // Prevent bot from responding to its own messages.
    if (message.author === client.user) return;
    if (game.settings.debug && message.channel.type === ChannelType.DM) console.log(message.author.username + ': "' + message.content + '"');

    // If the message begins with the command prefix, attempt to run a command.
    // If the command is run successfully, the message will be deleted.
    const messageStartsWithCommandAlias = message.content.startsWith(game.settings.commandPrefix);
    let isCommand = messageStartsWithCommandAlias || message.channel.type === ChannelType.DM || message.channel.id === game.guildContext.commandChannel.id;
    if (isCommand) {
        const command = messageStartsWithCommandAlias ? message.content.substring(game.settings.commandPrefix.length) : message.content;
        isCommand = await executeCommand(command, game, message);
    }
    if (message.channel.type !== ChannelType.DM && !isCommand && game.inProgress) {
        processIncomingMessage(game, message);
    }
});

client.on('messageUpdate', async (messageOld, messageNew) => {
    if (!initialized) return;
    if (messageOld.partial || messageNew.partial || messageOld.author.bot || messageOld.content === messageNew.content) return;

    if (messageOld.channel.type !== ChannelType.DM && game.inProgress
        && (game.guildContext.roomCategories.includes(messageOld.channel.parentId)
            || messageOld.channel.parentId === game.guildContext.whisperCategoryId
            || messageOld.channel.id === game.guildContext.announcementChannel.id)) {
        editSpectatorMessage(game, messageOld, messageNew);
    }
});

client.on('messageDelete', async (message) => {
    if (!initialized) return;
    if (message.channel.type !== ChannelType.DM && game.inProgress
        && (game.guildContext.roomCategories.includes(message.channel.parentId)
            || message.channel.parentId === game.guildContext.whisperCategoryId
            || message.channel.id === game.guildContext.announcementChannel.id)) {
        deleteSpectatorMessage(game, message);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!initialized) return;
    botContext.interactionHandler.interceptInteraction(interaction);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

loadDotEnv();
sendStartupLog();
let gameSettings = loadSettings();
let credentials = loadCredentials();

client.login(credentials.discord.token);
