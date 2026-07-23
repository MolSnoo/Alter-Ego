// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import UndressAction from '../Data/Actions/UndressAction.ts';
import Fixture from "../Data/Fixture.ts";
import RoomItem from "../Data/RoomItem.ts";
import Puzzle from "../Data/Puzzle.ts";

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "undress_moderator",
    description: "Unequips and drops all items for a player.",
    details: `Unequips all of the player's equipped items and drops them in the room they're currently in. They will `
        + `undress completely, including any items in their hands. However, any items whose prefab is not equippable `
        + `will not be removed with this command. They can be forcibly removed with the \`unequip\` command. When the `
        + `player undresses, it will narrated in the room.\n\n`
        + `A container to drop the items into can be specified. To do so, enter the container's name. No preposition is `
        + `necessary. If the container is a room item, its prefab ID or container identifier must be used. If you don't `
        + "specify a container, they will leave the items on the `DEFAULT_DROP_FIXTURE` defined in the game's settings.\n\n"
        + `If the container has multiple inventory slots, you can also specify which slot to put the items in. To do `
        + `this, enter the ID of the inventory slot followed by "of" before the container's identifier. If an inventory `
        + `slot is not specified, the player will put the items in the container's first inventory slot. However, they `
        + `will not be able to undress into an inventory slot if the combined size of their items would overfill it.\n\n`
        + `This command supports NPC latching. For more information, see the help details for the \`latch\` command.`,
    usableBy: "Moderator",
    aliases: ["undress"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}undress Haru\n`
        + `${settings.commandPrefix}undress Aisha LOCKER 1\n`
        + `${settings.commandPrefix}undress Astrid LAUNDRY BASKET 17\n`
        + `${settings.commandPrefix}undress Xenia MAIN POCKET of XENIAS BACKPACK`;
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
    if (!sentMessageInLatchChannel && args.length === 0)
        return game.communicationHandler.reply(message, `You need to specify a player. Usage:\n${usage(game.settings)}`);

    let player = game.entityFinder.getLivingPlayer(args[0]?.replace(/'s/g, ""));
    if (player && !moderator.latchedPlayerHasName(args[0]))
        args.splice(0, 1);
    if (!player && sentMessageInLatchChannel)
        player = moderator.getLatch();
    if (player === undefined) return game.communicationHandler.reply(message, `Player "${args[0]}" not found.`);

    const equippedItems = player.inventory.filter(equipmentSlot => equipmentSlot.equippedItem !== null);
    if (equippedItems.size === 0) return game.communicationHandler.reply(message, `${player.name} cannot undress because ${player.originalPronouns.sbj} does not have anything equipped.`);

    const input = args.join(' ');
    let parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Check if a fixture was specified.
    const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
    let fixture = null;
    if (parsedInput !== "") {
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput && fixtures[i].preposition !== "") {
                fixture = fixtures[i];
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(fixtures[i].name)).trimEnd();
                // Check if the fixture has a puzzle attached to it.
                if (fixture.childPuzzle !== null && !fixture.childPuzzle.isAlwaysAccessible() && (!fixture.childPuzzle.accessible || !fixture.childPuzzle.solved) && player.hidingSpot !== fixture.name)
                    return game.communicationHandler.reply(message, `You cannot put items ${fixture.preposition} ${fixture.name} right now.`);
                break;
            }
            else if (fixtures[i].name === parsedInput) return game.communicationHandler.reply(message, `${fixtures[i].name} cannot hold items.`);
        }
    }

    // Check if the player specified a container item.
    const items = game.entityFinder.getRoomItems(null, player.location.id, true);
    let containerItem = null;
    let containerItemSlot = null;
    if (parsedInput !== "") {
        for (let i = 0; i < items.length; i++) {
            if (parsedInput.endsWith(items[i].name)) {
                const itemContainer = items[i].container;
                if (fixture === null || fixture !== null && itemContainer !== null && (itemContainer.name === fixture.name || itemContainer instanceof Puzzle && itemContainer.parentFixture.name === fixture.name)) {
                    if (items[i].inventory.size === 0) return game.communicationHandler.reply(message, `${items[i].prefab.id} cannot hold items.`);
                    containerItem = items[i];
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                    // Check if a slot was specified.
                    if (parsedInput.endsWith(" OF")) {
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                        for (const [id, slot] of containerItem.inventory) {
                            if (parsedInput.endsWith(id)) {
                                containerItemSlot = slot;
                                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(id)).trimEnd();
                                break;
                            }
                        }
                        if (containerItemSlot === null) return game.communicationHandler.reply(message, `Couldn't find "${parsedInput}" of ${containerItem.name}.`);
                    }
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
        const totalSize = player.inventory.values().reduce((sum, item) => {
            return item.equippedItem !== null ? sum + item.equippedItem.prefab.size : sum;
        }, 0);
        if (totalSize > containerItemSlot.capacity && container.inventory.size !== 1) return game.communicationHandler.reply(message, `${player.name}'s inventory will not fit in ${containerItemSlot.id} of ${container.name} because it is too large.`);
        else if (totalSize > containerItemSlot.capacity) return game.communicationHandler.reply(message, `${player.name}'s inventory will not fit in ${container.name} because it is too large.`);
        else if (containerItemSlot.takenSpace + totalSize > containerItemSlot.capacity && container.inventory.size !== 1) return game.communicationHandler.reply(message, `${player.name}'s inventory will not fit in ${containerItemSlot.id} of ${container.name} because there isn't enough space left.`);
        else if (containerItemSlot.takenSpace + totalSize > containerItemSlot.capacity) return game.communicationHandler.reply(message, `${player.name}'s inventory will not fit in ${container.name} because there isn't enough space left.`);
    }
    else {
        if (parsedInput !== "") return game.communicationHandler.reply(message, `Couldn't find "${parsedInput}" to drop item into.`);
        const defaultDropObject = fixtures.find(fixture => fixture.name === game.settings.defaultDropFixture);
        if (defaultDropObject === null || defaultDropObject === undefined) return game.communicationHandler.reply(message, `There is no default drop fixture "${game.settings.defaultDropFixture}" in ${player.location.id}.`);
        container = defaultDropObject;
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

    const action = new UndressAction(game, message, player, player.location, true);
    await action.performUndress(container, slot);
    action.sendSuccessMessageToCommandChannel();
}
