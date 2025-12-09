import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "text_moderator",
    description: "Sends a text message from an NPC.",
    details: "Sends a text message from the first player to the second player. The first player must have the talent \"NPC\". "
        + "If an image is attached, it will be sent as well.",
    usableBy: "Moderator",
    aliases: ["text"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}text amy florian I work at the bar.\n`
        + `${settings.commandPrefix}text amy florian Here's a picture of me at work. (attached image)\n`
        + `${settings.commandPrefix}text ??? keiko This is a message about your car's extended warranty.\n`
        + `${settings.commandPrefix}text ??? hibiki (attached image)`;
}


/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return messageHandler.addReply(game, message, `You need to specify a sender, a recipient, and a message. Usage:\n${usage(game.settings)}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase() && game.players_alive[i].title === "NPC") {
            player = game.players_alive[i];
            break;
        }
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase() && game.players_alive[i].title !== "NPC")
            return messageHandler.addReply(game, message, `You cannot text for a player that isn't an NPC.`);
    }
    if (player === null) return messageHandler.addReply(game, message, `Couldn't find player "${args[0]}".`);
    args.splice(0, 1);

    var recipient = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            recipient = game.players_alive[i];
            break;
        }
    }
    if (recipient === null) return messageHandler.addReply(game, message, `Couldn't find player "${args[0]}".`);
    if (recipient.name === player.name) return messageHandler.addReply(game, message, `${player.name} cannot send a message to ${player.originalPronouns.ref}.`);
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
