import UnequipAction from '../Data/Actions/UnequipAction.ts';
import Game from '../Data/Game.ts';

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import InventoryItem from '../Data/InventoryItem.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "unequip_moderator",
    description: "Unequips an item for a player.",
    details: `Unequips an item from one of the given player's equipment slots. The item will be placed in their hand, `
        + `so they must have a free hand. When an item is unequipped, it will be narrated in the room, regardless of `
        + `whether it is discreet or not. If the item's prefab has any unequipped commands, they will be executed when `
        + `it is unequipped.\n\n`
        + `You can unequip any item with this command, even if its prefab is not equippable. You can also specify which `
        + `equipment slot to unequip the item from. To do so, enter "from" after the prefab ID or container identifier `
        + `of the item, followed by the ID of the equipment slot.\n\n`
        + `This command supports NPC latching. For more information, see the help details for the \`latch\` command.`,
    usableBy: "Moderator",
    aliases: ["unequip", "remove", "u"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}unequip Kyra's PLAGUE DOCTOR MASK\n`
        + `${settings.commandPrefix}remove Lain WHITE PARKA\n`
        + `${settings.commandPrefix}u Dexter KNIT WOOL SWEATER from SHIRT`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Moderator} moderator - The moderator who issued the command.
 */
export async function execute(game, message, command, args, moderator) {
    const sentMessageInLatchChannel = moderator?.sentMessageInLatchChannel(message) ?? false;
    if (!sentMessageInLatchChannel && args.length < 2)
        return game.communicationHandler.reply(message, `You need to specify a player and an item. Usage:\n${usage(game.settings)}`);
    if (sentMessageInLatchChannel && args.length < 1)
    return game.communicationHandler.reply(message, `You need to specify an item. Usage:\n${usage(game.settings)}`);

    let player = game.entityFinder.getLivingPlayer(args[0]?.replace(/'s/g, ""));
    if (player && !moderator.latchedPlayerHasName(args[0]))
        args.splice(0, 1);
    if (!player && sentMessageInLatchChannel)
        player = moderator.getLatch();
    if (player === undefined) return game.communicationHandler.reply(message, `Player "${args[0]}" not found.`);

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
        slot = player.inventory.get(split[1]);
        if (slot === undefined)
            return game.communicationHandler.reply(message, `Couldn't find equipment slot "${split[1]}".`);
        else if (slot.equippedItem === null)
            return game.communicationHandler.reply(message, `Nothing is equipped to "${split[1]}".`);
        else if (slot.equippedItem?.prefab?.id !== itemName && slot.equippedItem?.identifier !== itemName)
            return game.communicationHandler.reply(message, `Couldn't find "${itemName}" equipped to ${slotName}.`);
        item = slot.equippedItem;
    } else {
        slot = game.entityFinder.getPlayerEquipmentSlotWithEquippedItem(player, itemName);
        if (slot === undefined)
            return game.communicationHandler.reply(message, `Couldn't find equipped item "${split[0]}".`);
        // slot.equippedItem will never be null, because slot.equippedItem.name resolves to itemName
        item = slot.equippedItem;
    }

    if (slot.id === "RIGHT HAND" || slot.id === "LEFT HAND")
        return game.communicationHandler.reply(message, `Cannot unequip items from either of ${player.name}'s hands. To get rid of this item, use the drop command.`);

    const action = new UnequipAction(game, message, player, player.location, true);
    action.performUnequip(item, slot, hand);
    action.sendSuccessMessageToCommandChannel();
}
