const settings = include('Configs/settings.json');
const {format: prettyFormat} = require('pretty-format');
const zlib = require('zlib');
const fs = require('fs');

module.exports.config = {
    name: "logdump_moderator",
    description: "Dump current game state to file.",
    details: "Dumps a log of the last used commands, as well as current internal state.",
    usage: `${settings.commandPrefix}logdump`,
    usableBy: "Moderator",
    aliases: ["logdump"]
};

module.exports.run = async (bot, game, message, command, args) => {
    const dataGame = prettyFormat(game, {
        plugins: [simpleFilterPlugin, complexFilterPlugin],
        indent: 4
    });
    
    const dataLog = prettyFormat(bot.commandLog, {
        plugins: [simpleFilterPlugin, complexFilterPlugin],
        indent: 4
    });

    try {
        const bufferGame = await new Promise((resolve, reject) => {
            zlib.gzip(dataGame, (err, buffer) => {
                if (err) reject(err);
                else resolve(buffer);
            });
        });

        const bufferLog = await new Promise((resolve, reject) => {
            zlib.gzip(dataLog, (err, buffer) => {
                if (err) reject(err);
                else resolve(buffer);
            });
        });

        if (bufferGame.byteLength > 10 * 1024 * 1024 || bufferLog.byteLength > 10 * 1024 * 1024) {
            game.messageHandler.addReply(message, "The compressed data exceeds Discord's file size limit. Saving to disk...\n"
                + `Game Data: \`${bufferGame.byteLength}B\`\n`
                + `Log Data: \`${bufferLog.byteLength}B\``);
                
            const fileGame = "./data_game.txt.gz";
            const fileLog = "./data_commands.log.gz";
            fs.writeFile(fileGame, bufferGame, function (err) {
                if (err) {
                    console.log(err);
                    return game.messageHandler.addReply(message, "Failed to write to `./data_game.txt.gz`, see console for details!");
                }
            });
            fs.writeFile(fileLog, bufferLog, function (err) {
                if (err) {
                    console.log(err);
                    return game.messageHandler.addReply(message, "Failed to write to `./data_commands.log.gz`, see console for details!");
                }
            });

            return game.messageHandler.addReply(message, "Saved to disk at `./data_game.txt.gz` and `./data_commands.log.gz`.")
        } else {
            const fileGame = { attachment: bufferGame, name: "data_game.txt.gz" };
            const fileLog = { attachment: bufferLog, name: "data_commands.log.gz" };

            message.channel.send({ files: [fileGame, fileLog] });
        }
    } catch (error) {
        console.error("Compression error:", error);
        return game.messageHandler.addReply(message, "An error occurred while compressing the data.");
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

const simpleFilterPlugin = {
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

const complexFilterPlugin = {
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
                    let serialized = printer(val, config, indentation, depth, refs);
                    complexProcessing.delete(val);
                    return serialized;
                }
            case 'Room':
                if (depth > 2) {
                    let occupants = val.occupants.length
                        ? ` occupied by ${val.occupants.map(player => player.name).join(', ')}`
                        : '';
                    return `<Room ${val.name}${occupants}>`;
                } else {
                    complexProcessing.add(val);
                    let serialized = printer(val, config, indentation, depth, refs);
                    complexProcessing.delete(val);
                    return serialized;
                }
            default:
                return `<${constructorName || 'Unknown'}>`;
        }
    }
};