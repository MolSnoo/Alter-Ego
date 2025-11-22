const serverconfig = include('Configs/serverconfig.json');

const fs = require('fs');

module.exports.config = {
    name: "setdefaultroomicon_bot",
    description: "Sets a room's display icon.",
    details: "Sets the icon that will display by default when the given room's information is displayed, if there exists no specific icon for that room. "
        + "The icon given must be a URL with a .jpg, .jpeg, .png, .gif, .webp, or .avif extension. To reset the default icon, simply do not specify a new icon.",
    usage: `setdefaultroomicon https://media.discordapp.net/attachments/1290826220367249489/1441259427411001455/sLPkDhP.png\n`
        + `setdefaultroomicon`,
    usableBy: "Bot",
    aliases: ["setdefaultroomicon"]
};

module.exports.run = async (bot, game, command, args, player, data) => {
    const cmdString = command + " " + args.join(" ");

    var input = args.join(" ").replace(/(?<=http(s?))@(?=.*?(jpg|jpeg|png|gif|webp|avif))/g, ':').replace(/(?<=http(s?):.*?)\\(?=.*?(jpg|jpeg|png|gif|webp|avif))/g, '/');
    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|jpeg|png|gif|webp|avif))$');
    if (!iconURLSyntax.test(input) && input !== "") return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". The display icon must be a URL with a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.`);

    let json = JSON.stringify(serverconfig);
    await fs.writeFileSync('Configs/serverconfig.json', json, 'utf8');

    return;
};
