import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "equip_moderator",
    description: "Equips an item for a player.",
    details: "Equips an item currently in the given player's hand. You can specify which equipment slot you want the item to be equipped to, if you want. "
        + "Any item (whether equippable or not) can be equipped to any slot using this command. People in the room will see the player equip an item, "
        + "regardless of its size.",
    usableBy: "Moderator",
    aliases: ["equip", "wear", "e"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}equip lavris's mask\n`
        + `${settings.commandPrefix}equip keiko lab coat\n`
        + `${settings.commandPrefix}equip cara's sweater to shirt\n`
        + `${settings.commandPrefix}equip aria large purse to glasses`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return messageHandler.addReply(game, message, `You need to specify a player and an item. Usage:\n${usage(game.settings)}`);

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
    var newArgs = parsedInput.split(" TO ");
    var itemName = newArgs[0].trim();
    var slotName = newArgs[1] ? newArgs[1] : "";

    // First, find the item in the player's inventory.
    var item = null;
    var hand = "";
    // Get references to the right and left hand equipment slots so we don't have to iterate through the player's inventory to find them every time.
    var rightHand = null;
    var leftHand = null;
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === "RIGHT HAND")
            rightHand = player.inventory[slot];
        else if (player.inventory[slot].name === "LEFT HAND")
            leftHand = player.inventory[slot];
    }
    // Check for the identifier first.
    if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.identifier !== "" && rightHand.equippedItem.identifier === itemName) {
        item = rightHand.equippedItem;
        hand = "RIGHT HAND";
    }
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.identifier !== "" && leftHand.equippedItem.identifier === itemName) {
        item = leftHand.equippedItem;
        hand = "LEFT HAND";
    }
    // Check for the prefab ID next.
    else if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.prefab.id === itemName) {
        item = rightHand.equippedItem;
        hand = "RIGHT HAND";
    }
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.prefab.id === itemName) {
        item = leftHand.equippedItem;
        hand = "LEFT HAND";
    }
    // Check for the name last.
    else if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.name === itemName) {
        item = rightHand.equippedItem;
        hand = "RIGHT HAND";
    }
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.name === itemName) {
        item = leftHand.equippedItem;
        hand = "LEFT HAND";
    }
    if (item === null) return messageHandler.addReply(game, message, `Couldn't find item "${itemName}" in either of ${player.name}'s hands.`);

    // If no slot name was given, pick the first one this item can be equipped to.
    if (slotName === "") slotName = item.prefab.equipmentSlots[0];

    let foundSlot = false;
    for (let i = 0; i < player.inventory.length; i++) {
        if (slotName && player.inventory[i].name === slotName) {
            foundSlot = true;
            if (player.inventory[i].equippedItem !== null) return messageHandler.addReply(game, message, `Cannot equip items to ${slotName} because ${player.inventory[i].equippedItem.identifier ? player.inventory[i].equippedItem.identifier : player.inventory[i].equippedItem.prefab.id} is already equipped to it.`);
        }
    }
    if (!foundSlot) return messageHandler.addReply(game, message, `Couldn't find equipment slot "${slotName}".`);

    player.equip(game, item, slotName, hand, game.botContext);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly equipped ${item.identifier ? item.identifier : item.prefab.id} to ${slotName} in ${player.location.channel}`);

    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully equipped ${item.identifier ? item.identifier : item.prefab.id} to ${player.name}'s ${slotName}.`);

    return;
}
