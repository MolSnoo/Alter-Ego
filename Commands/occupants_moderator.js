const settings = require('../Configs/settings.json');

var moment = require('moment');

module.exports.config = {
    name: "occupants_moderator",
    description: "Lists all occupants in a room.",
    details: "Lists all occupants currently in the given room. If an occupant is in the process of moving, "
        + "their move queue will be included, along with the time remaining until they reach the next room in their queue. "
        + "Note that the displayed time remaining will not be adjusted according to the heatedSlowdownRate setting. "
        + "If a player in the game has the heated status effect, movement times for all players will be displayed as shorter than they actually are. "
        + "Occupants with the `hidden` behavior attributes will also be listed alongside their hiding spots.",
    usage: `${settings.commandPrefix}occupants floor-b1-hall-1\n`
        + `${settings.commandPrefix}o ultimate conference hall`,
    usableBy: "Moderator",
    aliases: ["occupants", "o"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify a room. Usage:\n${exports.config.usage}`);

    var input = args.join(" ");
    var parsedInput = input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
    var room = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (game.rooms[i].name === parsedInput) {
            room = game.rooms[i];
            break;
        }
    }
    if (room === null) return game.messageHandler.addReply(message, `Couldn't find room "${input}".`);

    // Generate a string of all occupants in the room.
    const occupants = sort_occupantsString(room.occupants);
    var occupantsList = [];
    for (let i = 0; i < occupants.length; i++)
        occupantsList.push(occupants[i].name);
    // Generate a string of all hidden occupants in the room.
    const hidden = sort_occupantsString(room.occupants.filter(occupant => occupant.hasAttribute("hidden")));
    var hiddenList = [];
    for (let i = 0; i < hidden.length; i++)
        hiddenList.push(`${hidden[i].name} (${hidden[i].hidingSpot})`);
    // Generate a string of all moving occupants in the room.
    const moving = sort_occupantsString(room.occupants.filter(occupant => occupant.isMoving));
    var movingList = [];
    for (let i = 0; i < moving.length; i++) {
        const remaining = new moment.duration(moving[i].remainingTime);

        const days = Math.floor(remaining.asDays());
        const hours = remaining.hours();
        const minutes = remaining.minutes();
        const seconds = remaining.seconds();

        let displayString = "";
        if (days !== 0) displayString += `${days} `;
        if (hours >= 0 && hours < 10) displayString += '0';
        displayString += `${hours}:`;
        if (minutes >= 0 && minutes < 10) displayString += '0';
        displayString += `${minutes}:`;
        if (seconds >= 0 && seconds < 10) displayString += '0';
        displayString += `${seconds}`;

        const moveQueue = moving[i].moveQueue.join(">");
        movingList.push(`${moving[i].name} (${displayString}) [>${moveQueue}]`);
    }

    var occupantsMessage = "";
    if (occupantsList.length === 0) occupantsMessage = `There is no one in ${room.name}.`;
    else occupantsMessage += `__All occupants in ${room.name}:__\n` + occupantsList.join(" ");
    if (hiddenList.length > 0) occupantsMessage += `\n\n__Hidden occupants:__\n` + hiddenList.join("\n");
    if (movingList.length > 0) occupantsMessage += `\n\n__Moving occupants:__\n` + movingList.join("\n");
    game.messageHandler.addGameMechanicMessage(message.channel, occupantsMessage);

    return;
};

function sort_occupantsString(list) {
    list.sort(function (a, b) {
        var nameA = a.name.toLowerCase();
        var nameB = b.name.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });
    return list;
}