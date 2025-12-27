import GameSettings from '../Classes/GameSettings.js';
import UnequipAction from '../Data/Actions/UnequipAction.js';
import Game from '../Data/Game.js';
import InventoryItem from '../Data/InventoryItem.js';
import Player from '../Data/Player.js';
import { addReply } from '../Modules/messageHandler.js';

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
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return addReply(game, message, `You need to specify an item. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable unequip");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    // First, check if the player has a free hand.
    const hand = game.entityFinder.getPlayerFreeHand(player);
    if (hand === undefined) return addReply(game, message, "You do not have a free hand to unequip an item. Either drop an item you're currently holding or stash it in one of your equipped items.");

    const input = args.join(' ');
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    const slotRegex = / FROM (.+)$/
    let slotName = parsedInput.match(slotRegex)[0];
    if (slotName === "RIGHT HAND" || slotName === "LEFT HAND")
        return addReply(game, message, `Cannot unequip items from either of ${player.name}'s hands. To get rid of this item, use the drop command.`);
    let slot = player.inventoryCollection.get(slotName);
    /** @type {InventoryItem} */
    let item;
    let itemName;
    if (slot !== undefined) {
        if (slot.equippedItem === null) return addReply(game, message, `Nothing is equipped to ${slotName}.`);
        itemName = parsedInput.substring(0, parsedInput.lastIndexOf(` FROM ${slotName}`)).trim();
        item = game.entityFinder.getPlayerSlotWithItem(player, itemName, slot, true, false, false)[1];
    } else {
        [slot, item] = game.entityFinder.getPlayerSlotWithItem(player, parsedInput, null, true, false, false);
    }

    if (item === undefined) {
        if (itemName) return addReply(game, message, `Couldn't find "${itemName}" equipped to ${slotName}.`);
        else return addReply(game, message, `Couldn't find equipped item "${parsedInput}".`);
    } else if (slot === undefined) {
        if (!slotName) slotName = parsedInput.substring(parsedInput.lastIndexOf(" FROM ") + " FROM ".length).trim();
        else return addReply(game, message, `Couldn't find equipment slot "${slotName}".`)
    } else if (slot.id === "RIGHT HAND" || slot.id === "LEFT HAND")
        return addReply(game, message, `Cannot unequip items from either of ${player.name}'s hands. To get rid of this item, use the drop command.`);
    else if (!item.prefab.equippable) 
        return addReply(game, message, `You cannot unequip the ${item.name}.`);

    const action = new UnequipAction(game, message, player, player.location, false);
    action.performUnequip(item, slot, hand);
}
