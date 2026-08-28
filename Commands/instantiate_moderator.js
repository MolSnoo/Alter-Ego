// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import InstantiateInventoryItemAction from '../Data/Actions/InstantiateInventoryItemAction.ts';
import InstantiateRoomItemAction from '../Data/Actions/InstantiateRoomItemAction.ts';
import RoomItem from '../Data/RoomItem.ts';
import { parseProceduralSelections, parseInstantiateContainingString } from '../Modules/stringDataExtractor.ts';
import { getErrorMessage } from '../Modules/errorHandler.ts';

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import InventoryItem from '../Data/InventoryItem.ts' */
/** @import InventorySlot from '../Data/InventorySlot.ts' */
/** @import Player from '../Data/Player.ts' */
/** @import Prefab from '../Data/Prefab.ts' */
/** @import { ContainedItem } from '../Modules/stringDataExtractor.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "instantiate_moderator",
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
        + `If the container to instantiate the item into is a room item or inventory item, the ID of the inventory slot `
        + `to instantiate the item into can be specified, followed by "of" before the container's identifier.`,
    usableBy: "Moderator",
    aliases: ["instantiate", "create", "generate", "is", "gn"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}instantiate RAW FISH on FLOOR at Beach\n`
        + `${settings.commandPrefix}create PICKAXE in LOCKER 1 at mining-hub\n`
        + `${settings.commandPrefix}generate 3 EMPTY DRAIN CLEANER in CUPBOARDS at Kitchen\n`
        + `${settings.commandPrefix}is GREEN BOOK in MAIN POCKET of LARGE BACKPACK 1 at dorm-library\n`
        + `${settings.commandPrefix}gn 4 SCREWDRIVER in TOOL BOX at Beach House\n`
        + `${settings.commandPrefix}instantiate WET CLAY POT (quality = excellent) on POTTERY WHEEL at Art Studio\n`
        + `${settings.commandPrefix}create PACK OF PENS containing 10 PEN (ink color = blue) on CHECKOUT COUNTER at School Store\n`
        + `${settings.commandPrefix}generate KATANA in Nero's RIGHT HAND\n`
        + `${settings.commandPrefix}is GORILLA MASK on Evad's FACE\n`
        + `${settings.commandPrefix}gn VIVIANS LAPTOP in Vivian's VIVIANS SATCHEL\n`
        + `${settings.commandPrefix}instantiate 2 SHOTPUT BALL in Cassie's MAIN POCKET of LARGE BACKPACK\n`
        + `${settings.commandPrefix}create 3 GACHA CAPSULE (color=metal + character=upa) in Asuka's LEFT POCKET of GAMER HOODIE\n`
        + `${settings.commandPrefix}is 4 BINDER (binder color=yellow) containing FOLDER (folder color=lime green) + 2 PENCIL (pencil grade=2B+pencil color=blue) in Elise's LEFT HAND`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Moderator} moderator - The moderator who issued the command.
 */
