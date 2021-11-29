const settings = include('settings.json');

module.exports.config = {
    name: "hide_player",
    description: "Hides you in an object.",
    details: `Allows you to use an object in a room as a hiding spot. When hidden, you will be removed from that room's channel `
        + `so that when other players enter the room, they won't see you on the user list. `
        + `When players speak in the room that you're hiding in, you will hear what they say. `
        + `If someone inspects or tries to hide in the object you're hiding in, you will be revealed and added back to the room channel. `
        + `If you wish to come out of hiding on your own, use the unhide command.`,
    usage: `${settings.commandPrefix}hide desk\n`
        + `${settings.commandPrefix}hide cabinet\n`
        + `${settings.commandPrefix}unhide`,
    usableBy: "Player",
    aliases: ["hide", "unhide"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    const status = player.getAttributeStatusEffects("disable hide");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    if (player.statusString.includes("hidden") && command === "unhide") {
        let object = null;
        for (let i = 0; i < game.objects.length; i++) {
            if (game.objects[i].location.name === player.location.name && game.objects[i].name === player.hidingSpot) {
                object = game.objects[i];
                break;
            }
        }
        if (object !== null && (!object.accessible || object.childPuzzle !== null && object.childPuzzle.type.endsWith("lock") && !object.childPuzzle.solved))
            return game.messageHandler.addReply(message, `You cannot come out of hiding right now.`);
        else player.cure(game, "hidden", true, false, true);
    }
    else if (player.statusString.includes("hidden"))
        return game.messageHandler.addReply(message, `You are already **hidden**. If you wish to stop hiding, use "${settings.commandPrefix}unhide".`);
    else if (command === "unhide")
        return game.messageHandler.addReply(message, "You are not currently hidden.");
    // Player is currently not hidden and is using the hide command.
    else {
        if (args.length === 0)
            return game.messageHandler.addReply(message, `You need to specify an object. Usage:\n${exports.config.usage}`);

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
        if (object === null) return game.messageHandler.addReply(message, `Couldn't find object "${input}".`);

        // Make sure the object isn't locked.
        if (object.childPuzzle !== null && object.childPuzzle.type.endsWith("lock") && !object.childPuzzle.solved)
            return game.messageHandler.addReply(message, `You cannot hide in ${object.name} right now.`);

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
