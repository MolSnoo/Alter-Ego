import UnequipAction from '../Data/Actions/UnequipAction.js';
import Game from '../Data/Game.js';
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/InventoryItem.js').default} InventoryItem */

/** @type {CommandConfig} */
export const config = {
    name: "unequip_moderator",
    description: "Unequips an item for a player.",
    details: "Unequips an item the given player currently has equipped. The unequipped item will be placed in one of the player's free hands. "
        + "You can specify which equipment slot you want the item to be unequipped from. Any item can be unequipped, whether it's equippable "
        + "or not. People in the room will see the player unequip an item, regardless of its size.",
    usableBy: "Moderator",
    aliases: ["unequip", "u"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}unequip lavris's mask\n`
        + `${settings.commandPrefix}unequip keiko lab coat\n`
        + `${settings.commandPrefix}unequip cara's sweater from shirt\n`
        + `${settings.commandPrefix}unequip aria large purse from glasses`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return addReply(game, message, `You need to specify a player and an item. Usage:\n${usage(game.settings)}`);

    const player = game.entityFinder.getLivingPlayer(args[0].replace(/'s/g, ""));
    if (player === undefined) return addReply(game, message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    // First, check if the player has a free hand.
    const hand = game.entityFinder.getPlayerFreeHand(player);
    if (hand === undefined) return addReply(game, message, `${player.name} does not have a free hand to unequip an item.`);

    const input = args.join(' ');
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    const slotRegex = / FROM (.+)$/
    let equipmentSlotId = parsedInput.match(slotRegex)[0];
    if (equipmentSlotId === "RIGHT HAND" || equipmentSlotId === "LEFT HAND")
        return addReply(game, message, `Cannot unequip items from either of ${player.name}'s hands. To get rid of this item, use the drop command.`);
    let equipmentSlot = player.inventoryCollection.get(Game.generateValidEntityName(equipmentSlotId));
    if (equipmentSlot === undefined && !equipmentSlotId) {
        equipmentSlotId = parsedInput.substring(parsedInput.lastIndexOf(" FROM ") + " FROM ".length).trim();
        return addReply(game, message, `Couldn't find equipment slot "${equipmentSlotId}".`)
    }

    let itemIdentifier;
    if (equipmentSlot !== undefined) {
        if (equipmentSlot.equippedItem === null) return addReply(game, message, `Nothing is equipped to ${equipmentSlotId}.`);
        itemIdentifier = parsedInput.substring(0, parsedInput.lastIndexOf(` FROM ${equipmentSlotId}`)).trim();
        equipmentSlot = game.entityFinder.getPlayerEquipmentSlotWithEquippedItem(player, itemIdentifier, equipmentSlot.id);
    }
    else
        equipmentSlot = game.entityFinder.getPlayerEquipmentSlotWithEquippedItem(player, parsedInput);

    if (equipmentSlot === undefined) {
        if (itemIdentifier) return addReply(game, message, `Couldn't find "${itemIdentifier}" equipped to ${equipmentSlotId}.`);
        else return addReply(game, message, `Couldn't find equipped item "${parsedInput}".`);
    }

    const action = new UnequipAction(game, message, player, player.location, true);
    action.performUnequip(equipmentSlot.equippedItem, equipmentSlot, hand);
    addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully unequipped ${equipmentSlot.equippedItem.getIdentifier()} from ${player.name}'s ${equipmentSlotId}.`);
}
