import GameSettings from "../Classes/GameSettings.js";
import Game from "../Data/Game.js";
import Player from "../Data/Player.js";
import Event from "../Data/Event.js";
import Flag from "../Data/Flag.js";
import InventoryItem from "../Data/InventoryItem.js";
import Puzzle from "../Data/Puzzle.js";
import Narration from '../Data/Narration.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "object_bot",
    description: "Activates or deactivates an object.",
    details: 'Activates or deactivates an object. You may specify a player to activate/deactivate the object. If you do, '
        + 'players in the room will be notified, so you should generally give a string for the bot to use, '
        + 'otherwise the bot will say "[player] turns on/off the [object]." which may not sound right. '
        + "If you specify a player, only objects in the room that player is in can be activated/deactivated. "
        + 'You can also use a room name instead of a player name. In that case, only objects in the room '
        + 'you specify can be activated/deactivated. This is useful if you have multiple objects with the same name '
        + 'spread across the map. This command can only be used for objects with a recipe tag. If there is a puzzle with '
        + 'the same name as the object whose state is supposed to be the same as the object, use the puzzle command to update it as well.',
    usableBy: "Bot",
    aliases: ["object", "activate", "deactivate"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `object activate blender\n`
        + `object deactivate microwave\n`
        + `activate keurig kyra\n`
        + `deactivate oven noko\n`
        + `object activate fireplace log cabin\n`
        + `object deactivate fountain flower garden\n`
        + `activate freezer zoran "Zoran plugs in the FREEZER."\n`
        + `deactivate washer 1 laundry room "WASHER 1 turns off"`;
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
    var input = cmdString;
    if (command === "object") {
        if (args[0] === "activate") command = "activate";
        else if (args[0] === "deactivate") command = "deactivate";
        input = input.substring(input.indexOf(args[1]));
        args = input.split(" ");
    }
    else input = args.join(" ");

    if (command !== "activate" && command !== "deactivate") return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Invalid command given. Use "activate" or "deactivate".`);
    if (args.length === 0) {
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    // The message, if it exists, is the easiest to find at the beginning. Look for that first.
    var announcement = "";
    var index = input.indexOf('"');
    if (index === -1) index = input.indexOf('�');
    if (index !== -1) {
        announcement = input.substring(index + 1);
        // Remove the announcement from the list of arguments.
        input = input.substring(0, index - 1);
        args = input.split(" ");
        // Now clean up the announcement text.
        if (announcement.endsWith('"') || announcement.endsWith('�'))
            announcement = announcement.substring(0, announcement.length - 1);
        if (!announcement.endsWith('.') && !announcement.endsWith('!'))
            announcement += '.';
    }

    // Find the prospective list of objects.
    var objects = game.objects.filter(object => input.toUpperCase().startsWith(object.name + ' ') || input.toUpperCase() === object.name);
    if (objects.length > 0) {
        input = input.substring(objects[0].name.length).trim();
        args = input.split(" ");
    }

    // Now find the player, who should be the last argument.
    if (args[args.length - 1] === "player" && player !== null) {
        args.splice(args.length - 1, 1);
        input = args.join(" ");
        announcement = announcement.replace(/player/g, player.displayName);
    }
    else {
        player = null;
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].name.toLowerCase() === args[args.length - 1].toLowerCase()) {
                player = game.players_alive[i];
                args.splice(args.length - 1, 1);
                input = args.join(" ");
                break;
            }
        }
    }

    // If a player wasn't specified, check if a room name was.
    var room = null;
    if (player === null) {
        const parsedInput = input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
        for (let i = 0; i < game.rooms.length; i++) {
            if (parsedInput.endsWith(game.rooms[i].name)) {
                room = game.rooms[i];
                input = input.substring(0, parsedInput.indexOf(room.name) - 1);
                break;
            }
        }
    }

    // Finally, find the object.
    var object = null;
    for (let i = 0; i < objects.length; i++) {
        if ((player !== null && objects[i].location.name === player.location.name)
            || (room !== null && objects[i].location.name === room.name)) {
            object = objects[i];
            break;
        }
    }
    if (object === null && player === null && room === null && objects.length > 0) object = objects[0];
    else if (object === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find object "${input}".`);
    if (object.recipeTag === "") return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${object.name} cannot be ${command}d because it has no recipe tag.`);

    var narrate = false;
    if (announcement === "" && player !== null) narrate = true;
    else if (announcement !== "") new Narration(game, player, game.rooms.find(room => room.name === object.location.name), announcement).send();

    const time = new Date().toLocaleTimeString();
    if (command === "activate") {
        object.activate(game, player, narrate);
        // Post log message.
        if (player) messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly activated ${object.name} in ${player.location.channel}`);
    }
    else if (command === "deactivate") {
        object.deactivate(game, player, narrate);
        // Post log message.
        if (player) messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly deactivated ${object.name} in ${player.location.channel}`);
    }

    return;
}
