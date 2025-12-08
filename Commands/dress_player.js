import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";

/** @type {CommandConfig} */
export const config = {
    name: "dress_player",
    description: "Takes and equips all items from a container.",
    details: "Takes all items from a container of your choosing and equips them, if possible. You must have a free hand to take an item. "
        + "Items will be equipped in the order in which they appear in the game's data, which may not be obvious upon inspecting the container. "
        + "If an item is equippable to an equipment slot, but you already have something equipped to that slot, it will not be equipped, "
        + "and you will not be notified when this happens. If the container you choose has multiple inventory slots, you can specify which "
        + "slot to dress from. Otherwise, you will dress from all slots.",
    usableBy: "Player",
    aliases: ["dress", "redress"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}dress wardrobe\n`
        + `${settings.commandPrefix}dress laundry basket\n`
        + `${settings.commandPrefix}redress main pocket of backpack`;
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
        return messageHandler.addReply(game, message, `You need to specify a container with items. Usage:\n${usage(game.settings)}`);

    const status = player.getAttributeStatusEffects("disable dress");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[0].name}**.`);

    // First, check if the player has a free hand.
    var hand = "";
    for (var handSlot = 0; handSlot < player.inventory.length; handSlot++) {
        if (player.inventory[handSlot].name === "RIGHT HAND" && player.inventory[handSlot].equippedItem === null) {
            hand = "RIGHT HAND";
            break;
        }
        else if (player.inventory[handSlot].name === "LEFT HAND" && player.inventory[handSlot].equippedItem === null) {
            hand = "LEFT HAND";
            break;
        }
        // If it's reached the left hand and it has an equipped item, both hands are taken. Stop looking.
        else if (player.inventory[handSlot].name === "LEFT HAND")
            break;
    }
    if (hand === "") return messageHandler.addReply(game, message, "You do not have a free hand to take an item. Either drop an item you're currently holding or stash it in one of your equipped items.");

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var container = null;
    var slotName = "";
    // Check if the player specified an object.
    const objects = game.objects.filter(object => object.location.name === player.location.name && object.accessible);
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].name === parsedInput) {
            container = objects[i];
            // Check if the object has a puzzle attached to it.
            if (container.childPuzzle !== null && container.childPuzzle.type !== "weight" && container.childPuzzle.type !== "container" && (!container.childPuzzle.accessible || !container.childPuzzle.solved) && player.hidingSpot !== container.name)
                return messageHandler.addReply(game, message, `You cannot take items from ${container.name} right now.`);
            else if (container.childPuzzle !== null)
                container = objects[i].childPuzzle;
            break;
        }
    }

    // Check if the player specified a container item.
    var items = game.items.filter(item => item.location.name === player.location.name && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    if (container === null) {
        for (let i = 0; i < items.length; i++) {
            if (parsedInput.endsWith(items[i].name)) {
                container = items[i];
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                // Check if a slot was specified.
                if (parsedInput.endsWith(" OF")) {
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                    for (let slot = 0; slot < container.inventory.length; slot++) {
                        if (parsedInput.endsWith(container.inventory[slot].name)) {
                            slotName = container.inventory[slot].name;
                            parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(container.inventory[slot].name)).trimEnd();
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
    while (topContainer !== null && topContainer.hasOwnProperty("inventory"))
        topContainer = topContainer.container;

    if (topContainer !== null) {
        if (topContainer.hasOwnProperty("hidingSpotCapacity") && topContainer.autoDeactivate && topContainer.activated)
            return messageHandler.addReply(game, message, `You cannot take items from ${topContainer.name} while it is turned on.`);
    }
    const hiddenStatus = player.getAttributeStatusEffects("hidden");
    if (hiddenStatus.length > 0) {
        if (topContainer !== null && topContainer.hasOwnProperty("parentObject"))
            topContainer = topContainer.parentObject;

        if (topContainer === null || topContainer.hasOwnProperty("hidingSpotCapacity") && topContainer.name !== player.hidingSpot)
            return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].name}**.`);
    }

    // Get all items in this container.
    var containerItems = [];
    if (container.hasOwnProperty("hidingSpotCapacity"))
        containerItems = items.filter(item => item.containerName === `Object: ${container.name}` && item.prefab.equippable);
    else if (container.hasOwnProperty("solved"))
        containerItems = items.filter(item => item.containerName === `Puzzle: ${container.name}` && item.prefab.equippable);
    else if (container.hasOwnProperty("inventory") && slotName !== "")
        containerItems = items.filter(item => item.containerName === `Item: ${container.identifier}/${slotName}` && item.prefab.equippable);
    else if (container.hasOwnProperty("inventory") && slotName === "")
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
                if (containerItems[i].prefab.equipmentSlots[j] === player.inventory[k].name) {
                    // Ensure that this item will only be equipped once if it can be equipped to multiple slots.
                    if (equipped) continue;
                    // If something is already equipped to this equipment slot, move on.
                    if (player.inventory[k].equippedItem !== null) break;
                    // Take the item and equip it.
                    player.take(game, containerItems[i], hand, container, containerItems[i].slot, false);
                    player.equip(game, player.inventory[handSlot].equippedItem, player.inventory[k].name, hand, game.botContext, false);
                    equipped = true;
                }
            }
        }
    }

    player.notify(game, `You dress.`);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is an Object.
    if (container.hasOwnProperty("hidingSpotCapacity"))
        messageHandler.addLogMessage(game, `${time} - ${player.name} dressed from ${container.name} in ${player.location.channel}`);
    // Container is a Puzzle.
    else if (container.hasOwnProperty("solved")) {
        messageHandler.addLogMessage(game, `${time} - ${player.name} dressed from ${container.name} in ${player.location.channel}`);
        // Container is a weight puzzle.
        if (container.type === "weight") {
            const weightItems = game.items.filter(item => item.location.name === container.location.name && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
            const weight = weightItems.reduce((total, item) => total + item.quantity * item.weight, 0);
            const misc = {
                command: "take",
                input: input
            };
            player.attemptPuzzle(game.botContext, game, container, null, weight.toString(), "take", misc);
        }
        // Container is a container puzzle.
        else if (container.hasOwnProperty("solved") && container.type === "container") {
            const containerItems = game.items.filter(item => item.location.name === container.location.name && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0).sort(function (a, b) {
                if (a.prefab.id < b.prefab.id) return -1;
                if (a.prefab.id > b.prefab.id) return 1;
                return 0;
            });
            const misc = {
                command: "take",
                input: input
            };
            player.attemptPuzzle(game.botContext, game, container, item, containerItems, "take", misc);
        }
    }
    // Container is an Item.
    else if (container.hasOwnProperty("inventory") && slotName !== "")
        messageHandler.addLogMessage(game, `${time} - ${player.name} dressed from ${slotName} of ${container.identifier} in ${player.location.channel}`);
    else if (container.hasOwnProperty("inventory") && slotName === "")
        messageHandler.addLogMessage(game, `${time} - ${player.name} dressed from ${container.identifier} in ${player.location.channel}`);

    return;
}
