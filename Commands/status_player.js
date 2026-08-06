/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import Player from '../Data/Player.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "status_player",
    description: "Shows your status.",
    details: `Shows you what status effects you're currently afflicted with. `
        + `Note that some status effects may not be visible to you. You will also be unable to see their durations.`,
    usableBy: "Player",
    aliases: ["status"],
    requiresGame: true,
    usableInEditMode: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}status`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Player} player - The player who issued the command.
 */
export async function execute(game, message, command, args, player) {
    const status = player.getBehaviorAttributeStatusEffects("disable status");
    if (status.length > 0) return game.communicationHandler.reply(message, `You cannot do that because you are **${status[0].id}**.`);

    const statusMessage = `You are currently:\n${player.getStatusList(false, false)}`;
    game.communicationHandler.sendMessageToPlayer(player, statusMessage, false);
}
