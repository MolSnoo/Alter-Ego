const settings = include('settings.json');

module.exports.config = {
    name: "hide_moderator",
    description: "Hides a player in the given object.",
    details: "Forcefully hides a player in the specified object. To force them out of hiding, use the unhide command.",
    usage: `${settings.commandPrefix}hide nero beds\n`
        + `${settings.commandPrefix}hide cleo bleachers\n`
        + `${settings.commandPrefix}unhide scarlet`,
    usableBy: "Moderator",
    aliases: ["hide", "unhide"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `you need to specify a player. Usage:\n${exports.config.usage}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return game.messageHandler.addReply(message, `player "${args[0]}" not found.`);

    if (player.statusString.includes("hidden") && command === "unhide")
        player.cure(game, "hidden", true, false, true);
    else if (player.statusString.includes("hidden"))
        return game.messageHandler.addReply(message, `${player.name} is already **hidden**. If you want ${player.originalPronouns.obj} to stop hiding, use "${settings.commandPrefix}unhide ${player.name}".`);
    else if (command === "unhide")
        return game.messageHandler.addReply(message, `${player.name} is not currently hidden.`);
    // Player is currently not hidden and the hide command is being used.
    else {
        if (args.length === 0)
            return game.messageHandler.addReply(message, `you need to specify an object. Usage:\n${exports.config.usage}`);

        var input = args.join(" ");
        var parsedInput = input.toUpperCase().replace(/\'/g, "");

        // Check if the input is an object that the player can hide in.
        const objects = game.objects.filter(object => object.location.name === player.location.name && object.accessible);
        var object = null;
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].name === parsedInput && objects[i].isHidingSpot) {
                object = objects[i];
                break;
            }
            else if (objects[i].name === parsedInput)
                return game.messageHandler.addReply(message, `${objects[i].name} is not a hiding spot.`);
        }
        if (object === null) return game.messageHandler.addReply(message, `couldn't find object "${input}".`);

        // Check to see if the hiding spot is already taken.
        var hiddenPlayer = null;
        for (let i = 0; i < player.location.occupants.length; i++) {
            if (player.location.occupants[i].hidingSpot === object.name) {
                hiddenPlayer = player.location.occupants[i];
                break;
            }
        }

        // It is already taken.
        if (hiddenPlayer !== null) {
            player.notify(game, `You attempt to hide in the ${object.name}, but you find ${hiddenPlayer.displayName} is already there!`);
            hiddenPlayer.cure(game, "hidden", false, false, true);
            hiddenPlayer.notify(game, `You've been found by ${player.displayName}. You are no longer hidden.`);
        }
        // It's free real estate!
        else {
            player.hidingSpot = object.name;
            player.inflict(game, "hidden", true, false, true);

            // Log message is sent when status is inflicted.
        }
    }

    return;
};