export async function execute(game, message, command, args, moderator) {
    // The `is` alias makes it so error messages trigger very frequently in the bot commands channel if people start a message with "is".
    // Guard against that.
    const isMessageStartingWithIs = command === 'is' && !message.content.startsWith(game.settings.commandPrefix);
    if (args.length < 4 && !isMessageStartingWithIs)
        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyErrorWithUsage(`a prefab and a container`, usage));

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
            return game.communicationHandler.reply(message, getErrorMessage(error));
        }
        input = input.substring(0, input.indexOf('(')) + input.substring(input.indexOf(')') + 1).trimStart();
        parsedInput = parsedInput.substring(0, parsedInput.indexOf('(')) + parsedInput.substring(parsedInput.indexOf(')') + 1).trimStart();
    }
    args = parsedInput.split(' ');

    /** @type {Player | null} */
    let player = null;
    // Room was found. Look for the container in it.
    if (room !== null) {
        // Check if a fixture was specified.
        let fixture = null;
        const fixtures = game.fixtures.filter(fixture => fixture.location.id === room.id);
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyError(`a prefab and a preposition`));
            if (parsedInput.endsWith(`${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}`) || parsedInput.endsWith(`IN ${fixtures[i].name}`)) {
                if (fixtures[i].preposition === "") return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotPutItemsInContainerError(fixtures[i], "Moderator"));
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
                if (items[i].identifier === parsedInput || items[i].prefab.id === parsedInput || items[i].name === parsedInput) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyError(`a prefab and a preposition`));
                if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "" || parsedInput.endsWith(items[i].prefab.id) || parsedInput.endsWith(items[i].name)) {
                    if (items[i].inventory.size === 0 || items[i].prefab.preposition === "") return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotPutItemsInContainerError(items[i], "Moderator"));
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
                        if (containerItemSlot === null) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateInventorySlotNotFoundError(containerItem, newArgs[newArgs.length - 1], "Moderator"));
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
        if (parsedInput.includes(" CONTAINING")) {
            const containedItemStringStart = parsedInput.indexOf(" CONTAINING") + " CONTAINING".length;
            const containedItemString = parsedInput.substring(containedItemStringStart).trim();
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
                const affix = containedItemStringEnd !== -1 ? ` ${parsedInput.substring(containedItemStringEnd).trimStart()}` : ``;
                parsedInput = parsedInput.substring(0, parsedInput.indexOf(" CONTAINING")) + affix;
            }
            catch (error) {
                return game.communicationHandler.reply(message, getErrorMessage(error));
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
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateEntityNotFoundError("fixture, room item, or puzzle", parsedInput));
        }
        else if (prefab === null && container !== null) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateEntityNotFoundError("prefab with id", parsedInput));
        else if (prefab === null && container === null) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateNotFoundError(parsedInput));

        if (!container.isItemContainer() || !container.canCurrentlyContainItems(false, true))
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotPutItemsInContainerError(container, "Moderator"));
        if (isNaN(quantity) || quantity < 1)
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotInstantiateWithInvalidQuantityError(prefab, quantity));
        if (quantity > 1 && !prefab.pluralContainingPhrase)
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateNoPluralContainingPhraseError(prefab));
        if (containerItem !== null && container instanceof RoomItem) {
            if (containerItemSlot.willBeOverFilledBy(prefab, quantity))
                return game.communicationHandler.reply(message, game.errorMessageGenerator.generateItemWillNotFitInInventorySlotError(prefab, container, containerItemSlot, "Moderator"));
        }
        // Check for procedural selections errors.
        for (const [proceduralName, proceduralValue] of proceduralSelections.entries()) {
            if (!prefab.proceduralOptions.has(proceduralName))
                return game.communicationHandler.reply(message, game.errorMessageGenerator.generateProceduralNotFoundError(prefab, proceduralName));
            if (!prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePossibilityNotFoundError(prefab, proceduralName, proceduralValue));
        }
        // Check for contained items errors.
        if (containedItems.length > 0) {
            if (prefab.inventory.size === 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotPutItemsInContainerError(prefab, "Moderator"));
            if (prefab.inventory.size > 1) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateContainerHasMultipleInventorySlotsError(prefab, "Moderator"));
            const totalSize = containedItems.reduce((size, item) => size + (item.quantity * item.prefab.size), 0);
            if (totalSize > prefab.inventory.first().capacity)
                return game.communicationHandler.reply(message, game.errorMessageGenerator.generateItemsWillNotFitInInventorySlotError(containedItems.map(item => item.prefab), prefab, prefab.inventory.first(), "Moderator"));
            for (const containedItem of containedItems) {
                for (const [proceduralName, proceduralValue] of containedItem.proceduralSelections.entries()) {
                    if (!containedItem.prefab.proceduralOptions.has(proceduralName))
                        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateProceduralNotFoundError(containedItem.prefab, proceduralName));
                    if (!containedItem.prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                        return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePossibilityNotFoundError(containedItem.prefab, proceduralName, proceduralValue));
                }
            }
        }

        // Now instantiate the item.
        const instantiateAction = new InstantiateRoomItemAction(game, message, undefined, room, true);
        instantiateAction.performInstantiateRoomItem(prefab, container, slotName, quantity, proceduralSelections, prefab.uses, containedItems);
        instantiateAction.sendSuccessMessageToCommandChannel();
    }
    else {
        const newArgs = input.split(' ');
        for (let i = 0; i < newArgs.length; i++) {
            let playerName = newArgs[i].toUpperCase();
            if (playerName.endsWith("'S")) {
                playerName = playerName.slice(0, -2);
            }

            const fetchedPlayer = game.entityFinder.getLivingPlayer(playerName);
            if (fetchedPlayer) {
                player = fetchedPlayer;
                newArgs.splice(i, 1);
                break;
            }
        }
        if (player === null) {
            if (!isMessageStartingWithIs) game.communicationHandler.reply(message, game.errorMessageGenerator.generateRoomOrPlayerNotFoundError());
            return;
        }

        parsedInput = newArgs.join(" ").toUpperCase().replace(/\'/g, "");

        // Check if an inventory item was specified.
        /** @type {InventoryItem} */
        let containerItem = null;
        /** @type {InventorySlot<InventoryItem>} */
        let containerItemSlot = null;
        const items = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null);
        for (let i = 0; i < items.length; i++) {
            if (items[i].identifier === parsedInput || items[i].prefab.id === parsedInput || items[i].name === parsedInput) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateSpecifyError(`a prefab and a preposition`));
            if (parsedInput.endsWith(items[i].identifier) && items[i].identifier !== "" || parsedInput.endsWith(items[i].prefab.id) || parsedInput.endsWith(items[i].name)) {
                if (items[i].inventory.size === 0 || items[i].prefab.preposition === "") return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotPutItemsInContainerError(items[i], "Moderator"));
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
                        }
                    }
                    if (containerItemSlot === null) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateInventorySlotNotFoundError(containerItem, newArgs[newArgs.length - 1], "Moderator"));
                }
                if (parsedInput.endsWith(containerItem.prefab.preposition.toUpperCase()))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItem.prefab.preposition.toUpperCase())).trimEnd();
                else if (parsedInput.endsWith(" IN"))
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" IN")).trimEnd();
                break;
            }
        }
        if (containerItem !== null && containerItemSlot === null) [containerItemSlot] = containerItem.inventory.values();
        const slotName = containerItem !== null ? containerItemSlot.id : "";

        // Check if an equipment slot was specified.
        let equipmentSlotId = "";
        if (containerItem === null) {
            for (const [id, slot] of player.inventory) {
                if (parsedInput.endsWith(id)) {
                    equipmentSlotId = id;
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(id)).trimEnd();
                    const newArgs = parsedInput.split(' ');
                    newArgs.splice(newArgs.length - 1, 1);
                    parsedInput = newArgs.join(' ');
                    if (slot.equippedItem !== null) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotEquipToOccupiedEquipmentSlotError(slot, "Moderator"));
                    break;
                }
            }
        }

        /** @type {ContainedItem[]} */
        let containedItems = [];
        if (parsedInput.includes(" CONTAINING")) {
            const containedItemStringStart = parsedInput.indexOf(" CONTAINING") + " CONTAINING".length;
            const containedItemString = parsedInput.substring(containedItemStringStart).trim();
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
                const affix = containedItemStringEnd !== -1 ? ` ${parsedInput.substring(containedItemStringEnd).trimStart()}` : ``;
                parsedInput = parsedInput.substring(0, parsedInput.indexOf(" CONTAINING")) + affix;
            }
            catch (error) {
                return game.communicationHandler.reply(message, getErrorMessage(error));
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

        if (prefab !== null && containerItem === null && equipmentSlotId === "") {
            parsedInput = parsedInput.substring(prefab.id.length).trimStart();
            parsedInput = parsedInput.substring(parsedInput.indexOf(' ')).trimStart();
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateEntityNotFoundError("inventory item or equipment slot", parsedInput));
        }
        else if (prefab === null && (containerItem !== null || equipmentSlotId !== "")) {
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateEntityNotFoundError("prefab with id", parsedInput));
        }
        else if (prefab === null && containerItem === null && equipmentSlotId === "") return game.communicationHandler.reply(message, game.errorMessageGenerator.generateNotFoundError(parsedInput));

        if (isNaN(quantity) || quantity < 1)
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotInstantiateWithInvalidQuantityError(prefab, quantity));
        if (equipmentSlotId !== "" && quantity !== 1)
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotInstantiateEquippedItemWithInvalidQuantityError());
        if (quantity > 1 && !prefab.pluralContainingPhrase)
            return game.communicationHandler.reply(message, game.errorMessageGenerator.generateNoPluralContainingPhraseError(prefab));
        if (containerItem !== null) {
            equipmentSlotId = containerItem.equipmentSlot;
            if (containerItemSlot.willBeOverFilledBy(prefab, quantity))
                return game.communicationHandler.reply(message, game.errorMessageGenerator.generateItemWillNotFitInInventorySlotError(prefab, containerItem, containerItemSlot, "Moderator"));
        }
        // Check for procedural selections errors.
        for (const [proceduralName, proceduralValue] of proceduralSelections.entries()) {
            if (!prefab.proceduralOptions.has(proceduralName))
                return game.communicationHandler.reply(message, game.errorMessageGenerator.generateProceduralNotFoundError(prefab, proceduralName));
            if (!prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePossibilityNotFoundError(prefab, proceduralName, proceduralValue));
        }
        // Check for contained items errors.
        if (containedItems.length > 0) {
            if (prefab.inventory.size === 0) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateCannotPutItemsInContainerError(prefab, "Moderator"));
            if (prefab.inventory.size > 1) return game.communicationHandler.reply(message, game.errorMessageGenerator.generateContainerHasMultipleInventorySlotsError(prefab, "Moderator"));
            const totalSize = containedItems.reduce((size, item) => size + (item.quantity * item.prefab.size), 0);
            if (totalSize > prefab.inventory.first().capacity)
                return game.communicationHandler.reply(message, game.errorMessageGenerator.generateItemsWillNotFitInInventorySlotError(containedItems.map(item => item.prefab), prefab, prefab.inventory.first(), "Moderator"));
            for (const containedItem of containedItems) {
                for (const [proceduralName, proceduralValue] of containedItem.proceduralSelections.entries()) {
                    if (!containedItem.prefab.proceduralOptions.has(proceduralName))
                        return game.communicationHandler.reply(message, game.errorMessageGenerator.generateProceduralNotFoundError(containedItem.prefab, proceduralName));
                    if (!containedItem.prefab.proceduralOptions.get(proceduralName).has(proceduralValue))
                        return game.communicationHandler.reply(message, game.errorMessageGenerator.generatePossibilityNotFoundError(containedItem.prefab, proceduralName, proceduralValue));
                }
            }
        }

        // Now instantiate the item.
        const instantiateAction = new InstantiateInventoryItemAction(game, message, player, player.location, true);
        instantiateAction.performInstantiateInventoryItem(prefab, equipmentSlotId, containerItem, slotName, quantity, proceduralSelections, prefab.uses, containedItems);
        instantiateAction.sendSuccessMessageToCommandChannel();
    }
}
