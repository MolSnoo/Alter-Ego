import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "stats_moderator",
    description: "Lists a given player's stats.",
    details: "Lists the given player's default and current stats, as well as the roll modifiers they have based on each current stat. "
        + "The maximum weight the player can carry will be listed, as well as how much weight they are currently carrying. "
        + "Additionally, the player's current maximum stamina will be listed, as this can differ if the player is inflicted with any "
        + "status effects that modify the stamina stat.",
    usableBy: "Moderator",
    aliases: ["stats"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}stats ayaka`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {AEMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify a player. Usage:\n${usage(game.settings)}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            break;
        }
    }
    if (player === null) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);

    var statsString = `__${player.name}'s default stats:__\n`;
    statsString += `Str: ${player.defaultStrength}\n`;
    statsString += `Int: ${player.defaultIntelligence}\n`;
    statsString += `Dex: ${player.defaultDexterity}\n`;
    statsString += `Spd: ${player.defaultSpeed}\n`;
    statsString += `Sta: ${player.defaultStamina}\n`;
    statsString += `\n`;

    const strModifier = player.getStatModifier(player.strength);
    const intModifier = player.getStatModifier(player.intelligence);
    const dexModifier = player.getStatModifier(player.dexterity);
    const spdModifier = player.getStatModifier(player.speed);
    const staModifier = player.getStatModifier(player.stamina);
    statsString += `__${player.name}'s current stats:__\n`;
    statsString += `Str: ${player.strength} (Carry weight: ${player.carryWeight}/${player.maxCarryWeight}) [` + (strModifier > 0 ? '+' : '') + `${strModifier}]\n`;
    statsString += `Int: ${player.intelligence} [` + (intModifier > 0 ? '+' : '') + `${intModifier}]\n`;
    statsString += `Dex: ${player.dexterity} [` + (dexModifier > 0 ? '+' : '') + `${dexModifier}]\n`;
    statsString += `Spd: ${player.speed} [` + (spdModifier > 0 ? '+' : '') + `${spdModifier}]\n`;
    statsString += `Sta: ${Math.round(player.stamina * 100) / 100}/${player.maxStamina} [` + (staModifier > 0 ? '+' : '') + `${staModifier}]`;
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, statsString);

    return;
}
