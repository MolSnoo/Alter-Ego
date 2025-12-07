import settings from '../Configs/settings.json' with { type: 'json' };
import GameSettings from "../Classes/GameSettings.js";
import Game from "../Data/Game.js";
import Player from "../Data/Player.js";
import Event from "../Data/Event.js";
import Flag from "../Data/Flag.js";
import InventoryItem from "../Data/InventoryItem.js";
import Puzzle from "../Data/Puzzle.js";
import fs from 'fs';
import * as messageHandler from '../Modules/messageHandler.js';

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
 * @param {Game} game 
 * @param {string} command 
 * @param {string[]} args 
 * @param {Player} [player] 
 * @param {Event|Flag|InventoryItem|Puzzle} [callee] 
 */
export async function execute (game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");

    var input = args.join(" ").replace(/(?<=http(s?))@(?=.*?(jpg|jpeg|png|gif|webp|avif))/g, ':').replace(/(?<=http(s?):.*?)\\(?=.*?(jpg|jpeg|png|gif|webp|avif))/g, '/');
    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|jpeg|png|gif|webp|avif))$');
    if (!iconURLSyntax.test(input) && input !== "") return messageHandler.addGameMechanicMessage(game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". The display icon must be a URL with a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.`);

    settings.defaultRoomIconURL = input;

    const json = JSON.stringify(settings, null, "  ");
    await fs.writeFileSync('Configs/settings.json', json, 'utf8');

    return;
}
