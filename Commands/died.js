const discord = require("discord.js");
const settings = require("../settings.json");

//>alive

module.exports.run = async (bot, config, message, args) => {
    if (!config.game) return message.reply("There is no game currently running.");
    if (message.member.roles.find(role => role.name === config.role_needed)) {
        if (config.players_dead === "" || config.players_dead.length === 0) return message.channel.send("No one is currently dead.");
        let playerList = config.players_dead[0].name;
        for (var i = 1; i < config.players_dead.length; i++) {
            playerList += ', ' + config.players_dead[i].name;
        }
        message.channel.send(`Players who are dead: \n${playerList}`);
    }
    else message.reply(`You must be ${config.role_needed} to use that command.`);
};

module.exports.help = {
    name: "died"
}