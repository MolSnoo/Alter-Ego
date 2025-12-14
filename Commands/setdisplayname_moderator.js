import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "setdisplayname_moderator",
    description: "Sets a player's display name.",
    details: "Sets the name that will display whenever the given player does something in-game. This will not change their name on the spreadsheet, "
        + "and when player data is reloaded, their display name will be reverted to their true name. Note that if the player is inflicted with "
        + "or cured of a status effect with the concealed attribute, their display name will be updated, thus overwriting one that was set manually. "
        + "However, this command can be used to overwrite their new display name afterwards as well. Note that this command will not change the player's "
        + "nickname in the server.",
    usableBy: "Moderator",
    aliases: ["setdisplayname"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}setdisplayname usami Monomi\n`
        + `${settings.commandPrefix}setdisplayname faye An individual wearing a MINOTAUR MASK`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return messageHandler.addReply(game, message, `You need to specify a player and a display name. Usage:\n${usage(game.settings)}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);

    var input = args.join(" ");
    if (input.length > 32) return messageHandler.addReply(game, message, `A name cannot exceed 32 characters.`);

    player.displayName = input;
    player.location.occupantsString = player.location.generate_occupantsString(player.location.occupants.filter(occupant => !occupant.hasAttribute("hidden")));
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully updated ${player.name}'s display name.`);

    return;
}
