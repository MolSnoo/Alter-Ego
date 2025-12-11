import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";

/** @type {CommandConfig} */
export const config = {
    name: "text_player",
    description: "Sends a text message to another player.",
    details: "Sends a text message to the player you specify. If an image is attached, it will be sent as well. This command works best "
        + "when sent via direct message, rather than in a room channel. This command is only available to players with certain status effects.",
    usableBy: "Player",
    aliases: ["text"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}text elijah Hello. I am EVA Chan. We are schoolmates.\n`
        + `${settings.commandPrefix}text astrid i often paint cityscapes, urban scenes, and portraits of people - but today i decided to experiment with something a bit more abstract. (attached image)\n`
        + `${settings.commandPrefix}text viviana (attached image)`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify a player to text and a message. Usage:\n${usage(game.settings)}`);

    const status = player.getAttributeStatusEffects("enable text");
    if (status.length === 0) return messageHandler.addReply(game, message, `You do not have a device with which to send a text message.`);

    let recipient = game.entityFinder.getLivingPlayer(args[0]);
    if (recipient === undefined) return messageHandler.addReply(game, message, `Couldn't find player "${args[0]}".`);
    if (recipient.name === player.name) return messageHandler.addReply(game, message, `You cannot send a message to yourself.`);
    args.splice(0, 1);

    var input = args.join(" ");
    if (input === "" && message.attachments.size === 0) return messageHandler.addReply(game, message, `Text message cannot be empty. Please send a message and/or an attachment.`);
    if (input.length > 1900)
        input = input.substring(0, 1897) + "...";

    var senderText = `\`[ ${player.name} -> ${recipient.name} ]\` `;
    var receiverText = `\`[ ${player.name} ]\` `;
    if (input !== "") {
        senderText += input;
        receiverText += input;
    }
    
    messageHandler.addDirectNarrationWithAttachments(player, senderText, message.attachments);
    messageHandler.addDirectNarrationWithAttachments(recipient, receiverText, message.attachments);

    return;
}
