import DressAction from '../Data/Actions/DressAction.ts';
import Fixture from "../Data/Fixture.ts";
import InventorySlot from '../Data/InventorySlot.ts';
import RoomItem from "../Data/RoomItem.ts";
import Puzzle from "../Data/Puzzle.ts";

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "dress_moderator",
    description: "Takes and equips all items from a container for a player.",
    details: `Takes all room items from the given container and equips them for the given player, if possible. `
        + `The container's name must be given, or its container identifier if it is a room item. The specified player must `
        + `have a free hand to take an item. The player dressing will be narrated in the room they're in.\n\n`
        + `Items will be equipped in the order in which they appear on the spreadsheet. If an item is equippable to an `
        + `equipment slot, but the player already has something equipped to that slot, it will not be equipped, and they `
        + `will not be notified when this happens. If the container has multiple inventory slots, you can specify `
        + `which slot to dress from by entering the ID of the inventory slot followed by "of" before the container. `
        + `Otherwise, the player will dress from all slots.\n\n`
        + `This command supports NPC latching. For more information, see the help details for the \`latch\` command.`,
    usableBy: "Moderator",
    aliases: ["dress", "redress"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}dress Ezekiel WARDROBE\n`
        + `${settings.commandPrefix}dress Kelly LAUNDRY BASKET 7\n`
        + `${settings.commandPrefix}redress Luna MAIN POCKET of BLUE BACKPACK`;
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
        return game.communicationHandler.reply(message, `You need to specify a player and a container with items. Usage:\n${usage(game.settings)}`);
    if (sentMessageInLatchChannel && args.length < 1)
        return game.communicationHandler.reply(message, `You need to specify a container with items. Usage:\n${usage(game.settings)}`);

    let player = game.entityFinder.getLivingPlayer(args[0]?.replace(/'s/g, ""));
    if (player && !moderator.latchedPlayerHasName(args[0]))
        args.splice(0, 1);
    if (!player && sentMessageInLatchChannel)
        player = moderator.getLatch();
    if (player === undefined) return game.communicationHandler.reply(message, `Player "${args[0]}" not found.`);

    // First, check if the player has a free hand.
    let hand = game.entityFinder.getPlayerFreeHand(player);
    if (hand === undefined) return game.communicationHandler.reply(message, `${player.name} does not have a free hand to take an item.`);

    const input = args.join(' ');
    let parsedInput = input.toUpperCase().replace(/\'/g, "");

    /** @type {RoomItemContainer} */
    let container = null;
    /** @type {InventorySlot<RoomItem>} */
    let inventorySlot = null;
    // Check if the player specified a fixture.
    const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
    for (let i = 0; i < fixtures.length; i++) {
        if (fixtures[i].name === parsedInput) {
            container = fixtures[i];
            // Check if the fixture has a puzzle attached to it.
            if (container.childPuzzle !== null && !container.childPuzzle.isAlwaysAccessible() && (!container.childPuzzle.accessible || !container.childPuzzle.solved) && player.hidingSpot !== container.name)
                return game.communicationHandler.reply(message, `Items cannot be taken from ${container.name} right now.`);
            else if (container.childPuzzle !== null)
                container = fixtures[i].childPuzzle;
            break;
        }
    }

    // Check if the player specified a container item.
    const items = game.roomItems.filter(item => item.location.id === player.location.id && item.accessible && (item.quantity > 0 || isNaN(item.quantity)));
    if (container === null) {
        for (let i = 0; i < items.length; i++) {
            if (parsedInput.endsWith(items[i].name)) {
                container = items[i];
                parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(items[i].name)).trimEnd();
                // Check if a slot was specified.
                if (parsedInput.endsWith(" OF")) {
                    parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(" OF")).trimEnd();
                    for (const slot of container.inventory.values()) {
                        if (parsedInput.endsWith(slot.id)) {
                            inventorySlot = slot;
                            parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(slot.id)).trimEnd();
                            break;
                        }
                    }
                    if (inventorySlot === null) return game.communicationHandler.reply(message, `Couldn't find "${parsedInput}" of ${container.name}.`);
                }
                break;
            }
        }
    }
    if (container === null) return game.communicationHandler.reply(message, `Couldn't find a container in the room named "${input}".`);

    let topContainer = container;
    while (topContainer !== null && topContainer instanceof RoomItem)
        topContainer = topContainer.container;

    if (topContainer !== null) {
        if (topContainer instanceof Fixture && topContainer.autoDeactivate && topContainer.activated)
            return game.communicationHandler.reply(message, `Items cannot be taken from ${topContainer.name} while it is turned on.`);
    }

    // Get all items in this container.
    /**
     * @type {RoomItem[]}
     */
    let containerItems = [];
    if (container instanceof Fixture)
        containerItems = items.filter(item => item.containerType === 'Fixture' && item.containerName === container.name && item.prefab.equippable);
    else if (container instanceof Puzzle)
        containerItems = items.filter(item => item.containerType === 'Puzzle' && item.containerName === container.name && item.prefab.equippable);
    else if (container instanceof RoomItem && inventorySlot)
        containerItems = items.filter(item => item.containerType === 'RoomItem' && item.containerName === `${container.identifier}/${inventorySlot.id}` && item.prefab.equippable);
    else if (container instanceof RoomItem && !inventorySlot)
        containerItems = items.filter(item => item.containerType === 'RoomItem' && item.containerName.startsWith(`${container.identifier}/`) && item.prefab.equippable);
    if (containerItems.length === 0)
        return game.communicationHandler.reply(message, `${container.name} has no equippable items.`);

    const action = new DressAction(game, message, player, player.location, true);
    action.performDress(containerItems, hand, container, inventorySlot);
    action.sendSuccessMessageToCommandChannel();
}
