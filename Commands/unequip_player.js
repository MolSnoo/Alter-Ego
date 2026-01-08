import UnequipAction from '../Data/Actions/UnequipAction.js';
import Game from '../Data/Game.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/InventoryItem.js').default} InventoryItem */
/** @typedef {import('../Data/Player.js').default} Player */

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
export function usage(settings) {
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
export async function execute(game, message, command, args, player) {
    if (args.length === 0)
        return game.communicationHandler.reply(message, `You need to specify an item. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable unequip");
    if (status.length > 0) return game.communicationHandler.reply(message, `You cannot do that because you are **${status[1].id}**.`);

    // First, check if the player has a free hand.
    const hand = game.entityFinder.getPlayerFreeHand(player);
    if (hand === undefined) return game.communicationHandler.reply(message, "You do not have a free hand to unequip an item. Either drop an item you're currently holding or stash it in one of your equipped items.");

    const input = args.join(' ');
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    const slotRegex = / FROM (.+)$/
    let equipmentSlotId = parsedInput.match(slotRegex)[0];
    if (equipmentSlotId === "RIGHT HAND" || equipmentSlotId === "LEFT HAND")
        return game.communicationHandler.reply(message, `You cannot unequip items from your hands. To get rid of this item, use the drop command.`);
    let equipmentSlot = player.inventoryCollection.get(Game.generateValidEntityName(equipmentSlotId));
    if (equipmentSlot === undefined && !equipmentSlotId) {
        equipmentSlotId = parsedInput.substring(parsedInput.lastIndexOf(" FROM ") + " FROM ".length).trim();
        return game.communicationHandler.reply(message, `Couldn't find equipment slot "${equipmentSlotId}".`);
    }

    let itemName;
    if (equipmentSlot !== undefined) {
        if (equipmentSlot.equippedItem === null) return game.communicationHandler.reply(message, `Nothing is equipped to ${equipmentSlotId}.`);
        itemName = parsedInput.substring(0, parsedInput.lastIndexOf(` FROM ${equipmentSlotId}`)).trim();
        equipmentSlot = game.entityFinder.getPlayerEquipmentSlotWithEquippedItem(player, itemName, equipmentSlot.id, "player");
    }
    else
        equipmentSlot = game.entityFinder.getPlayerEquipmentSlotWithEquippedItem(player, parsedInput, undefined, "player");

    if (equipmentSlot === undefined) {
        if (itemName) return game.communicationHandler.reply(message, `Couldn't find "${itemName}" equipped to ${equipmentSlotId}.`);
        else return game.communicationHandler.reply(message, `Couldn't find equipped item "${parsedInput}".`);
    }
    else if (!equipmentSlot.equippedItem.prefab.equippable) 
        return game.communicationHandler.reply(message, `You cannot unequip the ${equipmentSlot.equippedItem.name}.`);

    const action = new UnequipAction(game, message, player, player.location, false);
    action.performUnequip(equipmentSlot.equippedItem, equipmentSlot, hand);
}
