import GameSettings from '../Classes/GameSettings.js';
import HideAction from '../Data/Actions/HideAction.js';
import UnhideAction from '../Data/Actions/UnhideAction.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import { addReply } from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "hide_player",
    description: "Hides you in an object.",
    details: `Allows you to use an object in a room as a hiding spot. When hidden, you will be removed from that room's channel so that `
        + `when other players enter the room, they won't see you on the user list. When players speak in the room that you're hiding in, `
        + `you will hear what they say. Under normal circumstances, a whisper channel will be created for you to speak in. Most players `
        + `will be unable to hear what you say in this channel. However, if you want to speak so that everyone can hear you (while having `
        + `your identity remain a secret), use the say command. If someone hides in the same hiding spot as you, ` 
        + `you will be placed in a whisper channel together. If someone inspects or tries to hide in the object you're hiding in, `
        + `your position will be revealed. If you wish to come out of hiding on your own, use the unhide command.`,
    usableBy: "Player",
    aliases: ["hide", "unhide"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}hide desk\n`
        + `${settings.commandPrefix}hide cabinet\n`
        + `${settings.commandPrefix}unhide`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    const status = player.getAttributeStatusEffects("disable hide");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    if (player.statusString.includes("hidden") && command === "unhide") {
        let fixture = null;
        for (let i = 0; i < game.fixtures.length; i++) {
            if (game.fixtures[i].location.id === player.location.id && game.fixtures[i].name === player.hidingSpot) {
                fixture = game.fixtures[i];
                break;
            }
        }
        if (fixture !== null && (!fixture.accessible || fixture.childPuzzle !== null && fixture.childPuzzle.type.endsWith("lock") && !fixture.childPuzzle.solved))
            return addReply(game, message, `You cannot come out of hiding right now.`);
        else {
            const unhideAction = new UnhideAction(game, message, player, player.location, false);
            unhideAction.performUnhide(fixture.hidingSpot);
        }
    }
    else if (player.statusString.includes("hidden"))
        return addReply(game, message, `You are already **hidden**. If you wish to stop hiding, use "${game.settings.commandPrefix}unhide".`);
    else if (command === "unhide")
        return addReply(game, message, "You are not currently hidden.");
    // Player is currently not hidden and is using the hide command.
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

        // Make sure the fixture isn't locked.
        if (fixture.childPuzzle !== null && fixture.childPuzzle.type.endsWith("lock") && !fixture.childPuzzle.solved)
            return addReply(game, message, `You cannot hide in ${fixture.name} right now.`);

        const hideAction = new HideAction(game, message, player, player.location, false);
        hideAction.performHide(fixture.hidingSpot);
    }
}
