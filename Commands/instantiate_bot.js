// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import InstantiateInventoryItemAction from "../Data/Actions/InstantiateInventoryItemAction.ts";
import InstantiateRoomItemAction from "../Data/Actions/InstantiateRoomItemAction.ts";
import RoomItem from "../Data/RoomItem.ts";
import { getErrorMessage } from "../Modules/errorHandler.ts";
import { parseProceduralSelections } from '../Modules/stringDataExtractor.ts';

/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import Player from '../Data/Player.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "instantiate_bot",
    description: "Generates an item.",
    details: `Generates a room item or inventory item in the specified location. The prefab ID must be used. `
        + `A quantity can also be set by supplying a number before the prefab ID. If no quantity is given, the item `
        + `will be instantiated with a quantity of 1.\n\n`
        + `If the prefab has procedural options, they can be manually selected in parentheses. To do this, write the `
        + `name of the procedural tag and the poss tag to select within it, separated by an equal sign (\`=\`). `
        + `Multiple procedural selections can be made, separated by a plus sign (\`+\`).\n\n`
        + `To instantiate a room item, the display name or ID of the room must be given at the end, following \"at\". `
        + `The container to put it in must also be specified after the prefab's ID, preceded by the container's `
        + `preposition or "in". If the container is a fixture with a child puzzle, the puzzle will be its container. `
        + `If the container is another room item, the container's identifier, prefab ID, or name can be used.\n\n`
        + `To instantiate an inventory item, the name of the player must be given followed by \`'s\`. It is possible to `
        + `instantiate an inventory item directly to a player's equipment slot by specifying the equipment slot's ID. `
        + `In this case, the player will be notified that they equipped the item, and the prefab's equipped commands `
        + `will be executed. However, a container item can be specified instead by entering its preposition or "in" `
        + `followed by its identifier, prefab ID, or name. The player will not be notified when the item is instantiated this way.\n\n`
        + `If, when instantiating an inventory item, "player" is supplied instead of a player's name, then the prefab `
        + `will be instantiated in the inventory of the player who caused this command to be executed. If "room" is `
        + `supplied instead, then the command will executed on all players in the room as the initiating player. `
        + `If "all" is supplied instead, then the command will be executed on all living players, `
        + `including NPCs and players with the Free Movement role.\n\n`
        + `If the container to instantiate the item into is a room item or inventory item, the ID of the inventory slot `
        + `to instantiate the item into can be specified, followed by "of" before the container's identifier.`,
    usableBy: "Bot",
    aliases: ["instantiate", "create", "generate", "is", "gn"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `instantiate RAW FISH on FLOOR at Beach\n`
        + `create PICKAXE in LOCKER 1 at mining-hub\n`
        + `generate 3 EMPTY DRAIN CLEANER in CUPBOARDS at Kitchen\n`
        + `instantiate GREEN BOOK in MAIN POCKET of LARGE BACKPACK 1 at dorm-library\n`
        + `is 4 SCREWDRIVER in TOOL BOX at Beach House\n`
        + `gn WET CLAY POT (quality = excellent) on POTTERY WHEEL at Art Studio\n`
        + `instantiate KATANA in player RIGHT HAND\n`
        + `create GORILLA MASK on all FACE\n`
        + `instantiate NECK CLAMP to room NECK\n`
        + `generate VIVIANS LAPTOP in Vivian's VIVIANS SATCHEL\n`
        + `is 2 SHOTPUT BALL in Cassie's MAIN POCKET of LARGE BACKPACK\n`
        + `gn 3 GACHA CAPSULE (color=metal + character=upa) in Asuka's LEFT POCKET of GAMER HOODIE`;
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
    if (args.length < 4) {
        game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    let quantity = 1;
    if (args[0].match(/^\d+$/)) {
        quantity = parseInt(args[0]);
        args.splice(0, 1);
    }

    let input = args.join(" ");
    let parsedInput = input.toUpperCase().replace(/\'/g, "");
    const undashedInput = parsedInput.replace(/-/g, " ");

    // Some prefabs might have similar names. Make a list of all the ones that are found at the beginning of parsedInput.
    let prefab = null;
    const matches = [];
    for (let i = 1; i <= args.length; i++) {
        const match = game.entityFinder.getPrefab(args.slice(0, i).join(" "));
        if (match)
            matches.push(match);
    }

    // Find room specified at the end of args.
    let room = game.entityFinder.getRoom(input.substring(undashedInput.lastIndexOf(" AT ") + 4));
    if (!room) room = null;
    else parsedInput = parsedInput.substring(0, undashedInput.lastIndexOf(` AT ${room.id.toUpperCase().replace(/-/g, " ")}`));

    // If a parenthetical expression is included, procedural options are being manually set.
    /** @type {Map<string, string>} */
    let proceduralSelections = new Map();
    if (parsedInput.indexOf('(') < parsedInput.indexOf(')')) {
        try {
            proceduralSelections = parseProceduralSelections(parsedInput);
        }
        catch (error) {
            return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${getErrorMessage(error)}`);
        }
        input = input.substring(0, input.indexOf('(')) + input.substring(input.indexOf(')') + 1).trimStart();
        parsedInput = parsedInput.substring(0, parsedInput.indexOf('(')) + parsedInput.substring(parsedInput.indexOf(')') + 1).trimStart();
    }
    args = parsedInput.split(' ');

    // Room was found. Look for the container in it.
    if (room !== null) {
        // Check if a fixture was specified.
        let fixture = null;
        const fixtures = game.fixtures.filter(fixture => fixture.location.id === room.id);
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". You need to supply a prefab and a preposition.`);
            if (parsedInput.endsWith(`${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}`) || parsedInput.endsWith(`IN ${fixtures[i].name}`)) {
                if (fixtures[i].preposition === "") return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${fixtures[i].name} cannot hold items.`);
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

        let containerItem = null;
        let containerItemSlot = null;
        if (fixture === null) {
            // Check if a container item was specified.
            const items = game.entityFinder.getRoomItems(null, room.id);
            for (let i = 0; i < items.length; i++) {
                if (items[i].identifier === parsedInput || items[i].prefab.id === parsedInput || items[i].name === parsedInput) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". You need to supply a prefab and a preposition.`);
                if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "" || parsedInput.endsWith(items[i].prefab.id) || parsedInput.endsWith(items[i].name)) {
                    if (items[i].inventory.size === 0 || items[i].prefab.preposition === "") return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${items[i].identifier ? items[i].identifier : items[i].name} cannot hold items.`);
                    containerItem = items[i];

                    if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "")
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].identifier)).trimEnd();
                    else if (parsedInput.endsWith(items[i].prefab.id))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].prefab.id)).trimEnd();
                    else if (parsedInput.endsWith(items[i].name))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                    let newArgs = parsedInput.split(' ');
                    // Check if a slot was specified.
                    if (parsedInput.endsWith(" OF")) {
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                        newArgs = parsedInput.split(' ');
                        for (const [id, slot] of containerItem.inventory) {
                            if (parsedInput.endsWith(id)) {
                                containerItemSlot = slot;
                                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(id)).trimEnd();
                                break;
                            }
                        }
                        if (containerItemSlot === null) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier ? containerItem.identifier : containerItem.name}.`);
                    }
                    if (parsedInput.endsWith(containerItem.prefab.preposition.toUpperCase()))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItem.prefab.preposition.toUpperCase())).trimEnd();
                    else if (parsedInput.endsWith(" IN"))
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" IN")).trimEnd();
                    break;
                }
            }
            if (containerItem !== null && containerItemSlot === null) [containerItemSlot] = containerItem.inventory.values();
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

        // Finally, find the prefab.
        if (matches.length === 1) prefab = matches[0];
        else {
            for (let i = 0; i < matches.length; i++) {
                if (matches[i].id === parsedInput) {
                    prefab = matches[i];
                    break;
                }
            }
        }

        if (prefab !== null && container === null) {
            parsedInput = parsedInput.substring(prefab.id.length).trimStart();
            parsedInput = parsedInput.substring(parsedInput.indexOf(' ')).trimStart();
            return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find "${parsedInput}" to instantiate ${prefab.id} into.`);
        }
        else if (prefab === null && container !== null) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find prefab with id "${parsedInput}".`);
        else if (prefab === null && container === null) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find "${parsedInput}".`);

        if (isNaN(quantity) || quantity < 1)
            return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${game.errorMessageGenerator.generateCannotInstantiateWithInvalidQuantityError(prefab, quantity)}`);
        if (containerItem !== null && container instanceof RoomItem) {
            if (prefab.size > containerItemSlot.capacity && container.inventory.size !== 1) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${containerItemSlot.id} of ${container.name} because it is too large.`);
            else if (prefab.size > containerItemSlot.capacity) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${container.name} because it is too large.`);
            else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity && container.inventory.size !== 1) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${containerItemSlot.id} of ${container.name} because there isn't enough space left.`);
            else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${container.name} because there isn't enough space left.`);
        }
        // Check for procedural selections errors.
        for (const [proceduralName, proceduralValue] of proceduralSelections.entries()) {
            if (!prefab.proceduralOptions.has(proceduralName))
                return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${prefab.id} does not have procedural "${proceduralName}".`);
            if (!prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${prefab.id}'s procedural "${proceduralName}" does not have possibility "${proceduralValue}".`);
        }

        // Now instantiate the item.
        const instantiateAction = new InstantiateRoomItemAction(game, undefined, player, room, true);
        instantiateAction.performInstantiateRoomItem(prefab, container, slotName, quantity, proceduralSelections);
    }
    else {
        args = input.split(' ');
        /** @type Player[] */
        let players = [];
        for (let i = 0; i < args.length; i++) {
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
        if (players.length === 0) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find a room or player in your input.`);

        parsedInput = args.join(" ").toUpperCase().replace(/\'/g, "");

        for (let j = 0; j < players.length; j++) {
            player = players[j];
            let parsedInput2 = parsedInput;
            // Check if an inventory item was specified.
            let containerItem = null;
            let containerItemSlot = null;
            const items = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null);
            for (let i = 0; i < items.length; i++) {
                if (items[i].identifier === parsedInput2 || items[i].prefab.id === parsedInput2 || items[i].name === parsedInput2) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". You need to supply a prefab and a preposition.`);
                if (parsedInput2.endsWith(items[i].identifier) && items[i].identifier !== "" || parsedInput2.endsWith(items[i].prefab.id) || parsedInput2.endsWith(items[i].name)) {
                    if (items[i].inventory.size === 0 || items[i].prefab.preposition === "") return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${items[i].identifier ? items[i].identifier : items[i].name} cannot hold items.`);
                    containerItem = items[i];

                    if (parsedInput2.endsWith(items[i].identifier) && items[i].identifier !== "")
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(items[i].identifier)).trimEnd();
                    else if (parsedInput2.endsWith(items[i].prefab.id))
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(items[i].prefab.id)).trimEnd();
                    else if (parsedInput2.endsWith(items[i].name))
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(items[i].name)).trimEnd();
                    let newArgs = parsedInput2.split(' ');
                    // Check if a slot was specified.
                    if (parsedInput2.endsWith(" OF")) {
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(" OF")).trimEnd();
                        newArgs = parsedInput2.split(' ');
                        for (const [id, slot] of containerItem.inventory) {
                            if (parsedInput2.endsWith(id)) {
                                containerItemSlot = slot;
                                parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(id)).trimEnd();
                                break;
                            }
                        }
                        if (containerItemSlot === null) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier ? containerItem.identifier : containerItem.name}.`);
                    }
                    if (parsedInput2.endsWith(containerItem.prefab.preposition.toUpperCase()))
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(containerItem.prefab.preposition.toUpperCase())).trimEnd();
                    else if (parsedInput2.endsWith(" IN"))
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(" IN")).trimEnd();
                    break;
                }
            }
            if (containerItem !== null && containerItemSlot === null) [containerItemSlot] = containerItem.inventory.values();
            const slotName = containerItem !== null ? containerItemSlot.id : "";

            // Check if an equipment slot was specified.
            let equipmentSlotName = "";
            if (containerItem === null) {
                for (const [id, slot] of player.inventory) {
                    if (parsedInput2.endsWith(id)) {
                        equipmentSlotName = id;
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(id)).trimEnd();
                        const newArgs = parsedInput2.split(' ');
                        newArgs.splice(newArgs.length - 1, 1);
                        parsedInput2 = newArgs.join(' ');
                        if (slot.equippedItem !== null) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Cannot equip items to ${id} because ${slot.equippedItem.name} is already equipped to it.`);
                        break;
                    }
                }
            }

            // Finally, find the prefab.
            if (matches.length === 1) prefab = matches[0];
            else {
                for (let i = 0; i < matches.length; i++) {
                    if (matches[i].id === parsedInput2) {
                        prefab = matches[i];
                        break;
                    }
                }
            }

            if (prefab !== null && containerItem === null && equipmentSlotName === "") {
                parsedInput2 = parsedInput2.substring(prefab.id.length).trimStart();
                parsedInput2 = parsedInput2.substring(parsedInput2.indexOf(' ')).trimStart();
                return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find "${parsedInput2}" to instantiate ${prefab.id} into.`);
            }
            else if (prefab === null && (containerItem !== null || equipmentSlotName !== "")) {
                parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(' '));
                return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find prefab with id "${parsedInput2}".`);
            }
            else if (prefab === null && containerItem === null && equipmentSlotName === "") return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Couldn't find "${parsedInput2}".`);

            if (isNaN(quantity) || quantity < 1)
                return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${game.errorMessageGenerator.generateCannotInstantiateWithInvalidQuantityError(prefab, quantity)}`);
            if (equipmentSlotName !== "" && quantity !== 1) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Cannot instantiate more than 1 item to a player's equipment slot.`);
            if (containerItem !== null) {
                equipmentSlotName = containerItem.equipmentSlot;
                if (prefab.size > containerItemSlot.capacity && containerItem.inventory.size !== 1) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${containerItemSlot.id} of ${player.name}'s ${containerItem.name} because it is too large.`);
                else if (prefab.size > containerItemSlot.capacity) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${player.name}'s ${containerItem.name} because it is too large.`);
                else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity && containerItem.inventory.size !== 1) game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${containerItemSlot.id} of ${player.name}'s ${containerItem.name} because there isn't enough space left.`);
                else if (containerItemSlot.takenSpace + quantity * prefab.size > containerItemSlot.capacity) game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${prefab.id} will not fit in ${player.name}'s ${containerItem.name} because there isn't enough space left.`);
            }
            // Check for procedural selections errors.
            for (const [proceduralName, proceduralValue] of proceduralSelections.entries()) {
                if (!prefab.proceduralOptions.has(proceduralName))
                    return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${prefab.id} does not have procedural "${proceduralName}".`);
                if (!prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                    return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". ${prefab.id}'s procedural "${proceduralName}" does not have possibility "${proceduralValue}".`);
            }

            // Now instantiate the item.
            const instantiateAction = new InstantiateInventoryItemAction(game, undefined, player, player.location, true);
            instantiateAction.performInstantiateInventoryItem(prefab, equipmentSlotName, containerItem, slotName, quantity, proceduralSelections);
        }
    }
}
