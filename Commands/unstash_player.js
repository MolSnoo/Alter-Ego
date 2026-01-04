import UnstashAction from '../Data/Actions/UnstashAction.js';
import InventoryItem from '../Data/InventoryItem.js';
import { addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */
/** @typedef {import('../Data/InventorySlot.js').default} InventorySlot*/

/** @type {CommandConfig} */
export const config = {
    name: "unstash_player",
    description: "Moves an inventory item into your hand.",
    details: "Moves an inventory item from another item in your inventory into your hand. You can specify which item to remove it from, if you have "
        + "multiple items with the same name. If the inventory item you choose to move it from has multiple slots for items (such as multiple pockets), "
        + "you can specify which slot you want to take it from as well. If you attempt to unstash a very large item (a sword, for example), "
        + "people in the room with you will see you doing so.",
    usableBy: "Player",
    aliases: ["unstash", "retrieve", "r"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}unstash laptop\n`
        + `${settings.commandPrefix}retrieve sword from sheath\n`
        + `${settings.commandPrefix}unstash old key from right pocket of pants\n`
        + `${settings.commandPrefix}retrieve water bottle from side pouch of backpack`;
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

    const status = player.getBehaviorAttributeStatusEffects("disable unstash");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    // First, check if the player has a free hand.
    const hand = game.entityFinder.getPlayerFreeHand(player);
    if (hand === undefined) return addReply(game, message, "You do not have a free hand to retrieve an item. Either drop an item you're currently holding or stash it in one of your equipped items.");
    
    const input = args.join(' ');
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    let item = null;
    let container = null;
    let slotName = "";
    let slot = null;
    const playerItems = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null && (item.quantity > 0 || isNaN(item.quantity)));
    for (let i = 0; i < playerItems.length; i++) {
        // If parsedInput is only the item's name, we've found the item.
        if (playerItems[i].name === parsedInput) {
            item = playerItems[i];
            container = playerItems[i].container;
            if (playerItems[i].container === null) continue;
            slotName = playerItems[i].slot;
            slot = container.inventoryCollection.get(slotName);
            break;
        }
        // A container was specified.
        if (parsedInput.startsWith(`${playerItems[i].name} FROM `)) {
            const containerName = parsedInput.substring(`${playerItems[i].name} FROM `.length).trim();
            if (playerItems[i].container !== null) {
                // Slot name was specified.
                if (containerName.endsWith(` OF ${playerItems[i].container.name}`)) {
                    const tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${playerItems[i].container.name}`));
                    if (playerItems[i].container instanceof InventoryItem) {
                        for (const id of playerItems[i].container.inventoryCollection.keys()) {
                            if (id === tempSlotName && playerItems[i].slot === tempSlotName) {
                                item = playerItems[i];
                                container = playerItems[i].container;
                                slotName = tempSlotName;
                                slot = container.inventoryCollection.get(slotName);
                                break;
                            }
                        }
                    }
                    if (item !== null) break;
                }
                // Only a container name was specified.
                else if (playerItems[i].container.name === containerName) {
                    item = playerItems[i];
                    container = playerItems[i].container;
                    slotName = playerItems[i].slot;
                    slot = container.inventoryCollection.get(slotName);
                    break;
                }
            }
        }
    }
    if (item === null) {
        if (parsedInput.includes(" FROM ")) {
            const itemName = parsedInput.substring(0, parsedInput.indexOf(" FROM "));
            const containerName = parsedInput.substring(parsedInput.indexOf(" FROM ") + " FROM ".length);
            return addReply(game, message, `Couldn't find "${containerName}" in your inventory containing "${itemName}".`);
        }
        else return addReply(game, message, `Couldn't find item "${parsedInput}" in your inventory.`);
    }
    if (item !== null && !container) return addReply(game, message, `${item.name} is not contained in another item and cannot be unstashed.`);

    const action = new UnstashAction(game, message, player, player.location, false);
    action.performUnstash(item, hand, container, slot);
}
