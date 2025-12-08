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
    name: "setvoice_bot",
    description: "Sets a player's voice.",
    details: `Sets a player's voice descriptor that will be used when the player uses the `
    + `say command or speaks in a room with a player who can't view the room channel. `
    + `This will not change their voice descriptor on the spreadsheet, and when player data is reloaded, `
    + `their voice descriptor will be reverted to what appears on the spreadsheet. You can also supply another `
    + `player's name instead of a voice descriptor. In this case, the first player's voice will sound exactly like `
    + `the second player's, which they can use to deceive other players. If you use "player" in place of a player's name, `
    + `then the player who triggered the command will have their voice changed. Note that unlike other commands which `
    + `change a player's characteristics, the player's voice will **not** be changed by being inflicted or cured `
    + `of a status effect with the concealed attribute. If this command is used to change a character's voice, it must `
    + `be used again to change it back to normal. It can be reset to their original voice descriptor by omitting a `
    + `voice descriptor in the commands.`,
    usableBy: "Bot",
    aliases: ["setvoice"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `setvoice player a deep modulated voice\n`
    + `setvoice player a high digitized voice\n`
    + `setvoice persephone multiple overlapping voices\n`
    + `setvoice ghost a disembodied voice\n`
    + `setvoice player pollux\n`
    + `setvoice player haru\n`
    + `setvoice player`;
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
    if (args.length === 0)
        return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);

    if (args[0].toLowerCase() !== "player") {
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
                player = game.players_alive[i];
                args.splice(0, 1);
                break;
            }
        }
        if (player === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Player "${args[0]}" not found.`);
    }
    else if (args[0].toLowerCase() === "player" && player === null)
        return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". The "player" argument was used, but no player was passed into the command.`);

    args.splice(0, 1);

    var input = args.join(" ");
    if (input === "" || input === null || input === undefined) {
        if (player.voiceString !== player.originalVoiceString)
            player.voiceString = player.originalVoiceString;
    }
    else {
        if (args.length === 1) {
            for (let i = 0; i < game.players.length; i++) {
                if (game.players[i].name.toLowerCase() === args[0].toLowerCase() && game.players[i].name !== player.name) {
                    player.voiceString = game.players[i].name;
                    return;
                }
            }
        }
        player.voiceString = input;
    }

    return;
}
