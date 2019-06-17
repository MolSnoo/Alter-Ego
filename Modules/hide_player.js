const settings = require("../settings.json");

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
    if (status.length > 0) return message.reply(`You cannot do that because you are **${status[0].name}**.`);

    if (player.statusString.includes("hidden") && command === "unhide")
        player.cure(game, "hidden", true, false, true, true);
    else if (player.statusString.includes("hidden"))
        return message.reply(`you are already **hidden**. If you wish to stop hiding, use "${settings.commandPrefix}unhide".`);
    else if (command === "unhide")
        return message.reply("you are not currently hidden.");
    // Player is currently not hidden and is using the hide command.
    else {
        if (args.length === 0) {
            message.reply("you need to specify an object. Usage:");
            message.channel.send(exports.config.usage);
            return;
        }

        var input = args.join(" ");
        var parsedInput = input.toUpperCase().replace(/\'/g, "");

        // Check if the input is an object that the player can hide in.
        const objects = game.objects.filter(object => object.location === player.location.name && object.accessible);
        var object = null;
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].name === parsedInput && objects[i].isHidingSpot) {
                object = objects[i];
                break;
            }
            else if (objects[i].name === parsedInput)
                return message.reply(`${objects[i].name} is not a hiding spot.`);
        }
        if (object === null) return message.reply(`couldn't find object "${input}".`);

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
            player.member.send(`You attempt to hide in the ${object.name}, but you find ${hiddenPlayer.displayName} is already there!`);
            hiddenPlayer.cure(game, "hidden", false, false, true, true);
            hiddenPlayer.member.send(`You've been found by ${player.displayName}. You are no longer hidden.`);
        }
        // It's free real estate!
        else {
            player.hidingSpot = object.name;
            player.inflict(game, "hidden", true, true, true);

            // Log message is sent when status is inflicted.
        }
    }

    return;
};
