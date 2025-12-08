import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";

/** @type {CommandConfig} */
export const config = {
    name: "use_player",
    description: "Uses an item in your inventory or an object in a room.",
    details: "Uses an item from your inventory. Not all items have programmed uses. Those that do will inflict you "
        + "with or cure you of a status effect of some kind. Status effects can be good, bad, or neutral, but it "
        + "should be fairly obvious what kind of effect a particular item will have on you.\n\n"
        + "Some items can be used on objects. For example, using a key on a locker "
        + "will unlock the locker, using a crowbar on a crate will open the crate, etc.\n\n"
        + "Some objects are capable of turning items into other items. For example, an oven can turn frozen food "
        + "into cooked food. In order to use objects like this, drop the items in the object and use it.\n\n"
        + "You can even use objects in the room without using an item at all. Not all objects are usable. "
        + "Anything after the name of the object will be treated as a password or combination. "
        + "Passwords and combinations are case-sensitive. If the object is a lock of some kind, you can relock it using the lock command. "
        + "Other objects may require a puzzle to be solved before they do anything special.",
    usableBy: "Player",
    aliases: ["use", "unlock", "lock", "type", "activate", "flip", "push", "press", "ingest", "consume", "swallow", "eat", "drink"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}use first aid kit\n`
        + `${settings.commandPrefix}eat food\n`
        + `${settings.commandPrefix}use old key chest\n`
        + `${settings.commandPrefix}use lighter candle\n`
        + `${settings.commandPrefix}lock locker\n`
        + `${settings.commandPrefix}type keypad YAMA NI NOBORU\n`
        + `${settings.commandPrefix}unlock locker 1 12-22-11\n`
        + `${settings.commandPrefix}press button\n`
        + `${settings.commandPrefix}flip lever\n`
        + `${settings.commandPrefix}use blender`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 * @param {Player} player 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify an object. Usage:\n${usage(game.settings)}`);

    const status = player.getAttributeStatusEffects("disable use");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[0].name}**.`);

    // This will be checked multiple times, so get it now.
    const hiddenStatus = player.getAttributeStatusEffects("hidden");

    var input = args.join(" ");
    var parsedInput = input.toUpperCase();

    // First find the item in the player's hand, if applicable.
    var item = null;
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].equippedItem !== null && (parsedInput.startsWith(player.inventory[slot].equippedItem.name + ' ') || player.inventory[slot].equippedItem.name === parsedInput)) {
            if (player.inventory[slot].name === "RIGHT HAND" && player.inventory[slot].equippedItem !== null) {
                item = player.inventory[slot].equippedItem;
                break;
            }
            else if (player.inventory[slot].name === "LEFT HAND" && player.inventory[slot].equippedItem !== null) {
                item = player.inventory[slot].equippedItem;
                break;
            }
        }
        // If it's reached the left hand and it doesn't have the desired item, neither hand has it. Stop looking.
        else if (player.inventory[slot].name === "LEFT HAND")
            break;
    }
    if (item !== null) {
        parsedInput = parsedInput.substring(item.name.length).trim();
        input = input.substring(item.name.length).trim();
    }

    // Now check to see if the player is trying to solve a puzzle.
    var puzzle = null;
    var password = "";
    var targetPlayer = null;
    if (parsedInput !== "" && (command !== "ingest" && command !== "consume" && command !== "swallow" && command !== "eat" && command !== "drink")) {
        var puzzles = game.puzzles.filter(puzzle => puzzle.location.name === player.location.name);
        if (command === "lock" || command === "unlock") puzzles = puzzles.filter(puzzle => puzzle.type === "combination lock" || puzzle.type === "key lock");
        else if (command === "type") puzzles = puzzles.filter(puzzle => puzzle.type === "password");
        else if (command === "push" || command === "press" || command === "activate" || command === "flip") puzzles = puzzles.filter(puzzle => puzzle.type === "interact" || puzzle.type === "toggle");
        for (let i = 0; i < puzzles.length; i++) {
            if (puzzles[i].parentObject !== null &&
                (parsedInput.startsWith(puzzles[i].parentObject.name + ' ') || parsedInput === puzzles[i].parentObject.name)) {
                puzzle = puzzles[i];
                //parsedInput = parsedInput.substring(puzzle.parentObject.name.length).trim();
                input = input.substring(puzzle.parentObject.name.length).trim();
                break;
            }
            else if (parsedInput.startsWith(puzzles[i].name + ' ') || parsedInput === puzzles[i].name) {
                puzzle = puzzles[i];
                //parsedInput = parsedInput.substring(puzzle.name.length).trim();
                input = input.substring(puzzle.name.length).trim();
                break;
            }
        }
        if (puzzle !== null) {
            // Make sure the player can only solve the puzzle if it's a child puzzle of the object they're hiding in, if they're hidden.
            if (hiddenStatus.length > 0 && puzzle.parentObject !== null && player.hidingSpot !== puzzle.parentObject.name) return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].name}**.`);

            password = input;
            if (password !== "") parsedInput = parsedInput.substring(0, parsedInput.indexOf(password.toUpperCase())).trim();
            for (let i = 0; i < game.players_alive.length; i++) {
                if (game.players_alive[i].displayName.toLowerCase() === input.toLowerCase() &&
                game.players_alive[i].location.name === player.location.name &&
                (!game.players_alive[i].hasAttribute("hidden") || game.players_alive[i].hidingSpot === player.hidingSpot)) {
                    targetPlayer = game.players_alive[i];
                    break;
                }
            }
        }
    }

    // Check if the player specified an object.
    var object = null;
    if (item === null && parsedInput !== "" && (command !== "ingest" && command !== "consume" && command !== "swallow" && command !== "eat" && command !== "drink")) {
        var objects = game.objects.filter(object => object.location.name === player.location.name);
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].name === parsedInput) {
                object = objects[i];
                break;
            }
        }
    }

    // If there is an object, do the required behavior.
    if (object !== null && object.recipeTag !== "" && object.activatable) {
        // Make sure the player can only activate the object if it's the object they're hiding in, if they're hidden.
        if (hiddenStatus.length > 0 && player.hidingSpot !== object.name) return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].name}**.`);

        const narrate = puzzle === null ? true : false;
        const time = new Date().toLocaleTimeString();
        if (object.activated) {
            object.deactivate(player, narrate);
            // Post log message.
            messageHandler.addLogMessage(game, `${time} - ${player.name} deactivated ${object.name} in ${player.location.channel}`);
        }
        else {
            object.activate(player, narrate);
            // Post log message.
            messageHandler.addLogMessage(game, `${time} - ${player.name} activated ${object.name} in ${player.location.channel}`);
        }
    }

    // If there is a puzzle, do the required behavior.
    if (puzzle !== null) {
        const response = player.attemptPuzzle(puzzle, item, password, command, input, message, targetPlayer);
        if (response === "" || !response) return;
        else return messageHandler.addReply(game, message, response);
    }
    // Otherwise, the player must be trying to use an item on themselves.
    else if (item !== null && (command === "use" || command === "ingest" || command === "consume" || command === "swallow" || command === "eat" || command === "drink")) {
        const itemName = item.identifier ? item.identifier : item.prefab.id;
        const response = player.use(item);
        if (response === "" || !response) {
            // Post log message.
            const time = new Date().toLocaleTimeString();
            messageHandler.addLogMessage(game, `${time} - ${player.name} used ${itemName} from ${player.originalPronouns.dpos} inventory in ${player.location.channel}`);
            return;
        }
        else return messageHandler.addReply(game, message, response);
    }
    else if (object === null) return messageHandler.addReply(game, message, `Couldn't find "${input}" to ${command}. Try using a different command?`);
}
