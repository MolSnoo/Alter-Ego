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

    let input = args.join(" ");
    let parsedInput = input.replace(/ /g, "-").toLowerCase();

    let room = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (game.rooms[i].name === parsedInput || parsedInput.startsWith(game.rooms[i].name + '-')) {
            room = game.rooms[i];
            input = input.substring(game.rooms[i].name.length).trim();
            break;
        }
    }
    if (room === null) return game.messageHandler.addReply(message, `Couldn't find room "${input}".`);

    const iconURLSyntax = RegExp('(http(s?)://.*?\\.(jpg|jpeg|png|gif|webp|avif))(\\?.*)?$');
    input = input.replace(iconURLSyntax, '$1');
    if (input.length === 0) {
        if (message.attachments.size !== 0)
            input = message.attachments.first().url.replace(iconURLSyntax, '$1');
    }
    if (!iconURLSyntax.test(input) && input !== "") return game.messageHandler.addReply(message, `The display icon must be a URL with a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.`);

    room.iconURL = input;
    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully updated the icon for ${room.name}.`);

    return;
};
