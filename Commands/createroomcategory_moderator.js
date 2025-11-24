const settings = require('../Configs/settings.json');
const constants = require('../Configs/constants.json');
const serverManager = require('../Modules/serverManager.js');

module.exports.config = {
    name: "createroomcategory_moderator",
    description: "Creates a room category.",
    details: "Creates a room category channel with the given name. The ID of the new category channel will "
        + "automatically be added to the roomCategories setting in the serverconfig file. If a room category "
        + "with the given name already exists, but its ID hasn't been registered in the roomCategories setting, "
        + "it will automatically be added. Note that if you create a room category in Discord without using "
        + "this command, you will have to add its ID to the roomCategories setting manually.",
    usage: `${settings.commandPrefix}createroomcategory Floor 1\n`
        + `${settings.commandPrefix}register Floor 2`,
    usableBy: "Moderator",
    aliases: ["createroomcategory","register"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to give a name to the new room category. Usage:\n${exports.config.usage}`);

    var input = args.join(" ");
    var channel = game.guild.channels.cache.find(channel => channel.name.toLowerCase() === input.toLowerCase() && channel.parentId === null);
    if (channel) {
        let response = await serverManager.registerRoomCategory(channel);
        game.messageHandler.addGameMechanicMessage(message.channel, response);
    }
    else {
        try {
            channel = await serverManager.createCategory(game.guild, input);
            let response = await serverManager.registerRoomCategory(channel);
            game.messageHandler.addGameMechanicMessage(message.channel, response);
        }
        catch (err) {
            game.messageHandler.addGameMechanicMessage(message.channel, err);
        }
    }

    return;
};
