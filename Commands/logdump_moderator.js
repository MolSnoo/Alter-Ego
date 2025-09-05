const settings = include('Configs/settings.json');
const { inspect } = require('node:util');

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
    const matches = args[0].match(regex)

    const hours = parseInt(matches[1])
    const minutes = parseInt(matches[2])

    const offset = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000)

    const time = Date.now() - offset;

    const entries = bot.commandLog.filter(entry => entry.timestamp.getTime() >= time)

    const dataGame = inspect(game, {
        depth: args[1], colors: false, showHidden: false
    })
    const dataLog = inspect(entries, {
        depth: args[1], colors: false, showHidden: false
    })
    const bufferGame = Buffer.from(dataGame)
    const bufferLog = Buffer.from(dataLog)
    const fileGame = { attachment: bufferGame, name: "data_game.txt" }
    const fileLog = { attachment: bufferLog, name: "data_commands.log" }
    message.channel.send({ files: [fileGame, fileLog] });
}