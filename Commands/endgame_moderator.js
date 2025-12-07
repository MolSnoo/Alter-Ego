import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "endgame_moderator",
    description: "Ends a game.",
    details: 'Ends the game. All players will be removed from whatever room channels they were in. '
        + 'The Player and Dead roles will be removed from all players.',
    usableBy: "Moderator",
    aliases: ["endgame"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}endgame`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    // Remove all living players from whatever room channel they're in.
    for (let i = 0; i < game.players_alive.length; i++) {
        const player = game.players_alive[i];
        if (player.talent !== "NPC") {
            if (player.location.channel) player.location.channel.permissionOverwrites.create(player.member, { ViewChannel: null });
            player.removeFromWhispers(game);
            player.member.roles.remove(game.guildContext.playerRole).catch();

            for (let j = 0; j < player.status.length; j++) {
                if (player.status[j].hasOwnProperty("timer") && player.status[j].timer !== null)
                    player.status[j].timer.stop();
            }
        }
    }

    for (let i = 0; i < game.players_dead.length; i++) {
        const player = game.players_dead[i];
        if (player.talent !== "NPC") player.member.roles.remove(game.guildContext.deadRole).catch();
    }

    clearTimeout(game.halfTimer);
    clearTimeout(game.endTimer);

    game.inProgress = false;
    game.canJoin = false;
    messageHandler.clearQueue();
    if (!game.settings.debug) {
        game.botContext.updatePresence();
    }
    game.players.clear();
    game.players_alive.clear();
    game.players_dead.clear();

    var channel;
    if (game.settings.debug) channel = game.guildContext.testingChannel;
    else channel = game.guildContext.generalChannel;
    channel.send(`${message.member.displayName} ended the game!`);

    return;
}
