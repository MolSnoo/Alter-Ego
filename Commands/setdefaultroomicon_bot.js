import fs from 'fs';
import settings from '../Configs/settings.json' with { type: 'json' };
import { addGameMechanicMessage } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

/** @type {CommandConfig} */
export const config = {
    name: "setdefaultroomicon_bot",
    description: "Sets the default room icon.",
    details: "Sets the icon that will display by default when the given room's information is displayed, if there exists no specific icon for that room. "
        + "The icon given must be a URL with a .jpg, .jpeg, .png, .gif, .webp, or .avif extension. To reset the default icon, simply do not specify a new icon.",
    usableBy: "Bot",
    aliases: ["setdefaultroomicon"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `setdefaultroomicon https://media.discordapp.net/attachments/1290826220367249489/1441259427411001455/sLPkDhP.png\n`
        + `setdefaultroomicon`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} [player] - The player who caused the command to be executed, if applicable. 
 * @param {Callee} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute (game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");

    const input = args.join(" ").replace(/(?<=http(s?))@(?=.*?(jpg|jpeg|png|gif|webp|avif))/g, ':').replace(/(?<=http(s?):.*?)\\(?=.*?(jpg|jpeg|png|gif|webp|avif))/g, '/');
    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|jpeg|png|gif|webp|avif))$');
    if (!iconURLSyntax.test(input) && input !== "") return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". The display icon must be a URL with a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.`);

    game.settings.defaultRoomIconURL = input;
    settings.defaultRoomIconURL = input;

    const json = JSON.stringify(settings, null, "  ");
    await fs.writeFileSync('Configs/settings.json', json, 'utf8');
}
