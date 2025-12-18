import GameSettings from "../Classes/GameSettings.js";
import Game from "../Data/Game.js";
import Player from "../Data/Player.js";
import Event from "../Data/Event.js";
import Flag from "../Data/Flag.js";
import InventoryItem from "../Data/InventoryItem.js";
import Puzzle from "../Data/Puzzle.js";
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "tag_bot",
    description: "Adds or removes a room's tags.",
    details: "-**add**/**addtag**: Adds a tag to the given room. Events that affect rooms with that tag will immediately "
        + "apply to the given room, and any tag that gives a room special behavior will immediately activate those functions.\n\n"
        + "-**remove**/**removetag**: Removes a tag from the given room. Events that affect rooms with that tag will immediately "
        + "stop applying to the given room, and any tag that gives a room special behavior will immediately stop functioning.\n\n"
        + "Note that unlike the moderator version of this command, you cannot add/remove multiple tags at once.",
    usableBy: "Bot",
    aliases: ["tag", "addtag", "removetag"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `tag add kitchen video surveilled\n`
        + `tag remove kitchen audio surveilled\n`
        + `addtag vault soundproof\n`
        + `removetag freezer cold`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} [player] - The player who caused the command to be executed, if applicable. 
 * @param {Event|Flag|InventoryItem|Puzzle} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute (game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    var input = command + " " + args.join(" ");
    if (command === "tag") {
        if (args[0] === "add") command = "addtag";
        else if (args[0] === "remove") command = "removetag";
        input = input.substring(input.indexOf(args[1]));
        args = input.split(" ");
    }
    else input = args.join(" ");

    if (command !== "addtag" && command !== "removetag") return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Invalid command given. Use "add" or "remove".`);
    if (args.length < 2)
        return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);

    input = args.join(" ");
    var parsedInput = input.replace(/ /g, "-").toLowerCase();

    var room = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (parsedInput.startsWith(game.rooms[i].name + '-')) {
            room = game.rooms[i];
            break;
        }
    }
    if (room === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find room "${input}".`);

    input = input.substring(room.name.length).trim();
    if (input === "") return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);

    if (command === "addtag") {
        if (!room.tags.includes(input.trim()))
            room.tags.push(input.trim());
    }
    else if (command === "removetag") {
        if (room.tags.includes(input.trim()))
            room.tags.splice(room.tags.indexOf(input.trim()), 1);
    }

    return;
}
