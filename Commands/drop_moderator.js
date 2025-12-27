import DropAction from '../Data/Actions/DropAction.js';
import Fixture from "../Data/Fixture.js";
import RoomItem from "../Data/RoomItem.js";
import Puzzle from "../Data/Puzzle.js";
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "drop_moderator",
    description: "Drops the given item from a player's inventory.",
    details: "Forcibly drops an item for a player. The item must be in either of the player's hands. You can specify "
        + "where in the room to drop the item into by putting the name of an object or item in the room after the item. "
        + "If you want to discard the item in an item with multiple inventory slots, you can specify which slot to put it in. "
        + `If no object or item is specified, they will drop it on the floor. This can be changed in the settings file. `
        + "Only objects and item in the same room as the player can be specified.",
    usableBy: "Moderator",
    aliases: ["drop", "discard", "d"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}drop emily's knife\n`
        + `${settings.commandPrefix}drop veronica knife on counter\n`
        + `${settings.commandPrefix}drop colin's fish sticks in oven\n`
        + `${settings.commandPrefix}drop aria yellow key in large purse\n`
        + `${settings.commandPrefix}drop devyn wrench on top rack of tool box`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return addReply(game, message, `You need to specify a player and an item. Usage:\n${usage(game.settings)}`);

    const player = game.entityFinder.getLivingPlayer(args[0].toLowerCase().replace(/'s/g, ""));
    if (player === undefined) return addReply(game, message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    const input = args.join(" ");
    let parsedInput = input.toUpperCase().replace(/\'/g, "");
    let newArgs = null;

    // First, find the item in the player's inventory.
    let hand, item;
    for (let i = args.length; i > 0; i--) {
        [hand, item] = game.entityFinder.getPlayerHandHoldingItem(player, args.slice(0, i).join(" "), true);
        if (hand) {
            args = args.slice(i);
            break;
        }
    }
    if (item === undefined) return addReply(game, message, `Couldn't find item "${input}" in either of ${player.name}'s hands.`);
    newArgs = parsedInput.split(' ');

    // Check if a fixture was specified.
    const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
    let fixture = null;
    if (parsedInput !== "") {
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput) return addReply(game, message, `You need to supply a preposition.`);
            if ((parsedInput === `${fixtures[i].preposition.toUpperCase()} ${fixtures[i].name}` || parsedInput === `IN ${fixtures[i].name}`) && fixtures[i].preposition !== "") {
                fixture = fixtures[i];
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(fixtures[i].name)).trimEnd();
                // Check if the fixture has a puzzle attached to it.
                if (fixture.childPuzzle !== null && fixture.childPuzzle.type !== "weight" && fixture.childPuzzle.type !== "container" && (!fixture.childPuzzle.accessible || !fixture.childPuzzle.solved) && player.hidingSpot !== fixture.name)
                    return addReply(game, message, `You cannot put items ${fixture.preposition} ${fixture.name} right now.`);
                newArgs = parsedInput.split(' ');
                newArgs.splice(newArgs.length - 1, 1);
                parsedInput = newArgs.join(' ');
                break;
            }
            else if (parsedInput === `${newArgs[0]} ${fixtures[i].name}` && fixtures[i].preposition === "") return addReply(game, message, `${fixtures[i].name} cannot hold items.`);
        }
    }

    // Check if a container item was specified.
    const items = game.roomItems.filter(item => item.location.id === player.location.id && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    let containerItem = null;
    let containerItemSlot = null;
    if (parsedInput !== "") {
        for (let i = 0; i < items.length; i++) {
            if (items[i].identifier !== "" && items[i].identifier === parsedInput ||
                items[i].prefab.id === parsedInput ||
                items[i].name === parsedInput) return addReply(game, message, `You need to supply a preposition.`);
            if (items[i].identifier !== "" && parsedInput.endsWith(items[i].identifier) ||
                parsedInput.endsWith(items[i].prefab.id) ||
                parsedInput.endsWith(items[i].name)) {
                const itemContainer = items[i].container;
                if (fixture === null || fixture !== null && itemContainer !== null && (itemContainer.name === fixture.name || itemContainer instanceof Puzzle && itemContainer.parentFixture.name === fixture.name)) {
                    if (items[i].inventoryCollection.size === 0) return addReply(game, message, `${items[i].prefab.id} cannot hold items.`);
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
                        for (const [id, slot] of containerItem.inventoryCollection) {
                            if (parsedInput.endsWith(id)) {
                                containerItemSlot = slot;
                                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(containerItemSlot.id)).trimEnd();
                                break;
                            }
                        }
                        if (containerItemSlot === null) return addReply(game, message, `Couldn't find "${newArgs[newArgs.length - 1]}" of ${containerItem.identifier}.`);
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
    else if (fixture !== null && fixture.childPuzzle !== null && (fixture.childPuzzle.type === "weight" || fixture.childPuzzle.type === "container" || fixture.childPuzzle.accessible && fixture.childPuzzle.solved || player.hidingSpot === fixture.name) && containerItem === null)
        container = fixture.childPuzzle;
    else if (containerItem !== null) {
        container = containerItem;
        if (containerItemSlot === null) [containerItemSlot] = containerItem.inventoryCollection.values();
        slot = containerItemSlot;
        if (item.prefab.size > containerItemSlot.capacity && container.inventoryCollection.size !== 1) return addReply(game, message, `${item.getIdentifier()} will not fit in ${containerItemSlot.id} of ${container.identifier} because it is too large.`);
        else if (item.prefab.size > containerItemSlot.capacity) return addReply(game, message, `${item.getIdentifier()} will not fit in ${container.identifier} because it is too large.`);
        else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity && container.inventoryCollection.size !== 1) return addReply(game, message, `${item.getIdentifier()} will not fit in ${containerItemSlot.id} of ${container.identifier} because there isn't enough space left.`);
        else if (containerItemSlot.takenSpace + item.prefab.size > containerItemSlot.capacity) return addReply(game, message, `${item.getIdentifier()} will not fit in ${container.identifier} because there isn't enough space left.`);
    }
    else {
        if (parsedInput !== "") return addReply(game, message, `Couldn't find "${parsedInput}" to drop item into.`);
        const defaultDropOpject = fixtures.find(fixture => fixture.name === game.settings.defaultDropFixture);
        if (defaultDropOpject === null || defaultDropOpject === undefined) return addReply(game, message, `There is no default drop object "${game.settings.defaultDropFixture}" in ${player.location.id}.`);
        container = defaultDropOpject;
    }

    let topContainer = container;
    while (topContainer !== null && topContainer instanceof RoomItem)
        topContainer = topContainer.container;

    if (topContainer !== null) {
        let topContainerPreposition = "in";
        if (topContainer instanceof Fixture && topContainer.preposition !== "") topContainerPreposition = topContainer.preposition; 
        if (topContainer instanceof Fixture && topContainer.autoDeactivate && topContainer.activated)
            return addReply(game, message, `Items cannot be put ${topContainerPreposition} ${topContainer.name} while it is turned on.`);
    }

    const action = new DropAction(game, message, player, player.location, true);
    action.performDrop(item, hand, container, slot);
    addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully dropped ${item.getIdentifier()} for ${player.name}.`);
}
