import GameSettings from '../Classes/GameSettings.js';
import Action from '../Data/Action.js';
import Fixture from '../Data/Fixture.js';
import Game from '../Data/Game.js';
import RoomItem from '../Data/RoomItem.js';
import Player from '../Data/Player.js';
import Puzzle from "../Data/Puzzle.js";
import { addReply } from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "take_player",
    description: "Takes an item and puts it in your inventory.",
    details: "Adds an item from the room you're in to your inventory. You must have a free hand to take an item. "
        + "If there are multiple items with the same name in a room, you can specify which object or item you want to take it from. "
        + "Additionally, if the item is contained in another item with multiple inventory slots (such as pockets), you can specify which slot to "
        + "take it from. If you take a very large item (a sword, for example), people will see you pick it up and see you carrying it when you enter or exit a room.",
    usableBy: "Player",
    aliases: ["take", "get", "t"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}take butcher's knife\n`
        + `${settings.commandPrefix}get first aid kit\n`
        + `${settings.commandPrefix}take pill bottle from medicine cabinet\n`
        + `${settings.commandPrefix}get towel from benches\n`
        + `${settings.commandPrefix}take hammer from tool box\n`
        + `${settings.commandPrefix}get key from pants\n`
        + `${settings.commandPrefix}take key from left pocket of pants`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return addReply(game, message, `You need to specify an item. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable take");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    // First, check if the player has a free hand.
    const hand = game.entityFinder.getPlayerFreeHand(player);
    if (hand === undefined) return addReply(game, message, "You do not have a free hand to take an item. Either drop an item you're currently holding or stash it in one of your equipped items.");

    const input = args.join(" ");
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    let item = null;
    let container = null;
    let slotName = "";
    let slot = null;
    const roomItems = game.entityFinder.getRoomItems(null, player.location.id, true);
    for (let i = 0; i < roomItems.length; i++) {
        // If parsedInput is only the item's name, we've found the item.
        if (roomItems[i].name === parsedInput) {
            item = roomItems[i];
            container = roomItems[i].container;
            slotName = roomItems[i].slot;
            if (container instanceof RoomItem) slot = container.inventoryCollection.get(slotName);
            break;
        }
        // A container was specified.
        if (parsedInput.startsWith(`${roomItems[i].name} FROM `)) {
            const containerName = parsedInput.substring(`${roomItems[i].name} FROM `.length).trim();
            if (roomItems[i].container !== null) {
                const roomItemContainer = roomItems[i].container;
                // Slot name was specified.
                if (containerName.endsWith(` OF ${roomItemContainer.name}`)) {
                    const tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${roomItemContainer.name}`));
                    if (roomItemContainer instanceof RoomItem) {
                        for (const id of roomItemContainer.inventoryCollection.keys()) {
                            if (id === tempSlotName && roomItems[i].slot === tempSlotName) {
                                item = roomItems[i];
                                container = roomItemContainer;
                                slotName = tempSlotName;
                                slot = container.inventoryCollection.get(slotName);
                                break;
                            }
                        }
                    }
                    if (item !== null) break;
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
                    if (container instanceof RoomItem) slot = container.inventoryCollection.get(slotName);
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
            const itemName = parsedInput.substring(0, parsedInput.indexOf(" FROM "));
            const containerName = parsedInput.substring(parsedInput.indexOf(" FROM ") + " FROM ".length);
            return addReply(game, message, `Couldn't find "${containerName}" containing "${itemName}".`);
        }
        else return addReply(game, message, `Couldn't find item "${parsedInput}" in the room.`);
    }
    
    let topContainer = container;
    while (topContainer !== null && topContainer instanceof RoomItem)
        topContainer = topContainer.container;

    if (topContainer !== null && topContainer instanceof Fixture && topContainer.autoDeactivate && topContainer.activated)
        return addReply(game, message, `You cannot take items from ${topContainer.name} while it is turned on.`);
    const hiddenStatus = player.getBehaviorAttributeStatusEffects("hidden");
    if (hiddenStatus.length > 0) {
        if (topContainer !== null && topContainer instanceof Puzzle)
            topContainer = topContainer.parentFixture;

        if (topContainer === null || topContainer instanceof Fixture && topContainer.name !== player.hidingSpot)
            return addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
    }

    const action = new Action(game, ActionType.Take, message, player, player.location, false);
    action.performTake(item, hand, container, slot);
}
