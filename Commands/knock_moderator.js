import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

import Narration from '../Data/Narration.js';

/** @type {CommandConfig} */
export const config = {
    name: "knock_moderator",
    description: "Knocks on a door for a player.",
    details: "Knocks on a door for the given player",
    usableBy: "Moderator",
    aliases: ["knock"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}knock kanda door 1`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return messageHandler.addReply(game, message, `You need to specify a player and an exit. Usage:\n${usage(game.settings)}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Check that the input given is an exit in the player's current room.
    var exit = null;
    for (let i = 0; i < player.location.exit.length; i++) {
        if (player.location.exit[i].name === parsedInput) {
            exit = player.location.exit[i];
        }
    }
    if (exit === null) return messageHandler.addReply(game, message, `Couldn't find exit "${parsedInput}" in the room.`);

    var roomNarration = player.displayName + " knocks on ";
    if (exit.name === "DOOR") roomNarration += "the DOOR";
    else if (exit.name.includes("DOOR")) roomNarration += exit.name;
    else roomNarration += "the door to " + exit.name;
    roomNarration += '.';

    // Narrate the player knocking in their current room.
    new Narration(game, player, player.location, roomNarration).send();

    var room = exit.dest;
    if (room.id === player.location.id) return;

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
            hearingPlayers[i].notify(destNarration);
    }
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully knocked on ${exit.name} for ${player.name}.`);

    // Post log message.
    const time = new Date().toLocaleTimeString();
    messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly knocked on ${exit.name} in ${player.location.channel}`);

    return;
}
