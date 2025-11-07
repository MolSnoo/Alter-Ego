const settings = require('../Configs/settings.json');
const constants = require('../Configs/constants.json');
const playerdefaults = require('../Configs/playerdefaults.json');
const serverconfig = require('../Configs/serverconfig.json');

const Player = require('../Data/Player.js');

module.exports.config = {
    name: "play_eligible",
    description: "Joins a game.",
    details: "Adds you to the list of players for the current game.",
    usage: `${settings.commandPrefix}play`,
    usableBy: "Eligible",
    aliases: ["play"]
};

module.exports.run = async (bot, game, message, args) => {
    for (let i = 0; i < game.players.length; i++) {
        if (message.author.id === game.players[i].id)
            return message.reply("You are already playing.");
    }
    if (!game.canJoin) return message.reply("You were too late to join the game. Contact a moderator to be added before the game starts.");

    const member = await game.guild.members.fetch(message.author.id);

    var player = new Player(
        message.author.id,
        member,
        member.displayName,
        member.displayName,
        "",
        playerdefaults.defaultPronouns,
        playerdefaults.defaultVoice,
        playerdefaults.defaultStats,
        true,
        playerdefaults.defaultLocation,
        "",
        playerdefaults.defaultStatusEffects,
        playerdefaults.defaultDescription,
        new Array(),
        null
    );
    player.setPronouns(player.originalPronouns, player.pronounString);
    player.setPronouns(player.pronouns, player.pronounString);
    game.players.push(player);
    game.players_alive.push(player);
    member.roles.add(serverconfig.playerRole);
    message.channel.send(`<@${message.author.id}> joined the game!`);

    return;
};
