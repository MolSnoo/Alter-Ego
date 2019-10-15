const settings = include('settings.json');
const dialogHandler = include(`${settings.modulesDir}/dialogHandler.js`);

module.exports.config = {
    name: "say_moderator",
    description: "Sends a message to the given channel.",
    details: 'Sends a message to the given channel. A channel must be specified. If the bot is registered as a player '
        + 'on the spreadsheet, the message will be passed into the dialog handler so that players with the "hear room" '
        + 'attribute can hear it.',
    usage: `${settings.commandPrefix}say #park Hello. My name is Alter Ego.`,
    usableBy: "Moderator",
    aliases: ["say"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2) {
        message.reply("You need to specify a channel and something to say. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }
    if (message.mentions.channels.size === 0) {
        message.reply("You need to specify a channel to send the message to. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    const channel = message.mentions.channels.first();
    const string = args.slice(1).join(" ");

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].id === bot.user.id) {
            player = game.players_alive[i];
            break;
        }
    }
    if (player !== null) {
        for (let i = 0; i < game.rooms.length; i++) {
            if (game.rooms[i].name === channel.name) {
                player.location = game.rooms[i];
                break;
            }
        }
    }

    channel.send(string).then(message => {
        if (player !== null)
            dialogHandler.execute(game, message);
    });

    return;
};
