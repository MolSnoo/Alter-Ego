import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

import Die from '../Data/Die.js';

/** @type {CommandConfig} */
export const config = {
    name: "roll_moderator",
    description: "Rolls a die.",
    details: `Rolls a die. If a stat and a player are specified, calculates the result plus the modifier of `
        + "the player's specified stat. If two players are specified, any status effects the second player has which affect the "
        + "first player will be applied to the first player, whose stats will be recalculated before their stat modifier is applied. "
        + "Additionally, if a strength roll is performed using two players, the second player's dexterity stat will be inverted and "
        + "applied to the first player's roll. Any modifiers will be mentioned in the result, but please note that the result sent "
        + "has already had the modifiers applied. Valid stat inputs include: `str`, `strength`, `int`, `intelligence`, `dex`, "
        + "`dexterity`, `spd`, `speed`, `sta`, `stamina`.",
    usableBy: "Moderator",
    aliases: ["roll"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}roll\n`
        + `${settings.commandPrefix}roll int colin\n`
        + `${settings.commandPrefix}roll faye devyn\n`
        + `${settings.commandPrefix}roll str seamus terry\n`
        + `${settings.commandPrefix}roll strength shinobu shiori\n`
        + `${settings.commandPrefix}roll sta evad\n`
        + `${settings.commandPrefix}roll dexterity agiri`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    let statString = null, stat = null, attacker = null, defender = null;
    if (args.length === 3) {
        statString = args[0].toLowerCase();
        attacker = game.entityFinder.getLivingPlayer(args[1]);
        if (attacker === undefined) return messageHandler.addReply(game, message, `Couldn't find player "${args[1]}".`);
        defender = game.entityFinder.getLivingPlayer(args[2]);
        if (defender === undefined) return messageHandler.addReply(game, message, `Couldn't find player "${args[2]}".`);
    }
    else if (args.length === 2) {
        const arg0 = game.entityFinder.getLivingPlayer(args[0]);
        if (arg0 === undefined) {
            attacker = arg0;
            defender = game.entityFinder.getLivingPlayer(args[1]);
            if (defender === undefined) return messageHandler.addReply(game, message, `Couldn't find player "${args[1]}".`);
        }
        else {
            statString = arg0;
            attacker = game.entityFinder.getLivingPlayer(args[1]);
            if (attacker === undefined) return messageHandler.addReply(game, message, `Couldn't find player "${args[1]}".`);
        }
    }
    else if (args.length === 1) {
        const arg0 = game.entityFinder.getLivingPlayer(args[0]);
        if (arg0 === undefined) attacker = arg0;
        else return messageHandler.addReply(game, message, `Cannot roll for a stat without a given player.`);
    }
    if (statString) {
        if (statString === "str" || statString === "strength") stat = "str";
        else if (statString === "int" || statString === "intelligence") stat = "int";
        else if (statString === "dex" || statString === "dexterity") stat = "dex";
        else if (statString === "spd" || statString === "speed") stat = "spd";
        else if (statString === "sta" || statString === "stamina") stat = "sta";
        else return messageHandler.addReply(game, message, `"${statString}" is not a valid stat.`);
    }

    const die = new Die(game, stat, attacker, defender);
    if (die.modifier === 0) messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Rolled a **${die.result}** with no modifiers.`);
    else messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Rolled a **${die.result}** with modifiers ${die.modifierString}.`);
    
    return;
}
