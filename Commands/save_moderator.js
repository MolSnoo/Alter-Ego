const settings = include('settings.json');
const saver = include(`${settings.modulesDir}/saver.js`);

module.exports.config = {
    name: "save_moderator",
    description: "An example command.",         //
    details: "Tells you your role.",            // UPDATE ALL OF THIS
    usage: `${settings.commandPrefix}save`,     //
    usableBy: "Moderator",
    aliases: ["save"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    try {
        await saver.saveGame();
        message.channel.send("Game data successfully saved to the spreadsheet.");
    }
    catch (err) {
        console.log(err);
        return game.messageHandler.addGameMechanicMessage(message.channel, "There was an error saving data to the spreadsheet. Error:\n```" + err + "```");
    }

    return;
};
