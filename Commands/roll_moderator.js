import Die from '../Data/Die.ts';
import Player from '../Data/Player.ts';

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "roll_moderator",
    description: "Rolls a die.",
    details: `Rolls a die. You can set the minimum and maximum possible values in your \`.env\` file `
        + `with the \`DICE_MIN\` and \`DICE_MAX\` settings, respectively.\n\n`
        + `If a stat and a player are specified, the result will have the modifier of the player's specified stat `
        + `added to it. If two players are specified, any status effects the second player has which `
        + `affect the first player will be applied to the first player, whose stats will be recalculated before their `
        + `stat modifier is applied. Additionally, if a strength roll is performed using two players, the second `
        + `player's dexterity modifier will be inverted and applied to the first player's roll. Any modifiers will be `
        + `mentioned in the result, but please note that the result sent has already had the modifiers applied.\n\n`
        + "Valid stat inputs are: "
        + "`str`, `strength`, `per`, `perception`, `dex`, `dexterity`, `spd`, `speed`, `sta`, `stamina`.",
    usableBy: "Moderator",
    aliases: ["roll"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}roll\n`
        + `${settings.commandPrefix}roll Sadie\n`
        + `${settings.commandPrefix}roll Christopher Nero\n`
        + `${settings.commandPrefix}roll str Ai\n`
        + `${settings.commandPrefix}roll strength Aisha Huiyu\n`
        + `${settings.commandPrefix}roll perception Kanda\n`
        + `${settings.commandPrefix}roll per Kyra Amadeus\n`
        + `${settings.commandPrefix}roll dexterity Flint\n`
        + `${settings.commandPrefix}roll dex Elijah Lucia\n`
        + `${settings.commandPrefix}roll spd Luna\n`
        + `${settings.commandPrefix}roll speed Xenia Fury\n`
        + `${settings.commandPrefix}roll stamina Danica\n`
        + `${settings.commandPrefix}roll sta Ezekiel Kelly`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Moderator} moderator - The moderator who issued the command.
 */
export async function execute(game, message, command, args, moderator) {
    let statString = null, stat = null, attacker = null, defender = null;
    if (args.length === 3) {
        statString = args[0].toLowerCase();
        attacker = game.entityFinder.getLivingPlayer(args[1]);
        if (attacker === undefined) return game.communicationHandler.reply(message, `Couldn't find player "${args[1]}".`);
        defender = game.entityFinder.getLivingPlayer(args[2]);
        if (defender === undefined) return game.communicationHandler.reply(message, `Couldn't find player "${args[2]}".`);
    }
    else if (args.length === 2) {
        const arg0 = game.entityFinder.getLivingPlayer(args[0]);
        if (arg0 !== undefined) {
            attacker = arg0;
            defender = game.entityFinder.getLivingPlayer(args[1]);
            if (defender === undefined) return game.communicationHandler.reply(message, `Couldn't find player "${args[1]}".`);
        }
        else {
            statString = args[0];
            attacker = game.entityFinder.getLivingPlayer(args[1]);
            if (attacker === undefined) return game.communicationHandler.reply(message, `Couldn't find player "${args[1]}".`);
        }
    }
    else if (args.length === 1) {
        const arg0 = game.entityFinder.getLivingPlayer(args[0]);
        if (arg0 !== undefined) attacker = arg0;
        else return game.communicationHandler.reply(message, `Cannot roll for a stat without a given player.`);
    }
    if (statString) {
        const statAbbreviation = Player.abbreviateStatName(statString);
        if (statAbbreviation === "str") stat = "str";
        else if (statAbbreviation === "per") stat = "per";
        else if (statAbbreviation === "dex") stat = "dex";
        else if (statAbbreviation === "spd") stat = "spd";
        else if (statAbbreviation === "sta") stat = "sta";
        else return game.communicationHandler.reply(message, `"${statString}" is not a valid stat.`);
    }

    const die = game.rollDie(stat, attacker, defender);
    if (die.modifier === 0) game.communicationHandler.sendToCommandChannel(`Rolled a **${die.result}** with no modifiers.`);
    else game.communicationHandler.sendToCommandChannel(`Rolled a **${die.result}** with modifiers ${die.modifierString}.`);
}
