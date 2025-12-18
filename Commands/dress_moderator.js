import Fixture from "../Data/Fixture.js";
import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import RoomItem from "../Data/RoomItem.js";
import Puzzle from "../Data/Puzzle.js";
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "dress_moderator",
    description: "Takes and equips all items from a container for a player.",
    details: "Takes all items from a container of your choosing and equips them for the given player, if possible. They must "
        + "have a free hand to take an item. Items will be equipped in the order in which they appear on the spreadsheet. "
        + "If an item is equippable to an equipment slot, but the player already has something equipped to that slot, it will not be equipped, "
        + "and they will not be notified when this happens. If the container you choose has multiple inventory slots, you can specify which "
        + "slot to dress from. Otherwise, the player will dress from all slots.",
    usableBy: "Moderator",
    aliases: ["dress", "redress"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}dress ezekiel wardrobe\n`
        + `${settings.commandPrefix}dress kelly laundry basket\n`
        + `${settings.commandPrefix}redress luna main pocket of backpack`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {AEMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return messageHandler.addReply(game, message, `You need to specify a player and a container with items. Usage:\n${usage(game.settings)}`);

    let player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase().replace(/'s/g, "")) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);

    // First, check if the player has a free hand.
    let hand = "";
    let handSlot = 0;
    for (handSlot; handSlot < player.inventory.length; handSlot++) {
        if (player.inventory[handSlot].id === "RIGHT HAND" && player.inventory[handSlot].equippedItem === null) {
            hand = "RIGHT HAND";
            break;
        }
        else if (player.inventory[handSlot].id === "LEFT HAND" && player.inventory[handSlot].equippedItem === null) {
            hand = "LEFT HAND";
            break;
        }
        // If it's reached the left hand and it has an equipped item, both hands are taken. Stop looking.
        else if (player.inventory[handSlot].id === "LEFT HAND")
            break;
    }
    if (hand === "") return messageHandler.addReply(game, message, `${player.name} does not have a free hand to take an item.`);

    let input = args.join(' ');
    let parsedInput = input.toUpperCase().replace(/\'/g, "");

    let container = null;
    let slotName = "";
    // Check if the player specified a fixture.
    const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
    for (let i = 0; i < fixtures.length; i++) {
        if (fixtures[i].name === parsedInput) {
            container = fixtures[i];
            // Check if the fixture has a puzzle attached to it.
            if (container.childPuzzle !== null && container.childPuzzle.type !== "weight" && container.childPuzzle.type !== "container" && (!container.childPuzzle.accessible || !container.childPuzzle.solved) && player.hidingSpot !== container.name)
                return messageHandler.addReply(game, message, `Items cannot be taken from ${container.name} right now.`);
            else if (container.childPuzzle !== null)
                container = fixtures[i].childPuzzle;
            break;
        }
    }

    // Check if the player specified a container item.
    let items = game.items.filter(item => item.location.id === player.location.id && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    if (container === null) {
        for (let i = 0; i < items.length; i++) {
            if (parsedInput.endsWith(items[i].name)) {
                container = items[i];
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                // Check if a slot was specified.
                if (parsedInput.endsWith(" OF")) {
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                    for (let slot = 0; slot < container.inventory.length; slot++) {
                        if (parsedInput.endsWith(container.inventory[slot].id)) {
                            slotName = container.inventory[slot].id;
                            parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(container.inventory[slot].id)).trimEnd();
                            break;
                        }
                    }
                    if (slotName === "") return messageHandler.addReply(game, message, `Couldn't find "${parsedInput}" of ${container.name}.`);
                }
                break;
            }
        }
    }
    if (container === null) return messageHandler.addReply(game, message, `Couldn't find a container in the room named "${input}".`);

    let topContainer = container;
    while (topContainer !== null && topContainer instanceof RoomItem)
        topContainer = topContainer.container;

    if (topContainer !== null) {
        if (topContainer instanceof Fixture && topContainer.autoDeactivate && topContainer.activated)
            return messageHandler.addReply(game, message, `Items cannot be taken from ${topContainer.name} while it is turned on.`);
    }

    // Get all items in this container.
    let containerItems = [];
    if (container instanceof Fixture)
        containerItems = items.filter(item => item.containerName === `Object: ${container.name}` && item.prefab.equippable);
    else if (container instanceof Puzzle)
        containerItems = items.filter(item => item.containerName === `Puzzle: ${container.name}` && item.prefab.equippable);
    else if (container instanceof RoomItem && slotName !== "")
        containerItems = items.filter(item => item.containerName === `Item: ${container.identifier}/${slotName}` && item.prefab.equippable);
    else if (container instanceof RoomItem && slotName === "")
        containerItems = items.filter(item => item.containerName.startsWith(`Item: ${container.identifier}/`) && item.prefab.equippable);
    if (containerItems.length === 0)
        return messageHandler.addReply(game, message, `${container.name} has no equippable items.`);

    for (let i = 0; i < containerItems.length; i++) {
        // Player shouldn't be able to take items that they're not strong enough to carry.
        if (player.carryWeight + containerItems[i].weight > player.maxCarryWeight) continue;
        let equipped = false;
        // Look for the player's equipment slots that the current item can be equipped to.
        for (let j = 0; j < containerItems[i].prefab.equipmentSlots.length; j++) {
            for (let k = 0; k < player.inventory.length; k++) {
                if (containerItems[i].prefab.equipmentSlots[j] === player.inventory[k].id) {
                    // Ensure that this item will only be equipped once if it can be equipped to multiple slots.
                    if (equipped) continue;
                    // If something is already equipped to this equipment slot, move on.
                    if (player.inventory[k].equippedItem !== null) break;
                    // Take the item and equip it.
                    player.take(containerItems[i], hand, container, containerItems[i].slot, false);
                    player.equip(player.inventory[handSlot].equippedItem, player.inventory[k].id, hand, false);
                    equipped = true;
                }
            }
        }
    }

    player.notify(`You dress.`);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is a Fixture.
    if (container instanceof Fixture)
        messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly dressed from ${container.name} in ${player.location.channel}`);
    // Container is a Puzzle.
    else if (container instanceof Puzzle) {
        messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly dressed from ${container.name} in ${player.location.channel}`);
        // Container is a weight puzzle.
        if (container.type === "weight") {
            const weightItems = game.items.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
            const weight = weightItems.reduce((total, item) => total + item.quantity * item.weight, 0);
            player.attemptPuzzle(container, null, weight.toString(), "take", input);
        }
        // Container is a container puzzle.
        else if (container instanceof Puzzle && container.type === "container") {
            const containerItems = game.items.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0).sort(function (a, b) {
                if (a.prefab.id < b.prefab.id) return -1;
                if (a.prefab.id > b.prefab.id) return 1;
                return 0;
            }).map(item => item.prefab.id);
            player.attemptPuzzle(container, null, containerItems.join(','), "take", input);
        }
    }
    // Container is a RoomItem.
    else if (container instanceof RoomItem && slotName !== "")
        messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly dressed from ${slotName} of ${container.identifier} in ${player.location.channel}`);
    else if (container instanceof RoomItem && slotName === "")
        messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly dressed from ${container.identifier} in ${player.location.channel}`);
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully dressed ${player.name}.`);

    return;
}
