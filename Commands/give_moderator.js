import GiveAction from '../Data/Actions/GiveAction.js';
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

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
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 3)
        return addReply(game, message, `You need to specify two players and an item. Usage:\n${usage(game.settings)}`);

    // First, find the giver.
    const giver = game.entityFinder.getLivingPlayer(args[0].replace(/'s/g, ""));
    if (giver === undefined) return addReply(game, message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    // Next, find the recipient.
    const recipient = game.entityFinder.getLivingPlayer(args[args.length - 1].replace(/'s/g, ""));
    if (recipient === undefined) return addReply(game, message, `Player "${args[args.length - 1]}" not found.`);
    args.splice(args.length - 1, 1);
    if (args[args.length - 1].toLowerCase() === "to") args.splice(args.length - 1, 1);

    if (giver.name === recipient.name) return addReply(game, message, `${giver.name} cannot give an item to ${giver.originalPronouns.ref}.`);
    if (giver.location.id !== recipient.location.id) return addReply(game, message, `${giver.name} and ${recipient.name} are not in the same room.`);

    // Check to make sure that the recipient has a free hand.
    let recipientHand = game.entityFinder.getPlayerFreeHand(recipient);
    if (recipientHand === undefined) return addReply(game, message, `${recipient.name} does not have a free hand to receive an item.`);

    const input = args.join(" ");
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Now find the item in the giver's inventory.
    let [giverHand, item] = game.entityFinder.getPlayerHandHoldingItem(giver, parsedInput, true);
    if (item === undefined) return addReply(game, message, `Couldn't find item "${parsedInput}" in either of ${giver.name}'s hands.`);

    const action = new GiveAction(game, message, giver, giver.location, true);
    action.performGive(item, giverHand, recipient, recipientHand);
    addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully gave ${giver.name}'s ${item.getIdentifier()} to ${recipient.name}.`);
}
