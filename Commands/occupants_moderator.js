import { Duration } from 'luxon';
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "occupants_moderator",
    description: "Lists all occupants in a room.",
    details: "Lists all occupants currently in the given room. If an occupant is in the process of moving, "
        + "their move queue will be included, along with the time remaining until they reach the next room in their queue. "
        + "Note that the displayed time remaining will not be adjusted according to the heatedSlowdownRate setting. "
        + "If a player in the game has the heated status effect, movement times for all players will be displayed as shorter than they actually are. "
        + "Occupants with the `hidden` behavior attributes will also be listed alongside their hiding spots.",
    usableBy: "Moderator",
    aliases: ["occupants", "o"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}occupants floor-b1-hall-1\n`
        + `${settings.commandPrefix}o ultimate conference hall`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return addReply(game, message, `You need to specify a room. Usage:\n${usage(game.settings)}`);

    const input = args.join(" ");
    const room = game.entityFinder.getRoom(input);
    if (room === undefined) return addReply(game, message, `Couldn't find room "${input}".`);

    // Generate a string of all occupants in the room.
    const occupants = room.occupants.sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0);
    const occupantsList = [];
    for (let i = 0; i < occupants.length; i++)
        occupantsList.push(occupants[i].name);
    // Generate a string of all hidden occupants in the room.
    const hidden = room.occupants.filter(occupant => occupant.hasBehaviorAttribute("hidden")).sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0);
    const hiddenList = [];
    for (let i = 0; i < hidden.length; i++)
        hiddenList.push(`${hidden[i].name} (${hidden[i].hidingSpot})`);
    // Generate a string of all moving occupants in the room.
    const moving = room.occupants.filter(occupant => occupant.isMoving).sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0);
    const movingList = [];
    for (let i = 0; i < moving.length; i++) {
        const remaining = Duration.fromMillis(moving[i].remainingTime);

        const days = Math.floor(remaining.as('days'));
        const hours = remaining.hours;
        const minutes = remaining.minutes;
        const seconds = remaining.seconds;

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

    let occupantsMessage = "";
    if (occupantsList.length === 0) occupantsMessage = `There is no one in ${room.id}.`;
    else occupantsMessage += `__All occupants in ${room.id}:__\n` + occupantsList.join(" ");
    if (hiddenList.length > 0) occupantsMessage += `\n\n__Hidden occupants:__\n` + hiddenList.join("\n");
    if (movingList.length > 0) occupantsMessage += `\n\n__Moving occupants:__\n` + movingList.join("\n");
    addGameMechanicMessage(game, game.guildContext.commandChannel, occupantsMessage);
}
