import { clearQueue } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

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
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    // Remove all living players from whatever room channel they're in.
    game.entityFinder.getLivingPlayers(null, false).map((player) => {
        if (player.location.channel)
            player.location.channel.permissionOverwrites.create(player.member, { ViewChannel: null });
        player.removeFromWhispers("");
        player.member.roles.remove(game.guildContext.playerRole).catch();
        player.member.roles.add(game.guildContext.spectatorRole).catch();

        for (const status of player.statusCollection.values()) {
            if (status.timer !== null)
                status.timer.stop();
        }
    });

    // Remove dead role and add spectator role to dead players.
    game.entityFinder.getDeadPlayers(null, false).map((player) => {
        player.member.roles.remove(game.guildContext.deadRole).catch();
        player.member.roles.add(game.guildContext.spectatorRole).catch();
    });

    clearTimeout(game.halfTimer);
    clearTimeout(game.endTimer);

    game.inProgress = false;
    game.canJoin = false;
    clearQueue(game);
    if (!game.settings.debug)
        game.botContext.updatePresence();
    game.entityLoader.clearAll();

    let channel;
    if (game.settings.debug) channel = game.guildContext.testingChannel;
    else channel = game.guildContext.generalChannel;
    channel.send(`${message.member.displayName} ended the game!`);
}
