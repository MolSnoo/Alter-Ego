import GameSettings from '../Classes/GameSettings.js';
import HideAction from '../Data/Actions/HideAction.js';
import UnhideAction from '../Data/Actions/UnhideAction.js';
import Game from '../Data/Game.js';
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "hide_moderator",
    description: "Hides a player in the given object.",
    details: `Forcibly hides a player in the specified object. They will be able to hide in the specified object `
        + `even if it is attached to a lock-type puzzle that is unsolved, and even if the hiding spot is beyond its `
        + `capacity. To force them out of hiding, use the unhide command.`,
    usableBy: "Moderator",
    aliases: ["hide", "unhide"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}hide nero beds\n`
        + `${settings.commandPrefix}hide cleo bleachers\n`
        + `${settings.commandPrefix}unhide scarlet`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return addReply(game, message, `You need to specify a player. Usage:\n${usage(game.settings)}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return addReply(game, message, `Player "${args[0]}" not found.`);

    if (player.statusString.includes("hidden") && command === "unhide") {
        const unhideAction = new UnhideAction(game, message, player, player.location, true);
        unhideAction.performUnhide();
        addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully brought ${player.name} out of hiding.`);
    }
    else if (player.statusString.includes("hidden"))
        return addReply(game, message, `${player.name} is already **hidden**. If you want ${player.originalPronouns.obj} to stop hiding, use "${game.settings.commandPrefix}unhide ${player.name}".`);
    else if (command === "unhide")
        return addReply(game, message, `${player.name} is not currently hidden.`);
    // Player is currently not hidden and the hide command is being used.
    else {
        if (args.length === 0)
            return addReply(game, message, `You need to specify a fixture. Usage:\n${usage(game.settings)}`);

        var input = args.join(" ");
        var parsedInput = input.toUpperCase().replace(/\'/g, "");

        // Check if the input is a fixture that the player can hide in.
        const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.accessible);
        var fixture = null;
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput && fixtures[i].hidingSpotCapacity > 0) {
                fixture = fixtures[i];
                break;
            }
            else if (fixtures[i].name === parsedInput)
                return addReply(game, message, `${fixtures[i].name} is not a hiding spot.`);
        }
        if (fixture === null) return addReply(game, message, `Couldn't find fixture "${input}".`);

        const hideAction = new HideAction(game, message, player, player.location, true);
        hideAction.performHide(fixture.hidingSpot);
        addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully hid ${player.name} in the ${fixture.name}.`);
    }
}
