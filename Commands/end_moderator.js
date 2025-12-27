import * as messageHandler from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "end_moderator",
    description: "Ends an event.",
    details: "Ends the specified event. The event must be ongoing. If the event has any ended commands, they will be run.",
    usableBy: "Moderator",
    aliases: ["end"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}end rain\n`
        + `${settings.commandPrefix}end explosion`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify an event. Usage:\n${usage(game.settings)}`);

    const input = args.join(" ");
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    const event = game.entityFinder.getEvent(parsedInput);
    if (event === null) return messageHandler.addReply(game, message, `Couldn't find event "${input}".`);
    if (!event.ongoing) return messageHandler.addReply(game, message, `${event.id} is not currently ongoing.`);

    await event.end(true);
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully ended ${event.id}.`);

    return;
}
