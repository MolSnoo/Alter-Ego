const settings = include('settings.json');

const Narration = include(`${settings.dataDir}/Narration.js`);

module.exports.config = {
    name: "object_moderator",
    description: "Activates or deactivates an object.",
    details: 'Activates or deactivates an object. You may specify a player to activate/deactivate the object. If you do, '
        + 'players in the room will be notified, so you should generally give a string for the bot to use, '
        + 'otherwise the bot will say "[player] turns on/off the [object]." which may not sound right. '
        + "If you specify a player, only objects in the room that player is in can be activated/deactivated. "
        + 'You can also use a room name instead of a player name. In that case, only objects in the room '
        + 'you specify can be activated/deactivated. This is useful if you have multiple objects with the same name '
        + 'spread across the map. This command can only be used for objects with a recipe tag. If there is a puzzle with '
        + 'the same name as the object whose state is supposed to be the same as the object, use the puzzle command to update it as well.',
    usage: `${settings.commandPrefix}object activate blender\n`
        + `${settings.commandPrefix}object deactivate microwave\n`
        + `${settings.commandPrefix}activate keurig kyra\n`
        + `${settings.commandPrefix}deactivate oven noko\n`
        + `${settings.commandPrefix}object activate fireplace log cabin\n`
        + `${settings.commandPrefix}object deactivate fountain flower garden\n`
        + `${settings.commandPrefix}activate freezer zoran "Zoran plugs in the FREEZER."\n`
        + `${settings.commandPrefix}deactivate washer 1 laundry room "WASHER 1 turns off"`,
    usableBy: "Moderator",
    aliases: ["object", "activate", "deactivate"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    var input = command + " " + args.join(" ");
    if (command === "object") {
        if (args[0] === "activate") command = "activate";
        else if (args[0] === "deactivate") command = "deactivate";
        input = input.substring(input.indexOf(args[1]));
        args = input.split(" ");
    }
    else input = args.join(" ");

    if (command !== "activate" && command !== "deactivate") return game.messageHandler.addReply(message, 'invalid command given. Use "activate" or "deactivate".');
    if (args.length === 0)
        return game.messageHandler.addReply(message, `you need to input all required arguments. Usage:\n${exports.config.usage}`);

    // The message, if it exists, is the easiest to find at the beginning. Look for that first.
    var announcement = "";
    var index = input.indexOf('"');
    if (index === -1) index = input.indexOf('“');
    if (index !== -1) {
        announcement = input.substring(index + 1);
        // Remove the announcement from the list of arguments.
        input = input.substring(0, index - 1);
        args = input.split(" ");
        // Now clean up the announcement text.
        if (announcement.endsWith('"') || announcement.endsWith('”'))
            announcement = announcement.substring(0, announcement.length - 1);
        if (!announcement.endsWith('.') && !announcement.endsWith('!'))
            announcement += '.';
    }

    // Find the prospective list of objects.
    var objects = game.objects.filter(object => input.toUpperCase().startsWith(object.name + ' ') || input.toUpperCase() === object.name);
    if (objects.length > 0) {
        input = input.substring(objects[0].name.length).trim();
        args = input.split(" ");
    }

    // Now find the player, who should be the last argument.
    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[args.length - 1].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(args.length - 1, 1);
            input = args.join(" ");
            break;
        }
    }

    // If a player wasn't specified, check if a room name was.
    var room = null;
    if (player === null) {
        const parsedInput = input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
        for (let i = 0; i < game.rooms.length; i++) {
            if (parsedInput.endsWith(game.rooms[i].name)) {
                room = game.rooms[i];
                input = input.substring(0, parsedInput.indexOf(room.name) - 1);
                break;
            }
        }
    }

    // Finally, find the object.
    var object = null;
    for (let i = 0; i < objects.length; i++) {
        if ((player !== null && objects[i].location.name === player.location.name)
            || (room !== null && objects[i].location.name === room.name)) {
            object = objects[i];
            break;
        }
    }
    if (object === null && player === null && room === null && objects.length > 0) object = objects[0];
    else if (object === null) return game.messageHandler.addReply(message, `couldn't find object "${input}".`);
    if (object.recipeTag === "") return game.messageHandler.addReply(message, `${object.name} cannot be ${command}d because it has no recipe tag.`);

    var narrate = false;
    if (announcement === "" && player !== null) narrate = true;
    else if (announcement !== "") new Narration(game, player, game.rooms.find(room => room.name === object.location.name), announcement).send();

    const time = new Date().toLocaleTimeString();
    if (command === "activate") {
        object.activate(game, player, narrate);
        game.messageHandler.addGameMechanicMessage(message.channel, `Successfully activated ${object.name}.`);
        // Post log message.
        if (player) game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcefully activated ${object.name} in ${player.location.channel}`);
    }
    else if (command === "deactivate") {
        object.deactivate(game, player, narrate);
        game.messageHandler.addGameMechanicMessage(message.channel, `Successfully deactivated ${object.name}.`);
        // Post log message.
        if (player) game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcefully deactivated ${object.name} in ${player.location.channel}`);
    }

    return;
};
