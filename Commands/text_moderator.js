import TextAction from '../Data/Actions/TextAction.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "text_moderator",
    description: "Sends a text message from an NPC.",
    details: "Sends a text message from the first player to the second player. The first player must have the talent \"NPC\". "
        + "If an image is attached, it will be sent as well.",
    usableBy: "Moderator",
    aliases: ["text"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
    return `${settings.commandPrefix}text amy florian I work at the bar.\n`
        + `${settings.commandPrefix}text amy florian Here's a picture of me at work. (attached image)\n`
        + `${settings.commandPrefix}text ??? keiko This is a message about your car's extended warranty.\n`
        + `${settings.commandPrefix}text ??? hibiki (attached image)`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute(game, message, command, args) {
    if (args.length < 2)
        return game.communicationHandler.reply(message, `You need to specify a sender, a recipient, and a message. Usage:\n${usage(game.settings)}`);

    const player = game.entityFinder.getLivingPlayer(args[0]);
    if (player === undefined) return game.communicationHandler.reply(message, `Couldn't find player "${args[0]}".`);
    else if (!player.isNPC) return game.communicationHandler.reply(message, `You cannot text for a player that isn't an NPC.`);
    args.splice(0, 1);

    const recipient = game.entityFinder.getLivingPlayer(args[0]);
    if (recipient === undefined) return game.communicationHandler.reply(message, `Couldn't find player "${args[0]}".`);
    if (recipient.name === player.name) return game.communicationHandler.reply(message, `${player.name} cannot send a message to ${player.originalPronouns.ref}.`);
    args.splice(0, 1);

    const input = args.join(" ");
    if (input === "" && message.attachments.size === 0) return game.communicationHandler.reply(message, `Text message cannot be empty. Please send a message and/or an attachment.`);
    
    const action = new TextAction(game, message, player, player.location, false);
    action.performText(recipient, input);
}
