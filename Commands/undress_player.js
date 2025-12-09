import { default as Fixture } from "../Data/Object.js";
import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Item from "../Data/Item.js";
import Player from '../Data/Player.js';
import Puzzle from "../Data/Puzzle.js";
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";

/** @type {CommandConfig} */
export const config = {
    name: "undress_player",
    description: "Unequips and drops all items.",
    details: "Unequips all items you have equipped and drops them into a container of your choosing. If no container is chosen, then items will be "
        + `dropped on the floor. The given container must have a large enough capacity to hold all of the items in your `
        + "inventory. This command will also drop any items in your hands.",
    usableBy: "Player",
    aliases: ["undress"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}undress\n`
        + `${settings.commandPrefix}undress wardrobe\n`
        + `${settings.commandPrefix}undress laundry basket\n`
        + `${settings.commandPrefix}undress main pocket of backpack`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    const status = player.getAttributeStatusEffects("disable undress");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    let input = args.join(' ');
    let parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Check if the player specified an object.
    const objects = game.objects.filter(object => object.location.id === player.location.id && object.accessible);
    let object = null;
    if (parsedInput !== "") {
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].name === parsedInput && objects[i].preposition !== "") {
                object = objects[i];
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(objects[i].name)).trimEnd();
                // Check if the object has a puzzle attached to it.
                if (object.childPuzzle !== null && object.childPuzzle.type !== "weight" && object.childPuzzle.type !== "container" && (!object.childPuzzle.accessible || !object.childPuzzle.solved) && player.hidingSpot !== object.name)
                    return messageHandler.addReply(game, message, `You cannot put items ${object.preposition} ${object.name} right now.`);
                break;
            }
            else if (objects[i].name === parsedInput) return messageHandler.addReply(game, message, `${objects[i].name} cannot hold items. Contact a moderator if you believe this is a mistake.`);
        }
    }

    // Check if the player specified a container item.
    let items = game.items.filter(item => item.location.id === player.location.id && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    let containerItem = null;
    let containerItemSlot = null;
    if (parsedInput !== "") {
        for (let i = 0; i < items.length; i++) {
            if (parsedInput.endsWith(items[i].name)) {
                const itemContainer = items[i].container;
                if (object === null || object !== null && itemContainer !== null && (itemContainer.name === object.name || itemContainer instanceof Puzzle && itemContainer.parentObject.name === object.name)) {
                    if (items[i].inventory.length === 0) return messageHandler.addReply(game, message, `${items[i].name} cannot hold items. Contact a moderator if you believe this is a mistake.`);
                    containerItem = items[i];
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                    // Check if a slot was specified.
                    if (parsedInput.endsWith(" OF")) {
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                        for (let slot = 0; slot < containerItem.inventory.length; slot++) {
                            if (parsedInput.endsWith(containerItem.inventory[slot].id)) {
                                containerItemSlot = containerItem.inventory[slot];
                                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItemSlot.id)).trimEnd();
                                break;
                            }
                        }
                        if (containerItemSlot === null) return messageHandler.addReply(game, message, `Couldn't find "${parsedInput}" of ${containerItem.name}.`);
                    }
                    break;
                }
            }
        }
    }

    // Now decide what the container should be.
    let container = null;
    let slotName = "";
    if (object !== null && object.childPuzzle === null && containerItem === null)
        container = object;
    else if (object !== null && object.childPuzzle !== null && (object.childPuzzle.type === "weight" || object.childPuzzle.type === "container" || object.childPuzzle.accessible && object.childPuzzle.solved || player.hidingSpot === object.name) && containerItem === null)
        container = object.childPuzzle;
    else if (containerItem !== null) {
        container = containerItem;
        if (containerItemSlot === null) containerItemSlot = containerItem.inventory[0];
        slotName = containerItemSlot.id;
        let totalSize = 0;
        for (let i = 0; i < player.inventory.length; i++) {
            if (player.inventory[i].equippedItem !== null)
                totalSize += player.inventory[i].equippedItem.prefab.size;
        }
        if (totalSize > containerItemSlot.capacity && container.inventory.length !== 1) return messageHandler.addReply(game, message, `Your inventory will not fit in ${containerItemSlot.id} of ${container.name} because it is too large.`);
        else if (totalSize > containerItemSlot.capacity) return messageHandler.addReply(game, message, `Your inventory will not fit in ${container.name} because it is too large.`);
        else if (containerItemSlot.takenSpace + totalSize > containerItemSlot.capacity && container.inventory.length !== 1) return messageHandler.addReply(game, message, `Your inventory will not fit in ${containerItemSlot.id} of ${container.name} because there isn't enough space left.`);
        else if (containerItemSlot.takenSpace + totalSize > containerItemSlot.capacity) return messageHandler.addReply(game, message, `Your inventory will not fit in ${container.name} because there isn't enough space left.`);
    }
    else {
        if (parsedInput !== "") return messageHandler.addReply(game, message, `Couldn't find "${parsedInput}" to drop item into.`);
        const defaultDropOpject = objects.find(object => object.name === game.settings.defaultDropObject);
        if (defaultDropOpject === null || defaultDropOpject === undefined) return messageHandler.addReply(game, message, `You cannot drop items in this room.`);
        container = defaultDropOpject;
    }

    let topContainer = container;
    while (topContainer !== null && topContainer instanceof Item)
        topContainer = topContainer.container;

    if (topContainer !== null) {
        let topContainerPreposition = "in";
        if (topContainer instanceof Fixture && topContainer.preposition !== "") topContainerPreposition = topContainer.preposition;
        if (topContainer instanceof Fixture && topContainer.autoDeactivate && topContainer.activated)
            return messageHandler.addReply(game, message, `You cannot put items ${topContainerPreposition} ${topContainer.name} while it is turned on.`);
    }
    const hiddenStatus = player.getAttributeStatusEffects("hidden");
    if (hiddenStatus.length > 0) {
        if (topContainer !== null && topContainer instanceof Puzzle)
            topContainer = topContainer.parentObject;

        if (topContainer === null || topContainer instanceof Fixture && topContainer.name !== player.hidingSpot)
            return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
    }

    let rightHand = 0;
    // First, drop the items in the player's hands.
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].id === "RIGHT HAND") rightHand = slot;
        if (player.inventory[slot].id === "RIGHT HAND" && player.inventory[slot].equippedItem !== null)
            player.drop(player.inventory[slot].equippedItem, "RIGHT HAND", container, slotName, false);
        else if (player.inventory[slot].id === "LEFT HAND" && player.inventory[slot].equippedItem !== null)
            player.drop(player.inventory[slot].equippedItem, "LEFT HAND", container, slotName, false);
    }
    // Now, unequip all equipped items.
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].equippedItem !== null && player.inventory[slot].equippedItem.prefab.equippable) {
            player.unequip(player.inventory[slot].equippedItem, player.inventory[slot].id, "RIGHT HAND", false);
            player.drop(player.inventory[rightHand].equippedItem, "RIGHT HAND", container, slotName, false);
        }
    }

    player.notify(`You undress.`);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is an Object.
    if (container instanceof Fixture)
        messageHandler.addLogMessage(game, `${time} - ${player.name} undressed into ${container.name} in ${player.location.channel}`);
    // Container is a Puzzle.
    else if (container instanceof Puzzle) {
        messageHandler.addLogMessage(game, `${time} - ${player.name} undressed into ${container.name} in ${player.location.channel}`);
        // Container is a weight puzzle.
        if (container.type === "weight") {
            const containerItems = game.items.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
            const weight = containerItems.reduce((total, item) => total + item.quantity * item.weight, 0);
            player.attemptPuzzle(container, null, weight.toString(), "drop", input);
        }
        // Container is a container puzzle.
        else if (container.type === "container") {
            const containerItems = game.items.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0).sort(function (a, b) {
                if (a.prefab.id < b.prefab.id) return -1;
                if (a.prefab.id > b.prefab.id) return 1;
                return 0;
            }).map(item => item.prefab.id);
            player.attemptPuzzle(container, null, containerItems.join(','), "drop", input);
        }
    }
    // Container is an Item.
    else if (container instanceof Item)
        messageHandler.addLogMessage(game, `${time} - ${player.name} undressed into ${slotName} of ${container.identifier} in ${player.location.channel}`);

    return;
}
