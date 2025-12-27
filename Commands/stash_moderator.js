import StashAction from '../Data/Actions/StashAction.js';
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "stash_moderator",
    description: "Stores a player's inventory item inside another inventory item.",
    details: "Moves an item from the given player's hand to another item in their inventory. You can specify any item in their inventory "
        + "that has the capacity to hold items. If the inventory item you choose has multiple slots for items (such as multiple pockets), "
        + "you can specify which slot you want to store the item in. Note that each slot has a maximum capacity that it can hold, so if it's "
        + "too full or too small to contain the item you're trying to stash, you won't be able to stash it there. If you attempt to stash a "
        + "very large item (a sword, for example), people in the room with the player will see them doing so.",
    usableBy: "Moderator",
    aliases: ["stash", "store", "s"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}stash vivian laptop in satchel\n`
        + `${settings.commandPrefix}store nero's sword in sheath\n`
        + `${settings.commandPrefix}stash antimony's old key in right pocket of pants\n`
        + `${settings.commandPrefix}store cassie water bottle in side pouch of backpack`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 3)
        return addReply(game, message, `You need to specify a player and two items. Usage:\n${usage(game.settings)}`);

    const player = game.entityFinder.getLivingPlayer(args[0].toLowerCase().replace(/'s/g, ""));
    if (player === undefined) return addReply(game, message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    const input = args.join(' ');
    let parsedInput = input.toUpperCase().replace(/\'/g, "");
    let newArgs = parsedInput.split(' ');

    // Look for the container item.
    const items = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null);
    let containerItem = null;
    let containerItemSlot = null;
    for (let i = 0; i < items.length; i++) {
        if (items[i].identifier !== "" && parsedInput.endsWith(items[i].identifier) && parsedInput !== items[i].identifier ||
            parsedInput.endsWith(items[i].prefab.id) && parsedInput !== items[i].prefab.id ||
            parsedInput.endsWith(items[i].name) && parsedInput !== items[i].name) {
            containerItem = items[i];
            if (items[i].inventoryCollection.size === 0) continue;

            if (items[i].identifier !== "" && parsedInput.endsWith(items[i].identifier))
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].identifier)).trimEnd();
            else if (parsedInput.endsWith(items[i].prefab.id))
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].prefab.id)).trimEnd();
            else if (parsedInput.endsWith(items[i].name))
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
                if (containerItemSlot === null) return addReply(game, message, `Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier}.`);
            }
            newArgs = parsedInput.split(' ');
            newArgs.splice(newArgs.length - 1, 1);
            parsedInput = newArgs.join(' ');
            break;
        }
        else if (items[i].identifier !== "" && parsedInput === items[i].identifier ||
            parsedInput === items[i].prefab.id ||
            parsedInput === items[i].name) {
            addReply(game, message, `You need to specify two items. Usage:`);
            addGameMechanicMessage(game, game.guildContext.commandChannel, usage(game.settings));
            return;
        }
    }
    if (containerItem === null) return addReply(game, message, `Couldn't find container item "${newArgs[newArgs.length - 1]}".`);
    else if (containerItem.inventoryCollection.size === 0) return addReply(game, message, `${containerItem.prefab.id} cannot hold items.`);

    // Now find the item in the player's inventory.
    const [hand, item] = game.entityFinder.getPlayerHandHoldingItem(player, parsedInput, true, true, true, true, false);
    if (item === undefined) return addReply(game, message, `Couldn't find item "${parsedInput}" in either of ${player.name}'s hands.`);
    // Make sure item and containerItem aren't the same item.
    if (item.row === containerItem.row) return addReply(game, message, `Can't stash ${item.getIdentifier()} ${item.prefab.preposition} itself.`);

    if (containerItemSlot === null) [containerItemSlot] = containerItem.inventoryCollection.values();
    if (item.prefab.size > containerItemSlot.capacity && containerItem.inventoryCollection.size !== 1) return addReply(game, message, `${item.getIdentifier()} will not fit in ${containerItemSlot.id} of ${containerItem.identifier} because it is too large.`);
    else if (item.prefab.size > containerItemSlot.capacity) return addReply(game, message, `${item.getIdentifier()} will not fit in ${containerItem.identifier} because it is too large.`);
    else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity && containerItem.inventoryCollection.size !== 1) return addReply(game, message, `${item.getIdentifier()} will not fit in ${containerItemSlot.id} of ${containerItem.identifier} because there isn't enough space left.`);
    else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity) return addReply(game, message, `${item.getIdentifier()} will not fit in ${containerItem.identifier} because there isn't enough space left.`);

    const action = new StashAction(game, message, player, player.location, true);
    action.performStash(item, hand, containerItem, containerItemSlot);
    addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully stashed ${item.getIdentifier()} ${containerItem.prefab.preposition} ${containerItemSlot.id} of ${containerItem.identifier} for ${player.name}.`);
}
