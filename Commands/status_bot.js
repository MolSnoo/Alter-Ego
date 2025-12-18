import GameSettings from "../Classes/GameSettings.js";
import Game from "../Data/Game.js";
import Player from "../Data/Player.js";
import Event from "../Data/Event.js";
import Flag from "../Data/Flag.js";
import InventoryItem from "../Data/InventoryItem.js";
import Puzzle from "../Data/Puzzle.js";
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "status_bot",
    description: "Deals with status effects on players.",
    details: 'Deals with status effects on players.\n'
        + '-**add**/**inflict**: Inflicts the specified player with the given status effect. '
        + 'If the "player" argument is used in place of a name, then the player who triggered '
        + 'the command will be inflicted. If the "all" argument is used instead, then all living '
        + 'players will be inflicted. If the "room" argument is used in place of a name, '
        + 'then all players in the same room as the player who solved it will be inflicted.\n'
        + '-**remove**/**cure**: Cures the specified player of the given status effect. '
        + 'If the "player" argument is used in place of a name, then the player who triggered '
        + 'the command will be cured. If the "all" argument is used instead, then all living '
        + 'players will be cured. If the "room" argument is used in place of a name, '
        + 'then all players in the same room as the player who solved it will be cured.',
    usableBy: "Bot",
    aliases: ["status", "inflict", "cure"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `status add player heated\n`
        + `status add room safe\n`
        + `inflict all deaf\n`
        + `inflict diego heated\n`
        + `status remove player injured\n`
        + `status remove room restricted\n`
        + `cure antoine injured\n`
        + `cure all deaf`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} [player] - The player who caused the command to be executed, if applicable. 
 * @param {Event|Flag|InventoryItem|Puzzle} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute (game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    if (command === "status") {
        if (args[0] === "add" || args[0] === "inflict") command = "inflict";
        else if (args[0] === "remove" || args[0] === "cure") command = "cure";
        args.splice(0, 1);
    }

    if (args.length === 0) {
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    // Determine which player(s) are being inflicted/cured with a status effect.
    /**
     * @type {Array<Player>}
     */
    let players = new Array();
    if (args[0].toLowerCase() === "player" && player !== null)
        players.push(player);
    else if (args[0].toLowerCase() === "room" && player !== null)
        players = player.location.occupants;
    else if (args[0].toLowerCase() === "all") {
        players.concat(game.entityFinder.getLivingPlayers(null, false).filter((player) => {!player.member.roles.cache.find(role => role.id === game.guildContext.freeMovementRole.id)}));
    }
    else {
        player = game.entityFinder.getLivingPlayer(args[0]);
        if (player === undefined) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find player "${args[0]}".`);
        players.push(player);
    }
    args.splice(0, 1);

    const statusName = args.join(" ").toLowerCase();
    for (let i = 0; i < players.length; i++) {
        if (command === "inflict")
            players[i].inflict(statusName, true, true, true, callee);
        else if (command === "cure")
            players[i].cure(statusName, true, true, true, callee);
    }

    return;
}
