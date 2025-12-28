import Narration from '../Data/Narration.js';
import { addGameMechanicMessage, addLogMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "fixture_moderator",
    description: "Activates or deactivates a fixture.",
    details: 'Activates or deactivates a fixture. You may specify a player to activate/deactivate the fixture. If you do, '
        + 'players in the room will be notified, so you should generally give a string for the bot to use, '
        + 'otherwise the bot will say "[player] turns on/off the [fixture]." which may not sound right. '
        + "If you specify a player, only fixtures in the room that player is in can be activated/deactivated. "
        + 'You can also use a room name instead of a player name. In that case, only fixtures in the room '
        + 'you specify can be activated/deactivated. This is useful if you have multiple fixtures with the same name '
        + 'spread across the map. This command can only be used for fixtures with a recipe tag. If there is a puzzle with '
        + 'the same name as the fixture whose state is supposed to be the same as the fixture, use the puzzle command to update it as well.',
    usableBy: "Moderator",
    aliases: ["fixture", "object", "activate", "deactivate"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}fixture activate blender\n`
        + `${settings.commandPrefix}fixture deactivate microwave\n`
        + `${settings.commandPrefix}activate keurig kyra\n`
        + `${settings.commandPrefix}deactivate oven noko\n`
        + `${settings.commandPrefix}fixture activate fireplace log cabin\n`
        + `${settings.commandPrefix}fixture deactivate fountain flower garden\n`
        + `${settings.commandPrefix}activate freezer zoran "Zoran plugs in the FREEZER."\n`
        + `${settings.commandPrefix}deactivate washer 1 laundry room "WASHER 1 turns off"`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    let input = command + " " + args.join(" ");
    if (command === "fixture" || command === "object") {
        if (args[0] === "activate") command = "activate";
        else if (args[0] === "deactivate") command = "deactivate";
        input = input.substring(input.indexOf(args[1]));
        args = input.split(" ");
    }
    else input = args.join(" ");

    if (command !== "activate" && command !== "deactivate") return addReply(game, message, 'Invalid command given. Use "activate" or "deactivate".');
    if (args.length === 0)
        return addReply(game, message, `You need to input all required arguments. Usage:\n${usage(game.settings)}`);

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
    let player = game.entityFinder.getLivingPlayer(args[args.length - 1]);
    if (player) {
        args.splice(args.length - 1, 1);
        input = args.join(" ");
    } else
        player = null;

    // If a player wasn't specified, check if a room name was.
    let room = null;
    if (player === null) {
        const parsedInput = input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
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
    else if (fixture === null) return addReply(game, message, `Couldn't find fixture "${input}".`);
    if (fixture.recipeTag === "") return addReply(game, message, `${fixture.name} cannot be ${command}d because it has no recipe tag.`);

    let narrate = false;
    if (announcement === "" && player !== null) narrate = true;
    else if (announcement !== "") new Narration(game, player, game.entityFinder.getRoom(fixture.location.id), announcement).send();

    const time = new Date().toLocaleTimeString();
    if (command === "activate") {
        fixture.activate(player, narrate);
        addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully activated ${fixture.name}.`);
        // Post log message.
        if (player) addLogMessage(game, `${time} - ${player.name} forcibly activated ${fixture.name} in ${player.location.channel}`);
    }
    else if (command === "deactivate") {
        fixture.deactivate(player, narrate);
        addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully deactivated ${fixture.name}.`);
        // Post log message.
        if (player) addLogMessage(game, `${time} - ${player.name} forcibly deactivated ${fixture.name} in ${player.location.channel}`);
    }
}
