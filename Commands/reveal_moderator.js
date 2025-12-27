import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "reveal_moderator",
    description: "Gives a player the Dead role.",
    details: "Removes the Player role from the listed players and gives them the Dead role. "
        + "All listed players must be dead.",
    usableBy: "Moderator",
    aliases: ["reveal"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}reveal chris\n`
        + `${settings.commandPrefix}reveal micah joshua amber devyn veronica\n`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return addReply(game, message, `You need to specify at least one player. Usage:\n${usage(game.settings)}`);

    // Get all listed players first.
    const players = [];
    for (let i = args.length - 1; i >= 0; i--) {
        const player = game.entityFinder.getDeadPlayer(args[i]);
        if (player) {
            players.push(player);
            args.splice(i, 1);
        }
    }
    if (args.length > 0) {
        const missingPlayers = args.join(", ");
        return addReply(game, message, `Couldn't find player(s) on dead list: ${missingPlayers}.`);
    }

    for (let i = 0; i < players.length; i++) {
        if (!players[i].isNPC) {
            players[i].member.roles.remove(game.guildContext.playerRole);
            players[i].member.roles.add(game.guildContext.deadRole);
        }
    }

    addGameMechanicMessage(game, game.guildContext.commandChannel, "Listed players have been given the Dead role.");

    return;
}
