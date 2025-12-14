import Fixture from "../Data/Fixture.js";
import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import RoomItem from "../Data/RoomItem.js";
import Puzzle from "../Data/Puzzle.js";
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "undress_moderator",
    description: "Unequips and drops all items for a player.",
    details: "Unequips all items the given player has equipped and drops them into a container of your choosing. If no container is chosen, then items will be "
        + `dropped on the floor. The given container must have a large enough capacity to hold all of the items in the given player's `
        + "inventory. This command will also drop any items in their hands.",
    usableBy: "Moderator",
    aliases: ["undress"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}undress haru\n`
        + `${settings.commandPrefix}undress yuko locker 1\n`
        + `${settings.commandPrefix}undress aki laundry basket\n`
        + `${settings.commandPrefix}undress stella main pocket of backpack`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify a player. Usage:\n${usage(game.settings)}`);

    let player = game.entityFinder.getLivingPlayer(args[0].toLowerCase().replace(/'s/g, ""));
    if (player === undefined) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    let input = args.join(' ');
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
                if (fixture.childPuzzle !== null && fixture.childPuzzle.type !== "weight" && fixture.childPuzzle.type !== "container" && (!fixture.childPuzzle.accessible || !fixture.childPuzzle.solved) && player.hidingSpot !== fixture.name)
                    return messageHandler.addReply(game, message, `You cannot put items ${fixture.preposition} ${fixture.name} right now.`);
                break;
            }
            else if (fixtures[i].name === parsedInput) return messageHandler.addReply(game, message, `${fixtures[i].name} cannot hold items.`);
        }
    }

    // Check if the player specified a container item.
    let items = game.items.filter(item => item.location.id === player.location.id && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    let containerItem = null;
    let containerItemSlot = null;
    if (parsedInput !== "") {
        for (let i = 0; i < items.length; i++) {
            if (parsedInput.endsWith(items[i].name)) {
                const itemContainer = items[i].container;
                if (fixture === null || fixture !== null && itemContainer !== null && (itemContainer.name === fixture.name || itemContainer instanceof Puzzle && itemContainer.parentFixture.name === fixture.name)) {
                    if (items[i].inventory.length === 0) return messageHandler.addReply(game, message, `${items[i].prefab.id} cannot hold items.`);
                    containerItem = items[i];
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                    // Check if a slot was specified.
                    if (parsedInput.endsWith(" OF")) {
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                        for (let slot = 0; slot < containerItem.inventory.length; slot++) {
                            if (parsedInput.endsWith(containerItem.inventory[slot].id)) {
                                containerItemSlot = containerItem.inventory[slot];
                                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItemSlot.id)).trimEnd();
                                break;
                            }
                        }
                        if (containerItemSlot === null) return messageHandler.addReply(game, message, `Couldn't find "${parsedInput}" of ${containerItem.name}.`);
                    }
                    break;
                }
            }
        }
    }

    // Now decide what the container should be.
    let container = null;
    let slotName = "";
    if (fixture !== null && fixture.childPuzzle === null && containerItem === null)
        container = fixture;
    else if (fixture !== null && fixture.childPuzzle !== null && (fixture.childPuzzle.type === "weight" || fixture.childPuzzle.type === "container" || fixture.childPuzzle.accessible && fixture.childPuzzle.solved || player.hidingSpot === fixture.name) && containerItem === null)
        container = fixture.childPuzzle;
    else if (containerItem !== null) {
        container = containerItem;
        if (containerItemSlot === null) containerItemSlot = containerItem.inventory[0];
        slotName = containerItemSlot.id;
        let totalSize = 0;
        for (let i = 0; i < player.inventory.length; i++) {
            if (player.inventory[i].equippedItem !== null)
                totalSize += player.inventory[i].equippedItem.prefab.size;
        }
        if (totalSize > containerItemSlot.capacity && container.inventory.length !== 1) return messageHandler.addReply(game, message, `${player.name}'s inventory will not fit in ${containerItemSlot.id} of ${container.name} because it is too large.`);
        else if (totalSize > containerItemSlot.capacity) return messageHandler.addReply(game, message, `${player.name}'s inventory will not fit in ${container.name} because it is too large.`);
        else if (containerItemSlot.takenSpace + totalSize > containerItemSlot.capacity && container.inventory.length !== 1) return messageHandler.addReply(game, message, `${player.name}'s inventory will not fit in ${containerItemSlot.id} of ${container.name} because there isn't enough space left.`);
        else if (containerItemSlot.takenSpace + totalSize > containerItemSlot.capacity) return messageHandler.addReply(game, message, `${player.name}'s inventory will not fit in ${container.name} because there isn't enough space left.`);
    }
    else {
        if (parsedInput !== "") return messageHandler.addReply(game, message, `Couldn't find "${parsedInput}" to drop item into.`);
        const defaultDropOpject = fixtures.find(fixture => fixture.name === game.settings.defaultDropFixture);
        if (defaultDropOpject === null || defaultDropOpject === undefined) return messageHandler.addReply(game, message, `There is no default drop fixture "${game.settings.defaultDropFixture}" in ${player.location.name}.`);
        container = defaultDropOpject;
    }

    let topContainer = container;
    while (topContainer !== null && topContainer instanceof RoomItem)
        topContainer = topContainer.container;

    if (topContainer !== null) {
        let topContainerPreposition = "in";
        if (topContainer instanceof Fixture && topContainer.preposition !== "") topContainerPreposition = topContainer.preposition;
        if (topContainer instanceof Fixture && topContainer.autoDeactivate && topContainer.activated)
            return messageHandler.addReply(game, message, `Items cannot be put ${topContainerPreposition} ${topContainer.name} while it is turned on.`);
    }

    let rightHand = 0;
    // First, drop the items in the player's hands.
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].id === "RIGHT HAND") rightHand = slot;
        if (player.inventory[slot].id === "RIGHT HAND" && player.inventory[slot].equippedItem !== null)
            player.drop(player.inventory[slot].equippedItem, "RIGHT HAND", container, slotName, false);
        else if (player.inventory[slot].id === "LEFT HAND" && player.inventory[slot].equippedItem !== null)
            player.drop(player.inventory[slot].equippedItem, "LEFT HAND", container, slotName, false);
    }
    // Now, unequip all equipped items.
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].equippedItem !== null && player.inventory[slot].equippedItem.prefab.equippable) {
            player.unequip(player.inventory[slot].equippedItem, player.inventory[slot].id, "RIGHT HAND", false);
            player.drop(player.inventory[rightHand].equippedItem, "RIGHT HAND", container, slotName, false);
        }
    }

    player.notify(`You undress.`);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is a Fixture.
    if (container instanceof Fixture)
        messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly undressed into ${container.name} in ${player.location.channel}`);
    // Container is a Puzzle.
    else if (container instanceof Puzzle) {
        messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly undressed into ${container.name} in ${player.location.channel}`);
        // Container is a weight puzzle.
        if (container.type === "weight") {
            const containerItems = game.items.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0);
            const weight = containerItems.reduce((total, item) => total + item.quantity * item.weight, 0);
            player.attemptPuzzle(container, null, weight.toString(), "drop", input);
        }
        // Container is a container puzzle.
        else if (container.type === "container") {
            const containerItems = game.items.filter(item => item.location.id === container.location.id && item.containerName === `Puzzle: ${container.name}` && !isNaN(item.quantity) && item.quantity > 0).sort(function (a, b) {
                if (a.prefab.id < b.prefab.id) return -1;
                if (a.prefab.id > b.prefab.id) return 1;
                return 0;
            }).map(item => item.prefab.id);
            player.attemptPuzzle(container, null, containerItems.join(','), "drop", input);
        }
    }
    // Container is a RoomItem.
    else if (container instanceof RoomItem)
        messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly undressed into ${slotName} of ${container.identifier} in ${player.location.channel}`);

    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully undressed ${player.name}.`);

    return;
}
