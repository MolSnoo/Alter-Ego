import { addGameMechanicMessage } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

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
export function usage(settings) {
    return `${settings.commandPrefix}save`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute(game, message, command, args) {
    try {
        await game.entitySaver.saveGame();
        addGameMechanicMessage(game, game.guildContext.commandChannel, "Successfully saved game data to the spreadsheet.");
    }
    catch (err) {
        console.log(err);
        addGameMechanicMessage(game, game.guildContext.commandChannel, "There was an error saving data to the spreadsheet. Error:\n```" + err + "```");
    }

    return;
}
