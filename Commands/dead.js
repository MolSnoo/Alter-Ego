const discord = require("discord.js");
const settings = require("../settings.json");

//>dead player || >dead player1 player2 ... playerN

module.exports.run = async (bot, config, message, args) => {
    if (!config.game) return message.reply("There is no game currently running.");
    let usage = new discord.RichEmbed()
        .setTitle("Command Help")
        .setColor("a42004")
        .setDescription(`${settings.commandPrefix}dead player1 player2 ... playerN`);
    if (!args.length) {
        message.reply("you need to specify at least one player. Usage:");
        message.channel.send(usage);
        return;
    }

    if (message.member.roles.find(role => role.name === config.role_needed)) {
        for (var i = 0; i < config.players_alive.length; i++) {
            for (var j = 0; j < args.length; j++) {
                if (args[j].toLowerCase() === config.players_alive[i].name.toLowerCase()) {
                    const guild = message.guild;
                    const playerName = config.players_alive[i].name;
                    const playerLocation = guild.channels.find(channel => channel.name === config.players_alive[i].location);
                    exports.die(config.players_alive[i], config, playerLocation, i);

                    // Post log message
                    const logchannel = guild.channels.find(channel => channel.id === config.logChannel);
                    var time = new Date();
                    logchannel.send(time.toLocaleTimeString() + " - " + playerName + " died in " + playerLocation);
                }
            }
        }

        message.channel.send("Listed players are now dead. Remember to give them the Dead role when the body is discovered!");
    }
    else message.reply(`You must be ${config.role_needed} to use that command.`);
};

module.exports.die = function (player, config, channel, index) {
    // Remove player from their current channel.
    const guild = channel.guild;
    if (player.hidingSpot === "" && !player.statusString.includes("concealed")) {
        channel.overwritePermissions(player.id, { VIEW_CHANNEL: null });
        channel.send(player.name + " has died.");
    }
    else if (player.statusString.includes("concealed")) {
        channel.send("A masked figure has died.");
        config.concealedPlayer.member = null;
        config.concealedPlayer.location = null;
        config.concealedPlayer.hidden = false;
    }
    for (var i = 0; i < config.rooms.length; i++) {
        if (config.rooms[i].name === channel.name) {
            config.rooms[i].removePlayer(player);
            break;
        }
    }

    // Delete whispers, if applicable.
    const move = require("./move.js");
    move.deleteWhispers(player, guild, config, "has died.");

    // Update various data.
    player.alive = false;
    player.location = "";
    player.hidingSpot = "";
    player.status.length = 0;

    // Update that data on the sheet, as well.
    const sheet = require("../House-Data/sheets.js");
    sheet.updateData(player.playerCells(), new Array(new Array(player.id, player.name, player.talent, player.clueLevel, player.alive, player.location, player.hidingSpot, "")));

    // Move player to dead list.
    config.players_dead.push(player);
    // Then remove them from living list.
    if (index) {
        config.players_alive.splice(index, 1);
    }
    else {
        for (var index = 0; index < config.players_alive.length; index++) {
            if (player.id === config.players_alive[index].id) {
                config.players_alive.splice(index, 1);
                break;
            }
        }
    }

    const deadMember = guild.members.find(member => member.id === player.id);
    deadMember.send("You have died. When your body is discovered, you will be given the Dead role. Until then, please do not speak on the server or to other players.");
};

module.exports.help = {
    name: "dead"
}