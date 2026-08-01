import DestroyInventoryItemAction from "../Data/Actions/DestroyInventoryItemAction.ts";
import DestroyRoomItemAction from "../Data/Actions/DestroyRoomItemAction.ts";
import Game from "../Data/Game.ts";
import Fixture from "../Data/Fixture.ts";
import RoomItem from "../Data/RoomItem.ts";
import Puzzle from "../Data/Puzzle.ts";
import { itemIdentifierMatches } from "../Modules/matchers.ts";

/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Player from '../Data/Player.ts' */
/** @import InventoryItem from '../Data/InventoryItem.ts' */
/** @import InventorySlot from '../Data/InventorySlot.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "destroy_bot",
    description: "Destroys an item.",
    details: `Destroys an item in the specified location or in the player's inventory. `
        + `The prefab ID or container identifier of the item must be given.\n\n`
        + `To destroy a room item, the display name or ID of the room it's in must be given at the end of the command, following "at". `
        + `To destroy an inventory item, the name of the player must be given followed by \`'s\` before the item's identifier.\n\n`
        + `If, when destroying an inventory item, "player" is supplied instead of a player's name, then the given item will be `
        + `destroyed from the inventory of the player who caused this command to be executed. If "room" is supplied instead, then `
        + `the command will be executed on all players in the room as the initiating player. If "all" is supplied instead, then `
        + `the command will be executed on all living players, including NPCs and players with the Free Movement role.\n\n`
        + `It is possible to specify the container from which to destroy the item. To do so, add the container's preposition or "in" `
        + `after the item's identifier, followed by the container's name. If the container is another item, its identifier or prefab `
        + `ID must be used. The ID of the inventory slot to destroy the item from can also be specified, followed by "of". `
        + `If you enter "all" in place of an item's identifier and specify a container, all items in that container will be destroyed.\n\n`
        + `It is also possible to destroy an inventory item by specifying only the ID of the equipment slot it's equipped to `
        + `instead of the item's identifier. This will destroy whatever is equipped to that equipment slot.\n\n`
        + `Note that if you destroy an inventory item, the player will be notified if it is an item they have equipped, and its `
        + `unequipped commands will be executed. The player will not be notified if it is an item they have stashed.`,
    usableBy: "Bot",
    aliases: ["destroy", "ds"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `destroy VOLLEYBALL at beach\n`
        + `ds CAN OF GASOLINE on SHELVES at Warehouse\n`
        + `destroy NOTE in LOCKER 1 at Men's Locker Room\n`
        + `ds WRENCH in TOOL BOX 1 at beach-house\n`
        + `destroy WHITE GLOVES in BREAST POCKET of TUXEDO at dressing room\n`
        + `ds all in TRASH CAN at lounge\n`
        + `destroy player BLUE BIRD MUSIC BOX\n`
        + `ds all FACE\n`
        + `destroy room NUMBERED BRACELET`
        + `ds Vivian's VIVIANS LAPTOP in VIVIANS SATCHEL\n`
        + `destroy SHOTPUT BALL in Cassie's MAIN POCKET of LARGE BACKPACK 1\n`
        + `ds all in Hitoshi's HITOSHIS TROUSERS\n`
        + `destroy all in Evad's FRONT POCKET of DENIM OVERALLS 6`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Player} [player] - The player who caused the command to be executed, if applicable.
 * @param {Callee} [callee] - The in-game entity that caused the command to be executed, if applicable.
 */
