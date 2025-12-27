import * as messageHandler from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "dead_moderator",
    description: "Lists all dead players.",
    details: "Lists all dead players.",
    usableBy: "Moderator",
    aliases: ["dead", "died"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}dead\n`
        + `${settings.commandPrefix}died`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    let playerList = `Dead players:\n${game.entityFinder.getDeadPlayers().join(", ")}`;
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, playerList);

    return;
}
