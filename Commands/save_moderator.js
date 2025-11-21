const settings = require('../Configs/settings.json');
const constants = require('../Configs/constants.json');
const saver = require('../Modules/saver.js');

module.exports.config = {
    name: "save_moderator",
    description: "Saves the game data to the spreadsheet.",
    details: "Manually saves the game data to the spreadsheet. Ordinarily, game data is automatically saved "
        + `to the spreadsheet every ${settings.autoSaveInterval} seconds, as defined in the settings file. `
        + "However, this command allows you to save at any time, even when edit mode is enabled.",
    usage: `${settings.commandPrefix}save`,
    usableBy: "Moderator",
    aliases: ["save"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    try {
        await saver.saveGame();
        game.messageHandler.addGameMechanicMessage(message.channel, "Successfully saved game data to the spreadsheet.");
    }
    catch (err) {
        console.log(err);
        game.messageHandler.addGameMechanicMessage(message.channel, "There was an error saving data to the spreadsheet. Error:\n```" + err + "```");
    }

    return;
};
