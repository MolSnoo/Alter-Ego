// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import InstantiateInventoryItemAction from "../Data/Actions/InstantiateInventoryItemAction.ts";
import InstantiateRoomItemAction from "../Data/Actions/InstantiateRoomItemAction.ts";
import RoomItem from "../Data/RoomItem.ts";
import { getErrorMessage } from "../Modules/errorHandler.ts";
import { parseProceduralSelections, parseInstantiateContainingString } from '../Modules/stringDataExtractor.ts';

/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import InventoryItem from '../Data/InventoryItem.ts' */
/** @import InventorySlot from '../Data/InventorySlot.ts' */
/** @import Player from '../Data/Player.ts' */
/** @import Prefab from '../Data/Prefab.ts' */
/** @import { ContainedItem } from '../Modules/stringDataExtractor.ts' */

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
        + `You can instantiate items inside of the created item. It must have only one inventory slot for this to work. `
        + `To do so, enter "containing" after the prefab ID and procedural selections, followed by a list of prefabs `
        + `separated by a plus sign (\`+\`). You can specify quantities and procedural selections for the `
        + `contained items, just like the main item. However, they must all fit in its sole inventory slot.\n\n`
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
        + `including NPCs and players with the \`can move freely\` behavior attribute.\n\n`
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
        + `is GREEN BOOK in MAIN POCKET of LARGE BACKPACK 1 at dorm-library\n`
        + `gn 4 SCREWDRIVER in TOOL BOX at Beach House\n`
        + `instantiate WET CLAY POT (quality = excellent) on POTTERY WHEEL at Art Studio\n`
        + `create PACK OF PENS containing 10 PEN (ink color = blue) on CHECKOUT COUNTER at School Store\n`
        + `generate KATANA in player RIGHT HAND\n`
        + `is GORILLA MASK on all FACE\n`
        + `gn NECK CLAMP to room NECK\n`
        + `instantiate VIVIANS LAPTOP in Vivian's VIVIANS SATCHEL\n`
        + `create 2 SHOTPUT BALL in Cassie's MAIN POCKET of LARGE BACKPACK\n`
        + `generate 3 GACHA CAPSULE (color=metal + character=upa) in Asuka's LEFT POCKET of GAMER HOODIE\n`
        + `is 4 BINDER (binder color=yellow) containing FOLDER (folder color=lime green) + 2 PENCIL (pencil grade=2B+pencil color=blue) in player's LEFT HAND`;
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
        game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateInsufficientArgumentsError("Bot", cmdString));
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
    /** @type {Prefab} */
    let prefab = null;
    /** @type {Prefab[]} */
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
    if (parsedInput.indexOf('(') < parsedInput.indexOf(')') && (!parsedInput.includes(" CONTAINING" ) || parsedInput.indexOf('(') < parsedInput.indexOf(" CONTAINING "))) {
        try {
            proceduralSelections = parseProceduralSelections(parsedInput);
        }
        catch (error) {
            return game.communicationHandler.sendToCommandChannel(`${game.errorMessageGenerator.getErrorPrefix(cmdString)}${getErrorMessage(error)}`);
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
            if (fixtures[i].name === parsedInput) return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateSpecifyError("a prefab and a preposition", "Bot", cmdString));
            if (parsedInput.endsWith(`${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}`) || parsedInput.endsWith(`IN ${fixtures[i].name}`)) {
                if (fixtures[i].preposition === "") return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateCannotPutItemsInContainerError(fixtures[i], "Bot", cmdString));
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

        /** @type {RoomItem} */
        let containerItem = null;
        /** @type {InventorySlot<RoomItem>} */
        let containerItemSlot = null;
        if (fixture === null) {
            // Check if a container item was specified.
            const items = game.entityFinder.getRoomItems(null, room.id);
            for (let i = 0; i < items.length; i++) {
                if (items[i].identifier === parsedInput || items[i].prefab.id === parsedInput || items[i].name === parsedInput) return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateSpecifyError("a prefab and a preposition", "Bot", cmdString));
                if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "" || parsedInput.endsWith(items[i].prefab.id) || parsedInput.endsWith(items[i].name)) {
                    if (items[i].inventory.size === 0 || items[i].prefab.preposition === "") return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateCannotPutItemsInContainerError(items[i], "Bot", cmdString));
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
                        if (containerItemSlot === null) return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateInventorySlotNotFoundError(containerItem, newArgs[newArgs.length - 1], "Bot", cmdString));
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
        /** @type {RoomItemContainer} */
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

        /** @type {ContainedItem[]} */
        let containedItems = [];
        if (parsedInput.includes(" CONTAINING ")) {
            const containedItemStringStart = parsedInput.indexOf(" CONTAINING ") + " CONTAINING ".length;
            const containedItemString = parsedInput.substring(containedItemStringStart);
            try {
                containedItems = parseInstantiateContainingString(game, containedItemString);
                let containedItemStringEnd = -1;
                if (containedItemString.includes(')')) containedItemStringEnd = parsedInput.lastIndexOf(')') + 1;
                else {
                    const lastContainedItemId = containedItems[containedItems.length - 1]?.prefab.id.toUpperCase();
                    if (containedItemString.includes(lastContainedItemId)) {
                        const offset = containedItemString.lastIndexOf(lastContainedItemId) + lastContainedItemId.length;
                        containedItemStringEnd = containedItemStringStart + offset;
                    }
                }
                const affix = containedItemStringEnd !== -1 ? parsedInput.substring(containedItemStringEnd) : ``;
                parsedInput = parsedInput.substring(0, parsedInput.indexOf(" CONTAINING ")) + affix;
            }
            catch (error) {
                return game.communicationHandler.sendToCommandChannel(`${game.errorMessageGenerator.getErrorPrefix(cmdString)}${getErrorMessage(error)}`);
            }
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
            return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateEntityNotFoundError("fixture, room item, or puzzle", parsedInput, "Bot", cmdString));
        }
        else if (prefab === null && container !== null) return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateEntityNotFoundError("prefab with id", parsedInput, "Bot", cmdString));
        else if (prefab === null && container === null) return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateNotFoundError(parsedInput, "Bot", cmdString));

        if (!container.isItemContainer() || !container.canCurrentlyContainItems(false, true))
            return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateCannotPutItemsInContainerError(container, "Bot", cmdString));
        if (isNaN(quantity) || quantity < 1)
            return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateCannotInstantiateWithInvalidQuantityError(prefab, quantity, "Bot", cmdString));
        if (quantity > 1 && !prefab.pluralContainingPhrase)
            return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateNoPluralContainingPhraseError(prefab, "Bot", cmdString));
        if (containerItem !== null && container instanceof RoomItem) {
            if (containerItemSlot.willBeOverFilledBy(prefab, quantity))
                return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateItemWillNotFitInInventorySlotError(prefab, container, containerItemSlot, "Bot", cmdString));
        }
        // Check for procedural selections errors.
        for (const [proceduralName, proceduralValue] of proceduralSelections.entries()) {
            if (!prefab.proceduralOptions.has(proceduralName))
                return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateProceduralNotFoundError(prefab, proceduralName, "Bot", cmdString));
            if (!prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generatePossibilityNotFoundError(prefab, proceduralName, proceduralValue, "Bot", cmdString));
        }
        // Check for contained items errors.
        if (containedItems.length > 0) {
            if (prefab.inventory.size === 0) return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateCannotPutItemsInContainerError(prefab, "Bot", cmdString));
            if (prefab.inventory.size > 1) return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateContainerHasMultipleInventorySlotsError(prefab, "Bot", cmdString));
            const totalSize = containedItems.reduce((size, item) => size + (item.quantity * item.prefab.size), 0);
            if (totalSize > prefab.inventory.first().capacity)
                return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateItemsWillNotFitInInventorySlotError(containedItems.map(item => item.prefab), prefab, prefab.inventory.first(), "Bot", cmdString));
            for (const containedItem of containedItems) {
                for (const [proceduralName, proceduralValue] of containedItem.proceduralSelections.entries()) {
                    if (!containedItem.prefab.proceduralOptions.has(proceduralName))
                        return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateProceduralNotFoundError(containedItem.prefab, proceduralName, "Bot", cmdString));
                    if (!containedItem.prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                        return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generatePossibilityNotFoundError(containedItem.prefab, proceduralName, proceduralValue, "Bot", cmdString));
                }
            }
        }

        // Now instantiate the item.
        const instantiateAction = new InstantiateRoomItemAction(game, undefined, player, room, true);
        instantiateAction.performInstantiateRoomItem(prefab, container, slotName, quantity, proceduralSelections, prefab.uses, containedItems);
    }
    else {
        args = input.split(' ');
        /** @type {Player[]} */
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
        if (players.length === 0) return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateRoomOrPlayerNotFoundError("Bot", cmdString));

        parsedInput = args.join(" ").toUpperCase().replace(/\'/g, "");

        for (let j = 0; j < players.length; j++) {
            player = players[j];
            let parsedInput2 = parsedInput;
            // Check if an inventory item was specified.
            /** @type {InventoryItem} */
            let containerItem = null;
            /** @type {InventorySlot<InventoryItem>} */
            let containerItemSlot = null;
            const items = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null);
            for (let i = 0; i < items.length; i++) {
                if (items[i].identifier === parsedInput2 || items[i].prefab.id === parsedInput2 || items[i].name === parsedInput2) return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateSpecifyError("a prefab and a preposition", "Bot", cmdString));
                if (parsedInput2.endsWith(items[i].identifier) && items[i].identifier !== "" || parsedInput2.endsWith(items[i].prefab.id) || parsedInput2.endsWith(items[i].name)) {
                    if (items[i].inventory.size === 0 || items[i].prefab.preposition === "") return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateCannotPutItemsInContainerError(items[i], "Bot", cmdString));
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
                        if (containerItemSlot === null) return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateInventorySlotNotFoundError(containerItem, newArgs[newArgs.length - 1], "Bot", cmdString));
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
            let equipmentSlotId = "";
            if (containerItem === null) {
                for (const [id, slot] of player.inventory) {
                    if (parsedInput2.endsWith(id)) {
                        equipmentSlotId = id;
                        parsedInput2 = parsedInput2.substring(0, parsedInput2.lastIndexOf(id)).trimEnd();
                        const newArgs = parsedInput2.split(' ');
                        newArgs.splice(newArgs.length - 1, 1);
                        parsedInput2 = newArgs.join(' ');
                        if (slot.equippedItem !== null) return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateCannotEquipToOccupiedEquipmentSlotError(slot, "Bot", cmdString));
                        break;
                    }
                }
            }

            /** @type {ContainedItem[]} */
            let containedItems = [];
            if (parsedInput.includes(" CONTAINING ")) {
                const containedItemStringStart = parsedInput.indexOf(" CONTAINING ") + " CONTAINING ".length;
                const containedItemString = parsedInput.substring(containedItemStringStart);
                try {
                    containedItems = parseInstantiateContainingString(game, containedItemString);
                    let containedItemStringEnd = -1;
                    if (containedItemString.includes(')')) containedItemStringEnd = parsedInput.lastIndexOf(')') + 1;
                    else {
                        const lastContainedItemId = containedItems[containedItems.length - 1]?.prefab.id.toUpperCase();
                        if (containedItemString.includes(lastContainedItemId)) {
                            const offset = containedItemString.lastIndexOf(lastContainedItemId) + lastContainedItemId.length;
                            containedItemStringEnd = containedItemStringStart + offset;
                        }
                    }
                    const affix = containedItemStringEnd !== -1 ? parsedInput.substring(containedItemStringEnd) : ``;
                    parsedInput = parsedInput.substring(0, parsedInput.indexOf(" CONTAINING ")) + affix;
                }
                catch (error) {
                    return game.communicationHandler.sendToCommandChannel(`${game.errorMessageGenerator.getErrorPrefix(cmdString)}${getErrorMessage(error)}`);
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

            if (prefab !== null && containerItem === null && equipmentSlotId === "") {
                parsedInput2 = parsedInput2.substring(prefab.id.length).trimStart();
                parsedInput2 = parsedInput2.substring(parsedInput2.indexOf(' ')).trimStart();
                return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateEntityNotFoundError("inventory item or equipment slot", parsedInput2, "Bot", cmdString));
            }
            else if (prefab === null && (containerItem !== null || equipmentSlotId !== "")) {
                return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateEntityNotFoundError("prefab with id", parsedInput2, "Bot", cmdString));
            }
            else if (prefab === null && containerItem === null && equipmentSlotId === "") return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateNotFoundError(parsedInput2, "Bot", cmdString));

            if (isNaN(quantity) || quantity < 1)
            return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateCannotInstantiateWithInvalidQuantityError(prefab, quantity, "Bot", cmdString));
            if (equipmentSlotId !== "" && quantity !== 1)
                return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateCannotInstantiateEquippedItemWithInvalidQuantityError("Bot", cmdString));
            if (quantity > 1 && !prefab.pluralContainingPhrase)
                return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateNoPluralContainingPhraseError(prefab, "Bot", cmdString));
            if (containerItem !== null) {
                equipmentSlotId = containerItem.equipmentSlot;
                if (containerItemSlot.willBeOverFilledBy(prefab, quantity))
                    return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateItemWillNotFitInInventorySlotError(prefab, containerItem, containerItemSlot, "Bot", cmdString));
            }
            // Check for procedural selections errors.
            for (const [proceduralName, proceduralValue] of proceduralSelections.entries()) {
                if (!prefab.proceduralOptions.has(proceduralName))
                    return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateProceduralNotFoundError(prefab, proceduralName, "Bot", cmdString));
                if (!prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                    return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generatePossibilityNotFoundError(prefab, proceduralName, proceduralValue, "Bot", cmdString));
            }
            // Check for contained items errors.
            if (containedItems.length > 0) {
                if (prefab.inventory.size === 0) return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateCannotPutItemsInContainerError(prefab, "Bot", cmdString));
                if (prefab.inventory.size > 1) return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateContainerHasMultipleInventorySlotsError(prefab, "Bot", cmdString));
                const totalSize = containedItems.reduce((size, item) => size + (item.quantity * item.prefab.size), 0);
                if (totalSize > prefab.inventory.first().capacity)
                    return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateItemsWillNotFitInInventorySlotError(containedItems.map(item => item.prefab), prefab, prefab.inventory.first(), "Bot", cmdString));
                for (const containedItem of containedItems) {
                    for (const [proceduralName, proceduralValue] of containedItem.proceduralSelections.entries()) {
                        if (!containedItem.prefab.proceduralOptions.has(proceduralName))
                            return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generateProceduralNotFoundError(containedItem.prefab, proceduralName, "Bot", cmdString));
                        if (!containedItem.prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                            return game.communicationHandler.sendToCommandChannel(game.errorMessageGenerator.generatePossibilityNotFoundError(containedItem.prefab, proceduralName, proceduralValue, "Bot", cmdString));
                    }
                }
            }

            // Now instantiate the item.
            const instantiateAction = new InstantiateInventoryItemAction(game, undefined, player, player.location, true);
            instantiateAction.performInstantiateInventoryItem(prefab, equipmentSlotId, containerItem, slotName, quantity, proceduralSelections, prefab.uses, containedItems);
        }
    }
}
