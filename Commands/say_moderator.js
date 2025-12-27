import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { ChannelType } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { default as handleDialog } from '../Modules/dialogHandler.js';

import Narration from '../Data/Narration.js';

/** @type {CommandConfig} */
export const config = {
    name: "say_moderator",
    description: "Sends a message.",
    details: 'Sends a message. A channel or player must be specified. Messages can be sent to any '
        + 'channel, but if it is sent to a room channel, it will be treated as a narration so that players with the '
        + '"see room" attribute can see it. If the name of a player is specified and that player has the talent "NPC", '
        + 'the player will speak in the channel of the room they\'re in. Their dialog will be treated just like that of '
        + 'any normal player\'s. The image URL set in the player\'s Discord ID will be used for the player\'s avatar.',
    usableBy: "Moderator",
    aliases: ["say"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}say #park Hello. My name is Alter Ego.\n`
        + `${settings.commandPrefix}say #general Thank you for speaking with me today.\n`
        + `${settings.commandPrefix}say amy One appletini, coming right up.`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return messageHandler.addReply(game, message, `You need to specify a channel or player and something to say. Usage:\n${usage(game.settings)}`);

    const channel = message.mentions.channels.first();
    const string = args.slice(1).join(" ");

    let player = null;
    let room = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase() && game.players_alive[i].title === "NPC") {
            player = game.players_alive[i];
            break;
        }
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase() && game.players_alive[i].title !== "NPC")
            return messageHandler.addReply(game, message, `You cannot speak for a player that isn't an NPC.`);
    }
    if (player !== null) {
        // Create a webhook for this channel if necessary, or grab the existing one.
        let webHooks = await player.location.channel.fetchWebhooks();
        let webHook = webHooks.find(webhook => webhook.owner.id === game.botContext.client.user.id);
        if (webHook === null || webHook === undefined)
            webHook = await player.location.channel.createWebhook({ name: player.location.channel.name });

        let files = [];
        [...message.attachments.values()].forEach(attachment => files.push(attachment.url));

        const displayName = player.displayName;
        const displayIcon = player.displayIcon;
        if (player.hasAttribute("hidden")) {
            player.displayName = "Someone in the room";
            player.displayIcon = "https://cdn.discordapp.com/attachments/697623260736651335/911381958553128960/questionmark.png";
        }

        webHook.send({
            content: string,
            username: player.displayName,
            avatarURL: player.displayIcon,
            embeds: message.embeds,
            files: files
        }).then(message => {
            handleDialog(game, message, true, player, displayName)
                .then(() => {
                    player.displayName = displayName;
                    player.displayIcon = displayIcon;
                });
        });
    }
    else if (channel.type === ChannelType.GuildText && game.guildContext.roomCategories.includes(channel.parentId)) {
        for (let i = 0; i < game.rooms.length; i++) {
            if (game.rooms[i].id === channel.name) {
                room = game.rooms[i];
                break;
            }
        }
        if (room !== null)
            new Narration(game, null, room, string).send();
    }
    else if (channel.type === ChannelType.GuildText)
        channel.send(string);
    else messageHandler.addReply(game, message, `Couldn't find a player or channel in your input. Usage:\n${usage(game.settings)}`);

    return;
}
