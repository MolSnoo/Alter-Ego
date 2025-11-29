import { getChildItems } from '../Modules/itemManager.js';

module.exports.config = {
    name: "set_bot",
    description: "Sets an object, puzzle, or set of items as accessible or inaccessible.",
    details: 'Sets an object, puzzle, or set of items as accessible or inaccessible. '
        + 'You have to specify whether to set an object or puzzle, even if you want to set a set of '
        + 'items. When you use the optional "items" argument, it will set all of the items contained '
        + 'in that object or puzzle as accessible/inaccessible at once. Individual items cannot be set. '
        + 'You can also specify a room name.  If you do, only object/items/puzzles in the room you specify '
        + 'can be set as accessible/ inaccessible. This is useful if you have multiple objects or puzzles '
        + 'with the same name spread across the map.',
    usage: `set accessible puzzle button\n`
        + `set inaccessible object terminal\n`
        + `set accessible object keypad tool shed\n`
        + `set accessible object items medicine cabinet\n`
        + `set inaccessible puzzle items lock men's locker room`,
    usableBy: "Bot",
    aliases: ["set"]
};

module.exports.run = async (bot, game, command, args, player, data) => {
    const cmdString = command + " " + args.join(" ");

    if (args.length < 2) {
        game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);
        return;
    }

    var input = args.join(" ");
    if (args[0] === "accessible") command = "accessible";
    else if (args[0] === "inaccessible") command = "inaccessible";
    else {
        game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". The first argument must be "accessible" or "inaccessible".`);
        return;
    }
    input = input.substring(input.indexOf(args[1]));
    args = input.split(" ");

    var isObject = false;
    var isPuzzle = false;
    if (args[0] === "object") isObject = true;
    else if (args[0] === "puzzle") isPuzzle = true;
    else {
        game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". The second argument must be "object" or "puzzle".`);
        return;
    }
    input = input.substring(input.indexOf(args[1]));
    args = input.split(" ");

    var doItems = false;
    if (args[0] === "items") {
        doItems = true;
        input = input.substring(input.indexOf(args[1]));
        args = input.split(" ");
    }

    // Check if a room name was specified.
    var room = null;
    const parsedInput = input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
    for (let i = 0; i < game.rooms.length; i++) {
        if (parsedInput.endsWith(game.rooms[i].name)) {
            room = game.rooms[i];
            input = input.substring(0, parsedInput.lastIndexOf(room.name) - 1);
            break;
        }
    }

    if (isObject) {
        const objects = game.objects.filter(object => object.name === input.toUpperCase().replace(/\'/g, ""));
        // Finally, find the object.
        var object = null;
        for (let i = 0; i < objects.length; i++) {
            if (room !== null && objects[i].location.name === room.name) {
                object = objects[i];
                break;
            }
        }
        if (object === null && room === null && objects.length > 0) object = objects[0];
        else if (object === null) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find object "${input}".`);
    }
    else if (isPuzzle) {
        const puzzles = game.puzzles.filter(puzzle => puzzle.name === input.toUpperCase().replace(/\'/g, ""));
        // Finally, find the puzzle.
        var puzzle = null;
        for (let i = 0; i < puzzles.length; i++) {
            if (room !== null && puzzles[i].location.name === room.name) {
                puzzle = puzzles[i];
                break;
            }
        }
        if (puzzle === null && room === null && puzzles.length > 0) puzzle = puzzles[0];
        else if (puzzle === null) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find puzzle "${input}".`);
    }

    if (command === "accessible") {
        if (isObject) {
            if (doItems) {
                // Update all of the items contained in this object.
                let items = game.items.filter(item => item.location.name === object.location.name && item.containerName === `Object: ${object.name}` && item.container !== null && item.container.name === object.name && item.quantity > 0 && !item.accessible);
                let childItems = [];
                for (let i = 0; i < items.length; i++)
                    getChildItems(childItems, items[i]);
                items = items.concat(childItems);

                for (let i = 0; i < items.length; i++)
                    items[i].setAccessible();
            }
            else object.setAccessible();
        }
        else if (isPuzzle) {
            if (doItems) {
                // Update all of the items contained in this puzzle.
                let items = game.items.filter(item => item.location.name === puzzle.location.name && item.containerName === `Puzzle: ${puzzle.name}` && item.container !== null && item.container.name === puzzle.name && item.quantity > 0 && !item.accessible);
                let childItems = [];
                for (let i = 0; i < items.length; i++)
                    getChildItems(childItems, items[i]);
                items = items.concat(childItems);

                for (let i = 0; i < items.length; i++)
                    items[i].setAccessible();
            }
            else puzzle.setAccessible();
        }
    }
    else if (command === "inaccessible") {
        if (isObject) {
            if (doItems) {
                // Update all of the items contained in this object.
                let items = game.items.filter(item => item.location.name === object.location.name && item.containerName === `Object: ${object.name}` && item.container !== null && item.container.name === object.name && item.quantity > 0 && item.accessible);
                let childItems = [];
                for (let i = 0; i < items.length; i++)
                    getChildItems(childItems, items[i]);
                items = items.concat(childItems);

                for (let i = 0; i < items.length; i++)
                    items[i].setInaccessible();
            }
            else object.setInaccessible();
        }
        else if (isPuzzle) {
            if (doItems) {
                // Update all of the items contained in this puzzle.
                let items = game.items.filter(item => item.location.name === puzzle.location.name && item.containerName === `Puzzle: ${puzzle.name}` && item.container !== null && item.container.name === puzzle.name && item.quantity > 0 && item.accessible);
                let childItems = [];
                for (let i = 0; i < items.length; i++)
                    getChildItems(childItems, items[i]);
                items = items.concat(childItems);

                for (let i = 0; i < items.length; i++)
                    items[i].setInaccessible();
            }
            else puzzle.setInaccessible();
        }
    }

    return;
};
