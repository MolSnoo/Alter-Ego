import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

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
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    var events = [];
    for (let i = 0; i < game.events.length; i++) {
        if (game.events[i].ongoing) {
            if (game.events[i].remaining === null)
                events.push(game.events[i].name);
            else
                events.push(game.events[i].name + ` (${game.events[i].remainingString})`);
        }
    }
    const eventList = events.join(", ");
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Ongoing events:\n${eventList}`);

    return;
}
