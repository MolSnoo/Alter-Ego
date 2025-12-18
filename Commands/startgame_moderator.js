import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import playerdefaults from '../Configs/playerdefaults.json' with { type: 'json' };
import { updateSheetValues } from '../Modules/sheets.js';

/** @type {CommandConfig} */
export const config = {
    name: "startgame_moderator",
    description: "Starts a game.",
    details: 'Starts a new game. You must specify a timer using either hours (h) or minutes (m). '
        + 'During this time, any players with the Student role will be able to join using the PLAY command, '
        + 'at which point they will be given the Player role. When the timer reaches 0, '
        + 'all of the players will be uploaded to the Players spreadsheet. '
        + 'After making any needed modifications, use ".load all start" to begin the game.',
    usableBy: "Moderator",
    aliases: ["startgame", "start"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}startgame 24h\n`
        + `${settings.commandPrefix}start 0.25m`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0) return message.reply("remember to specify how long players have to join!");
    if (game.inProgress) return message.reply("there is already a game running.");
    
    const timeInt = parseInt(args[0].substring(0, args[0].length - 1));
    if (isNaN(timeInt) || (!args[0].endsWith('m') && !args[0].endsWith('h')))
        return message.reply("couldn't understand your timer. Must be a number followed by 'm' or 'h'.");

    var channel;
    if (game.settings.debug) channel = game.guildContext.testingChannel;
    else channel = game.guildContext.generalChannel;

    var time;
    var halfTime;
    var interval;
    if (args[0].endsWith('m')) {
        // Set the time in minutes.
        time = timeInt * 60000;
        halfTime = time / 2;
        interval = "minutes";
    }
    else if (args[0].endsWith('h')) {
        // Set the time in hours.
        time = timeInt * 3600000;
        halfTime = time / 2;
        interval = "hours";
    }

    game.halfTimer = setTimeout(function () {
        channel.send(`${timeInt / 2} ${interval} remaining to join the game. Use ${game.settings.commandPrefix}play to join!`);
    }, halfTime);

    game.endTimer = setTimeout(function () {
        game.canJoin = false;
        const playerRole = game.guildContext.playerRole;
        channel.send(`${playerRole}, time's up! The game will begin once the moderator is ready.`);

        game.players.sort(function (a, b) {
            var nameA = a.name.toLowerCase();
            var nameB = b.name.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });

        var playerCells = [];
        var inventoryCells = [];
        for (let i = 0; i < game.players.length; i++) {
            const player = game.players[i];
            const playerData = [
                player.id,
                player.name,
                player.title,
                player.pronounString,
                player.originalVoiceString,
                String(player.strength),
                String(player.intelligence),
                String(player.dexterity),
                String(player.speed),
                String(player.stamina),
                player.alive ? "TRUE" : "FALSE",
                player.locationDisplayName,
                player.hidingSpot,
                player.statusString,
                player.description
            ];
            playerCells.push(playerData);

            for (let j = 0; j < playerdefaults.defaultInventory.length; j++) {
                // Update this so it replaces the number smybol in any cell.
                var row = [player.name];
                row = row.concat(playerdefaults.defaultInventory[j]);
                for (let k = 0; k < row.length; k++) {
                    if (row[k].includes('#'))
                        row[k] = row[k].replace(/#/g, String(i + 1));
                }
                inventoryCells.push(row);
            }
        }
        updateSheetValues(game.constants.playerSheetDataCells, playerCells);
        updateSheetValues(game.constants.inventorySheetDataCells, inventoryCells);
        game.inProgress = false;
    }, time);

    game.inProgress = true;
    game.canJoin = true;
    let announcement = `${message.member.displayName} has started a game. You have ${timeInt} ${interval} to join the game with ${game.settings.commandPrefix}play.`;
    channel.send(announcement);

    if (game.settings.debug) game.guildContext.commandChannel.send("Started game in debug mode.");
    else game.guildContext.commandChannel.send("Started game.");

    return;
}
