module.exports.config = {
    name: "setroomicon_bot",
    description: "Sets a room's display icon.",
    details: "Sets the icon that will display when the given room's information is displayed. The icon given must be a URL with a .jpg, "
        + ".jpeg, .png, .gif, .webp, or .avif extension. To reset a room's icon, simply do not specify a new icon.",
    usage: `setroomicon living-room https://media.discordapp.net/attachments/1290826220367249489/1441259427411001455/sLPkDhP.png\n`
        + `setroomicon kitchen`,
    usableBy: "Bot",
    aliases: ["setroomicon"]
};

module.exports.run = async (bot, game, command, args, player, data) => {
    const cmdString = command + " " + args.join(" ");
    if (args.length === 0)
        return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Insufficient arguments.`);

    let room = null;
    for (let i = 0; i < game.rooms.length; i++) {
        if (game.rooms[i].name === args[0].toLowerCase()) {
            room = game.rooms[i];
            break;
        }
    }
    if (room === null)
        return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Room "${args[0]}" not found.`);

    args.splice(0, 1);

    var input = args.join(" ").replace(/(?<=http(s?))@(?=.*?(jpg|jpeg|png|gif|webp|avif))/g, ':').replace(/(?<=http(s?):.*?)\\(?=.*?(jpg|jpeg|png|gif|webp|avif))/g, '/');
    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|jpeg|png|gif|webp|avif))$');
    if (!iconURLSyntax.test(input)) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". The display icon must be a URL with a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.`);

    room.iconURL = input;

    return;
};
