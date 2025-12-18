import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { ChannelType } from "discord.js";
import { default as handleDialog } from '../Modules/dialogHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "say_player",
    description: "Sends your message to the room you're in.",
    details: "Sends your message to the channel of the room you're currently in. This command is "
        + "only available to players with certain status effects.",
    usableBy: "Player",
    aliases: ["say", "speak"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}say What happened?\n`
        + `${settings.commandPrefix}speak Did someone turn out the lights?`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify something to say. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("enable say");
    if (status.length === 0) return messageHandler.addReply(game, message, `You have no reason to use the say command. Speak in the room channel instead.`);

    const input = args.join(" ");
    if (!input.startsWith("(")) {
        // Create a webhook for this channel if necessary, or grab the existing one.
        const webHooks = await player.location.channel.fetchWebhooks();
        let webHook = webHooks.find(webhook => webhook.owner.id === game.botContext.client.user.id);
        if (webHook === null || webHook === undefined)
            webHook = await player.location.channel.createWebhook({ name: player.location.channel.name });

        const files = [];
        [...message.attachments.values()].forEach(attachment => files.push(attachment.url));

        const displayName = player.displayName;
        const displayIcon = player.displayIcon;
        if (player.hasBehaviorAttribute("hidden")) {
            player.displayName = "Someone in the room";
            player.displayIcon = "https://cdn.discordapp.com/attachments/697623260736651335/911381958553128960/questionmark.png";
        }

        webHook.send({
            content: input,
            username: player.displayName,
            avatarURL: player.displayIcon ? player.displayIcon : player.member.displayAvatarURL() || message.author.defaultAvatarURL,
            embeds: message.embeds,
            files: files
        }).then(msg => {
            handleDialog(game, msg, true, player, displayName)
                .then(() => {
                    player.displayName = displayName;
                    player.displayIcon = displayIcon;
                    // The say command isn't deleted by the commandHandler because it has necessary data. Delete it now.
                    if (message.channel.type !== ChannelType.DM) message.delete().catch();
                });
        });
    }
    
    return;
}
