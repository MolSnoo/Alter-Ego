import Player from "../Data/Player.js";
import Event from "../Data/Event.js";
import Flag from "../Data/Flag.js";
import InventoryItem from "../Data/InventoryItem.js";
import Puzzle from "../Data/Puzzle.js";
import * as messageHandler from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "kill_bot",
    description: "Makes a player dead.",
    details: "Moves the listed players from the living list to the dead list. "
        + "The player will be removed from whatever room channel they're in as well as any whispers. "
        + "A dead player will retain any items they had in their inventory, but they will not be accessible "
        + "unless they are manually added to the spreadsheet. A dead player will retain the Player role. "
        + "When a dead player's body is officially discovered, use the reveal command to remove the Player role "
        + "and give them the Dead role. If you use \"player\" in place of a list of players, then the player who "
        + "triggered the command will be killed. If the \"room\" argument is used instead, then all players in the "
        + "room will be killed.",
    usableBy: "Bot",
    aliases: ["kill", "die"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `kill natalie\n`
        + `die shiori corin terry andrew aria\n`
        + `kill player\n`
        + `die room`;
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
    if (args.length === 0) {
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". No players were specified.`);
        return;
    }

    // Determine which player(s) are being killed.
    let players = [];
    if (args[0].toLowerCase() === "player" && player !== null)
        players.push(player);
    else if (args[0].toLowerCase() === "room" && callee !== null && callee instanceof Event) {
        // Command was triggered by an Event. Get occupants of all rooms affected by it.
        game.entityFinder.getRooms(null, callee.roomTag, true).map((room) => {
            players = players.concat(room.occupants);
        });
    }
    else if (args[0].toLowerCase() === "room" && player !== null)
        players = player.location.occupants;
    else {
        player = null;
        for (let i = args.length - 1; i >= 0; i--) {
            const fetchedPlayer = game.entityFinder.getLivingPlayer(args[i]);
            if (fetchedPlayer) {
                players.push(fetchedPlayer);
                args.splice(i, 1);
            }
        }
        if (args.length > 0) {
            const missingPlayers = args.join(", ");
            return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find player(s): ${missingPlayers}.`);
        }
    }

    for (let i = 0; i < players.length; i++)
        players[i].die();

    return;
}
