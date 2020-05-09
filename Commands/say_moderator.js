const settings = include('settings.json');
const dialogHandler = include(`${settings.modulesDir}/dialogHandler.js`);

const Narration = include(`${settings.dataDir}/Narration.js`);

module.exports.config = {
    name: "say_moderator",
    description: "Sends a message to the given channel.",
    details: 'Sends a message to the given channel. A channel must be specified. If the bot is registered as a player '
        + 'on the spreadsheet, the message will be passed into the dialog handler so that players with the "hear room" '
        + 'attribute can hear it. If the bot is not registered as a player, but the message is sent to a room channel, '
        + 'it will be treated as a narration so that players with the "see room" attribute can see it.',
    usage: `${settings.commandPrefix}say #park Hello. My name is Alter Ego.`,
    usableBy: "Moderator",
    aliases: ["say"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2)
        return game.messageHandler.addReply(message, `You need to specify a channel and something to say. Usage:\n${exports.config.usage}`);
    if (message.mentions.channels.size === 0)
        return game.messageHandler.addReply(message, `You need to specify a channel to send the message to. Usage:\n${exports.config.usage}`);

    const channel = message.mentions.channels.first();
    const string = args.slice(1).join(" ");

    var player = null;
    var room = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].id === bot.user.id) {
            player = game.players_alive[i];
            break;
        }
    }
    if (player !== null && (settings.roomCategories.includes(channel.parentID) || channel.parentID === settings.whisperCategory)) {
        for (let i = 0; i < game.rooms.length; i++) {
            if (game.rooms[i].name === channel.name) {
                player.location = game.rooms[i];
                room = game.rooms[i];
                break;
            }
        }

        channel.send(string).then(message => {
            dialogHandler.execute(bot, game, message);
        });
    }
    else if (settings.roomCategories.includes(channel.parentID)) {
        for (let i = 0; i < game.rooms.length; i++) {
            if (game.rooms[i].name === channel.name) {
                room = game.rooms[i];
                break;
            }
        }
        if (room !== null)
            new Narration(game, null, room, string).send();
    }
    else
        channel.send(string);

    return;
};
