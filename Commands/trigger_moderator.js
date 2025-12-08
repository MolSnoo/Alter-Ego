import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

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
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify an event. Usage:\n${usage(game.settings)}`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var event = null;
    for (let i = 0; i < game.events.length; i++) {
        if (game.events[i].name === parsedInput) {
            event = game.events[i];
            break;
        }
    }
    if (event === null) return messageHandler.addReply(game, message, `Couldn't find event "${input}".`);
    if (event.ongoing) return messageHandler.addReply(game, message, `${event.name} is already ongoing.`);

    await event.trigger(true);
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully triggered ${event.name}.`);

    return;
}
