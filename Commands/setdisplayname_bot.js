/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

/** @type {CommandConfig} */
export const config = {
    name: "setdisplayname_bot",
    description: "Sets a player's display name.",
    details: "Sets the name that will display whenever the given player does something in-game. This will not change their name on the spreadsheet, "
        + "and when player data is reloaded, their display name will be reverted to their true name. Note that if the player is inflicted with "
        + "or cured of a status effect with the concealed attribute, their display name will be updated, thus overwriting one that was set manually. "
        + "However, this command can be used to overwrite their new display name afterwards as well. Note that this command will not change the player's "
        + "nickname in the server. If you use \"player\" in place of a player's name, then the player who triggered the command will have their "
        + "display name changed. To reset a player's display name to their real name, simply do not specify a new display name.",
    usableBy: "Bot",
    aliases: ["setdisplayname"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
    return `setdisplayname usami Monomi\n`
        + `setdisplayname player An individual wearing a MINOTAUR MASK\n`
        + `setdisplayname player`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} [player] - The player who caused the command to be executed, if applicable. 
 * @param {Callee} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute(game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    if (args.length === 0)
        return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);

    if (args[0].toLowerCase() !== "player") {
        player = game.entityFinder.getLivingPlayer(args[0]);
        if (player === undefined) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". Player "${args[0]}" not found.`);
    }
    else if (args[0].toLowerCase() === "player" && player === null)
        return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". The "player" argument was used, but no player was passed into the command.`);

    args.splice(0, 1);

    let input = args.join(" ");
    if (input === "") input = player.name;
    if (input.length > 32) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${cmdString}". A name cannot exceed 32 characters.`);

    player.displayName = input;
    player.location.occupantsString = player.location.generateOccupantsString(player.location.occupants.filter(occupant => !occupant.hasBehaviorAttribute("hidden")));
}
