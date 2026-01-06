/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "editmode_moderator",
    description: "Toggles edit mode for editing the spreadsheet.",
    details: "Toggles edit mode on or off, allowing you to make edits to the spreadsheet. When edit mode is turned on, "
        + "Alter Ego will no longer save the game to the spreadsheet automatically. Additionally, all player activity, "
        + "aside from speaking in room channels or in whispers, will be disabled. Players will be notified when edit mode "
        + "is enabled, so use it sparingly. Data will be saved to the spreadsheet before edit mode is enabled, so be sure "
        + "to wait until the confirmation message has been sent before making any edits. When you are finished making edits, "
        + "be sure to load the updated spreadsheet data before disabling edit mode.",
    usableBy: "Moderator",
    aliases: ["editmode"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
    return `${settings.commandPrefix}editmode\n`
        + `${settings.commandPrefix}editmode on\n`
        + `${settings.commandPrefix}editmode off`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute(game, message, command, args) {
    if (args.length === 0 && game.editMode === false || args.length > 0 && args[0].toLowerCase() === "on") {
        try {
            await game.entitySaver.saveGame();
            game.editMode = true;
            game.livingPlayersCollection.forEach(player => {
                player.stopMoving();
                if (!player.hasBehaviorAttribute('unconscious'))
                    game.communicationHandler.sendMessageToPlayer(player, "A moderator has enabled edit mode. While the spreadsheet is being edited, you cannot do anything but speak. This should only take a few minutes.", false);
            });
            game.communicationHandler.sendToCommandChannel("Edit mode has been enabled.");
        }
        catch (err) {
            console.log(err);
            return game.communicationHandler.sendToCommandChannel("There was an error saving data to the spreadsheet. Error:\n```" + err + "```");
        }
    }
    else if (args.length === 0 && game.editMode === true || args.length > 0 && args[0].toLowerCase() === "off") {
        if (game.loadedEntitiesWithErrors.size !== 0)
            return game.communicationHandler.reply(message, `Edit mode can't be disabled while there are errors on the sheet. Fix the errors found by the load command and then try again.`);
        game.editMode = false;
        game.livingPlayersCollection.forEach(player => {
            if (!player.hasBehaviorAttribute('unconscious'))
                game.communicationHandler.sendMessageToPlayer(player, "Edit mode has been disabled. You are free to resume normal gameplay.", false);
        });
        game.communicationHandler.sendToCommandChannel("Edit mode has been disabled.");
    }
    else game.communicationHandler.reply(message, `Couldn't understand input "${args[0]}". Usage:\n${usage(game.settings)}`);
}
