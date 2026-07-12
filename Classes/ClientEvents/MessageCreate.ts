// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ChannelType, Events } from "discord.js";
import ClientEvent from "../ClientEvent.ts";
import { processIncomingMessage } from "../../Modules/messageHandler.ts";

export default new ClientEvent({
    name: Events.MessageCreate,
    once: false,
    execute: async (message: UserMessage) => {
        if (!ClientEvent.clientReady) return;
        // Prevent the bot from responding to its own messages.
        if (message.author === ClientEvent.client.user) return;

        const game = ClientEvent.client.game;
        if (game.settings.debug && message.channel.type === ChannelType.DM)
            console.log(`${message.author.username}: "${message.content}"`);

        // If the message begins with the command prefix, attempt to run a command.
        // If the command is run successfully, the message will be deleted.
        const messageStartsWithCommandAlias = message.content.startsWith(game.settings.commandPrefix);
        let isCommand = messageStartsWithCommandAlias || message.channel.type === ChannelType.DM || message.channel.id === game.guildContext.commandChannel.id;
        if (isCommand) {
            const command = messageStartsWithCommandAlias ? message.content.substring(game.settings.commandPrefix.length) : message.content;
            isCommand = await game.clientContext.commandHandler.executeCommand(command, game, message);
        }
        if (message.channel.type !== ChannelType.DM && !isCommand && game.inProgress) {
            processIncomingMessage(game, message);
        }
    }
});
