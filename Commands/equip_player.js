import GameSettings from '../Classes/GameSettings.js';
import EquipAction from '../Data/Actions/EquipAction.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import { addReply } from '../Modules/messageHandler.js';

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
        return addReply(game, message, `You need to specify an item. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable equip");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    const input = args.join(' ');
    const parsedInput = input.toUpperCase().replace(/\'/g, "");
    const newArgs = parsedInput.split(" TO ");
    const itemName = newArgs[0].trim();
    let slotName = newArgs[1] ? newArgs[1] : "";

    const [hand, item] = game.entityFinder.getPlayerHandHoldingItem(player, itemName, true, false, false, true, false);
    if (item === undefined) return addReply(game, message, `Couldn't find item "${itemName}" in either of your hands. If this item is elsewhere in your inventory, please unequip or unstash it before trying to equip it.`);
    if (!item.prefab.equippable || item.prefab.equipmentSlots.length === 0) return addReply(game, message, `${itemName} is not equippable.`);

    // If no slot name was given, pick the first one this item can be equipped to.
    if (slotName === "") slotName = item.prefab.equipmentSlots[0];
    if (!item.prefab.equipmentSlots.includes(slotName)) return addReply(game, message, `${itemName} can't be equipped to equipment slot ${slotName}.`);

    let slot = player.inventoryCollection.get(slotName);
    if (slot === undefined) return addReply(game, message, `Couldn't find equipment slot "${slotName}".`);
    if (slot.equippedItem !== null) return addReply(game, message, `Cannot equip items to ${slotName} because ${slot.equippedItem.name} is already equipped to it.`);

    const action = new EquipAction(game, message, player, player.location, false);
    action.performEquip(item, slot, hand);
}
