import TakeAction from "../Data/Actions/TakeAction.js";
import Fixture from "../Data/Fixture.js";
import RoomItem from "../Data/RoomItem.js";
import Puzzle from "../Data/Puzzle.js";

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "take_moderator",
    description: "Takes the given item for a player.",
    details: "Forcibly takes an item for a player. The player must have a free hand to take an item. You can specify "
        + "which object or item to take the item from, but only items in the same room as the player can be taken. Additionally, if "
        + "the item is contained in another item with multiple inventory slots (such as pockets), you can specify which slot to take it from.",
    usableBy: "Moderator",
    aliases: ["take", "get", "t"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
    return `${settings.commandPrefix}take nero food\n`
        + `${settings.commandPrefix}take livida food from floor\n`
        + `${settings.commandPrefix}take cleo sword from desk\n`
        + `${settings.commandPrefix}take taylor hammer from tool box\n`
        + `${settings.commandPrefix}take aria green key from large purse\n`
        + `${settings.commandPrefix}take veronica game system from main pocket of backpack`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute(game, message, command, args) {
    if (args.length < 2)
        return game.communicationHandler.reply(message, `You need to specify a player and an item. Usage:\n${usage(game.settings)}`);

    const player = game.entityFinder.getLivingPlayer(args[0]);
    if (player === undefined) return game.communicationHandler.reply(message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    // First, check if the player has a free hand.
    const hand = game.entityFinder.getPlayerFreeHand(player);
    if (hand === undefined) return game.communicationHandler.reply(message, `${player.name} does not have a free hand to take an item.`);

    const input = args.join(" ");
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    let item = null;
    let container = null;
    let slotName = "";
    let slot = null;
    const roomItems = game.entityFinder.getRoomItems(null, player.location.id, true);
    for (let i = 0; i < roomItems.length; i++) {
        // If parsedInput is only the item's name, we've found the item.
        if (roomItems[i].identifier !== "" && roomItems[i].identifier === parsedInput ||
            roomItems[i].prefab.id === parsedInput ||
            roomItems[i].name === parsedInput) {
            item = roomItems[i];
            container = roomItems[i].container;
            slotName = roomItems[i].slot;
            if (container instanceof RoomItem) slot = container.inventoryCollection.get(slotName);
            break;
        }
        // A container was specified.
        if (roomItems[i].identifier !== "" && parsedInput.startsWith(`${roomItems[i].identifier} FROM `) ||
            parsedInput.startsWith(`${roomItems[i].prefab.id} FROM `) ||
            parsedInput.startsWith(`${roomItems[i].name} FROM `)) {
            let containerName;
            if (roomItems[i].identifier !== "" && parsedInput.startsWith(`${roomItems[i].identifier} FROM `))
                containerName = parsedInput.substring(`${roomItems[i].identifier} FROM `.length).trim();
            else if (parsedInput.startsWith(`${roomItems[i].prefab.id} FROM `))
                containerName = parsedInput.substring(`${roomItems[i].prefab.id} FROM `.length).trim();
            else if (parsedInput.startsWith(`${roomItems[i].name} FROM `))
                containerName = parsedInput.substring(`${roomItems[i].name} FROM `.length).trim();

            if (roomItems[i].container !== null) {
                const roomItemContainer = roomItems[i].container;
                // Slot name was specified.
                if (roomItemContainer instanceof RoomItem &&
                        (roomItemContainer.identifier !== "" && containerName.endsWith(` OF ${roomItemContainer.identifier}`) ||
                        containerName.endsWith(` OF ${roomItemContainer.prefab.id}`) ||
                        containerName.endsWith(` OF ${roomItemContainer.name}`))) {
                    let tempSlotName;
                    if (roomItemContainer.identifier !== "" && containerName.endsWith(` OF ${roomItemContainer.identifier}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${roomItemContainer.identifier}`));
                    else if (containerName.endsWith(` OF ${roomItemContainer.prefab.id}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${roomItemContainer.prefab.id}`));
                    else if (containerName.endsWith(` OF ${roomItemContainer.name}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${roomItemContainer.name}`));

                    for (const id of roomItemContainer.inventoryCollection.keys()) {
                        if (id === tempSlotName && roomItems[i].slot === tempSlotName) {
                            item = roomItems[i];
                            container = roomItemContainer;
                            slotName = tempSlotName;
                            slot = container.inventoryCollection.get(slotName);
                            break;
                        }
                    }
                    if (item !== null) break;
                }
                // A slot name wasn't specified, but the container is an item.
                else if (roomItemContainer instanceof RoomItem &&
                        (roomItemContainer.identifier !== "" && roomItemContainer.identifier === containerName ||
                        roomItemContainer.prefab.id === containerName ||
                        roomItemContainer.name === containerName)) {
                    item = roomItems[i];
                    container = roomItemContainer;
                    slotName = roomItems[i].slot;
                    slot = container.inventoryCollection.get(slotName);
                }
                // A puzzle's parent fixture was specified.
                else if (roomItemContainer instanceof Puzzle && roomItemContainer.parentFixture.name === containerName) {
                    item = roomItems[i];
                    container = roomItemContainer;
                    break;
                }
                // Only a container name was specified.
                else if (roomItemContainer.name === containerName) {
                    item = roomItems[i];
                    container = roomItemContainer;
                    slotName = roomItems[i].slot;
                    if (container instanceof RoomItem) slot = container.inventoryCollection.get(slotName);
                    break;
                }
            }
        }
    }
    if (item === null) {
        // Check if the player is trying to take a fixture.
        const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput)
                return game.communicationHandler.reply(message, `The ${fixtures[i].name} is not an item.`);
        }
        // Otherwise, the item wasn't found.
        if (parsedInput.includes(" FROM ")) {
            const itemName = parsedInput.substring(0, parsedInput.indexOf(" FROM "));
            const containerName = parsedInput.substring(parsedInput.indexOf(" FROM ") + " FROM ".length);
            return game.communicationHandler.reply(message, `Couldn't find "${containerName}" containing "${itemName}".`);
        }
        else return game.communicationHandler.reply(message, `Couldn't find item "${parsedInput}" in the room.`);
    }

    let topContainer = container;
    while (topContainer !== null && topContainer instanceof RoomItem)
        topContainer = topContainer.container;

    if (topContainer !== null && topContainer instanceof Fixture && topContainer.autoDeactivate && topContainer.activated)
        return game.communicationHandler.reply(message, `Items cannot be taken from ${topContainer.name} while it is turned on.`);

    const action = new TakeAction(game, message, player, player.location, true);
    action.performTake(item, hand, container, slot);
    game.communicationHandler.sendToCommandChannel(`Successfully took ${item.getIdentifier()} for ${player.name}.`);
}
