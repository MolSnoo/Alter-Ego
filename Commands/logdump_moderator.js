const settings = include('Configs/settings.json');
const {format: prettyFormat} = require('pretty-format');
const zlib = require('zlib');

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
                return `<Status "${val.name}" lasting ${val.duration?.humanize?.() || 'unknown'}>`
            case 'Gesture':
                return `<Gesture "${val.name}">`
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

module.exports.config = {
    name: "logdump_moderator",
    description: "Dump log of last used commands, as well as current internal state.",
    details: "Dumps a log of the last used commands, as well as current internal state.\n"
        + "A time, formatted as xhym, where x is the hours and y is the minutes, must be given as the first argument."
        + "A number must be provided as the second argument to specify depth of inspection into the current internal state.\n"
        + "Depth is a trade-off between detail and size. Remember that the Discord file upload limit is 10 MB.",
    usage: `${settings.commandPrefix}logdump 2h40m 4\n`
        + `${settings.commandPrefix}logdump 1h0m 6\n`
        + `${settings.commandPrefix}logdump 24h0m 1`,
    usableBy: "Moderator",
    aliases: ["logdump"]
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length !== 2 || Number.isNaN(parseInt(args[1]))) {
        return game.messageHandler.addReply(message, `You need to specify time and a depth. Usage:\n${exports.config.usage}`);
    }

    const regex = /^(?:(\d+)h)?(?:(\d+)m)?$/;
    const matches = args[0].match(regex);

    if (!matches || (matches[1] === undefined && matches[2] === undefined)) {
        return game.messageHandler.addReply(message, `Invalid time format. Use format like "2h30m" where at least one component is provided. Usage:\n${exports.config.usage}`);
    }

    const hours = parseInt(matches[1]);
    const minutes = parseInt(matches[2]);

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || minutes < 0) {
        return game.messageHandler.addReply(message, `Invalid time values. Hours and/or minutes must be valid, non-negative numbers. Usage:\n${exports.config.usage}`);
    }

    const offset = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
    const time = Date.now() - offset;
    const entries = bot.commandLog.filter(entry => entry.timestamp.getTime() >= time);

    const depth = parseInt(args[1]);

    const dataGame = prettyFormat(game, {
        maxDepth: depth,
        plugins: [simpleFilterPlugin, complexFilterPlugin],
        indent: 4
    });
    
    const dataLog = prettyFormat(entries, {
        maxDepth: depth,
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
            return game.messageHandler.addReply(message, "The compressed data exceeds Discord's file size limit. Try again with a smaller time window or lower depth.\n"
                + `Game Data: \`${bufferGame.byteLength}B\`\n`
                + `Log Data: \`${bufferLog.byteLength}B\``);
        }

        const fileGame = { attachment: bufferGame, name: "data_game.txt.gz" };
        const fileLog = { attachment: bufferLog, name: "data_commands.log.gz" };

        message.channel.send({ files: [fileGame, fileLog] });
    } catch (error) {
        console.error("Compression error:", error);
        return game.messageHandler.addReply(message, "An error occurred while compressing the data.");
    }
};