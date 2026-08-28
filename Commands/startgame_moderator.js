import { updateSheetValues } from "../Modules/sheets.ts";
import { loadPlayerDefaults } from "../Modules/settingsLoader.ts";

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "startgame_moderator",
    description: "Starts a game.",
    details: `Starts a new game with a timed delay. You must specify an amount of time as a number followed by a unit, `
        + `either hours (\`h\`) or minutes (\`m\`). During this time, server members with the Eligible role will be `
        + `able to voluntarily add themselves to the game as players using the \`play\` command in the general channel. `
        + `If debug mode is on, they must have the Tester role, and send the command in the testing channel. `
        + `When this occurs, they will be given the Player role, and they will be added to the game's data as players `
        + `with default player data as defined in the \`Player Defaults\` section of your \`.env\` file.\n\n`
        + `When the timer you set reaches 0, all of the player data will be saved to the Players sheet. After that, you `
        + `can edit their data to accurately reflect their characters. If you edit their data before the timer expires, `
        + `it will be overwritten. When you are ready to begin the game, use the \`load\` command `
        + `with the \`all start\` arguments.\n\n`
        + `**Only use this command if you are not planning to add players to the sheet yourself.** Any data already on `
        + `the Players and Inventory Items sheets will be overwritten by this command. If you just want an easier way `
        + `to populate those sheets without having to fill them out manually, use the \`addplayer\` command.`,
    usableBy: "Moderator",
    aliases: ["startgame", "start"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}startgame 24h\n`
        + `${settings.commandPrefix}start 1h\n`
        + `${settings.commandPrefix}startgame 30m\n`
        + `${settings.commandPrefix}start 0.25m`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Moderator} moderator - The moderator who issued the command.
 */
export async function execute(game, message, command, args, moderator) {
    if (args.length === 0) return game.communicationHandler.reply(message, "Remember to specify how long players have to join!");
    if (game.inProgress) return game.communicationHandler.reply(message, "There is already a game running.");

    const timeInt = parseInt(args[0].substring(0, args[0].length - 1));
    if (isNaN(timeInt) || (!args[0].endsWith('m') && !args[0].endsWith('h')))
        return game.communicationHandler.reply(message, "Couldn't understand your timer. Must be a number followed by 'm' or 'h'.");

    let channel;
    if (game.settings.debug) channel = game.guildContext.testingChannel;
    else channel = game.guildContext.generalChannel;

    let time;
    let halfTime;
    /** @type string */
    let interval;
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
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });

        const [playerdefaults] = loadPlayerDefaults();
        const playerCells = [];
        const inventoryCells = [];
        let i = 0;
        for (const player of game.players.values()) {
            const playerData = [
                player.id,
                player.name,
                player.title,
                player.pronounString,
                player.originalVoiceString,
                String(player.strength),
                String(player.perception),
                String(player.dexterity),
                String(player.speed),
                String(player.stamina),
                player.alive ? "TRUE" : "FALSE",
                player.locationDisplayName,
                player.hidingSpot,
                playerdefaults.defaultStatusEffects,
                player.description.text
            ];
            playerCells.push(playerData);

            for (let j = 0; j < playerdefaults.defaultInventory.length; j++) {
                // Update this so it replaces the number symbol in any cell.
                let row = [player.name];
                row = row.concat(playerdefaults.defaultInventory[j]);
                for (let k = 0; k < row.length; k++) {
                    if (row[k].includes('#'))
                        row[k] = row[k].replace(/#/g, String(i + 1));
                }
                inventoryCells.push(row);
            }
            i++;
        }
        updateSheetValues(game.constants.playerSheetDataCells, playerCells, game.settings.spreadsheetID);
        updateSheetValues(game.constants.inventorySheetDataCells, inventoryCells, game.settings.spreadsheetID);
        game.inProgress = false;
    }, time);

    game.inProgress = true;
    game.canJoin = true;
    const announcement = `${message.member.displayName} has started a game. You have ${timeInt} ${interval} to join the game with ${game.settings.commandPrefix}play.`;
    channel.send(announcement);

    if (game.settings.debug) game.guildContext.commandChannel.send("Started game in debug mode.");
    else game.guildContext.commandChannel.send("Started game.");
}
