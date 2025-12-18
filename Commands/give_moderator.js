import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "give_moderator",
    description: "Gives a player's item to another player.",
    details: "Transfers an item from the first player's inventory to the second player's inventory. Both players must be in the same room. "
        + "The item selected must be in one of the first player's hands. The receiving player must also have a free hand, "
        + "or else they will not be able to receive the item. If a particularly large item "
        + "(a chainsaw, for example) is given, people in the room with you will see the player giving it to the recipient.",
    usableBy: "Moderator",
    aliases: ["give", "g"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}give vivian's yellow key to aria\n`
        + `${settings.commandPrefix}give natalie night vision goggles to shiori`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 3)
        return messageHandler.addReply(game, message, `You need to specify two players and an item. Usage:\n${usage(game.settings)}`);

    // First, find the giver.
    const giver = game.entityFinder.getLivingPlayer(args[0].toLowerCase().replace(/'s/g, ""));
    if (giver === undefined) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    // Next, find the recipient.
    const recipient = game.entityFinder.getLivingPlayer(args[args.length - 1].toLowerCase().replace(/'s/g, ""));
    if (recipient === undefined) return messageHandler.addReply(game, message, `Player "${args[args.length - 1]}" not found.`);
    args.splice(args.length - 1, 1);
    if (args[args.length - 1].toLowerCase() === "to") args.splice(args.length - 1, 1);

    if (giver.name === recipient.name) return messageHandler.addReply(game, message, `${giver.name} cannot give an item to ${giver.originalPronouns.ref}.`);
    if (giver.location.id !== recipient.location.id) return messageHandler.addReply(game, message, `${giver.name} and ${recipient.name} are not in the same room.`);

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
    if (recipientHand === "") return messageHandler.addReply(game, message, `${recipient.name} does not have a free hand to receive an item.`);

    const input = args.join(" ");
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Now find the item in the giver's inventory.
    let item = null;
    let giverHand = "";
    // Get references to the right and left hand equipment slots so we don't have to iterate through the giver's inventory to find them every time.
    let rightHand = null;
    let leftHand = null;
    for (let slot = 0; slot < giver.inventory.length; slot++) {
        if (giver.inventory[slot].id === "RIGHT HAND")
            rightHand = giver.inventory[slot];
        else if (giver.inventory[slot].id === "LEFT HAND")
            leftHand = giver.inventory[slot];
    }
    // Check for the identifier first.
    if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.identifier !== "" && rightHand.equippedItem.identifier === parsedInput) {
        item = rightHand.equippedItem;
        giverHand = "RIGHT HAND";
    }
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.identifier !== "" && leftHand.equippedItem.identifier === parsedInput) {
        item = leftHand.equippedItem;
        giverHand = "LEFT HAND";
    }
    // Check for the prefab ID next.
    else if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.prefab.id === parsedInput) {
        item = rightHand.equippedItem;
        giverHand = "RIGHT HAND";
    }
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.prefab.id === parsedInput) {
        item = leftHand.equippedItem;
        giverHand = "LEFT HAND";
    }
    // Check for the name last.
    else if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.name === parsedInput) {
        item = rightHand.equippedItem;
        giverHand = "RIGHT HAND";
    }
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.name === parsedInput) {
        item = leftHand.equippedItem;
        giverHand = "LEFT HAND";
    }
    if (item === null) return messageHandler.addReply(game, message, `Couldn't find item "${parsedInput}" in either of ${giver.name}'s hands.`);

    giver.give(item, giverHand, recipient, recipientHand);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    messageHandler.addLogMessage(game, `${time} - ${giver.name} forcibly gave ${item.identifier ? item.identifier : item.prefab.id} to ${recipient.name} in ${giver.location.channel}`);

    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully gave ${giver.name}'s ${item.identifier ? item.identifier : item.prefab.id} to ${recipient.name}.`);

    return;
}
