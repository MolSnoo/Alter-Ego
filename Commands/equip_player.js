import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "equip_player",
    description: "Equips an item.",
    details: "Equips an item currently in your hand. You can specify which equipment slot you want to equip the item to, if you want. "
        + "However, some items can only be equipped to certain equipment slots (for example, a mask can only be equipped to the FACE slot). "
        + "People in the room will see you equip an item, regardless of its size.",
    usableBy: "Player",
    aliases: ["equip", "wear", "e"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}equip mask\n`
        + `${settings.commandPrefix}wear coat\n`
        + `${settings.commandPrefix}equip sweater to shirt`;
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
        return messageHandler.addReply(game, message, `You need to specify an item. Usage:\n${usage(game.settings)}`);

    const status = player.getAttributeStatusEffects("disable equip");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");
    var newArgs = parsedInput.split(" TO ");
    var itemName = newArgs[0].trim();
    var slotName = newArgs[1] ? newArgs[1] : "";

    var item = null;
    var hand = "";
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].id === "RIGHT HAND" && player.inventory[slot].equippedItem !== null && player.inventory[slot].equippedItem.name === itemName) {
            item = player.inventory[slot].equippedItem;
            hand = "RIGHT HAND";
            break;
        }
        else if (player.inventory[slot].id === "LEFT HAND" && player.inventory[slot].equippedItem !== null && player.inventory[slot].equippedItem.name === itemName) {
            item = player.inventory[slot].equippedItem;
            hand = "LEFT HAND";
            break;
        }
        // If it's reached the left hand and it doesn't have the desired item, neither hand has it. Stop looking.
        else if (player.inventory[slot].id === "LEFT HAND")
            break;
    }
    if (item === null) return messageHandler.addReply(game, message, `Couldn't find item "${itemName}" in either of your hands. If this item is elsewhere in your inventory, please unequip or unstash it before trying to equip it.`);
    if (!item.prefab.equippable || item.prefab.equipmentSlots.length === 0) return messageHandler.addReply(game, message, `${itemName} is not equippable.`);

    // If no slot name was given, pick the first one this item can be equipped to.
    if (slotName === "") slotName = item.prefab.equipmentSlots[0];

    let foundSlot = false;
    for (let i = 0; i < player.inventory.length; i++) {
        if (slotName && player.inventory[i].id === slotName) {
            foundSlot = true;
            var acceptableSlot = false;
            for (let j = 0; j < item.prefab.equipmentSlots.length; j++) {
                if (item.prefab.equipmentSlots[j] === player.inventory[i].id) {
                    acceptableSlot = true;
                    break;
                }
            }
            if (!acceptableSlot) return messageHandler.addReply(game, message, `${itemName} can't be equipped to equipment slot ${slotName}.`);
            if (player.inventory[i].equippedItem !== null) return messageHandler.addReply(game, message, `Cannot equip items to ${slotName} because ${player.inventory[i].equippedItem.name} is already equipped to it.`);
        }
    }
    if (!foundSlot) return messageHandler.addReply(game, message, `Couldn't find equipment slot "${slotName}".`);

    player.equip(item, slotName, hand);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    messageHandler.addLogMessage(game, `${time} - ${player.name} equipped ${item.identifier ? item.identifier : item.prefab.id} to ${slotName} in ${player.location.channel}`);

    return;
}
