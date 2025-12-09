import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

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
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify at least one player. Usage:\n${usage(game.settings)}`);

    // Get all listed players first.
    var players = [];
    for (let i = 0; i < game.players_dead.length; i++) {
        for (let j = 0; j < args.length; j++) {
            if (args[j].toLowerCase() === game.players_dead[i].name.toLowerCase()) {
                players.push(game.players_dead[i]);
                args.splice(j, 1);
                break;
            }
        }
    }
    if (args.length > 0) {
        const missingPlayers = args.join(", ");
        return messageHandler.addReply(game, message, `Couldn't find player(s) on dead list: ${missingPlayers}.`);
    }

    for (let i = 0; i < players.length; i++) {
        if (players[i].title !== "NPC") {
            players[i].member.roles.remove(game.guildContext.playerRole);
            players[i].member.roles.add(game.guildContext.deadRole);
        }
    }

    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, "Listed players have been given the Dead role.");

    return;
}
