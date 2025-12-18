import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "kill_moderator",
    description: "Makes a player dead.",
    details: "Moves the listed players from the living list to the dead list. "
        + "The player will be removed from whatever room channel they're in as well as any whispers. "
        + "A dead player will retain any items they had in their inventory, but they will not be accessible "
        + "unless they are manually added to the spreadsheet. A dead player will retain the Player role. "
        + "When a dead player's body is officially discovered, use the reveal command to remove the Player role "
        + "and give them the Dead role.",
    usableBy: "Moderator",
    aliases: ["kill", "die"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}kill chris\n`
        + `${settings.commandPrefix}die micah joshua amber devyn veronica`;
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
    const players = [];
    for (let i = args.length - 1; i >= 0; i--) {
        const player = game.entityFinder.getLivingPlayer(args[i]);
        if (player) {
            players.push(player);
            args.splice(i, 1);
        }
    }
    if (args.length > 0) {
        const missingPlayers = args.join(", ");
        return messageHandler.addReply(game, message, `Couldn't find player(s): ${missingPlayers}.`);
    }

    for (let i = 0; i < players.length; i++)
        players[i].die();

    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, "Listed players are now dead. Remember to use the reveal command when their bodies are discovered!");

    return;
}
