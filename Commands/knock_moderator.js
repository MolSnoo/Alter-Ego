const settings = include('Configs/settings.json');
const constants = include('Configs/constants.json');

const Narration = include(`${constants.dataDir}/Narration.js`);

module.exports.config = {
    name: "knock_moderator",
    description: "Knocks on a door for a player.",
    details: "Knocks on a door for the given player",
    usage: `${settings.commandPrefix}knock kanda door 1`,
    usableBy: "Moderator",
    aliases: ["knock"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2)
        return game.messageHandler.addReply(message, `You need to specify a player and an exit. Usage:\n${exports.config.usage}`);

    let player = game.players_alive_by_name.get(args[0]);
    if (player === undefined) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Check that the input given is an exit in the player's current room.
    var exit = null;
    for (let i = 0; i < player.location.exit.length; i++) {
        if (player.location.exit[i].name === parsedInput) {
            exit = player.location.exit[i];
        }
    }
    if (exit === null) return game.messageHandler.addReply(message, `Couldn't find exit "${parsedInput}" in the room.`);

    var roomNarration = player.displayName + " knocks on ";
    if (exit.name === "DOOR") roomNarration += "the DOOR";
    else if (exit.name.includes("DOOR")) roomNarration += exit.name;
    else roomNarration += "the door to " + exit.name;
    roomNarration += '.';

    // Narrate the player knocking in their current room.
    new Narration(game, player, player.location, roomNarration).send();

    var room = exit.dest;
    if (room.name === player.location.name) return;

    var hearingPlayers = [];
    // Get a list of all the hearing players in the destination room.
    for (let i = 0; i < room.occupants.length; i++) {
        if (!room.occupants[i].hasAttribute("no hearing"))
            hearingPlayers.push(room.occupants[i]);
    }

    var destNarration = "There is a knock on ";
    if (exit.link === "DOOR") destNarration += "the DOOR";
    else if (exit.link.includes("DOOR")) destNarration += exit.link;
    else destNarration += "the door to " + exit.link;
    destNarration += '.';

    // If the number of hearing players is the same as the number of occupants in the room, send the message to the room.
    if (hearingPlayers.length === room.occupants.length && hearingPlayers.length !== 0)
        new Narration(game, player, room, destNarration).send();
    else {
        for (let i = 0; i < hearingPlayers.length; i++)
            hearingPlayers[i].notify(game, destNarration);
    }
    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully knocked on ${exit.name} for ${player.name}.`);

    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly knocked on ${exit.name} in ${player.location.channel}`);

    return;
};
