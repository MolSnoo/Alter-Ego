// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import DropAction from '../Data/Actions/DropAction.ts';
import Fixture from "../Data/Fixture.ts";
import RoomItem from "../Data/RoomItem.ts";
import Puzzle from "../Data/Puzzle.ts";

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import EquipmentSlot from '../Data/EquipmentSlot.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import InventoryItem from '../Data/InventoryItem.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "drop_moderator",
    description: "Drops the given item from a player's inventory.",
    details: `Discards an item from the given player's inventory and leaves it in the room they're in. The item must `
        + `be in one of the player's hands. The item's prefab ID or container identifier must be used. If the player `
        + `discards a non-discreet item, this will be narrated in the room, so other players will see them drop it.\n\n`
        + `A container to drop the item into can be specified. To do so, add the container's preposition or "in" after `
        + `the item's identifier, followed by the container's name. If the container is a room item, its prefab ID or `
        + `container identifier must be used. If you don't specify a container, the player will leave the item `
        + `on the \`DEFAULT_DROP_FIXTURE\` defined in the game's settings.\n\n`
        + `If the container has multiple inventory slots, you can also specify which slot to put the item in. `
        + `To do this, enter the ID of the inventory slot followed by "of" before the container's identifier. If an `
        + `inventory slot is not specified, the player will put the item in the container's first inventory slot.\n\n`
        + `This command supports NPC latching. For more information, see the help details for the \`latch\` command.`,
    usableBy: "Moderator",
    aliases: ["drop", "discard", "put", "place", "d"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}drop Fable's LARGE KNIFE\n`
        + `${settings.commandPrefix}discard Fable LARGE KNIFE on COUNTER\n`
        + `${settings.commandPrefix}put Kyra's COOKIE SHEET 3 in OVEN\n`
        + `${settings.commandPrefix}place Kanda's WATERMELON in CRATE 1\n`
        + `${settings.commandPrefix}d Ava WRENCH on TOP RACK of TOOL BOX`;
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

    const input = args.join(" ");
    let parsedInput = input.toUpperCase().replace(/\'/g, "");
    let newArgs = [];

    // First, find the item in the player's inventory.
    /** @type {EquipmentSlot} */
    let hand;
    /** @type {InventoryItem} */
    let item;
    for (let i = args.length; i > 0; i--) {
        hand = game.entityFinder.getPlayerHandHoldingItem(player, args.slice(0, i).join(" "));
        if (hand) {
            item = hand.equippedItem;
            parsedInput = parsedInput.substring(args.slice(0, i).join(" ").length).trim();
            args = args.slice(i);
            break;
        }
    }
    if (item === undefined) return game.communicationHandler.reply(message, `Couldn't find item "${input}" in either of ${player.name}'s hands.`);
    newArgs = parsedInput.split(" ");

    // Check if a fixture was specified.
    const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
    let fixture = null;
    if (parsedInput !== "") {
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput) return game.communicationHandler.reply(message, `You need to supply a preposition.`);
            if ((parsedInput === `${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}` || parsedInput === `IN ${fixtures[i].name}`) && fixtures[i].preposition !== "") {
                fixture = fixtures[i];
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(fixtures[i].name)).trimEnd();
                // Check if the fixture has a puzzle attached to it.
                if (fixture.childPuzzle !== null && !fixture.childPuzzle.isAlwaysAccessible() && (!fixture.childPuzzle.accessible || !fixture.childPuzzle.solved) && player.hidingSpot !== fixture.name)
                    return game.communicationHandler.reply(message, `You cannot put items ${fixture.preposition} ${fixture.name} right now.`);
                newArgs = parsedInput.split(' ');
                newArgs.splice(newArgs.length - 1, 1);
                parsedInput = newArgs.join(' ');
                break;
            }
            else if (parsedInput === `${newArgs[0]} ${fixtures[i].name}` && fixtures[i].preposition === "") return game.communicationHandler.reply(message, `${fixtures[i].name} cannot hold items.`);
        }
    }

    // Check if a container item was specified.
    const items = game.roomItems.filter(item => item.location.id === player.location.id && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    let containerItem = null;
    let containerItemSlot = null;
    if (parsedInput !== "") {
        for (let i = 0; i < items.length; i++) {
            if (items[i].identifier !== "" && items[i].identifier === parsedInput ||
                items[i].prefab && items[i].prefab.id === parsedInput ||
                items[i].name === parsedInput) return game.communicationHandler.reply(message, `You need to supply a preposition.`);
            if (items[i].identifier !== "" && parsedInput.endsWith(items[i].identifier) ||
                parsedInput.endsWith(items[i].prefab.id) ||
                parsedInput.endsWith(items[i].name)) {
                const itemContainer = items[i].container;
                if (fixture === null || fixture !== null && itemContainer !== null && (itemContainer.name === fixture.name || itemContainer instanceof Puzzle && itemContainer.parentFixture.name === fixture.name)) {
                    if (items[i].inventory.size === 0) return game.communicationHandler.reply(message, `${items[i].prefab.id} cannot hold items.`);
                    containerItem = items[i];

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
                        for (const [id, slot] of containerItem.inventory) {
                            if (parsedInput.endsWith(id)) {
                                containerItemSlot = slot;
                                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItemSlot.id)).trimEnd();
                                break;
                            }
                        }
                        if (containerItemSlot === null) return game.communicationHandler.reply(message, `Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier}.`);
                    }
                    newArgs = parsedInput.split(' ');
                    newArgs.splice(newArgs.length - 1, 1);
                    parsedInput = newArgs.join(' ');
                    break;
                }
            }
        }
    }
    // Now decide what the container should be.
    let container = null;
    let slot = null;
    if (fixture !== null && fixture.childPuzzle === null && containerItem === null)
        container = fixture;
    else if (fixture !== null && fixture.childPuzzle !== null && (fixture.childPuzzle.isAlwaysAccessible() || fixture.childPuzzle.accessible && fixture.childPuzzle.solved || player.hidingSpot === fixture.name) && containerItem === null)
        container = fixture.childPuzzle;
    else if (containerItem !== null) {
        container = containerItem;
        if (containerItemSlot === null) [containerItemSlot] = containerItem.inventory.values();
        slot = containerItemSlot;
        if (item.prefab.size > containerItemSlot.capacity && container.inventory.size !== 1) return game.communicationHandler.reply(message, `${item.getIdentifier()} will not fit in ${containerItemSlot.id} of ${container.identifier} because it is too large.`);
        else if (item.prefab.size > containerItemSlot.capacity) return game.communicationHandler.reply(message, `${item.getIdentifier()} will not fit in ${container.identifier} because it is too large.`);
        else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity && container.inventory.size !== 1) return game.communicationHandler.reply(message, `${item.getIdentifier()} will not fit in ${containerItemSlot.id} of ${container.identifier} because there isn't enough space left.`);
        else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity) return game.communicationHandler.reply(message, `${item.getIdentifier()} will not fit in ${container.identifier} because there isn't enough space left.`);
    }
    else {
        if (parsedInput !== "") return game.communicationHandler.reply(message, `Couldn't find "${parsedInput}" to drop item into.`);
        const defaultDropFixture = fixtures.find(fixture => fixture.name === game.settings.defaultDropFixture);
        if (defaultDropFixture === null || defaultDropFixture === undefined) return game.communicationHandler.reply(message, `There is no default drop object "${game.settings.defaultDropFixture}" in ${player.location.id}.`);
        container = defaultDropFixture;
    }

    let topContainer = container;
    while (topContainer !== null && topContainer instanceof RoomItem)
        topContainer = topContainer.container;

    if (topContainer !== null) {
        let topContainerPreposition = "in";
        if (topContainer instanceof Fixture && topContainer.preposition !== "") topContainerPreposition = topContainer.preposition;
        if (topContainer instanceof Fixture && topContainer.autoDeactivate && topContainer.activated)
            return game.communicationHandler.reply(message, `Items cannot be put ${topContainerPreposition} ${topContainer.name} while it is turned on.`);
    }

    const action = new DropAction(game, message, player, player.location, true);
    await action.performDrop(item, hand, container, slot);
    action.sendSuccessMessageToCommandChannel();
}
