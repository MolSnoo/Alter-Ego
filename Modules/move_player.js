const discord = require("discord.js");
const settings = require("../settings.json");

module.exports.config = {
    name: "move_player",
    description: "Moves you to another room. You will be removed from the current channel and put into the channel corresponding to the room you specify. You can specify either an exit of the current room or the name of the desired room, if you know it. Note that you can only move to adjacent rooms. It is recommended that you open the new channel immediately so that you can start seeing messages as soon as you're added. The room description will be sent to you via DMs.",
    usage: `${settings.commandPrefix}move door 1\n${settings.commandPrefix}enter door 1`,
    usableBy: "Player",
    aliases: ["move", "go", "exit", "enter"]
};

module.exports.run = async (bot, game, message, args, player) => {
    if (args.length === 0) {
        message.reply("you need to specify a room. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    var input = args.join(" ");

    const currentRoom = player.location;
    var adjacent = false;
    var exit = null;
    var desiredRoom = null;
    var entrance = null;
    // If the player has the headmaster role, they can move to any room they please.
    if (player.member.roles.find(role => role.id === settings.headmasterRole)) {
        adjacent = true;
        for (let i = 0; i < game.rooms.length; i++) {
            if (game.rooms[i].name === input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase()) {
                desiredRoom = game.rooms[i];
                break;
            }
        }
    }
    // Otherwise, check that the desired room is adjacent to the current room.
    else {
        for (let i = 0; i < currentRoom.exit.length; i++) {
            if (currentRoom.exit[i].dest.name === input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase()
                || currentRoom.exit[i].name === input.toUpperCase()) {
                adjacent = true;
                exit = currentRoom.exit[i];
                desiredRoom = exit.dest;

                // Find the correct entrance.
                for (let j = 0; j < desiredRoom.exit.length; j++) {
                    if (desiredRoom.exit[j].name === currentRoom.exit[i].link) {
                        entrance = desiredRoom.exit[j];
                        break;
                    }
                }
                break;
            }
        }
    }
    if (!adjacent) return message.reply("you can't move to that room.");

    currentRoom.removePlayer(player, exit);
    desiredRoom.addPlayer(player, entrance);

    // Post log message.
    const logchannel = game.guild.channels.find(channel => channel.id === settings.logChannel);
    var time = new Date();
    logchannel.send(time.toLocaleTimeString() + " - " + player.name + " moved to " + desiredRoom.channel);

    return;
};
