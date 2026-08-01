// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Room from '../Data/Room.ts';
import { getChildItems } from '../Modules/itemManager.ts';

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "set_moderator",
    description: "Sets a fixture, puzzle, or group of room items as accessible or inaccessible.",
    details: `Sets a fixture, puzzle, or group of room items as accessible or inaccessible. `
        + `You have to specify whether to set a fixture or puzzle, even if you want to set a group of room items. `
        + `When you use the optional "items" argument, it will set all of the items contained in that fixture or puzzle `
        + `as accessible/inaccessible at once. This will also update the accessibility of all child items contained `
        + `inside of those room items. It is not possible to set the accessibility of individual room items.\n\n`
        + `You can also specify a room display name or ID at the end of the command. If you do, only `
        + `fixtures/puzzles/room items in the room you specify can be set as accessible/inaccessible. This is useful `
        + `if you have multiple fixtures or puzzles with the same name in different locations.`,
    usableBy: "Moderator",
    aliases: ["set"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}set accessible puzzle ROCK CLIMBING WALL\n`
        + `${settings.commandPrefix}set inaccessible puzzle LOGIN Infirmary\n`
        + `${settings.commandPrefix}set accessible fixture BUNSEN BURNER\n`
        + `${settings.commandPrefix}set inaccessible fixture UNDERBRUSH path-2\n`
        + `${settings.commandPrefix}set accessible puzzle items LOCK robotics-lab\n`
        + `${settings.commandPrefix}set inaccessible puzzle items LOOSE CRATE\n`
        + `${settings.commandPrefix}set accessible fixture items DOLLHOUSE\n`
        + `${settings.commandPrefix}set inaccessible fixture items TOP OF THE SHELVES Library`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Moderator} moderator - The moderator who issued the command.
 */
export async function execute(game, message, command, args, moderator) {
    if (args.length < 2)
        return game.communicationHandler.reply(message, `You need to input all required arguments. Usage:\n${usage(game.settings)}`);

    let input = args.join(" ");
    if (args[0] === "accessible") command = "accessible";
    else if (args[0] === "inaccessible") command = "inaccessible";
    else {
        game.communicationHandler.reply(message, 'The first argument must be "accessible" or "inaccessible". Usage:');
        game.communicationHandler.sendToCommandChannel(usage(game.settings));
        return;
    }
    input = input.substring(input.indexOf(args[1]));
    args = input.split(" ");

    let isFixture = false;
    let isPuzzle = false;
    if (args[0] === "fixture" || args[0] === "object") isFixture = true;
    else if (args[0] === "puzzle") isPuzzle = true;
    else {
        game.communicationHandler.reply(message, 'The second argument must be "fixture" or "puzzle". Usage:');
        game.communicationHandler.sendToCommandChannel(usage(game.settings));
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
    /** @type {Room} */
    let room = null;
    for (let i = args.length - 1; i >= 0; i--) {
        const parsedInput = Room.generateValidId(args.slice(i).join(" "));
        room = game.entityFinder.getRoom(parsedInput);
        if (room) {
            args.splice(i);
            break;
        }
    }
    if (!room) room = null;
    input = args.join(" ");

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
        else if (fixture === null) return game.communicationHandler.reply(message, `Couldn't find fixture "${input}".`);
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
        else if (puzzle === null) return game.communicationHandler.reply(message, `Couldn't find puzzle "${input}".`);
    }

    if (command === "accessible") {
        if (isFixture) {
            if (doItems) {
                // Update all of the items contained in this fixture.
                let items = game.entityFinder.getRoomItems(null, fixture.location.id, null, `Fixture`, fixture.name);
                /** @type import('../Data/RoomItem.ts').default[] */
                const childItems = [];
                for (let i = 0; i < items.length; i++)
                    getChildItems(childItems, items[i]);
                items = items.concat(childItems);

                for (let i = 0; i < items.length; i++)
                    items[i].setAccessible();
                game.communicationHandler.sendToCommandChannel(`Successfully made ${items.length} items in ${fixture.name} accessible.`);
            }
            else {
                fixture.setAccessible();
                game.communicationHandler.sendToCommandChannel(`Successfully made ${fixture.name} accessible.`);
            }
        }
        else if (isPuzzle) {
            if (doItems) {
                // Update all of the items contained in this puzzle.
                let items = game.entityFinder.getRoomItems(null, puzzle.location.id, null, `Puzzle`, puzzle.name);
                /** @type import('../Data/RoomItem.ts').default[] */
                const childItems = [];
                for (let i = 0; i < items.length; i++)
                    getChildItems(childItems, items[i]);
                items = items.concat(childItems);

                for (let i = 0; i < items.length; i++)
                    items[i].setAccessible();
                game.communicationHandler.sendToCommandChannel(`Successfully made ${items.length} items in ${puzzle.name} accessible.`);
            }
            else {
                puzzle.setAccessible();
                game.communicationHandler.sendToCommandChannel(`Successfully made ${puzzle.name} accessible.`);
            }
        }
    }
    else if (command === "inaccessible") {
        if (isFixture) {
            if (doItems) {
                // Update all of the items contained in this fixture.
                let items = game.entityFinder.getRoomItems(null, fixture.location.id, null, `Fixture`, fixture.name);
                /** @type import('../Data/RoomItem.ts').default[] */
                const childItems = [];
                for (let i = 0; i < items.length; i++)
                    getChildItems(childItems, items[i]);
                items = items.concat(childItems);

                for (let i = 0; i < items.length; i++)
                    items[i].setInaccessible();
                game.communicationHandler.sendToCommandChannel(`Successfully made ${items.length} items in ${fixture.name} inaccessible.`);
            }
            else {
                fixture.setInaccessible();
                game.communicationHandler.sendToCommandChannel(`Successfully made ${fixture.name} inaccessible.`);
            }
        }
        else if (isPuzzle) {
            if (doItems) {
                // Update all of the items contained in this puzzle.
                let items = game.entityFinder.getRoomItems(null, puzzle.location.id, null, `Puzzle`, puzzle.name);
                /** @type import('../Data/RoomItem.ts').default[] */
                const childItems = [];
                for (let i = 0; i < items.length; i++)
                    getChildItems(childItems, items[i]);
                items = items.concat(childItems);

                for (let i = 0; i < items.length; i++)
                    items[i].setInaccessible();
                game.communicationHandler.sendToCommandChannel(`Successfully made ${items.length} items in ${puzzle.name} inaccessible.`);
            }
            else {
                puzzle.setInaccessible();
                game.communicationHandler.sendToCommandChannel(`Successfully made ${puzzle.name} inaccessible.`);
            }
        }
    }
}
