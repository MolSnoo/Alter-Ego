import * as messageHandler from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "restore_moderator",
    description: "Restores a player's stamina.",
    details: "Sets the given player's stamina to its maximum value. Note that this does not automatically cure the weary status effect.",
    usableBy: "Moderator",
    aliases: ["restore"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}restore flint`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify a player. Usage:\n${usage(game.settings)}`);

    const player = game.entityFinder.getLivingPlayer(args[0]);
    if (player === undefined) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);

    player.stamina = player.maxStamina;
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Fully restored ${player.name}'s stamina.`);

    return;
}