export async function execute(game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    if (args.length < 2) {
        game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
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
        /** @type {InventorySlot<RoomItem>} */
        let containerItemSlot;

        newArgs = newArgs.splice(0, atIndex);

        // Check if a container item was specified.
        const roomItems = game.entityFinder.getRoomItems(null, room.id);
        for (let i = args.length - 1; i >= 0; i--) {
            let find = roomItems.find((item) => itemIdentifierMatches(item, newArgs.slice(i).join(" ")));
            if (find) {
                // If we have a complete slice of newArgs, we've found the item to delete.
                if (i === args.length - 1) {
                    item = find;
                    newArgs = newArgs.slice(0, i);
                    break;
                } else {
                    if (find.inventory.size === 0 || find.prefab.preposition === "")
                        return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${find.getIdentifier()} cannot hold items.`);
                    container = find;
                    newArgs = newArgs.slice(0, i);
                    break;
                }
            }
        }
        // Check if a slot was specified.
        if (container && newArgs.slice(-1)[0] === "OF" && container instanceof RoomItem) {
            newArgs = newArgs.slice(0, -1);
            for (const [id, collectionSlot] of container.inventory) {
                for (let i = 0; i < newArgs.length; i++) {
                    if (newArgs.slice(i).join(" ") === id) {
                        containerItemSlot = collectionSlot;
                        newArgs = newArgs.slice(0, i);
                        break;
                    }
                }
                if (containerItemSlot) break;
            }
            if (!containerItemSlot) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs[newArgs.length - 1]}" of ${container.getIdentifier()}.`);
        }
        if (container && !containerItemSlot && container instanceof RoomItem) {
            containerItemSlot = container.inventory.first();
        }

        // Check if a fixture was specified.
        if (!container && !item) {
            const fixtures = game.entityFinder.getFixtures(null, room.id, true);
            for (let i = 0; i < newArgs.length; i++) {
                let fixture = fixtures.find((fixture) => fixture.name === newArgs.slice(i).join(" "));
                if (fixture) {
                    if (i === 0) {
                        return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". You need to supply an item and a preposition.`);
                    } else {
                        if (newArgs.slice(i - 1, i)[0] === "IN" || newArgs.slice(i - 1, i)[0] === fixture.preposition.toUpperCase()) {
                            container = fixture;
                            newArgs = newArgs.slice(0, i - 1);
                            break;
                        } else {
                            container = fixture;
                            newArgs = newArgs.slice(0, i);
                            break;
                        }
                    }
                }
            }
        }
        if (container instanceof Fixture && container.childPuzzle !== null)
            container = container.childPuzzle;

        /** @type {RoomItem[]} */
        let containerItems = [];
         // Container is a Room.
        if (container === null)
            containerItems = roomItems;
        // Container is a Fixture.
        else if (container instanceof Fixture)
            containerItems = container.getContainedItems();
        // Container is a Puzzle.
        else if (container instanceof Puzzle)
            containerItems = container.getContainedItems();
        // Container is a RoomItem.
        else if (container instanceof RoomItem) {
            if (containerItemSlot) containerItems = containerItemSlot.getContainedItems();
            else containerItems = container.getContainedItems();
        }

        if (destroyAll) {
            newArgs.splice(0, 1);
            if (newArgs.length !== 0)
                return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs.join(" ")}" at ${room.id}`);
            for (const containerItem of containerItems) {
                const destroyAction = new DestroyRoomItemAction(game, undefined, undefined, room, true);
                destroyAction.performDestroyRoomItem(containerItem, containerItem.quantity, true);
            }
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

            const destroyAction = new DestroyRoomItemAction(game, undefined, undefined, room, true);
            destroyAction.performDestroyRoomItem(item, item.quantity, true);
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
        if (players.length === 0) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find a room or player in your input.`);

        for (const player of players) {
            let gotoNext = false;
            // Check if an inventory item was specified.
            /** @type {InventoryItem} */
            let containerItem = null;
            /** @type {InventorySlot<InventoryItem>} */
            let containerItemSlot = null;
            const playerItems = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null && (item.quantity > 0 || isNaN(item.quantity)));
            for (let i = 0; i < newArgs.length; i++) {
                let find = playerItems.find((item) => itemIdentifierMatches(item, newArgs.slice(i).join(" ")));
                if (find) {
                    // If we have a complete slice of newArgs, we've found the item to delete.
                    if (i === 0) {
                        item = find;
                        newArgs = newArgs.slice(0, i);
                        break;
                    } else {
                        if (find.inventory.size === 0 || find.prefab.preposition === "")
                            return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${find.getIdentifier()} cannot hold items.`);
                        containerItem = find;
                        newArgs = newArgs.slice(0, i);
                        break;
                    }
                }
            }
            // Check if a slot was specified.
            if (containerItem && newArgs.slice(-1)[0] === "OF") {
                newArgs = newArgs.slice(0, -1);
                for (const [id, collectionSlot] of containerItem.inventory) {
                    for (let i = 0; i < newArgs.length; i++) {
                        if (newArgs.slice(i).join(" ") === id) {
                            containerItemSlot = collectionSlot;
                            newArgs = newArgs.slice(0, i);
                            break;
                        }
                    }
                    if (containerItemSlot) break;
                }
                if (!containerItemSlot) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.getIdentifier()}.`);
            } else if (containerItem && !containerItemSlot) {
                containerItemSlot = containerItem.inventory.first();
            }
            if (containerItem && !containerItemSlot) {
                containerItemSlot = containerItem.inventory.first();
            }

            if (destroyAll) {
                newArgs.splice(0, 1);
            }

            /** @type {InventoryItem[]} */
            let containerItems = [];
            let containerName = "";
            let preposition = "in";
            if (containerItem !== null) {
                if (containerItemSlot) containerItems = containerItemSlot.getContainedItems();
                else containerItems = containerItem.getContainedItems();
                containerName = `${containerItemSlot.id} of ${containerItem.identifier} in ${player.name}'s inventory`;
                preposition = containerItem.getPreposition();

                if (destroyAll) {
                    for (const containerItem of containerItems) {
                        const destroyAction = new DestroyInventoryItemAction(game, undefined, player, player.location, true);
                        destroyAction.performDestroyInventoryItem(containerItem, containerItem.quantity, true, false);
                    }
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
                            return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find item "${newArgs.join(" ")}" ${preposition} ${containerName}.`);
                    }
                }
            } else {
                // Check if an equipment slot was specified.
                let equipmentSlotName = "";
                if (player.getEquipmentSlot(newArgs.join(" "))) {
                    item = player.getEquipmentSlot(newArgs.join(" ")).equippedItem;
                    equipmentSlotName = newArgs.join(" ");
                    if (!item) gotoNext = true;
                    if (destroyAll) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". The "all" argument cannot be used when the container is an equipment slot.`);
                } else {
                    for (const [id, slot] of player.inventory) {
                        if (slot.equippedItem && itemIdentifierMatches(slot.equippedItem, newArgs.join(" "))) {
                            item = slot.equippedItem;
                            equipmentSlotName = id;
                            if (destroyAll) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". The "all" argument cannot be used when the container is an equipped item.`);
                            break;
                        }
                    }
                }
                if (item && equipmentSlotName !== "") {
                    const destroyAction = new DestroyInventoryItemAction(game, undefined, player, player.location, true);
                    destroyAction.performDestroyInventoryItem(item, item.quantity, true, true);
                    gotoNext = true;
                }
            }
            if (gotoNext) continue;

            if (item) {
                const destroyAction = new DestroyInventoryItemAction(game, undefined, player, player.location, true);
                destroyAction.performDestroyInventoryItem(item, item.quantity, true);
            }
            else return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs.join(" ")}" in ${player.name}'s inventory.`);
        }
    }
}
