import EquipAction from '../Data/Actions/EquipAction.js';
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

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
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return addReply(game, message, `You need to specify a player and an item. Usage:\n${usage(game.settings)}`);

    const player = game.entityFinder.getLivingPlayer(args[0].toLowerCase().replace(/'s/g, ""));
    if (player === undefined) return addReply(game, message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    const input = args.join(' ');
    const parsedInput = input.toUpperCase().replace(/\'/g, "");
    const newArgs = parsedInput.split(" TO ");
    const itemName = newArgs[0].trim();
    let slotName = newArgs[1] ? newArgs[1] : "";

    // First, find the item in the player's inventory.
    const [hand, item] = game.entityFinder.getPlayerHandHoldingItem(player, itemName, true);
    if (item === undefined) return addReply(game, message, `Couldn't find item "${itemName}" in either of ${player.name}'s hands.`);

    // If no slot name was given, pick the first one this item can be equipped to.
    if (slotName === "") slotName = item.prefab.equipmentSlots[0];

    let slot = player.inventoryCollection.get(slotName);
    if (slot === undefined) return addReply(game, message, `Couldn't find equipment slot "${slotName}".`);
    if (slot.equippedItem !== null) return addReply(game, message, `Cannot equip items to ${slotName} because ${slot.equippedItem.getIdentifier()} is already equipped to it.`);

    const action = new EquipAction(game, message, player, player.location, true);
    action.performEquip(item, slot, hand);
    addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully equipped ${item.getIdentifier()} to ${player.name}'s ${slotName}.`);
}
