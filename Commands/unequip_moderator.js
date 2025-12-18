import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "unequip_moderator",
    description: "Unequips an item for a player.",
    details: "Unequips an item the given player currently has equipped. The unequipped item will be placed in one of the player's free hands. "
        + "You can specify which equipment slot you want the item to be unequipped from. Any item can be unequipped, whether it's equippable "
        + "or not. People in the room will see the player unequip an item, regardless of its size.",
    usableBy: "Moderator",
    aliases: ["unequip", "u"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}unequip lavris's mask\n`
        + `${settings.commandPrefix}unequip keiko lab coat\n`
        + `${settings.commandPrefix}unequip cara's sweater from shirt\n`
        + `${settings.commandPrefix}unequip aria large purse from glasses`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return messageHandler.addReply(game, message, `You need to specify a player and an item. Usage:\n${usage(game.settings)}`);

    const player = game.entityFinder.getLivingPlayer(args[0].toLowerCase().replace(/'s/g, ""));
    if (player === undefined) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    // First, check if the player has a free hand.
    let hand = "";
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].id === "RIGHT HAND" && player.inventory[slot].equippedItem === null) {
            hand = "RIGHT HAND";
            break;
        }
        else if (player.inventory[slot].id === "LEFT HAND" && player.inventory[slot].equippedItem === null) {
            hand = "LEFT HAND";
            break;
        }
        // If it's reached the left hand and it has an equipped item, both hands are taken. Stop looking.
        else if (player.inventory[slot].id === "LEFT HAND")
            break;
    }
    if (hand === "") return messageHandler.addReply(game, message, `${player.name} does not have a free hand to unequip an item.`);

    const input = args.join(' ');
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    let item = null;
    let slotName = "";
    for (let i = 0; i < player.inventory.length; i++) {
        if (parsedInput.endsWith(` FROM ${player.inventory[i].id}`)) {
            slotName = player.inventory[i].id;
            const itemName = parsedInput.substring(0, parsedInput.lastIndexOf(` FROM ${slotName}`)).trim();
            if (player.inventory[i].equippedItem === null) return messageHandler.addReply(game, message, `Nothing is equipped to ${slotName}.`);
            if (player.inventory[i].equippedItem.identifier !== "" && player.inventory[i].equippedItem.identifier === itemName ||
                player.inventory[i].equippedItem.prefab.id === itemName ||
                player.inventory[i].equippedItem.name === itemName) {
                item = player.inventory[i].equippedItem;
                break;
            }
            else return messageHandler.addReply(game, message, `Couldn't find "${itemName}" equipped to ${slotName}.`);
        }
        else if (player.inventory[i].equippedItem !== null &&
            (player.inventory[i].equippedItem.identifier !== "" && player.inventory[i].equippedItem.identifier === parsedInput ||
            player.inventory[i].equippedItem.prefab.id === parsedInput ||
            player.inventory[i].equippedItem.name === parsedInput)) {
            item = player.inventory[i].equippedItem;
            slotName = player.inventory[i].id;
            break;
        }
    }
    if (slotName === "RIGHT HAND" || slotName === "LEFT HAND")
        return messageHandler.addReply(game, message, `Cannot unequip items from either of ${player.name}'s hands. To get rid of this item, use the drop command.`);
    if (parsedInput.includes(" FROM ") && slotName === "") {
        slotName = parsedInput.substring(parsedInput.lastIndexOf(" FROM ") + " FROM ".length).trim();
        return messageHandler.addReply(game, message, `Couldn't find equipment slot "${slotName}".`);
    }
    if (item === null) return messageHandler.addReply(game, message, `Couldn't find equipped item "${parsedInput}".`);

    player.unequip(item, slotName, hand);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly unequipped ${item.identifier ? item.identifier : item.prefab.id} from ${slotName} in ${player.location.channel}`);

    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully unequipped ${item.identifier ? item.identifier : item.prefab.id} from ${player.name}'s ${slotName}.`);

    return;
}
