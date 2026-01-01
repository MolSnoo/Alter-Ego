import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "trigger_moderator",
    description: "Triggers an event.",
    details: "Triggers the specified event. The event must not already be ongoing. If the event has any triggered commands, they will be run.",
    usableBy: "Moderator",
    aliases: ["trigger"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}trigger rain\n`
        + `${settings.commandPrefix}trigger explosion`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return addReply(game, message, `You need to specify an event. Usage:\n${usage(game.settings)}`);

    const input = args.join(" ");
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    const event = game.entityFinder.getEvent(parsedInput);
    if (event === undefined) return addReply(game, message, `Couldn't find event "${input}".`);
    if (event.ongoing) return addReply(game, message, `${event.id} is already ongoing.`);

    await event.trigger(true);
    addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully triggered ${event.id}.`);
}
