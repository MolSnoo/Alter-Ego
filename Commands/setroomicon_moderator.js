import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

export const config = {
    name: "setroomicon_moderator",
    description: "Sets a room's icon.",
    details: "Sets the icon that will display when the given room's information is displayed. "
        + "The icon given must be an attachment or URL with a .jpg, .jpeg, .png, .gif, .webp, "
        + "or .avif extension. To reset a room's icon, simply do not specify a new icon.",
    usableBy: "Moderator",
    aliases: ["setroomicon"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
    return `${settings.commandPrefix}setroomicon living-room https://media.discordapp.net/attachments/1290826220367249489/1441259427411001455/sLPkDhP.png\n`
        + `${settings.commandPrefix}setroomicon kitchen`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute(game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify a room. Usage:\n${exports.config.usage}`);

    let input = args.join(" ");

    let room = undefined;
    for (let i = args.length; i > 0; i--) {
        room = game.entityFinder.getRoom(args.slice(0, i).join(" "));
        if (room)
            break;
    }
    if (room === undefined) return messageHandler.addReply(game, message, `Couldn't find room "${input}".`);

    const iconURLSyntax = RegExp('(http(s?)://.*?\\.(jpg|jpeg|png|gif|webp|avif))(\\?.*)?$');
    input = input.replace(iconURLSyntax, '$1');
    if (input.length === 0) {
        if (message.attachments.size !== 0)
            input = message.attachments.first().url.replace(iconURLSyntax, '$1');
    }
    if (!iconURLSyntax.test(input) && input !== "") return messageHandler.addReply(game, message, `The display icon must be a URL with a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.`);

    room.iconURL = input;
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully updated the icon for ${room.id}.`);

    return;
};
