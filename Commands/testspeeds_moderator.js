import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';
import fs from 'fs';
import { EOL } from 'os';

import Player from '../Data/Player.js';

/** @type {CommandConfig} */
export const config = {
    name: "testspeeds_moderator",
    description: "Checks the move times between each exit.",
    details: 'Tests the amount of time it takes to move between every exit in the game. '
        + 'Sends the results as a text file to the command channel. '
        + 'An argument must be provided. If the "players" argument is given, then the move times will be calculated for each player in the game. '
        + 'Note that the weight of any items the players are carrying will affect their calculated speed. '
        + 'If the "stats" argument is given, then the move times will be calculated for hypothetical players with speed from 1-10.',
    usableBy: "Moderator",
    aliases: ["testspeeds"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}testspeeds players\n`
        + `${settings.commandPrefix}testspeeds stats`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify what to test. Usage:\n${usage(game.settings)}`);

    const fileName = "./speeds.txt";
    fs.writeFile(fileName, "", function (err) {
        if (err) return console.log(err);
    });

    if (args[0] === "players")
        await testplayers(game, fileName);
    else if (args[0] === "stats")
        await testspeeds(game, fileName);
    else return messageHandler.addReply(game, message, 'Function not found. You need to use "players" or "stats".');

    game.guildContext.commandChannel.send({
        content: "Speeds calculated.",
        files: [
            {
                attachment: fileName,
                name: `speeds-${args[0]}.txt`
            }
        ]
    });

    return;
}

/**
 * Calculates the time it takes for each player in the game to move from every exit in a room to every other exit and appends it to the file.
 * @param {Game} game - The game being tested. 
 * @param {string} fileName - The name of the file to write the results to.
 */
async function testplayers (game, fileName) {
    var text = "";
    for (let i = 0; i < game.rooms.length; i++) {
        const room = game.rooms[i];
        text += game.rooms[i].name + '\n';
        for (let j = 0; j < room.exit.length; j++) {
            const exit1 = room.exit[j];
            for (let k = 0; k < room.exit.length; k++) {
                const exit2 = room.exit[k];
                if (exit1.row !== exit2.row) {
                    text += "   ";
                    text += `${exit1.name} ==> ${exit2.name}\n`;
                    for (let l = 0; l < game.players.length; l++) {
                        let player = game.players[l];
                        // Save the original coordinates.
                        const x = player.pos.x;
                        const y = player.pos.y;
                        const z = player.pos.z;
                        player.pos.x = exit1.pos.x;
                        player.pos.y = exit1.pos.y;
                        player.pos.z = exit1.pos.z;

                        text += "      ";
                        text += `${player.name}: `;
                        const walkTime = Math.round(player.calculateMoveTime(exit2, false) / 1000);
                        text += `${walkTime} seconds walking, `;
                        const runTime = Math.round(player.calculateMoveTime(exit2, true) / 1000);
                        text += `${runTime} seconds running\n`;

                        player.pos.x = x;
                        player.pos.y = y;
                        player.pos.z = z;
                    }
                }
            }
        }
    }
    await appendText(fileName, text);

    return;
}

/**
 * Calculates the time it takes for a hypothetical player of every possible speed stat value to move from every exit in a room to every other exit and appends it to the file.
 * @param {Game} game - The game being tested. 
 * @param {string} fileName - The name of the file to write the results to.
 */
async function testspeeds (game, fileName) {
    var text = "";
    for (let i = 0; i < game.rooms.length; i++) {
        const room = game.rooms[i];
        text += game.rooms[i].name + '\n';
        for (let j = 0; j < room.exit.length; j++) {
            const exit1 = room.exit[j];
            for (let k = 0; k < room.exit.length; k++) {
                const exit2 = room.exit[k];
                if (exit1.row !== exit2.row) {
                    text += "   ";
                    text += `${exit1.name} ==> ${exit2.name}\n`;
                    for (let l = 1; l <= 10; l++) {
                        let player = new Player("", null, "", "", "neutral", "an average voice",{ speed: l, stamina: 5, strength: 5, intelligence: 5, dexterity: 5 }, true, room.id, "", [], "", [], null, 1, game);
                        player.pos.x = exit1.pos.x;
                        player.pos.y = exit1.pos.y;
                        player.pos.z = exit1.pos.z;

                        text += "      ";
                        text += `Speed ${l}: `;
                        const walkTime = Math.round(player.calculateMoveTime(exit2, false) / 1000);
                        text += `${walkTime} seconds walking, `;
                        const runTime = Math.round(player.calculateMoveTime(exit2, true) / 1000);
                        text += `${runTime} seconds running\n`;
                    }
                }
            }
        }
    }
    await appendText(fileName, text);

    return;
}

/**
 * Appends text to the file.
 * @param {string} fileName - The name of the file to append.
 * @param {string} text - The text to add to the end of the file.
 * @returns {Promise<string>} The name of the file.
 */
function appendText(fileName, text) {
    return new Promise((resolve) => {
        fs.appendFile(fileName, text + EOL, function (err) {
            if (err) return console.log(err);
            resolve(fileName);
        });
    });
}
