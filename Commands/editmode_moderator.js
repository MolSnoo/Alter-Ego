const settings = include('Configs/settings.json');
const constants = include('Configs/constants.json');
const saver = include(`${constants.modulesDir}/saver.js`);

module.exports.config = {
    name: "editmode_moderator",
    description: "Toggles edit mode for editing the spreadsheet.",
    details: "Toggles edit mode on or off, allowing you to make edits to the spreadsheet. When edit mode is turned on, "
        + "Alter Ego will no longer save the game to the spreadsheet automatically. Additionally, all player activity, "
        + "aside from speaking in room channels or in whispers, will be disabled. Players will be notified when edit mode "
        + "is enabled, so use it sparingly. Data will be saved to the spreadsheet before edit mode is enabled, so be sure "
        + "to wait until the confirmation message has been sent before making any edits. When you are finished making edits, "
        + "be sure to load the updated spreadsheet data before disabling edit mode.",
    usage: `${settings.commandPrefix}editmode\n`
        + `${settings.commandPrefix}editmode on\n`
        + `${settings.commandPrefix}editmode off`,
    usableBy: "Moderator",
    aliases: ["editmode"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0 && game.editMode === false || args.length > 0 && args[0].toLowerCase() === "on") {
        try {
            await saver.saveGame();
            game.editMode = true;
            for (let i = 0; i < game.players_alive.length; i++) {
                game.players_alive[i].isMoving = false;
                clearInterval(game.players_alive[i].moveTimer);
                game.players_alive[i].remainingTime = 0;
                game.players_alive[i].moveQueue.length = 0;
                if (!game.players_alive[i].hasAttribute('unconscious'))
                    game.messageHandler.addDirectNarration(game.players_alive[i], "A moderator has enabled edit mode. While the spreadsheet is being edited, you cannot do anything but speak. This should only take a few minutes.", false);
            }
            game.messageHandler.addGameMechanicMessage(message.channel, "Edit mode has been enabled.");
        }
        catch (err) {
            console.log(err);
            return game.messageHandler.addGameMechanicMessage(message.channel, "There was an error saving data to the spreadsheet. Error:\n```" + err + "```");
        }
    }
    else if (args.length === 0 && game.editMode === true || args.length > 0 && args[0].toLowerCase() === "off") {
        game.editMode = false;
        for (let i = 0; i < game.players_alive.length; i++) {
            if (!game.players_alive[i].hasAttribute('unconscious'))
                game.messageHandler.addDirectNarration(game.players_alive[i], "Edit mode has been disabled. You are free to resume normal gameplay.", false);
        }
        game.messageHandler.addGameMechanicMessage(message.channel, "Edit mode has been disabled.");
    }
    else game.messageHandler.addReply(message, `Couldn't understand input "${args[0]}". Usage:\n${exports.config.usage}`);

    return;
};
