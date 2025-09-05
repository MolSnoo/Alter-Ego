const settings = include('Configs/settings.json');
const { inspect } = require('node:util');

module.exports.config = {
    name: "logdump_moderator",
    description: "Dump log of last used commands, as well as current internal state.",
    details: "Dumps a log of the last used commands, as well as current internal state.\n"
        + "A number may be provided as an argument to specify depth of inspection into the current internal state.\n"
        + "Depth is a trade-off between detail and size. Remember that the Discord file upload limit is 10 MB.",
    usage: `${settings.commandPrefix}logdump\n`
        + `${settings.commandPrefix}logdump 4`,
    usableBy: "Moderator",
    aliases: ["logdump"]
};

module.exports.run = async (bot, game, message, command, args) => {
    // TODO: bot command logging, log granularity arguments, etc.. a depth of 4 seems safe, so it should be the second argument, with the first argument being time..
    var dataGame = null;
    if (args.length >= 1) { // TODO: check that args[0] is actually a number
        dataGame = inspect(game, {
            depth: args[0], colors: false, showHidden: false,
        })
    }
    else {
        dataGame = inspect(game, {
            depth: 4, colors: false, showHidden: false,
        })
    }
    const bufferGame = Buffer.from(dataGame)
    const fileGame = { attachment: bufferGame, name: "data_game.txt" }
    message.channel.send({ files: [fileGame] });
}