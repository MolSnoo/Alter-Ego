const discord = require("discord.js");
const settings = require("../settings.json");

const Player = require("../House-Data/Player.js");

//>play

module.exports.run = async (bot, config, message, args) => {
    if (!config.game) return message.reply("There is no game running to join.");
    for (var i = 0; i < config.players.length; i++) {
        if (message.author.id === config.players[i].id)
            return message.reply("You are already playing.");
    }
    if (!config.canJoin) return message.reply("You were too late to join the game.");

    if ((settings.debug && message.member.roles.find(role => role.id === config.testingRole))
        || (!settings.debug && message.member.roles.find(role => role.id === config.studentRole))) {
        config.players.push(new Player(message.author.id, message.member.displayName, "", 0, true, "park", "", new Array()));
        config.players_alive.push(new Player(message.author.id, message.member.displayName, "", 0, true, "park", "", new Array()));
        message.member.addRole(config.playingRole);
        message.channel.send(`<@${message.author.id}> has joined the game!`);
    }
    else return message.reply("You are not eligible to play. If you think this is a mistake, contact a moderator.");
};

module.exports.help = {
    name: "play"
};