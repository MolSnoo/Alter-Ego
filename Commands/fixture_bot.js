import ActivateAction from "../Data/Actions/ActivateAction.js";
import DeactivateAction from "../Data/Actions/DeactivateAction.js";
import Room from "../Data/Room.js";
import { addGameMechanicMessage } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

/** @type {CommandConfig} */
export const config = {
    name: "fixture_bot",
    description: "Activates or deactivates a fixture.",
    details: 'Activates or deactivates a fixture. You may specify a player to activate/deactivate the fixture. If you do, '
        + 'players in the room will be notified, so you should generally give a string for the bot to use, '
        + 'otherwise the bot will say "[player] turns on/off the [fixture]." which may not sound right. '
        + "If you specify a player, only fixtures in the room that player is in can be activated/deactivated. "
        + 'You can also use a room name instead of a player name. In that case, only fixtures in the room '
        + 'you specify can be activated/deactivated. This is useful if you have multiple fixtures with the same name '
        + 'spread across the map. This command can only be used for fixtures with a recipe tag. If there is a puzzle with '
        + 'the same name as the fixture whose state is supposed to be the same as the fixture, use the puzzle command to update it as well.',
    usableBy: "Bot",
    aliases: ["fixture", "object", "activate", "deactivate"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `fixture activate blender\n`
        + `fixture deactivate microwave\n`
        + `activate keurig kyra\n`
        + `deactivate oven noko\n`
        + `fixture activate fireplace log cabin\n`
        + `fixture deactivate fountain flower garden\n`
        + `activate freezer zoran "Zoran plugs in the FREEZER."\n`
        + `deactivate washer 1 laundry room "WASHER 1 turns off"`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} [player] - The player who caused the command to be executed, if applicable. 
 * @param {Callee} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute (game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    let input = cmdString;
    if (command === "fixture" || command === "object") {
        if (args[0] === "activate") command = "activate";
        else if (args[0] === "deactivate") command = "deactivate";
        input = input.substring(input.indexOf(args[1]));
        args = input.split(" ");
    }
    else input = args.join(" ");

    if (command !== "activate" && command !== "deactivate") return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Invalid command given. Use "activate" or "deactivate".`);
    if (args.length === 0) {
        addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    // The message, if it exists, is the easiest to find at the beginning. Look for that first.
    let announcement = "";
    let index = input.indexOf('"');
    if (index === -1) index = input.indexOf('�');
    if (index !== -1) {
        announcement = input.substring(index + 1);
        // Remove the announcement from the list of arguments.
        input = input.substring(0, index - 1);
        args = input.split(" ");
        // Now clean up the announcement text.
        if (announcement.endsWith('"') || announcement.endsWith('�'))
            announcement = announcement.substring(0, announcement.length - 1);
        if (!announcement.endsWith('.') && !announcement.endsWith('!'))
            announcement += '.';
    }

    // Find the prospective list of fixtures.
    const fixtures = game.fixtures.filter(fixture => input.toUpperCase().startsWith(fixture.name + ' ') || input.toUpperCase() === fixture.name);
    if (fixtures.length > 0) {
        input = input.substring(fixtures[0].name.length).trim();
        args = input.split(" ");
    }

    // Now find the player, who should be the last argument.
    if (args[args.length - 1] === "player" && player !== null) {
        args.splice(args.length - 1, 1);
        input = args.join(" ");
        announcement = announcement.replace(/player/g, player.displayName);
    }
    else {
        player = game.entityFinder.getLivingPlayer(args[args.length - 1]);
        if (player) {
            args.splice(args.length - 1, 1);
            input = args.join(" ");
        } else
            player = null
    }

    // If a player wasn't specified, check if a room name was.
    let room = null;
    if (player === null) {
        const parsedInput = Room.generateValidId(input);
        for (let i = args.length - 1; i >= 0; i--) {
            room = game.entityFinder.getRoom(args.splice(i).join(" "));
            if (room) {
                input = input.substring(0, parsedInput.indexOf(room.id) - 1);
                break;
            }
        }
        if (!room) room = null;
    }

    // Finally, find the fixture.
    let fixture = null;
    for (let i = 0; i < fixtures.length; i++) {
        if ((player !== null && fixtures[i].location.id === player.location.id)
            || (room !== null && fixtures[i].location.id === room.id)) {
            fixture = fixtures[i];
            break;
        }
    }
    if (fixture === null && player === null && room === null && fixtures.length > 0) fixture = fixtures[0];
    else if (fixture === null) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find fixture "${input}".`);
    if (fixture.recipeTag === "") return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". ${fixture.name} cannot be ${command}d because it has no recipe tag.`);

    let narrate = false;
    if (announcement === "" && player !== null) narrate = true;

    if (command === "activate") {
        const activateAction = new ActivateAction(game, undefined, player, fixture.location, true);
        activateAction.performActivate(fixture, narrate, announcement);
    }
    else if (command === "deactivate") {
        const deactivateAction = new DeactivateAction(game, undefined, player, fixture.location, true);
        deactivateAction.performDeactivate(fixture, narrate, announcement);
    }
}
