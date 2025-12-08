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
 * @param {Game} game 
 * @param {string} command 
 * @param {string[]} args 
 * @param {Player} [player] 
 * @param {Event|Flag|InventoryItem|Puzzle} [callee] 
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
    var players = new Array();
    if (args[0].toLowerCase() === "player" && player !== null)
        players.push(player);
    else if (args[0].toLowerCase() === "room" && player !== null)
        players = player.location.occupants;
    else if (args[0].toLowerCase() === "all") {
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].title !== "NPC" && !game.players_alive[i].member.roles.cache.find(role => role.id === game.guildContext.freeMovementRole.id))
                players.push(game.players_alive[i]);
        }
    }
    else {
        player = null;
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
                player = game.players_alive[i];
                break;
            }
        }
        if (player === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find player "${args[0]}".`);
        players.push(player);
    }
    args.splice(0, 1);

    var statusName = args.join(" ").toLowerCase();
    for (let i = 0; i < players.length; i++) {
        if (command === "inflict")
            players[i].inflict(statusName, true, true, true, callee);
        else if (command === "cure")
            players[i].cure(statusName, true, true, true, callee);
    }

    return;
}
