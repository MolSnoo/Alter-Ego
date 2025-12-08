import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
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
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    for (let i = 0; i < game.players.length; i++) {
        if (message.author.id === game.players[i].id)
            return message.reply("You are already playing.");
    }
    if (!game.canJoin) return message.reply("You were too late to join the game. Contact a moderator to be added before the game starts.");

    const member = await game.guildContext.guild.members.fetch(message.author.id);

    var player = new Player(
        message.author.id,
        member,
        member.displayName,
        member.displayName,
        "",
        playerdefaults.defaultPronouns,
        playerdefaults.defaultVoice,
        playerdefaults.defaultStats,
        true,
        playerdefaults.defaultLocation,
        "",
        playerdefaults.defaultStatusEffects,
        playerdefaults.defaultDescription,
        new Array(),
        null
    );
    player.setPronouns(player.originalPronouns, player.pronounString);
    player.setPronouns(player.pronouns, player.pronounString);
    game.players.push(player);
    game.players_alive.push(player);
    member.roles.add(game.guildContext.playerRole);

    const channel = game.settings.debug ? game.guildContext.testingChannel : game.guildContext.generalChannel;
    channel.send(`<@${message.author.id}> joined the game!`);

    return;
}
