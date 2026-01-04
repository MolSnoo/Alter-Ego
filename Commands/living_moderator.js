import { addGameMechanicMessage } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "living_moderator",
    description: "Lists all living players.",
    details: "Lists all living players.",
    usableBy: "Moderator",
    aliases: ["living", "alive"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}living\n`
        + `${settings.commandPrefix}alive`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    let playerList = `Living players:\n${game.entityFinder.getLivingPlayers().map(player => player.name).join(" ")}`;
    addGameMechanicMessage(game, game.guildContext.commandChannel, playerList);
}
