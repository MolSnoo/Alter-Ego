import UnstashAction from '../Data/Actions/UnstashAction.ts';
import InventoryItem from '../Data/InventoryItem.ts';

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "unstash_moderator",
    description: "Moves an inventory item into a player's hand.",
    details: `Moves an inventory item from a container item in the given player's inventory into their hand. They must `
        + `have a free hand to unstash an item. The item's prefab ID or container identifier must be used. If the `
        + `player unstashes a non-discreet item, this will be narrated in the room.\n\n`
        + `It is possible to specify a container to unstash an item from. To do so, enter "from" after the item's `
        + `identifier, followed by the container item's prefab ID or container identifier. If the container item has `
        + `multiple inventory slots, you can also specify which slot to unstash the item from. To do so, enter the `
        + `ID of the inventory slot followed by "of" before the container's identifier.\n\n`
        + `This command supports NPC latching. For more information, see the help details for the \`latch\` command.`,
    usableBy: "Moderator",
    aliases: ["unstash", "retrieve", "r"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}unstash Vivian's VIVIANS LAPTOP\n`
        + `${settings.commandPrefix}retrieve Nero KATANA from KATANA SHEATH\n`
        + `${settings.commandPrefix}r Kyra's MASTER KEY from RIGHT POCKET of KYRAS LAB COAT 5\n`
        + `${settings.commandPrefix}r Haru WATER BOTTLE from SIDE POUCH of GREEN BACKPACK 1`;
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

    // First, check if the player has a free hand.
    const hand = game.entityFinder.getPlayerFreeHand(player);
    if (hand === undefined) return game.communicationHandler.reply(message, `${player.name} does not have a free hand to retrieve an item.`);

    const input = args.join(' ');
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    let item = null;
    let container = null;
    let slotName = "";
    let slot = null;
    const playerItems = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null && (item.quantity > 0 || isNaN(item.quantity)));
    for (let i = 0; i < playerItems.length; i++) {
        // If parsedInput is only the item's name, we've found the item.
        if (playerItems[i].identifier !== "" && playerItems[i].identifier === parsedInput ||
            playerItems[i].prefab.id === parsedInput ||
            playerItems[i].name === parsedInput) {
            item = playerItems[i];
            container = playerItems[i].container;
            if (playerItems[i].container === null) continue;
            slotName = playerItems[i].slot;
            slot = container.inventory.get(slotName);
            break;
        }
        // A container was specified.
        if (playerItems[i].identifier !== "" && parsedInput.startsWith(`${playerItems[i].identifier} FROM `) ||
            parsedInput.startsWith(`${playerItems[i].prefab.id} FROM `) ||
            parsedInput.startsWith(`${playerItems[i].name} FROM `)) {
            let containerName;
            if (playerItems[i].identifier !== "" && parsedInput.startsWith(`${playerItems[i].identifier} FROM `))
                containerName = parsedInput.substring(`${playerItems[i].identifier} FROM `.length).trim();
            else if (parsedInput.startsWith(`${playerItems[i].prefab.id} FROM `))
                containerName = parsedInput.substring(`${playerItems[i].prefab.id} FROM `.length).trim();
            else if (parsedInput.startsWith(`${playerItems[i].name} FROM `))
                containerName = parsedInput.substring(`${playerItems[i].name} FROM `.length).trim();

            if (playerItems[i].container !== null) {
                // Slot name was specified.
                if (playerItems[i].container.identifier !== "" && containerName.endsWith(` OF ${playerItems[i].container.identifier}`) ||
                    containerName.endsWith(` OF ${playerItems[i].container.prefab.id}`) ||
                    containerName.endsWith(` OF ${playerItems[i].container.name}`)) {
                    let tempSlotName;
                    if (playerItems[i].container.identifier !== "" && containerName.endsWith(` OF ${playerItems[i].container.identifier}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${playerItems[i].container.identifier}`));
                    else if (containerName.endsWith(` OF ${playerItems[i].container.prefab.id}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${playerItems[i].container.prefab.id}`));
                    else if (containerName.endsWith(` OF ${playerItems[i].container.name}`))
                        tempSlotName = containerName.substring(0, containerName.indexOf(` OF ${playerItems[i].container.name}`));

                    if (playerItems[i].container instanceof InventoryItem) {
                        for (const id of playerItems[i].container.inventory.keys()) {
                            if (id === tempSlotName && playerItems[i].slot === tempSlotName) {
                                item = playerItems[i];
                                container = playerItems[i].container;
                                slotName = tempSlotName;
                                slot = container.inventory.get(slotName);
                                break;
                            }
                        }
                    }
                    if (item !== null) break;
                }
                // Only a container name was specified.
                else if (playerItems[i].container.identifier !== "" && playerItems[i].container.identifier === containerName ||
                    playerItems[i].container.prefab.id === containerName ||
                    playerItems[i].container.name === containerName) {
                    item = playerItems[i];
                    container = playerItems[i].container;
                    slotName = playerItems[i].slot;
                    slot = container.inventory.get(slotName);
                    break;
                }
            }
        }
    }
    if (item === null) {
        if (parsedInput.includes(" FROM ")) {
            const itemName = parsedInput.substring(0, parsedInput.indexOf(" FROM "));
            const containerName = parsedInput.substring(parsedInput.indexOf(" FROM ") + " FROM ".length);
            return game.communicationHandler.reply(message, `Couldn't find "${containerName}" in ${player.name}'s inventory containing "${itemName}".`);
        }
        else return game.communicationHandler.reply(message, `Couldn't find item "${parsedInput}" in ${player.name}'s inventory.`);
    }
    if (item !== null && container === null) return game.communicationHandler.reply(message, `${item.getIdentifier()} is not contained in another item and cannot be unstashed.`);

    const action = new UnstashAction(game, message, player, player.location, true);
    action.performUnstash(item, hand, container, slot);
    action.sendSuccessMessageToCommandChannel();
}
