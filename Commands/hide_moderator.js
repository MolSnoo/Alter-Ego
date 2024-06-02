const settings = include('Configs/settings.json');
const constants = include('Configs/constants.json');

const Whisper = include(`${constants.dataDir}/Whisper.js`);

module.exports.config = {
    name: "hide_moderator",
    description: "Hides a player in the given object.",
    details: `Forcibly hides a player in the specified object. They will be able to hide in the specified object `
        + `even if it is attached to a lock-type puzzle that is unsolved, and even if the hiding spot is beyond its `
        + `capacity. To force them out of hiding, use the unhide command.`,
    usage: `${settings.commandPrefix}hide nero beds\n`
        + `${settings.commandPrefix}hide cleo bleachers\n`
        + `${settings.commandPrefix}unhide scarlet`,
    usableBy: "Moderator",
    aliases: ["hide", "unhide"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify a player. Usage:\n${exports.config.usage}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    if (player.statusString.includes("hidden") && command === "unhide") {
        player.cure(game, "hidden", true, false, true);
        game.messageHandler.addGameMechanicMessage(message.channel, `Successfully brought ${player.name} out of hiding.`);
    }
    else if (player.statusString.includes("hidden"))
        return game.messageHandler.addReply(message, `${player.name} is already **hidden**. If you want ${player.originalPronouns.obj} to stop hiding, use "${settings.commandPrefix}unhide ${player.name}".`);
    else if (command === "unhide")
        return game.messageHandler.addReply(message, `${player.name} is not currently hidden.`);
    // Player is currently not hidden and the hide command is being used.
    else {
        if (args.length === 0)
            return game.messageHandler.addReply(message, `You need to specify an object. Usage:\n${exports.config.usage}`);

        var input = args.join(" ");
        var parsedInput = input.toUpperCase().replace(/\'/g, "");

        // Check if the input is an object that the player can hide in.
        const objects = game.objects.filter(object => object.location.name === player.location.name && object.accessible);
        var object = null;
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].name === parsedInput && objects[i].hidingSpotCapacity > 0) {
                object = objects[i];
                break;
            }
            else if (objects[i].name === parsedInput)
                return game.messageHandler.addReply(message, `${objects[i].name} is not a hiding spot.`);
        }
        if (object === null) return game.messageHandler.addReply(message, `Couldn't find object "${input}".`);

        // Check to see if the hiding spot is already taken.
        var hiddenPlayers = [];
        for (let i = 0; i < player.location.occupants.length; i++) {
            if (player.location.occupants[i].hidingSpot === object.name)
                hiddenPlayers.push(player.location.occupants[i]);
        }

        // Create a list string of players currently hiding in that hiding spot.
        hiddenPlayers.sort(function (a, b) {
            let nameA = a.displayName.toLowerCase();
            let nameB = b.displayName.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
        if (player.hasAttribute("no sight")) {
            if (hiddenPlayers.length === 1)
                player.notify(game, `When you hide in the ${object.name}, you find someone already there!`);
            else if (hiddenPlayers.length > 1)
                player.notify(game, `When you hide in the ${object.name}, you find multiple people already there!`);
        }
        else {
            let hiddenPlayersString = "";
            if (hiddenPlayers.length === 1) hiddenPlayersString = hiddenPlayers[0].displayName;
            else if (hiddenPlayers.length === 2)
                hiddenPlayersString += `${hiddenPlayers[0].displayName} and ${hiddenPlayers[1].displayName}`;
            else if (hiddenPlayers.length >= 3) {
                for (let i = 0; i < hiddenPlayers.length - 1; i++)
                    hiddenPlayersString += `${hiddenPlayers[i].displayName}, `;
                hiddenPlayersString += `and ${hiddenPlayers[hiddenPlayers.length - 1].displayName}`;
            }

            if (hiddenPlayers.length > 0) player.notify(game, `When you hide in the ${object.name}, you find ${hiddenPlayersString} already there!`);
        }
        for (let i = 0; i < hiddenPlayers.length; i++) {
            if (hiddenPlayers[i].hasAttribute("no sight"))
                hiddenPlayers[i].notify(game, `Someone finds you! They hide with you.`);
            else
                hiddenPlayers[i].notify(game, `You're found by ${player.displayName}! ${player.pronouns.Sbj} hide` + (player.pronouns.plural ? '' : 's') + ` with you.`);
            hiddenPlayers[i].removeFromWhispers(game, "");
        }
        hiddenPlayers.push(player);
        player.hidingSpot = object.name;
        player.inflict(game, "hidden", true, false, true);

        // Create a whisper.
        if (hiddenPlayers.length > 0) {
            var whisper = new Whisper(hiddenPlayers, player.location);
            await whisper.init(game);
            game.whispers.push(whisper);
        }

        game.messageHandler.addGameMechanicMessage(message.channel, `Successfully hid ${player.name} in the ${object.name}.`);
        // Log message is sent when status is inflicted.
    }

    return;
};
