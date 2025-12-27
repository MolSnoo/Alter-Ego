import StashAction from '../Data/Actions/StashAction.js';
import Player from '../Data/Player.js';
import { addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "stash_player",
    description: "Stores an inventory item inside another inventory item.",
    details: "Moves an item from your hand to another item in your inventory. You can specify any item in your inventory "
        + "that has the capacity to hold items. If the inventory item you choose has multiple slots for items (such as multiple pockets), "
        + "you can specify which slot you want to store the item in. Note that each slot has a maximum capacity that it can hold, so if it's "
        + "too full or too small to contain the item you're trying to stash, you won't be able to stash it there. If you attempt to stash a "
        + "very large item (a sword, for example), people in the room with you will see you doing so.",
    usableBy: "Player",
    aliases: ["stash", "store", "s"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}stash laptop in satchel\n`
        + `${settings.commandPrefix}store sword in sheath\n`
        + `${settings.commandPrefix}stash old key in right pocket of pants\n`
        + `${settings.commandPrefix}store water bottle in side pouch of backpack`;
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
        return addReply(game, message, `You need to specify two items. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable stash");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    const input = args.join(' ');
    let parsedInput = input.toUpperCase().replace(/\'/g, "");
    let newArgs = parsedInput.split(' ');

    // Look for the container item.
    const items = game.inventoryItems.filter(item => item.player.name === player.name);
    let containerItem = null;
    let containerItemSlot = null;
    for (let i = 0; i < items.length; i++) {
        if (items[i].prefab !== null && parsedInput.endsWith(items[i].name) && parsedInput !== items[i].name) {
            containerItem = items[i];
            if (items[i].inventoryCollection.size === 0) continue;
            parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
            // Check if a slot was specified.
            if (parsedInput.endsWith(" OF")) {
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                newArgs = parsedInput.split(' ');
                for (const [id, slot] of containerItem.inventoryCollection) {
                    if (parsedInput.endsWith(id)) {
                        containerItemSlot = slot;
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(id)).trimEnd();
                        break;
                    }
                }
                if (containerItemSlot === null) return addReply(game, message, `Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.name}.`);
            }
            newArgs = parsedInput.split(' ');
            newArgs.splice(newArgs.length - 1, 1);
            parsedInput = newArgs.join(' ');
            break;
        }
        else if (parsedInput === items[i].name)
            return addReply(game, message, `You need to specify two items. Usage:\n${usage(game.settings)}`);
    }
    if (containerItem === null) return addReply(game, message, `Couldn't find container item "${newArgs[newArgs.length - 1]}".`);
    else if (containerItem.inventoryCollection.size === 0) return addReply(game, message, `${containerItem.name} cannot hold items. Contact a moderator if you believe this is a mistake.`);

    // Now find the item in the player's inventory.
    const [hand, item] = game.entityFinder.getPlayerHandHoldingItem(player, parsedInput, true, true, true, true, false);
    if (item === undefined) return addReply(game, message, `Couldn't find item "${parsedInput}" in either of your hands. If this item is elsewhere in your inventory, please unequip or unstash it before trying to stash it.`);
    // Make sure item and containerItem aren't the same item.
    if (item.row === containerItem.row) return addReply(game, message, `You can't stash ${item.name} ${item.prefab.preposition} itself.`);

    if (containerItemSlot === null) [containerItemSlot] = containerItem.inventoryCollection.values();
    if (item.prefab.size > containerItemSlot.capacity && containerItem.inventoryCollection.size !== 1) return addReply(game, message, `${item.name} will not fit in ${containerItemSlot.id} of ${containerItem.name} because it is too large.`);
    else if (item.prefab.size > containerItemSlot.capacity) return addReply(game, message, `${item.name} will not fit in ${containerItem.name} because it is too large.`);
    else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity && containerItem.inventoryCollection.size !== 1) return addReply(game, message, `${item.name} will not fit in ${containerItemSlot.id} of ${containerItem.name} because there isn't enough space left.`);
    else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity) return addReply(game, message, `${item.name} will not fit in ${containerItem.name} because there isn't enough space left.`);

    const action = new StashAction(game, message, player, player.location, false);
    action.performStash(item, hand, containerItem, containerItemSlot);
}
