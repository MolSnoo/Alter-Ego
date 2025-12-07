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
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(message, `You need to specify what to test. Usage:\n${usage(game.settings)}`);

    const file = "./speeds.txt";
    fs.writeFile(file, "", function (err) {
        if (err) return console.log(err);
    });

    if (args[0] === "players")
        await testplayers(game, file);
    else if (args[0] === "stats")
        await testspeeds(game, file);
    else return messageHandler.addReply(message, 'Function not found. You need to use "players" or "stats".');

    message.channel.send({
        content: "Speeds calculated.",
        files: [
            {
                attachment: file,
                name: `speeds-${args[0]}.txt`
            }
        ]
    });

    return;
}

async function testplayers (game, file) {
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
    await appendText(file, text);

    return;
}

async function testspeeds (game, file) {
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
                        let player = new Player("", null, "", "", "", "neutral", "an average voice",{ speed: l }, true, room, null, [], "", [], null, 1);
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
    await appendText(file, text);

    return;
}

function appendText(file, text) {
    return new Promise((resolve) => {
        fs.appendFile(file, text + EOL, function (err) {
            if (err) return console.log(err);
            resolve(file);
        });
    });
}
