import Game from "../Data/Game.js";
import Fixture from "../Data/Fixture.js";
import RoomItem from "../Data/RoomItem.js";
import Puzzle from "../Data/Puzzle.js";
import { destroyItem, destroyInventoryItem } from '../Modules/itemManager.js';
import { addGameMechanicMessage } from "../Modules/messageHandler.js";
import { itemIdentifierMatches } from "../Modules/matchers.js";
import { arSA } from "date-fns/locale";

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Player.js').default} Player */
/** @typedef {import('../Data/InventoryItem.js').default} InventoryItem */
/** @typedef {import('../Data/InventorySlot.js').default} InventorySlot */

/** @type {CommandConfig} */
export const config = {
    name: "destroy_bot",
    description: "Destroys an item.",
    details: "Destroys an item in the specified location or in the player's inventory. The prefab ID or container identifier of the item must be given. "
        + "In order to destroy an item, the name of the room must be given, following \"at\". The name of the container it belongs to can also be specified. "
        + "If the container is another item, the identifier of the item or its prefab ID must be used. "
        + "The name of the inventory slot to destroy the item from can also be specified.\n\n"
        + "To destroy an inventory item, \"player\", \"room\", \"all\", or the name of a player followed by \"'s\", must be given. A container item can also be specified, "
        + "as well as which slot to delete the item from. The player will not be notified if a container item is specified. "
        + "An equipment slot can also be specified instead of a container item. This will destroy whatever item is equipped to it. "
        + "The player will be notified in this case, and the item's unequipped commands will be run.\n\n"
        + "Note that using the \"all\" argument with a container will destroy all items in that container.",
    usableBy: "Bot",
    aliases: ["destroy"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `destroy volleyball at beach\n`
        + `destroy gasoline on shelves at warehouse\n`
        + `destroy note in locker 1 at mens locker room\n`
        + `destroy wrench in tool box at beach house\n`
        + `destroy gloves in breast pocket of tuxedo at dressing room\n`
        + `destroy all in trash can at lounge\n`
        + `destroy player keyboard\n`
        + `destroy all face\n`
        + `destroy vivians laptop in vivian's vivians satchel\n`
        + `destroy shotput ball in cassie's main pocket of large backpack\n`
        + `destroy all in hitoshi's trousers\n`
        + `destroy all in charlotte's right pocket of dress`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} [player] - The player who caused the command to be executed, if applicable. 
 * @param {Callee} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute (game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    if (args.length < 2) {
        addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    let newArgs = args.map((arg) => Game.generateValidEntityName(arg));

    const atIndex = newArgs.lastIndexOf("AT");
    const room = (atIndex > -1) ? game.entityFinder.getRoom(newArgs.slice(atIndex+1).join(" ")) : undefined;

    let destroyAll = (newArgs[0] === "ALL");
    // Room was found. Look for the container in it.
    if (room) {
        /** @type {RoomItem} */
        let item;
        /** @type {Fixture | Puzzle | RoomItem} */
        let container = null;
        /** @type {InventorySlot} */
        let slot;

        newArgs = newArgs.splice(0, atIndex);

        // Check if a container item was specified.
        const roomItems = game.entityFinder.getRoomItems(null, room.id);
        for (let i = 0; i < newArgs.length; i++) {
            let find = roomItems.find((item) => itemIdentifierMatches(item, newArgs.slice(i).join(" ")));
            if (find) {
                // If we have a complete slice of newArgs, we've found the item to delete.
                if (i === 0) {
                    item = find;
                    newArgs = newArgs.slice(0, i);
                    break;
                } else {
                    if (find.inventoryCollection.size === 0 || find.prefab.preposition === "")
                        return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${find.getIdentifier()} cannot hold items.`);
                    container = find;
                    newArgs = newArgs.slice(0, i);
                    break;
                }
            }
        }
        // Check if a slot was specified.
        if (container && newArgs.slice(-1)[0] === "OF" && container instanceof RoomItem) {
            newArgs = newArgs.slice(0, -1);
            for (const [id, collectionSlot] of container.inventoryCollection) {
                for (let i = 0; i < newArgs.length; i++) {
                    if (newArgs.slice(i).join(" ") === id) {
                        slot = collectionSlot;
                        newArgs = newArgs.slice(0, i);
                        break;
                    }
                }
                if (slot) break;
            }
            if (!slot) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs[newArgs.length - 1]}" of ${container.getIdentifier()}.`);
        }
        if (container && !slot && container instanceof RoomItem) {
            [slot] = container.inventoryCollection.values();
        }

        // Check if a fixture was specified.
        if (!container && !item) {
            const fixtures = game.entityFinder.getFixtures(null, room.id, true);
            for (let i = 0; i < newArgs.length; i++) {
                let find = fixtures.find((fixture) => fixture.name === newArgs.slice(i).join(" "));
                if (find) {
                    if (i === 0) {
                        return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". You need to supply an item and a preposition.`);
                    } else {
                        if (newArgs.slice(i - 1, i)[0] === "IN" || newArgs.slice(i - 1, i)[0] === find.preposition.toUpperCase()) {
                            container = find;
                            newArgs = newArgs.slice(0, i - 1);
                            break;
                        } else {
                            container = find;
                            newArgs = newArgs.slice(0, i);
                            break;
                        }
                    }
                }
            }
        }

        /** @type {RoomItem[]} */
        let containerItems = [];
         // Container is a Room.
        if (container === null)
            containerItems = roomItems;
        // Container is a Fixture.
        else if (container instanceof Fixture)
            containerItems = roomItems.filter(item => item.containerName === `Object: ${container.name}`);
        // Container is a Puzzle.
        else if (container instanceof Puzzle)
            containerItems = roomItems.filter(item => item.containerName === `Puzzle: ${container.name}`);
        // Container is a RoomItem.
        else if (container instanceof RoomItem)
            containerItems = roomItems.filter(item => item.containerName === `Item: ${container.identifier}/${slot.id}`);

        if (destroyAll) {
            newArgs.splice(0, 1);
            if (newArgs.length !== 0)
                return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs.join(" ")}" at ${room.id}`);
            for (const containerItem of containerItems)
                destroyItem(containerItem, containerItem.quantity, true);
        } else {
            // Find the item if it hasn't been found already.
            if (!item) {
                for (const containerItem of containerItems) {
                    if (itemIdentifierMatches(containerItem, newArgs.join(" "))) {
                        item = containerItem;
                        break;
                    }
                }
            }
            if (!item) return;

            destroyItem(item, item.quantity, true)
        }
    } else {
        /** @type {InventoryItem} */
        let item;
        /** @type {Player[]} */
        let players = [];
        // Iterate in reverse so that the "all" argument for players doesn't conflict with the "all" argument for items.
        for (let i = args.length - 1; i >= 0; i--) {
            let arg = args[i].toLowerCase().replace(/'s/g, "")
            if (arg === "player" && player !== null) {
                players.push(player);
                args.splice(i, 1);
                newArgs.splice(i, 1);
                break;
            } else if (arg === "room" && player !== null) {
                players = player.location.occupants;
                args.splice(i, 1);
                newArgs.splice(i, 1);
                break;
            } else if (arg === "all") {
                players = game.entityFinder.getLivingPlayers();
                args.splice(i, 1);
                newArgs.splice(i, 1);
                break;
            } else {
                const player = game.entityFinder.getLivingPlayer(arg);
                if (player) {
                    players.push(player);
                    args.splice(i, 1);
                    newArgs.splice(i, 1);
                    break;
                }
            }
        }
        if (players.length === 0) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find a room or player in your input.`);

        for (const player of players) {
            let gotoNext = false;
            // Check if an inventory item was specified.
            /** @type {InventoryItem} */
            let containerItem = null;
            /** @type {InventorySlot} */
            let containerItemSlot = null;
            const playerItems = player.inventoryCollection.filter(slot => slot.equippedItem && slot.equippedItem.prefab !== null && (slot.equippedItem.quantity > 0 || isNaN(slot.equippedItem.quantity))).map(slot => slot.equippedItem);
            for (let i = 0; i > newArgs.length; i++) {
                let find = playerItems.find((item) => itemIdentifierMatches(item, newArgs.slice(i).join(" ")));
                if (find) {
                    // If we have a complete slice of newArgs, we've found the item to delete.
                    if (i === 0) {
                        item = find;
                        newArgs = newArgs.slice(0, i);
                        break;
                    } else {
                        if (find.inventoryCollection.size === 0 || find.prefab.preposition === "")
                            return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${find.getIdentifier()} cannot hold items.`);
                        containerItem = find;
                        newArgs = newArgs.slice(0, i);
                        break;
                    }  
                }
            }
            // Check if a slot was specified.
            if (containerItem && newArgs.slice(-1)[0] === "OF") {
                newArgs = newArgs.slice(0, -1);
                for (const [id, collectionSlot] of containerItem.inventoryCollection) {
                    for (let i = 0; i < newArgs.length; i++) {
                        if (newArgs.slice(i).join(" ") === id) {
                            containerItemSlot = collectionSlot;
                            newArgs = newArgs.slice(0, i);
                            break;
                        }
                    }
                    if (containerItemSlot) break;
                }
                if (!containerItemSlot) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.getIdentifier()}.`);
            } else if (containerItem && !containerItemSlot) {
                [containerItemSlot] = containerItem.inventoryCollection.values();
            }
            if (containerItem && !containerItemSlot) {
                [containerItemSlot] = containerItem.inventoryCollection.values();
            }

            if (destroyAll) {
                newArgs.splice(0, 1);
            }

            let containerItems = [];
            let containerName = "";
            let preposition = "in";
            if (containerItem !== null) {
                containerItems = playerItems.filter(item => item.containerName === `${containerItem.identifier}/${containerItemSlot.id}`);
                containerName = `${containerItemSlot.id} of ${containerItem.identifier} in ${player.name}'s inventory`;
                preposition = containerItem.prefab.preposition ? containerItem.prefab.preposition : "in";

                if (destroyAll) {
                    for (const containerItem of containerItems)
                        destroyInventoryItem(containerItem, containerItem.quantity, true);
                    gotoNext = true;
                } else {
                    // Find the item if it hasn't been found already.
                    if (!item) {
                        for (const containerItem of containerItems) {
                            if (itemIdentifierMatches(containerItem, newArgs.join(" "))) {
                                item = containerItem;
                                break;
                            }
                        }
                        if (!item)
                            return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find item "${newArgs.join(" ")}" ${preposition} ${containerName}.`);
                    }
                }
            } else {
                // Check if an equipment slot was specified.
                let equipmentSlotName = "";
                if (player.inventoryCollection.has(newArgs.join(" "))) {
                    item = player.inventoryCollection.get(newArgs.join(" ")).equippedItem;
                    equipmentSlotName = newArgs.join(" ");
                    if (!item) gotoNext = true;
                    if (destroyAll) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". The "all" argument cannot be used when the container is an equipment slot.`);
                } else {
                    for (const [id, slot] of player.inventoryCollection) {
                        if (slot.equippedItem && itemIdentifierMatches(slot.equippedItem, newArgs.join(" "))) {
                            item = slot.equippedItem;
                            equipmentSlotName = id;
                            if (destroyAll) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". The "all" argument cannot be used when the container is an equipped item.`);
                            break;
                        }
                    }
                }
                if (item && equipmentSlotName !== "") {
                    destroyInventoryItem(item, item.quantity, true);
                    gotoNext = true;
                }
            }
            if (gotoNext) continue;

            if (item) destroyInventoryItem(item, item.quantity, true);
            else return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs.join(" ")}" in ${player.name}'s inventory.`);
        }
    }
}
