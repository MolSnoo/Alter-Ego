const settings = include('Configs/settings.json');
const serverconfig = include('Configs/serverconfig.json');

const fs = require('fs');

module.exports.config = {
    name: "setdefaultroomicon_moderator",
    description: "Sets a room's icon.",
    details: "Sets the icon that will display when the given room's information is displayed. The icon given must be an attachment or URL with a .jpg, "
        + ".jpeg, .png, .gif, .webp, or .avif extension. To reset a room's icon, simply do not specify a new icon.",
    usage: `${settings.commandPrefix}setdefaultroomicon https://media.discordapp.net/attachments/1290826220367249489/1441259427411001455/sLPkDhP.png\n`
        + `${settings.commandPrefix}setdefaultroomicon`,
    usableBy: "Moderator",
    aliases: ["setdefaultroomicon"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|jpeg|png|gif|webp|avif))$');
    var input = args.join(" ");
    if (input.length === 0) {
        if (message.attachments.size !== 0)
            input = message.attachments.first().url;
    }
    else if (!iconURLSyntax.test(input) && input !== "") return game.messageHandler.addReply(message, `The display icon must be a URL with a .jpg, .jpeg, .png, .gif, .webp, or .avif extension.`);

    let json = JSON.stringify(serverconfig);
    await fs.writeFileSync('Configs/serverconfig.json', json, 'utf8');

    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully updated the default room icon.`);

    return;
};
