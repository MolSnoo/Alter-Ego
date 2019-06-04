const discord = require("discord.js");
const settings = require("../settings.json");

//>endgame

module.exports.run = async (bot, config, message, args) => {
    if (!config.game) return message.reply("There is no game currently running.");
    if (message.channel.id !== config.commandsChannel) return;
    if (!message.member.roles.find(role => role.name === config.role_needed)) return message.reply(`You must be ${config.role_needed} to use that command.`);

    for (var i = 0; i < config.players_alive.length; i++) {
        const channel = message.guild.channels.find(channel => channel.name === config.players_alive[i].location);
        const member = message.guild.members.find(member => member.displayName === config.players_alive[i].name);
        channel.overwritePermissions(member, { VIEW_CHANNEL: null });
    }

    const playingMembers = message.guild.roles.get(config.playingRole).members;
    const playingKeys = Array.from(playingMembers.keys());
    for (var i = 0; i < playingKeys.length; i++) {
        let playingMember = message.guild.members.get(playingKeys[i]);
        playingMember.removeRole(config.playingRole).catch();
    }

    const deadMembers = message.guild.roles.get(config.deadRole).members;
    const deadKeys = Array.from(deadMembers.keys());
    for (var j = 0; j < deadKeys.length; j++) {
        let deadMember = message.guild.members.get(deadKeys[j]);
        deadMember.removeRole(config.deadRole).catch();
    }

    config.game = false;
    config.canJoin = false;
    config.players = [];
    config.players_alive = [];
    config.players_dead = [];

    const channel = bot.channels.get(config.endgame.sendChannel);
    channel.send(`${message.member.displayName} ended the game!`);
};

module.exports.help = {
    name: "endgame"
}