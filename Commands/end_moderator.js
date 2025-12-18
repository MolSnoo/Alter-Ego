import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

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
 * @param {AEMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify an event. Usage:\n${usage(game.settings)}`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var event = null;
    for (let i = 0; i < game.events.length; i++) {
        if (game.events[i].id === parsedInput) {
            event = game.events[i];
            break;
        }
    }
    if (event === null) return messageHandler.addReply(game, message, `Couldn't find event "${input}".`);
    if (!event.ongoing) return messageHandler.addReply(game, message, `${event.id} is not currently ongoing.`);

    await event.end(true);
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully ended ${event.id}.`);

    return;
}
