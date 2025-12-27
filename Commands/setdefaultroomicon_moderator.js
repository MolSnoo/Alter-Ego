import settings from '../Configs/settings.json' with { type: 'json' };
import * as messageHandler from '../Modules/messageHandler.js';

import fs from 'fs';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "setdefaultroomicon_moderator",
    description: "Sets the default room icon.",
    details: "Sets the icon that will display by default when the given room's information is displayed, if there exists no specific icon for that room. "
        + "The icon given must be a URL with a .jpg, .jpeg, .png, .gif, .webp, or .avif extension. To reset the default icon, simply do not specify a new icon.",
    usableBy: "Moderator",
    aliases: ["setdefaultroomicon"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}setdefaultroomicon https://media.discordapp.net/attachments/1290826220367249489/1441259427411001455/sLPkDhP.png\n`
        + `${settings.commandPrefix}setdefaultroomicon`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    const iconURLSyntax = RegExp('(http(s?)://.*?\\.(jpg|jpeg|png|gif|webp|avif))(\\?.*)?$');
    let input = args.join(" ");
    if (input.length === 0) {
        if (message.attachments.size !== 0)
            input = message.attachments.first().url.replace(iconURLSyntax, '$1');
    }
    if (!iconURLSyntax.test(input) && input !== "") return messageHandler.addReply(game, message, `The display icon must be a URL with a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.`);

    game.settings.defaultRoomIconURL = input;
    settings.defaultRoomIconURL = input;

    const json = JSON.stringify(settings, null, "  ");
    await fs.writeFileSync('Configs/settings.json', json, 'utf8');

    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully updated the default room icon.`);

    return;
}
