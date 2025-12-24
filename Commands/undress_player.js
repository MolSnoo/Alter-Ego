import Fixture from "../Data/Fixture.js";
import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import RoomItem from "../Data/RoomItem.js";
import Player from '../Data/Player.js';
import Puzzle from "../Data/Puzzle.js";
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "undress_player",
    description: "Unequips and drops all items.",
    details: "Unequips all items you have equipped and drops them into a container of your choosing. If no container is chosen, then items will be "
        + `dropped on the floor. The given container must have a large enough capacity to hold all of the items in your `
        + "inventory. This command will also drop any items in your hands.",
    usableBy: "Player",
    aliases: ["undress"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}undress\n`
        + `${settings.commandPrefix}undress wardrobe\n`
        + `${settings.commandPrefix}undress laundry basket\n`
        + `${settings.commandPrefix}undress main pocket of backpack`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    const status = player.getBehaviorAttributeStatusEffects("disable undress");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    const input = args.join(' ');
    let parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Check if the player specified a fixture.
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
            else if (fixtures[i].name === parsedInput) return messageHandler.addReply(game, message, `${fixtures[i].name} cannot hold items. Contact a moderator if you believe this is a mistake.`);
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
                    if (items[i].inventoryCollection.size === 0) return messageHandler.addReply(game, message, `${items[i].name} cannot hold items. Contact a moderator if you believe this is a mistake.`);
                    containerItem = items[i];
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                    // Check if a slot was specified.
                    if (parsedInput.endsWith(" OF")) {
                        parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                        for (const [id, slot] of containerItem.inventoryCollection) {
                            if (parsedInput.endsWith(id)) {
                                containerItemSlot = slot;
                                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(id)).trimEnd();
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
        if (containerItemSlot === null) [containerItemSlot] = containerItem.inventoryCollection.values();
        slotName = containerItemSlot.id;
        const totalSize = player.inventoryCollection.values().reduce((sum, item) => {
            return item.equippedItem !== null ? sum + item.equippedItem.prefab.size : sum;
        }, 0);
        if (totalSize > containerItemSlot.capacity && container.inventoryCollection.size !== 1) return messageHandler.addReply(game, message, `Your inventory will not fit in ${containerItemSlot.id} of ${container.name} because it is too large.`);
        else if (totalSize > containerItemSlot.capacity) return messageHandler.addReply(game, message, `Your inventory will not fit in ${container.name} because it is too large.`);
        else if (containerItemSlot.takenSpace + totalSize > containerItemSlot.capacity && container.inventoryCollection.size !== 1) return messageHandler.addReply(game, message, `Your inventory will not fit in ${containerItemSlot.id} of ${container.name} because there isn't enough space left.`);
        else if (containerItemSlot.takenSpace + totalSize > containerItemSlot.capacity) return messageHandler.addReply(game, message, `Your inventory will not fit in ${container.name} because there isn't enough space left.`);
    }
    else {
        if (parsedInput !== "") return messageHandler.addReply(game, message, `Couldn't find "${parsedInput}" to drop item into.`);
        const defaultDropOpject = fixtures.find(fixture => fixture.name === game.settings.defaultDropFixture);
        if (defaultDropOpject === null || defaultDropOpject === undefined) return messageHandler.addReply(game, message, `You cannot drop items in this room.`);
        container = defaultDropOpject;
    }

    let topContainer = container;
    while (topContainer !== null && topContainer instanceof RoomItem)
        topContainer = topContainer.container;

    if (topContainer !== null) {
        let topContainerPreposition = "in";
        if (topContainer instanceof Fixture && topContainer.preposition !== "") topContainerPreposition = topContainer.preposition;
        if (topContainer instanceof Fixture && topContainer.autoDeactivate && topContainer.activated)
            return messageHandler.addReply(game, message, `You cannot put items ${topContainerPreposition} ${topContainer.name} while it is turned on.`);
    }
    const hiddenStatus = player.getBehaviorAttributeStatusEffects("hidden");
    if (hiddenStatus.length > 0) {
        if (topContainer !== null && topContainer instanceof Puzzle)
            topContainer = topContainer.parentFixture;

        if (topContainer === null || topContainer instanceof Fixture && topContainer.name !== player.hidingSpot)
            return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
    }

    const [rightHand, leftHand] = game.entityFinder.getPlayerHands(player);
    // First, drop the items in the player's hands.
    if (rightHand.equippedItem !== null)
        player.drop(rightHand.equippedItem, rightHand, container, containerItemSlot, false);
    if (leftHand.equippedItem !== null)
        player.drop(leftHand.equippedItem, leftHand, container, containerItemSlot, false);
    // Now, unequip all equipped items.
    for (const slot of player.inventoryCollection.values()) {
        if (slot.equippedItem !== null && slot.equippedItem.prefab.equippable) {
            player.unequip(slot.equippedItem, slot, rightHand, false);
            player.drop(rightHand.equippedItem, rightHand, container, containerItemSlot, false);
        }
    }

    player.notify(`You undress.`);
    // Post log message. Message should vary based on container type.
    const time = new Date().toLocaleTimeString();
    // Container is a Fixture.
    if (container instanceof Fixture)
        messageHandler.addLogMessage(game, `${time} - ${player.name} undressed into ${container.name} in ${player.location.channel}`);
    // Container is a Puzzle.
    else if (container instanceof Puzzle) {
        messageHandler.addLogMessage(game, `${time} - ${player.name} undressed into ${container.name} in ${player.location.channel}`);
        // Container is a weight puzzle.
        if (container.type === "weight") {
            const containerItems = game.entityFinder.getRoomItems(null, container.location.id, null, `Puzzle: ${container.name}`);
            const weight = containerItems.reduce((total, item) => total + item.quantity * item.weight, 0);
            player.attemptPuzzle(container, null, weight.toString(), "drop", input);
        }
        // Container is a container puzzle.
        else if (container.type === "container") {
            const containerItems = game.entityFinder.getRoomItems(null, container.location.id, null, `Puzzle: ${container.name}`).sort(function (a, b) {
                if (a.prefab.id < b.prefab.id) return -1;
                if (a.prefab.id > b.prefab.id) return 1;
                return 0;
            }).map(item => item.prefab.id);
            player.attemptPuzzle(container, null, containerItems.join(','), "drop", input);
        }
    }
    // Container is a RoomItem.
    else if (container instanceof RoomItem)
        messageHandler.addLogMessage(game, `${time} - ${player.name} undressed into ${slotName} of ${container.identifier} in ${player.location.channel}`);

    return;
}
