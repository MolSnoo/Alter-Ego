import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "stash_moderator",
    description: "Stores a player's inventory item inside another inventory item.",
    details: "Moves an item from the given player's hand to another item in their inventory. You can specify any item in their inventory "
        + "that has the capacity to hold items. If the inventory item you choose has multiple slots for items (such as multiple pockets), "
        + "you can specify which slot you want to store the item in. Note that each slot has a maximum capacity that it can hold, so if it's "
        + "too full or too small to contain the item you're trying to stash, you won't be able to stash it there. If you attempt to stash a "
        + "very large item (a sword, for example), people in the room with the player will see them doing so.",
    usableBy: "Moderator",
    aliases: ["stash", "store", "s"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}stash vivian laptop in satchel\n`
        + `${settings.commandPrefix}store nero's sword in sheath\n`
        + `${settings.commandPrefix}stash antimony's old key in right pocket of pants\n`
        + `${settings.commandPrefix}store cassie water bottle in side pouch of backpack`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 3)
        return messageHandler.addReply(game, message, `You need to specify a player and two items. Usage:\n${usage(game.settings)}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase().replace(/'s/g, "")) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");
    var newArgs = parsedInput.split(' ');

    // Look for the container item.
    var items = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null);
    var containerItem = null;
    var containerItemSlot = null;
    for (let i = 0; i < items.length; i++) {
        if (items[i].identifier !== "" && parsedInput.endsWith(items[i].identifier) && parsedInput !== items[i].identifier ||
            parsedInput.endsWith(items[i].prefab.id) && parsedInput !== items[i].prefab.id ||
            parsedInput.endsWith(items[i].name) && parsedInput !== items[i].name) {
            containerItem = items[i];
            if (items[i].inventory.length === 0) continue;

            if (items[i].identifier !== "" && parsedInput.endsWith(items[i].identifier))
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].identifier)).trimEnd();
            else if (parsedInput.endsWith(items[i].prefab.id))
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].prefab.id)).trimEnd();
            else if (parsedInput.endsWith(items[i].name))
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
                if (containerItemSlot === null) return messageHandler.addReply(game, message, `Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier}.`);
            }
            newArgs = parsedInput.split(' ');
            var itemPreposition = newArgs[newArgs.length - 1].toLowerCase();
            newArgs.splice(newArgs.length - 1, 1);
            parsedInput = newArgs.join(' ');
            break;
        }
        else if (items[i].identifier !== "" && parsedInput === items[i].identifier ||
            parsedInput === items[i].prefab.id ||
            parsedInput === items[i].name) {
            messageHandler.addReply(game, message, `You need to specify two items. Usage:`);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, usage(game.settings));
            return;
        }
    }
    if (containerItem === null) return messageHandler.addReply(game, message, `Couldn't find container item "${newArgs[newArgs.length - 1]}".`);
    else if (containerItem.inventory.length === 0) return messageHandler.addReply(game, message, `${containerItem.prefab.id} cannot hold items.`);

    // Now find the item in the player's inventory.
    var item = null;
    var hand = "";
    // Get references to the right and left hand equipment slots so we don't have to iterate through the player's inventory to find them every time.
    var rightHand = null;
    var leftHand = null;
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].id === "RIGHT HAND")
            rightHand = player.inventory[slot];
        else if (player.inventory[slot].id === "LEFT HAND")
            leftHand = player.inventory[slot];
    }
    // Check for the identifier first.
    if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.identifier !== "" && rightHand.equippedItem.identifier === parsedInput) {
        item = rightHand.equippedItem;
        hand = "RIGHT HAND";
        parsedInput = parsedInput.substring(item.identifier.length).trim();
    }
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.identifier !== "" && leftHand.equippedItem.identifier === parsedInput) {
        item = leftHand.equippedItem;
        hand = "LEFT HAND";
        parsedInput = parsedInput.substring(item.identifier.length).trim();
    }
    // Check for the prefab ID next.
    else if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.prefab.id === parsedInput) {
        item = rightHand.equippedItem;
        hand = "RIGHT HAND";
        parsedInput = parsedInput.substring(item.prefab.id.length).trim();
    }
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.prefab.id === parsedInput) {
        item = leftHand.equippedItem;
        hand = "LEFT HAND";
        parsedInput = parsedInput.substring(item.prefab.id.length).trim();
    }
    // Check for the name last.
    else if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.name === parsedInput) {
        item = rightHand.equippedItem;
        hand = "RIGHT HAND";
        parsedInput = parsedInput.substring(item.name.length).trim();
    }
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.name === parsedInput) {
        item = leftHand.equippedItem;
        hand = "LEFT HAND";
        parsedInput = parsedInput.substring(item.name.length).trim();
    }
    if (item === null) return messageHandler.addReply(game, message, `Couldn't find item "${parsedInput}" in either of ${player.name}'s hands.`);
    // Make sure item and containerItem aren't the same item.
    if (item.row === containerItem.row) return messageHandler.addReply(game, message, `Can't stash ${item.identifier ? item.identifier : item.prefab.id} ${itemPreposition} itself.`);

    if (containerItemSlot === null) containerItemSlot = containerItem.inventory[0];
    if (item.prefab.size > containerItemSlot.capacity && containerItem.inventory.length !== 1) return messageHandler.addReply(game, message, `${item.identifier ? item.identifier : item.prefab.id} will not fit in ${containerItemSlot.id} of ${containerItem.identifier} because it is too large.`);
    else if (item.prefab.size > containerItemSlot.capacity) return messageHandler.addReply(game, message, `${item.identifier ? item.identifier : item.prefab.id} will not fit in ${containerItem.identifier} because it is too large.`);
    else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity && containerItem.inventory.length !== 1) return messageHandler.addReply(game, message, `${item.identifier ? item.identifier : item.prefab.id} will not fit in ${containerItemSlot.id} of ${containerItem.identifier} because there isn't enough space left.`);
    else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity) return messageHandler.addReply(game, message, `${item.identifier ? item.identifier : item.prefab.id} will not fit in ${containerItem.identifier} because there isn't enough space left.`);

    player.stash(item, hand, containerItem, containerItemSlot.id);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly stashed ${item.identifier ? item.identifier : item.prefab.id} ${containerItem.prefab.preposition} ${containerItemSlot.id} of ${containerItem.identifier} in ${player.location.channel}`);

    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully stashed ${item.identifier ? item.identifier : item.prefab.id} ${containerItem.prefab.preposition} ${containerItemSlot.id} of ${containerItem.identifier} for ${player.name}.`);

    return;
}
