import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";

/** @type {CommandConfig} */
export const config = {
    name: "unequip_player",
    description: "Unequips an item.",
    details: "Unequips an item you currently have equipped. The unequipped item will be placed in your hand, so you must have a free hand. "
        + "You can specify which equipment slot you want to unequip the item from, if you want. People in the room will see you unequip an item, "
        + "regardless of its size.",
    usableBy: "Player",
    aliases: ["unequip", "u"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}unequip sweater\n`
        + `${settings.commandPrefix}unequip glasses from face`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {AEMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify an item. Usage:\n${usage(game.settings)}`);

    const status = player.getAttributeStatusEffects("disable unequip");
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
    if (hand === "") return messageHandler.addReply(game, message, "You do not have a free hand to unequip an item. Either drop an item you're currently holding or stash it in one of your equipped items.");

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var item = null;
    var slotName = "";
    for (let i = 0; i < player.inventory.length; i++) {
        if (parsedInput.endsWith(` FROM ${player.inventory[i].id}`)) {
            slotName = player.inventory[i].id;
            let itemName = parsedInput.substring(0, parsedInput.lastIndexOf(` FROM ${slotName}`)).trim();
            if (player.inventory[i].equippedItem === null) return messageHandler.addReply(game, message, `Nothing is equipped to ${slotName}.`);
            if (player.inventory[i].equippedItem.name === itemName) {
                item = player.inventory[i].equippedItem;
                break;
            }
            else return messageHandler.addReply(game, message, `Couldn't find "${itemName}" equipped to ${slotName}.`);
        }
        else if (player.inventory[i].equippedItem !== null && player.inventory[i].equippedItem.name === parsedInput) {
            item = player.inventory[i].equippedItem;
            slotName = player.inventory[i].id;
            break;
        }
    }
    if (slotName === "RIGHT HAND" || slotName === "LEFT HAND")
        return messageHandler.addReply(game, message, `You cannot unequip items from either of your hands. To get rid of this item, use the drop command.`);
    if (parsedInput.includes(" FROM ") && slotName === "") {
        slotName = parsedInput.substring(parsedInput.lastIndexOf(" FROM ") + " FROM ".length).trim();
        return messageHandler.addReply(game, message, `Couldn't find equipment slot "${slotName}".`);
    }
    if (item === null) return messageHandler.addReply(game, message, `Couldn't find equipped item "${parsedInput}".`);

    if (!item.prefab.equippable) return messageHandler.addReply(game, message, `You cannot unequip the ${item.name}.`);

    player.unequip(item, slotName, hand);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    messageHandler.addLogMessage(game, `${time} - ${player.name} unequipped ${item.identifier ? item.identifier : item.prefab.id} from ${slotName} in ${player.location.channel}`);

    return;
}
