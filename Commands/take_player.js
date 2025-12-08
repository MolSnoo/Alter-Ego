import GameSettings from '../Classes/GameSettings.js';
import { default as Fixture } from '../Data/Object.js';
import Game from '../Data/Game.js';
import Item from '../Data/Item.js';
import Player from '../Data/Player.js';
import Puzzle from "../Data/Puzzle.js";
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";
import Narration from '../Data/Narration.js';

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
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 * @param {Player} player 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify an item. Usage:\n${usage(game.settings)}`);

    const status = player.getAttributeStatusEffects("disable take");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    // First, check if the player has a free hand.
    var hand = "";
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].id === "RIGHT HAND" && player.inventory[slot].equippedItem === null) {
            hand = "RIGHT HAND";
            break;
        }
        else if (player.inventory[slot].id === "LEFT HAND" && player.inventory[slot].equippedItem === null) {
            hand = "LEFT HAND";
            break;
        }
        // If it's reached the left hand and it has an equipped item, both hands are taken. Stop looking.
        else if (player.inventory[slot].id === "LEFT HAND")
            break;
    }
    if (hand === "") return messageHandler.addReply(game, message, "You do not have a free hand to take an item. Either drop an item you're currently holding or stash it in one of your equipped items.");

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var item = null;
    var container = null;
    var slotName = "";
    const roomItems = game.items.filter(item => item.location.id === player.location.id && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    for (let i = 0; i < roomItems.length; i++) {
        // If parsedInput is only the item's name, we've found the item.
        if (roomItems[i].name === parsedInput) {
            item = roomItems[i];
            container = roomItems[i].container;
            slotName = roomItems[i].slot;
            break;
        }
        // A container was specified.
        if (parsedInput.startsWith(`${roomItems[i].name} FROM `)) {
            let containerName = parsedInput.substring(`${roomItems[i].name} FROM `.length).trim();
            if (roomItems[i].container !== null) {
                const roomItemContainer = roomItems[i].container;
                // Slot name was specified.
                if (containerName.endsWith(` OF ${roomItemContainer.name}`)) {
                    let tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${roomItemContainer.name}`));
                    if (roomItemContainer instanceof Item) {
                        for (let slot = 0; slot < roomItemContainer.inventory.length; slot++) {
                            if (roomItemContainer.inventory[slot].id === tempSlotName && roomItems[i].slot === tempSlotName) {
                                item = roomItems[i];
                                container = roomItemContainer;
                                slotName = tempSlotName;
                                break;
                            }
                        }
                    }
                    if (item !== null) break;
                }
                // A puzzle's parent object was specified.
                else if (roomItemContainer instanceof Puzzle && roomItemContainer.parentObject.name === containerName) {
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
        // Check if the player is trying to take an object.
        const objects = game.objects.filter(object => object.location.id === player.location.id && object.accessible);
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].name === parsedInput)
                return messageHandler.addReply(game, message, `The ${objects[i].name} is not an item.`);
        }
        // Otherwise, the item wasn't found.
        if (parsedInput.includes(" FROM ")) {
            let itemName = parsedInput.substring(0, parsedInput.indexOf(" FROM "));
            let containerName = parsedInput.substring(parsedInput.indexOf(" FROM ") + " FROM ".length);
            return messageHandler.addReply(game, message, `Couldn't find "${containerName}" containing "${itemName}".`);
        }
        else return messageHandler.addReply(game, message, `Couldn't find item "${parsedInput}" in the room.`);
    }
    // If no container was found, make the container the Room.
    if (item !== null && item.container === null)
        container = item.location;
    
    let topContainer = container;
    while (topContainer !== null && topContainer instanceof Item)
        topContainer = topContainer.container;

    if (topContainer !== null && topContainer instanceof Fixture && topContainer.autoDeactivate && topContainer.activated)
        return messageHandler.addReply(game, message, `You cannot take items from ${topContainer.name} while it is turned on.`);
    const hiddenStatus = player.getAttributeStatusEffects("hidden");
    if (hiddenStatus.length > 0) {
        if (topContainer !== null && topContainer instanceof Puzzle)
            topContainer = topContainer.parentObject;

        if (topContainer === null || topContainer instanceof Fixture && topContainer.name !== player.hidingSpot)
            return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
    }
    if (item.weight > player.maxCarryWeight) {
        player.notify(`You try to take ${item.singleContainingPhrase}, but it is too heavy.`);
        if (!item.prefab.discreet) new Narration(game, player, player.location, `${player.displayName} tries to take ${item.singleContainingPhrase}, but it is too heavy for ${player.pronouns.obj} to lift.`).send();
        return;
    }
    else if (player.carryWeight + item.weight > player.maxCarryWeight) return messageHandler.addReply(game, message, `You try to take ${item.singleContainingPhrase}, but you're carrying too much weight.`);

    player.take(item, hand, container, slotName);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is an Object or Puzzle.
    if (container instanceof Fixture || container instanceof Puzzle) {
        messageHandler.addLogMessage(game, `${time} - ${player.name} took ${item.identifier ? item.identifier : item.prefab.id} from ${container.name} in ${player.location.channel}`);
        // Container is a weight puzzle.
        if (container instanceof Puzzle && container.type === "weight") {
            const containerItems = game.items.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
            const weight = containerItems.reduce((total, item) => total + item.quantity * item.weight, 0);
            player.attemptPuzzle(container, item, weight.toString(), "take", input);
        }
        // Container is a container puzzle.
        else if (container instanceof Puzzle && container.type === "container") {
            const containerItems = game.items.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0).sort(function (a, b) {
                if (a.prefab.id < b.prefab.id) return -1;
                if (a.prefab.id > b.prefab.id) return 1;
                return 0;
            });
            player.attemptPuzzle(container, item, containerItems, "take", input);
        }
    }
    // Container is an Item.
    else if (container instanceof Item)
        messageHandler.addLogMessage(game, `${time} - ${player.name} took ${item.identifier ? item.identifier : item.prefab.id} from ${slotName} of ${container.identifier} in ${player.location.channel}`);
    // Container is a Room.
    else
        messageHandler.addLogMessage(game, `${time} - ${player.name} took ${item.identifier ? item.identifier : item.prefab.id} from ${player.location.channel}`);
        
    return;
}
