import GameSettings from '../Classes/GameSettings.js';
import Action from "../Data/Action.js";
import Fixture from "../Data/Fixture.js";
import Game from '../Data/Game.js';
import RoomItem from "../Data/RoomItem.js";
import Puzzle from "../Data/Puzzle.js";
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "take_moderator",
    description: "Takes the given item for a player.",
    details: "Forcibly takes an item for a player. The player must have a free hand to take an item. You can specify "
        + "which object or item to take the item from, but only items in the same room as the player can be taken. Additionally, if "
        + "the item is contained in another item with multiple inventory slots (such as pockets), you can specify which slot to take it from.",
    usableBy: "Moderator",
    aliases: ["take", "get", "t"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}take nero food\n`
        + `${settings.commandPrefix}take livida food from floor\n`
        + `${settings.commandPrefix}take cleo sword from desk\n`
        + `${settings.commandPrefix}take taylor hammer from tool box\n`
        + `${settings.commandPrefix}take aria green key from large purse\n`
        + `${settings.commandPrefix}take veronica game system from main pocket of backpack`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return addReply(game, message, `You need to specify a player and an item. Usage:\n${usage(game.settings)}`);

    let player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return addReply(game, message, `Player "${args[0]}" not found.`);

    // First, check if the player has a free hand.
    let hand = null;
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].id === "RIGHT HAND" && player.inventory[slot].equippedItem === null) {
            hand = player.inventory[slot];
            break;
        }
        else if (player.inventory[slot].id === "LEFT HAND" && player.inventory[slot].equippedItem === null) {
            hand = player.inventory[slot];
            break;
        }
        // If it's reached the left hand and it has an equipped item, both hands are taken. Stop looking.
        else if (player.inventory[slot].id === "LEFT HAND")
            break;
    }
    if (hand === null) return addReply(game, message, `${player.name} does not have a free hand to take an item.`);

    let input = args.join(" ");
    let parsedInput = input.toUpperCase().replace(/\'/g, "");

    let item = null;
    let container = null;
    let slotName = "";
    const roomItems = game.items.filter(item => item.location.id === player.location.id && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    for (let i = 0; i < roomItems.length; i++) {
        // If parsedInput is only the item's name, we've found the item.
        if (roomItems[i].identifier !== "" && roomItems[i].identifier === parsedInput ||
            roomItems[i].prefab.id === parsedInput ||
            roomItems[i].name === parsedInput) {
            item = roomItems[i];
            container = roomItems[i].container;
            slotName = roomItems[i].slot;
            break;
        }
        // A container was specified.
        if (roomItems[i].identifier !== "" && parsedInput.startsWith(`${roomItems[i].identifier} FROM `) ||
            parsedInput.startsWith(`${roomItems[i].prefab.id} FROM `) ||
            parsedInput.startsWith(`${roomItems[i].name} FROM `)) {
            let containerName;
            if (roomItems[i].identifier !== "" && parsedInput.startsWith(`${roomItems[i].identifier} FROM `))
                containerName = parsedInput.substring(`${roomItems[i].identifier} FROM `.length).trim();
            else if (parsedInput.startsWith(`${roomItems[i].prefab.id} FROM `))
                containerName = parsedInput.substring(`${roomItems[i].prefab.id} FROM `.length).trim();
            else if (parsedInput.startsWith(`${roomItems[i].name} FROM `))
                containerName = parsedInput.substring(`${roomItems[i].name} FROM `.length).trim();

            if (roomItems[i].container !== null) {
                const roomItemContainer = roomItems[i].container;
                // Slot name was specified.
                if (roomItemContainer instanceof RoomItem &&
                        (roomItemContainer.identifier !== "" && containerName.endsWith(` OF ${roomItemContainer.identifier}`) ||
                        containerName.endsWith(` OF ${roomItemContainer.prefab.id}`) ||
                        containerName.endsWith(` OF ${roomItemContainer.name}`))) {
                    let tempSlotName;
                    if (roomItemContainer.identifier !== "" && containerName.endsWith(` OF ${roomItemContainer.identifier}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${roomItemContainer.identifier}`));
                    else if (containerName.endsWith(` OF ${roomItemContainer.prefab.id}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${roomItemContainer.prefab.id}`));
                    else if (containerName.endsWith(` OF ${roomItemContainer.name}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${roomItemContainer.name}`));

                    for (let slot = 0; slot < roomItemContainer.inventory.length; slot++) {
                        if (roomItemContainer.inventory[slot].id === tempSlotName && roomItems[i].slot === tempSlotName) {
                            item = roomItems[i];
                            container = roomItemContainer;
                            slotName = tempSlotName;
                            break;
                        }
                    }
                    if (item !== null) break;
                }
                // A slot name wasn't specified, but the container is an item.
                else if (roomItemContainer instanceof RoomItem &&
                        (roomItemContainer.identifier !== "" && roomItemContainer.identifier === containerName ||
                        roomItemContainer.prefab.id === containerName ||
                        roomItemContainer.name === containerName)) {
                    item = roomItems[i];
                    container = roomItemContainer;
                    slotName = roomItems[i].slot;
                }
                // A puzzle's parent fixture was specified.
                else if (roomItemContainer instanceof Puzzle && roomItemContainer.parentFixture.name === containerName) {
                    item = roomItems[i];
                    container = roomItemContainer;
                    break;
                }
                // Only a container name was specified.
                else if (roomItemContainer.name === containerName) {
                    item = roomItems[i];
                    container = roomItemContainer;
                    slotName = roomItems[i].slot;
                    break;
                }
            }
        }
    }
    if (item === null) {
        // Check if the player is trying to take a fixture.
        const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput)
                return addReply(game, message, `The ${fixtures[i].name} is not an item.`);
        }
        // Otherwise, the item wasn't found.
        if (parsedInput.includes(" FROM ")) {
            let itemName = parsedInput.substring(0, parsedInput.indexOf(" FROM "));
            let containerName = parsedInput.substring(parsedInput.indexOf(" FROM ") + " FROM ".length);
            return addReply(game, message, `Couldn't find "${containerName}" containing "${itemName}".`);
        }
        else return addReply(game, message, `Couldn't find item "${parsedInput}" in the room.`);
    }

    let topContainer = container;
    while (topContainer !== null && topContainer instanceof RoomItem)
        topContainer = topContainer.container;

    if (topContainer !== null && topContainer instanceof Fixture && topContainer.autoDeactivate && topContainer.activated)
        return addReply(game, message, `Items cannot be taken from ${topContainer.name} while it is turned on.`);

    const action = new Action(game, ActionType.Take, message, player, player.location, true);
    action.performTake(item, hand, container, slotName);
    addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully took ${item.getIdentifier()} for ${player.name}.`);
}
