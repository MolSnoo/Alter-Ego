const settings = include('Configs/settings.json');

module.exports.config = {
    name: "setroomicon_moderator",
    description: "Sets a room's icon.",
    details: "Sets the icon that will display when the given room's information is displayed. The icon given must be an attachment or URL with a .jpg, "
        + ".jpeg, .png, .gif, .webp, or .avif extension. To reset a room's icon, simply do not specify a new icon.",
    usage: `${settings.commandPrefix}setroomicon living-room https://media.discordapp.net/attachments/1290826220367249489/1441259427411001455/sLPkDhP.png\n`
        + `${settings.commandPrefix}setroomicon kitchen`,
    usableBy: "Moderator",
    aliases: ["setroomicon"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify a room. Usage:\n${exports.config.usage}`);

    let room = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (game.rooms[i].name === args[0].toLowerCase()) {
            room = game.rooms[i];
            break;
        }
    }
    if (room === null) return game.messageHandler.addReply(message, `Room "${args[0]}" not found.`);

    args.splice(0, 1);

    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|jpeg|png|gif|webp|avif))$');
    var input = args.join(" ");
    if (input.length === 0) {
        if (message.attachments.size === 0)
            return game.messageHandler.addReply(message, `You must provide a display icon, either as a URL or a file with a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.`);
        else {
            input = message.attachments.first().url;
        }
    }
    else if (!iconURLSyntax.test(input)) return game.messageHandler.addReply(message, `The display icon must be a URL with a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.`);

    room.iconURL = input;
    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully updated the icon for ${room.name}.`);

    return;
};
