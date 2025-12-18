import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";

import Narration from '../Data/Narration.js';

/** @type {CommandConfig} */
export const config = {
    name: "give_player",
    description: "Gives an item to another player.",
    details: "Transfers an item from your inventory to another player in the room. The item selected must be in one of your hands. "
        + "The receiving player must also have a free hand, or else they will not be able to receive the item. If a particularly large item "
        + "(a chainsaw, for example) is given, people in the room with you will see you giving it to the recipient.",
    usableBy: "Player",
    aliases: ["give", "g"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}give keiko moldy bread`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    if (args.length < 2)
        return messageHandler.addReply(game, message, `You need to specify a player and an item. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable give");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    // This will be checked multiple times, so get it now.
    const hiddenStatus = player.getBehaviorAttributeStatusEffects("hidden");

    const input = args.join(" ");
    let parsedInput = input.toUpperCase().replace(/\'/g, "");

    // First, find the recipient.
    let recipient = null;
    for (let i = 0; i < player.location.occupants.length; i++) {
        const occupant = player.location.occupants[i];
        if (parsedInput.startsWith(occupant.displayName.toUpperCase() + ' ') && (hiddenStatus.length === 0 && !occupant.hasAttribute("hidden") || occupant.hidingSpot === player.hidingSpot)) {
            // Player cannot give to themselves.
            if (occupant.name === player.name) return messageHandler.addReply(game, message, "You can't give to yourself.");

            recipient = occupant;
            parsedInput = parsedInput.substring(occupant.displayName.length + 1).trim();
            break;
        }
        else if (parsedInput.startsWith(occupant.displayName.toUpperCase()) && hiddenStatus.length > 0 && !occupant.hasAttribute("hidden"))
            return messageHandler.addReply(game, message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
    }
    if (recipient === null) return messageHandler.addReply(game, message, `Couldn't find player "${args[0]}" in the room with you. Make sure you spelled it right.`);

    // Check to make sure that the recipient has a free hand.
    let recipientHand = "";
    for (let slot = 0; slot < recipient.inventory.length; slot++) {
        if (recipient.inventory[slot].id === "RIGHT HAND" && recipient.inventory[slot].equippedItem === null) {
            recipientHand = "RIGHT HAND";
            break;
        }
        else if (recipient.inventory[slot].id === "LEFT HAND" && recipient.inventory[slot].equippedItem === null) {
            recipientHand = "LEFT HAND";
            break;
        }
        // If it's reached the left hand and it has an equipped item, both hands are taken. Stop looking.
        else if (recipient.inventory[slot].id === "LEFT HAND")
            break;
    }
    if (recipientHand === "") return messageHandler.addReply(game, message, `${recipient.displayName} does not have a free hand to receive an item.`);

    // Find the item in the player's inventory.
    let item = null;
    let giverHand = "";
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].equippedItem !== null && player.inventory[slot].equippedItem.name === parsedInput) {
            if (player.inventory[slot].id === "RIGHT HAND" && player.inventory[slot].equippedItem !== null) {
                item = player.inventory[slot].equippedItem;
                giverHand = "RIGHT HAND";
                break;
            }
            else if (player.inventory[slot].id === "LEFT HAND" && player.inventory[slot].equippedItem !== null) {
                item = player.inventory[slot].equippedItem;
                giverHand = "LEFT HAND";
                break;
            }
        }
        // If it's reached the left hand and it doesn't have the desired item, neither hand has it. Stop looking.
        else if (player.inventory[slot].id === "LEFT HAND")
            break;
    }
    if (item === null) return messageHandler.addReply(game, message, `Couldn't find item "${parsedInput}" in either of your hands. If this item is elsewhere in your inventory, please unequip or unstash it before trying to give it.`);

    if (item.weight > recipient.maxCarryWeight) {
        player.notify(`You try to give ${recipient.displayName} ${item.singleContainingPhrase}, but it is too heavy for ${recipient.pronouns.obj}.`);
        if (!item.prefab.discreet) new Narration(game, player, player.location, `${player.displayName} tries to give ${item.singleContainingPhrase} to ${recipient.displayName}, but it is too heavy for ${recipient.pronouns.obj} to lift.`).send();
        return;
    }
    else if (recipient.carryWeight + item.weight > recipient.maxCarryWeight)
        return player.notify(`You try to give ${recipient.displayName} ${item.singleContainingPhrase}, but ${recipient.pronouns.sbj} ` + (recipient.pronouns.plural ? `are` : `is`) + ` carrying too much weight.`, false);

    player.give(item, giverHand, recipient, recipientHand);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    messageHandler.addLogMessage(game, `${time} - ${player.name} gave ${item.identifier ? item.identifier : item.prefab.id} to ${recipient.name} in ${player.location.channel}`);

    return;
}
