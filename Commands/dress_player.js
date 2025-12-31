import DressAction from '../Data/Actions/DressAction.js';
import Fixture from "../Data/Fixture.js";
import RoomItem from "../Data/RoomItem.js";
import Puzzle from "../Data/Puzzle.js";
import { addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

/** @type {CommandConfig} */
export const config = {
    name: "dress_player",
    description: "Takes and equips all items from a container.",
    details: "Takes all items from a container of your choosing and equips them, if possible. You must have a free hand to take an item. "
        + "Items will be equipped in the order in which they appear in the game's data, which may not be obvious upon inspecting the container. "
        + "If an item is equippable to an equipment slot, but you already have something equipped to that slot, it will not be equipped, "
        + "and you will not be notified when this happens. If the container you choose has multiple inventory slots, you can specify which "
        + "slot to dress from. Otherwise, you will dress from all slots.",
    usableBy: "Player",
    aliases: ["dress", "redress"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}dress wardrobe\n`
        + `${settings.commandPrefix}dress laundry basket\n`
        + `${settings.commandPrefix}redress main pocket of backpack`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return addReply(game, message, `You need to specify a container with items. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable dress");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    // First, check if the player has a free hand.
    let hand = game.entityFinder.getPlayerFreeHand(player);
    if (hand === undefined) return addReply(game, message, "You do not have a free hand to take an item. Either drop an item you're currently holding or stash it in one of your equipped items.");

    const input = args.join(' ');
    let parsedInput = input.toUpperCase().replace(/\'/g, "");

    let container = null;
    let slotName = "";
    let slot = null;
    // Check if the player specified a fixture.
    const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
    for (let i = 0; i < fixtures.length; i++) {
        if (fixtures[i].name === parsedInput) {
            container = fixtures[i];
            // Check if the fixture has a puzzle attached to it.
            if (container.childPuzzle !== null && container.childPuzzle.type !== "weight" && container.childPuzzle.type !== "container" && (!container.childPuzzle.accessible || !container.childPuzzle.solved) && player.hidingSpot !== container.name)
                return addReply(game, message, `You cannot take items from ${container.name} right now.`);
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
                    for (const slot of container.inventoryCollection.values()) {
                        if (parsedInput.endsWith(slot.id)) {
                            slotName = slot.id;
                            parsedInput = parsedInput.substring(0, parsedInput.lastIndexOf(slot.id)).trimEnd();
                            break;
                        }
                    }
                    if (slotName === "") return addReply(game, message, `Couldn't find "${parsedInput}" of ${container.name}.`);
                }
                break;
            }
        }
    }
    if (container === null) return addReply(game, message, `Couldn't find a container in the room named "${input}".`);
    
    let topContainer = container;
    while (topContainer !== null && topContainer instanceof RoomItem)
        topContainer = topContainer.container;

    if (topContainer !== null) {
        if (topContainer instanceof Fixture && topContainer.autoDeactivate && topContainer.activated)
            return addReply(game, message, `You cannot take items from ${topContainer.name} while it is turned on.`);
    }
    const hiddenStatus = player.getBehaviorAttributeStatusEffects("hidden");
    if (hiddenStatus.length > 0) {
        if (topContainer !== null && topContainer instanceof Puzzle)
            topContainer = topContainer.parentFixture;

        if (topContainer === null || topContainer instanceof Fixture && topContainer.name !== player.hidingSpot)
            return addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
    }

    // Get all items in this container.
    /**
     * @type {RoomItem[]}
     */
    let containerItems = [];
    if (container instanceof Fixture)
        containerItems = items.filter(item => item.containerName === `Object: ${container.name}` && item.prefab.equippable);
    else if (container instanceof Puzzle)
        containerItems = items.filter(item => item.containerName === `Puzzle: ${container.name}` && item.prefab.equippable);
    else if (container instanceof RoomItem && slotName !== "")
        containerItems = items.filter(item => item.containerName === `Item: ${container.identifier}/${slotName}` && item.prefab.equippable);
    else if (container instanceof RoomItem && slotName === "")
        containerItems = items.filter(item => item.containerName.startsWith(`Item: ${container.identifier}/`) && item.prefab.equippable);
    if (containerItems.length === 0)
        return addReply(game, message, `${container.name} has no equippable items.`);
    
    const action = new DressAction(game, message, player, player.location, false);
    action.performDress(containerItems, hand, container, slot);
}
