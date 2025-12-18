import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { format as prettyFormat } from 'pretty-format';
import zlib from 'zlib';
import fs from 'fs';

/** @type {CommandConfig} */
export const config = {
    name: "dumplog_moderator",
    description: "Dump current game state to file.",
    details: "Dumps a log of the most recently used commands, as well as current internal game state. "
        + "This will generate two files. The data_commands file will contain all successfully-issued "
        + "commands that have been used recently, but keep in mind that the bot only stores up to "
        + "10,000 commands at a time. The data_game file will contain the entirety of the bot's internal "
        + "memory relating to the game, with certain data types being truncated when nested. Because these "
        + "files can be quite large, and Discord has a maximum file size limit of 10 MiB, they will be "
        + "compressed into a .gz file before being sent. If the file size exceeds this, they will "
        + "instead be saved to disk.\n\n"
        + "This command is for debugging purposes, and has no use during regular gameplay. If you discover "
        + "a bug that was not caused by Moderator error, please use this command and attach these files to "
        + "a new Issue on the [Alter Ego GitHub page](https://github.com/MolSnoo/Alter-Ego/issues).",
    usableBy: "Moderator",
    aliases: ["dumplog"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
    return `${settings.commandPrefix}dumplog`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute(game, message, command, args) {
    const dataGame = prettyFormat(game, {
        plugins: [simpleFilterPlugin, complexFilterPlugin],
        indent: 4
    });

    const dataLog = prettyFormat(game.botContext.commandLog, {
        plugins: [simpleFilterPlugin, complexFilterPlugin],
        indent: 4
    });

    let bufferGame = null
    let bufferLog = null

    try {
        bufferGame = await new Promise((resolve, reject) => {
            zlib.gzip(dataGame, (err, buffer) => {
                if (err) reject(err);
                else resolve(buffer);
            });
        });

        bufferLog = await new Promise((resolve, reject) => {
            zlib.gzip(dataLog, (err, buffer) => {
                if (err) reject(err);
                else resolve(buffer);
            });
        });
    } catch (error) {
        console.error("Compression error:", error);
        return messageHandler.addReply(game, message, "An error occurred while compressing the data.");
    }

    if (bufferGame.byteLength > 10 * 1024 * 1024 || bufferLog.byteLength > 10 * 1024 * 1024) {
        const fileGame = "./data_game.txt.gz";
        const fileLog = "./data_commands.log.gz";
        fs.writeFile(fileGame, bufferGame, function (err) {
            if (err) {
                console.log(err);
                return messageHandler.addReply(game, message, "The compressed data exceeds Discord's file size limit. Failed to write to `./data_game.txt.gz`, see console for details!");
            }
        });
        fs.writeFile(fileLog, bufferLog, function (err) {
            if (err) {
                console.log(err);
                return messageHandler.addReply(game, message, "The compressed data exceeds Discord's file size limit. Failed to write to `./data_commands.log.gz`, see console for details!");
            }
        });

        return messageHandler.addReply(game, message, "The compressed data exceeds Discord's file size limit. Saved to disk at `./data_game.txt.gz` and `./data_commands.log.gz`.")
    } else {
        const fileGame = { attachment: bufferGame, name: "data_game.txt.gz" };
        const fileLog = { attachment: bufferLog, name: "data_commands.log.gz" };

        game.guildContext.commandChannel.send({ content: "Successfully generated log files.", files: [fileGame, fileLog] });
    }
};

const simpleFilter = new Set([
    'Guild', 'GuildMember', 'TextChannel', 'Duration', 'Timeout',
    'Timer', 'Status', 'Gesture'
]);

const complexFilter = new Set([
    'Player', 'Room'
]);

const complexProcessing = new Set()

const simpleFilterPlugin = { // TODO: type hint!
    test: (val) => {
        if (val === null || typeof val !== 'object') return false;
        return simpleFilter.has(val.constructor?.name);
    },

    print: (val) => {
        const constructorName = val.constructor?.name;

        switch (constructorName) {
            case 'Guild':
                return `<Guild "${val.name || 'unknown'}">`;
            case 'GuildMember':
                return `<GuildMember "${val.displayName || 'unknown'}">`;
            case 'TextChannel':
                return `<TextChannel "${val.name || 'unknown'}">`;
            case 'Duration':
                return `<Duration ${val.humanize?.() || 'unknown'}>`;
            case 'Timeout':
                return `<Timeout ${val._idleTimeout}ms>`;
            case 'Timer':
                return `<Timer ${val.timerDuration}ms>`;
            case 'Status':
                return `<Status "${val.name}" lasting ${val.duration?.humanize?.() || 'unknown'}>`;
            case 'Gesture':
                return `<Gesture "${val.name}">`;
            default:
                return `<${constructorName || 'Unknown'}>`;
        }
    }
};

const complexFilterPlugin = { // TODO: type hint!
    test: (val) => {
        if (val === null || typeof val !== 'object') return false;
        if (complexProcessing.has(val)) return false;
        return complexFilter.has(val.constructor?.name);
    },

    serialize: (val, config, indentation, depth, refs, printer) => {
        const constructorName = val.constructor?.name;

        switch (constructorName) {
            case 'Player':
                if (depth > 2) {
                    return `<Player ${val.name}>`;
                } else {
                    complexProcessing.add(val);
                    const serialized = printer(val, config, indentation, depth, refs);
                    complexProcessing.delete(val);
                    return serialized;
                }
            case 'Room':
                if (depth > 2) {
                    const occupants = val.occupants.length
                        ? ` occupied by ${val.occupants.map(player => player.name).join(', ')}`
                        : '';
                    return `<Room ${val.name}${occupants}>`;
                } else {
                    complexProcessing.add(val);
                    const serialized = printer(val, config, indentation, depth, refs);
                    complexProcessing.delete(val);
                    return serialized;
                }
            default:
                return `<${constructorName || 'Unknown'}>`;
        }
    }
}