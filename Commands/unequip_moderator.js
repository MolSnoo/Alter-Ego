import UnequipAction from '../Data/Actions/UnequipAction.js';
import Game from '../Data/Game.js';

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
export function usage(settings) {
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
export async function execute(game, message, command, args) {
    if (args.length < 2)
        return game.communicationHandler.reply(message, `You need to specify a player and an item. Usage:\n${usage(game.settings)}`);

    const player = game.entityFinder.getLivingPlayer(args[0].toUpperCase().replace(/'S/g, ""));
    if (player === undefined) return game.communicationHandler.reply(message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    // First, check if the player has a free hand.
    const hand = game.entityFinder.getPlayerFreeHand(player);
    if (hand === undefined) return game.communicationHandler.reply(message, `${player.name} does not have a free hand to unequip an item.`);

    const split = Game.generateValidEntityName(args.join(' ')).split(' FROM ');
    let itemName = split[0].trim();
    let slotName = "";
    let item;
    let slot;
    if (split.length > 1) {
        slotName = split[1].trim();
    }

    if (slotName !== "") {
        slot = player.inventoryCollection.get(split[1]);
        if (slot === undefined)
            return game.communicationHandler.reply(message, `Couldn't find equipment slot "${split[1]}".`);
        else if (slot.equippedItem === null)
            return game.communicationHandler.reply(message, `Nothing is equipped to "${split[1]}".`);
        else if (slot.equippedItem.name !== itemName)
            return game.communicationHandler.reply(message, `Couldn't find "${itemName}" equipped to ${slotName}.`);
        item = slot.equippedItem;
    } else {
        slot = game.entityFinder.getPlayerEquipmentSlotWithEquippedItem(player, itemName, null, "player");
        if (slot === undefined)
            return game.communicationHandler.reply(message, `Couldn't find equipped item "${split[0]}".`);
        // slot.equippedItem will never be null, because slot.equippedItem.name resolves to itemName
        item = slot.equippedItem;
    }

    if (slot.id === "RIGHT HAND" || slot.id === "LEFT HAND")
        return game.communicationHandler.reply(message, `Cannot unequip items from either of ${player.name}'s hands. To get rid of this item, use the drop command.`);

    const action = new UnequipAction(game, message, player, player.location, false);
    action.performUnequip(item, slot, hand);
    game.communicationHandler.sendToCommandChannel(`Successfully unequipped ${item.getIdentifier()} from ${player.name}'s ${slot}.`);
}
