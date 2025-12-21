import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import playerdefaults from '../Configs/playerdefaults.json' with { type: 'json' };
import Player from '../Data/Player.js';

/** @type {CommandConfig} */
export const config = {
    name: "play_eligible",
    description: "Joins a game.",
    details: "Adds you to the list of players for the current game.",
    usableBy: "Eligible",
    aliases: ["play"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}play`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    for (const player of game.playersCollection.values()) {
        if (message.author.id === player.id)
            return message.reply("You are already playing.");
    }
    if (!game.canJoin) return message.reply("You were too late to join the game. Contact a moderator to be added before the game starts.");

    const member = await game.guildContext.guild.members.fetch(message.author.id);

    const player = new Player(
        message.author.id,
        member,
        member.displayName,
        "",
        playerdefaults.defaultPronouns,
        playerdefaults.defaultVoice,
        playerdefaults.defaultStats,
        true,
        playerdefaults.defaultLocation,
        "",
        [],
        playerdefaults.defaultDescription,
        [],
        null,
        0,
        game
    );
    player.statusString = playerdefaults.defaultStatusEffects;
    player.setPronouns(player.originalPronouns, player.pronounString);
    player.setPronouns(player.pronouns, player.pronounString);
    game.players.push(player);
    game.players_alive.push(player);
    game.playersCollection.set(player.name, player);
    game.livingPlayersCollection.set(player.name, player);
    member.roles.add(game.guildContext.playerRole);

    const channel = game.settings.debug ? game.guildContext.testingChannel : game.guildContext.generalChannel;
    channel.send(`<@${message.author.id}> joined the game!`);

    return;
}
