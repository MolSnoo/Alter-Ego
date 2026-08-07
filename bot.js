// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

'use strict';

import { readFileSync } from 'fs';
import { loadDotEnv } from "./Modules/envLoader.ts";
import ClientContext from "./Classes/ClientContext.ts";

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

<<<<<<< HEAD
=======
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
    client.application.emojis.fetch() // make sure app emoji cache is populated for application emoji mirroring
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
        await processIncomingMessage(game, message);
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

>>>>>>> feature/emoji-mirroring
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

loadDotEnv();
if (process.env.STACK_TRACE_LIMIT && Number.isInteger(parseInt(process.env.STACK_TRACE_LIMIT))) {
    Error.stackTraceLimit = Math.min(Math.max(10, Math.round(parseInt(process.env.STACK_TRACE_LIMIT))), 200);
}
sendStartupLog();
ClientContext.login();
