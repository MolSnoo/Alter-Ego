import GameSettings from '../Classes/GameSettings.js';
import DropAction from '../Data/Actions/DropAction.js';
import Fixture from "../Data/Fixture.js";
import Game from '../Data/Game.js';
import RoomItem from "../Data/RoomItem.js";
import Player from '../Data/Player.js';
import Puzzle from "../Data/Puzzle.js";
import { addReply } from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "drop_player",
    description: "Discards an item from your inventory.",
    details: "Discards an item from your inventory and leaves it in the room you're currently in. The item you want to discard must be in either of your hands. "
        + "You can specify where in the room you'd like to leave it by putting the name of an object or item in the room after the item. "
        + "Not all objects and items can contain items, but it should be fairly obvious which ones can. If you want to discard it in an item with multiple "
        + "inventory slots (such as pockets), you can specify which slot to put it in. If you don't specify an object or item, you will simply leave it on the floor. "
        + "If you drop a very large item (a sword, for example), people in the room with you will see you discard it.",
    usableBy: "Player",
    aliases: ["drop", "discard", "d"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}drop first aid kit\n`
        + `${settings.commandPrefix}discard basketball\n`
        + `${settings.commandPrefix}drop knife in sink\n`
        + `${settings.commandPrefix}discard towel on benches\n`
        + `${settings.commandPrefix}drop key in right pocket of skirt\n`
        + `${settings.commandPrefix}discard wrench on top rack of tool box`;
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

    const status = player.getAttributeStatusEffects("disable drop");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    let input = args.join(" ");
    let parsedInput = input.toUpperCase().replace(/\'/g, "");
    let newArgs = null;

    // First, find the item in the player's inventory.
    let item = null;
    let hand = "";
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].equippedItem !== null && (parsedInput.startsWith(player.inventory[slot].equippedItem.name + ' ') || player.inventory[slot].equippedItem.name === parsedInput)) {
            if (player.inventory[slot].id === "RIGHT HAND" && player.inventory[slot].equippedItem !== null) {
                item = player.inventory[slot].equippedItem;
                hand = "RIGHT HAND";
                break;
            }
            else if (player.inventory[slot].id === "LEFT HAND" && player.inventory[slot].equippedItem !== null) {
                item = player.inventory[slot].equippedItem;
                hand = "LEFT HAND";
                break;
            }
        }
        // If it's reached the left hand and it doesn't have the desired item, neither hand has it. Stop looking.
        else if (player.inventory[slot].id === "LEFT HAND")
            break;
    }
    if (item !== null) {
        parsedInput = parsedInput.substring(item.name.length).trim();
        newArgs = parsedInput.split(' ');
    }
    else return addReply(game, message, `Couldn't find item "${parsedInput}" in either of your hands. If this item is elsewhere in your inventory, please unequip or unstash it before trying to drop it.`);

    // Check if the player specified an fixture.
    const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
    let fixture = null;
    if (parsedInput !== "") {
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput) return addReply(game, message, `You need to supply a preposition.`);
            if ((parsedInput === `${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}` || parsedInput === `IN ${fixtures[i].name}`) && fixtures[i].preposition !== "") {
                fixture = fixtures[i];
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(fixtures[i].name)).trimEnd();
                // Check if the fixture has a puzzle attached to it.
                if (fixture.childPuzzle !== null && fixture.childPuzzle.type !== "weight" && fixture.childPuzzle.type !== "container" && (!fixture.childPuzzle.accessible || !fixture.childPuzzle.solved) && player.hidingSpot !== fixture.name)
                    return addReply(game, message, `You cannot put items ${fixture.preposition} ${fixture.name} right now.`);
                newArgs = parsedInput.split(' ');
                newArgs.splice(newArgs.length - 1, 1);
                parsedInput = newArgs.join(' ');
                break;
            }
            else if (parsedInput === `${newArgs[0]} ${fixtures[i].name}` && fixtures[i].preposition === "") return addReply(game, message, `${fixtures[i].name} cannot hold items. Contact a moderator if you believe this is a mistake.`);
        }
    }

    // Check if the player specified a container item.
    let items = game.items.filter(item => item.location.id === player.location.id && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    let containerItem = null;
    let containerItemSlot = null;
    if (parsedInput !== "") {
        for (let i = 0; i < items.length; i++) {
            if (items[i].name === parsedInput) return addReply(game, message, `You need to supply a preposition.`);
            if (parsedInput.endsWith(items[i].name) && parsedInput !== items[i].name) {
                const itemContainer = items[i].container;
                if (fixture === null || fixture !== null && itemContainer !== null && (itemContainer.name === fixture.name || itemContainer instanceof Puzzle && itemContainer.parentFixture.name === fixture.name)) {
                    if (items[i].inventory.length === 0) return addReply(game, message, `${items[i].name} cannot hold items. Contact a moderator if you believe this is a mistake.`);
                    containerItem = items[i];
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                    // Check if a slot was specified.
                    if (parsedInput.endsWith(" OF")) {
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                        newArgs = parsedInput.split(' ');
                        for (let slot = 0; slot < containerItem.inventory.length; slot++) {
                            if (parsedInput.endsWith(containerItem.inventory[slot].id)) {
                                containerItemSlot = containerItem.inventory[slot];
                                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItemSlot.id)).trimEnd();
                                break;
                            }
                        }
                        if (containerItemSlot === null) return addReply(game, message, `Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.name}.`);
                    }
                    newArgs = parsedInput.split(' ');
                    newArgs.splice(newArgs.length - 1, 1);
                    parsedInput = newArgs.join(' ');
                    break;
                }
            }
        }
    }

    // Now decide what the container should be.
    let container = null;
    let slotName = "";
    if (fixture !== null && fixture.childPuzzle === null && containerItem === null)
        container = fixture;
    else if (fixture !== null && fixture.childPuzzle !== null && (fixture.childPuzzle.type === "weight" || fixture.childPuzzle.type === "container" || fixture.childPuzzle.accessible && fixture.childPuzzle.solved || player.hidingSpot === fixture.name) && containerItem === null)
        container = fixture.childPuzzle;
    else if (containerItem !== null) {
        container = containerItem;
        if (containerItemSlot === null) containerItemSlot = containerItem.inventory[0];
        slotName = containerItemSlot.id;
        if (item.prefab.size > containerItemSlot.capacity && container.inventory.length !== 1) return addReply(game, message, `${item.name} will not fit in ${containerItemSlot.id} of ${container.name} because it is too large.`);
        else if (item.prefab.size > containerItemSlot.capacity) return addReply(game, message, `${item.name} will not fit in ${container.name} because it is too large.`);
        else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity && container.inventory.length !== 1) return addReply(game, message, `${item.name} will not fit in ${containerItemSlot.id} of ${container.name} because there isn't enough space left.`);
        else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity) return addReply(game, message, `${item.name} will not fit in ${container.name} because there isn't enough space left.`);
    }
    else {
        if (parsedInput !== "") return addReply(game, message, `Couldn't find "${parsedInput}" to drop item into.`);
        const defaultDropOpject = fixtures.find(fixture => fixture.name === game.settings.defaultDropFixture);
        if (defaultDropOpject === null || defaultDropOpject === undefined) return addReply(game, message, `You cannot drop items in this room.`);
        container = defaultDropOpject;
    }

    let topContainer = container;
    while (topContainer !== null && topContainer instanceof RoomItem)
        topContainer = topContainer.container;

    if (topContainer !== null) {
        let topContainerPreposition = "in";
        if (topContainer instanceof Fixture && topContainer.preposition !== "") topContainerPreposition = topContainer.preposition;
        if (topContainer instanceof Fixture && topContainer.autoDeactivate && topContainer.activated)
            return addReply(game, message, `You cannot put items ${topContainerPreposition} ${topContainer.name} while it is turned on.`);
    }
    const hiddenStatus = player.getAttributeStatusEffects("hidden");
    if (hiddenStatus.length > 0) {
        if (topContainer !== null && topContainer instanceof Puzzle)
            topContainer = topContainer.parentFixture;

        if (topContainer === null || topContainer instanceof Fixture && topContainer.name !== player.hidingSpot)
            return addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
    }

    const action = new DropAction(game, message, player, player.location, false);
    action.performDrop(item, hand, container, slotName);
}
