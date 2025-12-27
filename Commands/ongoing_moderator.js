import * as messageHandler from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "ongoing_moderator",
    description: "Lists all ongoing events.",
    details: "Lists all events which are currently ongoing, along with the time remaining on each one, if applicable.",
    usableBy: "Moderator",
    aliases: ["ongoing", "events"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}ongoing\n`
        + `${settings.commandPrefix}events`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    const events = game.entityFinder.getEvents(null, true).map((event) => {
        return event.remaining === null ? event.id : `${event.id} (${event.remainingString})`;
    });
    const eventList = events.join(", ");
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Ongoing events:\n${eventList}`);

    return;
}
