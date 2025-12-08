import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { saveGame } from '../Modules/saver.js';

/** @type {CommandConfig} */
export const config = {
    name: "save_moderator",
    description: "Saves the game data to the spreadsheet.",
    details: "Manually saves the game data to the spreadsheet. Ordinarily, game data is automatically saved "
        + `to the spreadsheet periodically, as defined in the settings file. `
        + "However, this command allows you to save at any time, even when edit mode is enabled.",
    usableBy: "Moderator",
    aliases: ["save"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}save`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    try {
        await saveGame(game);
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, "Successfully saved game data to the spreadsheet.");
    }
    catch (err) {
        console.log(err);
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, "There was an error saving data to the spreadsheet. Error:\n```" + err + "```");
    }

    return;
}
