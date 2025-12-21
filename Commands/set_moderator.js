import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { getChildItems } from '../Modules/itemManager.js';

/** @type {CommandConfig} */
export const config = {
    name: "set_moderator",
    description: "Sets an object, puzzle, or set of items as accessible or inaccessible.",
    details: 'Sets an object, puzzle, or set of items as accessible or inaccessible. '
        + 'You have to specify whether to set an object or puzzle, even if you want to set a set of '
        + 'items. When you use the optional "items" argument, it will set all of the items contained '
        + 'in that object or puzzle as accessible/inaccessible at once. Individual items cannot be set. '
        + 'You can also specify a room name.  If you do, only object/items/puzzles in the room you specify '
        + 'can be set as accessible/ inaccessible. This is useful if you have multiple objects or puzzles '
        + 'with the same name spread across the map.',
    usableBy: "Moderator",
    aliases: ["set"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}set accessible puzzle button\n`
        + `${settings.commandPrefix}set inaccessible fixture terminal\n`
        + `${settings.commandPrefix}set accessible fixture keypad tool shed\n`
        + `${settings.commandPrefix}set accessible fixture items medicine cabinet\n`
        + `${settings.commandPrefix}set inaccessible puzzle items lock men's locker room`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return messageHandler.addReply(game, message, `You need to input all required arguments. Usage:\n${usage(game.settings)}`);

    let input = args.join(" ");
    if (args[0] === "accessible") command = "accessible";
    else if (args[0] === "inaccessible") command = "inaccessible";
    else {
        messageHandler.addReply(game, message, 'The first argument must be "accessible" or "inaccessible". Usage:');
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, usage(game.settings));
        return;
    }
    input = input.substring(input.indexOf(args[1]));
    args = input.split(" ");

    let isFixture = false;
    let isPuzzle = false;
    if (args[0] === "fixture" || args[0] === "object") isFixture = true;
    else if (args[0] === "puzzle") isPuzzle = true;
    else {
        messageHandler.addReply(game, message, 'The second argument must be "fixture" or "puzzle". Usage:');
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, usage(game.settings));
        return;
    }
    input = input.substring(input.indexOf(args[1]));
    args = input.split(" ");

    let doItems = false;
    if (args[0] === "items") {
        doItems = true;
        input = input.substring(input.indexOf(args[1]));
        args = input.split(" ");
    }

    // Check if a room name was specified.
    let room = null;
    const parsedInput = input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
    for (let i = args.length - 1; i >= 0; i--) {
        room = game.entityFinder.getRoom(args.splice(i).join(" "));
        if (room) {
            input = input.substring(0, parsedInput.lastIndexOf(room.id) - 1);
            break;
        }
    }
    if (!room) room = null;

    let fixture = null;
    let puzzle = null;
    if (isFixture) {
        const fixtures = game.fixtures.filter(fixture => fixture.name === input.toUpperCase().replace(/\'/g, ""));
        // Finally, find the fixture.
        for (let i = 0; i < fixtures.length; i++) {
            if (room !== null && fixtures[i].location.id === room.id) {
                fixture = fixtures[i];
                break;
            }
        }
        if (fixture === null && room === null && fixtures.length > 0) fixture = fixtures[0];
        else if (fixture === null) return messageHandler.addReply(game, message, `Couldn't find fixture "${input}".`);
    }
    else if (isPuzzle) {
        const puzzles = game.puzzles.filter(puzzle => puzzle.name === input.toUpperCase().replace(/\'/g, ""));
        // Finally, find the puzzle.
        for (let i = 0; i < puzzles.length; i++) {
            if (room !== null && puzzles[i].location.id === room.id) {
                puzzle = puzzles[i];
                break;
            }
        }
        if (puzzle === null && room === null && puzzles.length > 0) puzzle = puzzles[0];
        else if (puzzle === null) return messageHandler.addReply(game, message, `Couldn't find puzzle "${input}".`);
    }

    if (command === "accessible") {
        if (isFixture) {
            if (doItems) {
                // Update all of the items contained in this fixture.
                let items = game.entityFinder.getRoomItems(null, fixture.location.id, null, `Object: ${fixture.name}`);
                const childItems = [];
                for (let i = 0; i < items.length; i++)
                    getChildItems(childItems, items[i]);
                items = items.concat(childItems);

                for (let i = 0; i < items.length; i++)
                    items[i].setAccessible();
                messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully made ${items.length} items in ${fixture.name} accessible.`);
            }
            else {
                fixture.setAccessible();
                messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully made ${fixture.name} accessible.`);
            }
        }
        else if (isPuzzle) {
            if (doItems) {
                // Update all of the items contained in this puzzle.
                let items = game.entityFinder.getRoomItems(null, puzzle.location.id, null, `Puzzle: ${puzzle.name}`);
                const childItems = [];
                for (let i = 0; i < items.length; i++)
                    getChildItems(childItems, items[i]);
                items = items.concat(childItems);

                for (let i = 0; i < items.length; i++)
                    items[i].setAccessible();
                messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully made ${items.length} items in ${puzzle.name} accessible.`);
            }
            else {
                puzzle.setAccessible();
                messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully made ${puzzle.name} accessible.`);
            }
        }
    }
    else if (command === "inaccessible") {
        if (isFixture) {
            if (doItems) {
                // Update all of the items contained in this fixture.
                let items = game.entityFinder.getRoomItems(null, fixture.location.id, null, `Object: ${fixture.name}`);
                const childItems = [];
                for (let i = 0; i < items.length; i++)
                    getChildItems(childItems, items[i]);
                items = items.concat(childItems);

                for (let i = 0; i < items.length; i++)
                    items[i].setInaccessible();
                messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully made ${items.length} items in ${fixture.name} inaccessible.`);
            }
            else {
                fixture.setInaccessible();
                messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully made ${fixture.name} inaccessible.`);
            }
        }
        else if (isPuzzle) {
            if (doItems) {
                // Update all of the items contained in this puzzle.
                let items = game.entityFinder.getRoomItems(null, puzzle.location.id, null, `Puzzle: ${puzzle.name}`);
                const childItems = [];
                for (let i = 0; i < items.length; i++)
                    getChildItems(childItems, items[i]);
                items = items.concat(childItems);

                for (let i = 0; i < items.length; i++)
                    items[i].setInaccessible();
                messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully made ${items.length} items in ${puzzle.name} inaccessible.`);
            }
            else {
                puzzle.setInaccessible();
                messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully made ${puzzle.name} inaccessible.`);
            }
        }
    }

    return;
}
