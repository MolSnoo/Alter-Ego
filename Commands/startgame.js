const discord = require("discord.js");
const settings = require("../settings.json");

//>startgame [time to join h/m] || >startgame stop

module.exports.run = async (bot, config, message, args) => {
    if (message.channel.id !== config.commandsChannel) return;
    if (config.game) return message.reply("There is already a game running.");
    if (message.member.roles.find(role => role.name !== config.role_needed)) return message.reply(`You must be ${config.role_needed} to use that command.`);

    if (args[0] === "stop") {
        stop();
        return;
    }
    if (!args[0]) return message.reply("Remember to specify how long players have to join!");

    const playingRole = message.guild.roles.find(role => role.id === config.playingRole);
    const channel = bot.channels.get(config.startgame.sendChannel);

    const timeLimit = args[0];
    if (isNaN(timeLimit.charAt(0)) && isNaN(timeLimit.charAt(1))) return message.reply("Time input must be a number [5h / 5m].");
    if (timeLimit.indexOf('m') === -1 && timeLimit.indexOf('h') === -1) return message.reply("Time input must have either h or m after it.");
    if (timeLimit.indexOf('m') !== -1 && timeLimit.indexOf('h') !== -1) return message.reply("Time input cannot have both m and h after it.");

    let time, halfTime, min, hour, mn = false, hr = false;
    if (timeLimit.index('m') !== -1) {
        min = timeLimit.slice(0, timeLimit.indexOf('m'));
        time = min * 60000;
        halfTime = time / 2;
        mn = true;
    }
    if (timeLimit.indexOf('h') !== -1) {
        hour = timeLimit.slice(0, timeLimit.indexOf('h'));
        time = hour * 3600000;
        halfTime = time / 2;
        hr = true;
    }

    x = setTimeout(function () {
        if (mn) generalChat.send(`${min / 2} minutes remaining to join the game. Use ${settings.commandPrefix}play to join!`);
        if (hr) generalChat.send(`${hour / 2} hours remaining to join the game. Use ${settings.commandPrefix}play to join!`);
    }, halfTime);

    y = setTimeout(function () {
        config.canJoin = false;
        channel.send(`${playing}, time's up! The game will begin once the moderator is ready.`);
        var players = new Array();
        for (var i = 0; i < config.players.length; i++) {
            players.push(new Array(config.players[i].id, config.players[i].name, "", config.players[i].clueLevel, config.players[i].alive, config.players[i].location, config.players[i].hidingSpot, "satisfied, well rested", "NULL", "", "", "", "", "", "", ""));
            players.push(new Array("", "", "", "", "", "", "", "", "NULL", "", "", "", "", "", "", ""));
            players.push(new Array("", "", "", "", "", "", "", "", "NULL", "", "", "", "", "", "", ""));
        }
        sheet.updateDate('Players!A3:P', players);
    }, time);

    config.game = true;
    config.canJoin = true;
    let startGame = `<@${message.author.id}> has started a game. `;
    if (mn) startGame += `You have ${min} minutes to join the game with ${settings.commandPrefix}play.`;
    if (hr) startGame += `You have ${hour} hours to join the game with ${settings.commandPrefix}play.`;
    channel.send(startGame);

    function stop() {
        clearTimeout(x);
        clearTimeout(y);
        return;
    }
};

module.exports.help = {
    name: "startgame"
}