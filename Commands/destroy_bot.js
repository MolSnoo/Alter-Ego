import GameSettings from "../Classes/GameSettings.js";
import Game from "../Data/Game.js";
import Player from "../Data/Player.js";
import Event from "../Data/Event.js";
import Fixture from "../Data/Fixture.js";
import Flag from "../Data/Flag.js";
import InventoryItem from "../Data/InventoryItem.js";
import RoomItem from "../Data/RoomItem.js";
import Puzzle from "../Data/Puzzle.js";
import { destroyItem, destroyInventoryItem } from '../Modules/itemManager.js';
import * as messageHandler from '../Modules/messageHandler.js';

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
 * @param {Event|Flag|InventoryItem|Puzzle} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute (game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    if (args.length < 2) {
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    const input = args.join(" ");
    let parsedInput = input.toUpperCase().replace(/\'/g, "");
    const undashedInput = parsedInput.replace(/-/g, " ");

    const room = game.entityFinder.getRooms(undashedInput.substring(undashedInput.lastIndexOf(" AT ") + 4), null, null, true)[0];
    if (room) {
        parsedInput = parsedInput.substring(0, undashedInput.lastIndexOf(" AT "));
    }

    let destroyAll = false;
    let item = null;
    // Room was found. Look for the container in it.
    if (room !== undefined) {
        let containerItem = null;
        let containerItemSlot = null;
        // Check if a container item was specified.
        const roomItems = game.entityFinder.getRoomItems(null, room.id);
        for (let i = 0; i < roomItems.length; i++) {
            // TODO: this can probably be optimized further...?
            // If parsedInput is only the identifier or the item's name, we've found the item to delete.
            if (roomItems[i].identifier !== "" && roomItems[i].identifier === parsedInput || roomItems[i].prefab.id === parsedInput) {
                item = roomItems[i];
                break;
            }
            if (parsedInput.endsWith(roomItems[i].identifier) && roomItems[i].identifier !== "") {
                if (roomItems[i].inventoryCollection.size === 0 || roomItems[i].prefab.preposition === "") return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${roomItems[i].identifier ? roomItems[i].identifier : roomItems[i].prefab.id} cannot hold items.`);
                containerItem = roomItems[i];

                if (parsedInput.endsWith(roomItems[i].identifier) && roomItems[i].identifier !== "")
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(roomItems[i].identifier)).trimEnd();
                else if (parsedInput.endsWith(roomItems[i].prefab.id))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(roomItems[i].prefab.id)).trimEnd();
                let newArgs = parsedInput.split(' ');
                // Check if a slot was specified.
                if (parsedInput.endsWith(" OF")) {
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                    newArgs = parsedInput.split(' ');
                    for (const [id, slot] of containerItem.inventoryCollection) {
                        if (parsedInput.endsWith(id)) { // TODO: optimize with arg slicing
                            containerItemSlot = slot;
                            parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(id)).trimEnd();
                            break;
                        }
                    }
                    if (containerItemSlot === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier ? containerItem.identifier : containerItem.prefab.id}.`);
                }
                if (parsedInput.endsWith(containerItem.prefab.preposition.toUpperCase()))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItem.prefab.preposition.toUpperCase())).trimEnd();
                else if (parsedInput.endsWith(" IN"))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" IN")).trimEnd();
                break;
            }
        }
        if (containerItem !== null && containerItemSlot === null) [containerItemSlot] = containerItem.inventoryCollection.values();

        // Check if a fixture was specified.
        let fixture = null;
        if (containerItem === null && item === null) {
            const fixtures = game.fixtures.filter(fixture => fixture.location.id === room.id && fixture.accessible);
            for (let i = 0; i < fixtures.length; i++) {
                if (fixtures[i].name === parsedInput) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". You need to supply an item and a preposition.`);
                if (parsedInput.endsWith(`${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}`) || parsedInput.endsWith(`IN ${fixtures[i].name}`)) {
                    fixture = fixtures[i];
                    if (parsedInput.endsWith(`${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}`))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(`${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}`)).trimEnd();
                    else if (parsedInput.endsWith(`IN ${fixtures[i].name}`))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(`IN ${fixtures[i].name}`)).trimEnd();
                    else
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(fixtures[i].name)).trimEnd();
                    break;
                }
            }
        }

        // Now decide what the container should be.
        let container = null;
        let slotName = "";
        if (fixture !== null && fixture.childPuzzle === null && containerItem === null)
            container = fixture;
        else if (fixture !== null && fixture.childPuzzle !== null && containerItem === null)
            container = fixture.childPuzzle;
        else if (containerItem !== null) {
            container = containerItem;
            slotName = containerItemSlot.id;
        }
        else if (item !== null)
            container = item.container;
        else
            container = null;

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
            containerItems = roomItems.filter(item => item.containerName === `Item: ${container.identifier}/${slotName}`);

        const newArgs = parsedInput.split(" ");
        if (newArgs[0] === "ALL") {
            destroyAll = true;
            newArgs.splice(0, 1);
            parsedInput = newArgs.join(" ");
        }

        if (destroyAll) {
            if (parsedInput !== "") return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${parsedInput}" at ${room.id}`);
            for (let i = 0; i < containerItems.length; i++)
                destroyItem(containerItems[i], containerItems[i].quantity, true);
        }
        else {
            // Find the item if it hasn't been found already.
            if (item === null) {
                for (let i = 0; i < containerItems.length; i++) {
                    if (containerItems[i].identifier === parsedInput || containerItems[i].prefab.id === parsedInput) {
                        item = containerItems[i];
                        break;
                    }
                }
            }
            if (item === null) return;

            destroyItem(item, item.quantity, true);
        }
    }
    else {
        let players = [];
        // Iterate in reverse so that the "all" argument for players doesn't conflict with the "all" argument for items.
        for (let i = args.length - 1; i >= 0; i--) {
            if (args[i].toLowerCase().replace(/'s/g, "") === "player" && player !== null) {
                players.push(player);
                args.splice(i, 1);
                break;
            }
            else if (args[i].toLowerCase().replace(/'s/g, "") === "room" && player !== null) {
                players = player.location.occupants;
                args.splice(i, 1);
                break;
            }
            else if (args[i].toLowerCase().replace(/'s/g, "") === "all") {
                players = game.entityFinder.getLivingPlayers();
                args.splice(i, 1);
                break;
            }
            else {
                let playerName = args[i].toLowerCase();
                if (playerName.endsWith("'s")) {
                    playerName = playerName.slice(0, -2);
                }

                const player = game.entityFinder.getLivingPlayer(playerName);
                if (player) {
                    players.push(player);
                    args.splice(i, 1);
                    break;
                }
            }
        }
        if (players.length === 0) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find a room or player in your input.`);

        parsedInput = args.join(" ").toUpperCase().replace(/\'/g, "");

        for (let j = 0; j < players.length; j++) {
            player = players[j];
            let parsedInput2 = parsedInput;
            let gotoNext = false;
            // Check if an inventory item was specified.
            let containerItem = null;
            let containerItemSlot = null;
            const playerItems = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null && (item.quantity > 0 || isNaN(item.quantity)));
            for (let i = 0; i < playerItems.length; i++) {
                // If parsedInput2 is only the identifier or the item's name, we've found the item to delete.
                if (playerItems[i].identifier !== "" && playerItems[i].identifier === parsedInput2 || playerItems[i].prefab.id === parsedInput2) {
                    item = playerItems[i];
                    break;
                }
                if (parsedInput2.endsWith(playerItems[i].identifier) && playerItems[i].identifier !== "" || parsedInput2.endsWith(playerItems[i].prefab.id)) {
                    if (playerItems[i].inventoryCollection.size === 0 || playerItems[i].prefab.preposition === "") return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${playerItems[i].identifier ? playerItems[i].identifier : playerItems[i].prefab.id} cannot hold items.`);
                    containerItem = playerItems[i];

                    if (parsedInput2.endsWith(playerItems[i].identifier) && playerItems[i].identifier !== "")
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(playerItems[i].identifier)).trimEnd();
                    else if (parsedInput2.endsWith(playerItems[i].prefab.id))
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(playerItems[i].prefab.id)).trimEnd();
                    let newArgs = parsedInput2.split(' ');
                    // Check if a slot was specified.
                    if (parsedInput2.endsWith(" OF")) {
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(" OF")).trimEnd();
                        newArgs = parsedInput2.split(' ');
                        for (const [id, slot] of containerItem.inventoryCollection) {
                            if (parsedInput2.endsWith(id)) {
                                containerItemSlot = slot;
                                parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(id)).trimEnd();
                                break;
                            }
                        }
                        if (containerItemSlot === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier ? containerItem.identifier : containerItem.name}.`);
                    }
                    if (parsedInput2.endsWith(containerItem.prefab.preposition.toUpperCase()))
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(containerItem.prefab.preposition.toUpperCase())).trimEnd();
                    else if (parsedInput2.endsWith(" IN"))
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(" IN")).trimEnd();
                    break;
                }
            }
            if (containerItem !== null && containerItemSlot === null) [containerItemSlot] = containerItem.inventoryCollection.values();
            const slotName = containerItem !== null ? containerItemSlot.id : "";

            const newArgs = parsedInput2.split(" ");
            if (newArgs[0] === "ALL") {
                destroyAll = true;
                newArgs.splice(0, 1);
                parsedInput2 = newArgs.join(" ");
            }

            let containerItems = [];
            let containerName = "";
            let preposition = "in";
            // If the item still hasn't been found, but a containerItem was, find it in the container.
            if (containerItem !== null) {
                containerItems = playerItems.filter(item => item.containerName === `${containerItem.identifier}/${slotName}`);
                containerName = `${slotName} of ${containerItem.identifier} in ${player.name}'s inventory`;
                preposition = containerItem.prefab.preposition ? containerItem.prefab.preposition : "in";

                if (destroyAll) {
                    for (let i = 0; i < containerItems.length; i++)
                        destroyInventoryItem(containerItems[i], containerItems[i].quantity, true);
                    gotoNext = true;
                }
                else {
                    // Find the item if it hasn't been found already.
                    if (item === null) {
                        for (let i = 0; i < containerItems.length; i++) {
                            if (containerItems[i].identifier === parsedInput2 || containerItems[i].prefab.id === parsedInput2) {
                                item = containerItems[i];
                                break;
                            }
                        }
                        if (item === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find item "${parsedInput2}" ${preposition} ${containerName}.`);
                    }
                }
            }
            else {
                // Check if an equipment slot was specified.
                let equipmentSlotName = "";
                if (player.inventoryCollection.get(parsedInput2)) {
                    item = player.inventoryCollection.get(parsedInput2).equippedItem
                    equipmentSlotName = parsedInput2;
                    if (item === null) gotoNext = true;
                    if (destroyAll) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". The "all" argument cannot be used when the container is an equipment slot.`);
                }
                else {
                    for (const [id, slot] of player.inventoryCollection) {
                        if (slot.equippedItem !== null && slot.equippedItem.identifier === parsedInput2 || slot.equippedItem.prefab.id === parsedInput2) {
                            item = slot.equippedItem
                            equipmentSlotName = id
                            if (destroyAll) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". The "all" argument cannot be used when the container is an equipped item.`);
                            break;
                        }
                    }
                }
                if (item !== null && equipmentSlotName !== "") {
                    destroyInventoryItem(item, item.quantity, true);
                    gotoNext = true;
                }
            }
            if (gotoNext) continue;

            if (item !== null) destroyInventoryItem(item, item.quantity, true);
            else return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find "${parsedInput2}" in ${player.name}'s inventory.`);
        }
    }

    return;
}
