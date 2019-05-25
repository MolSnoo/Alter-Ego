const discord = require("discord.js");
const settings = require("../settings.json");

const sheet = require("../House-Data/sheets.js");

//>room lock [room] || >room unlock [room]

module.exports.run = async (bot, config, message, args) => {
    if (message.member.roles.find(role => role.name === config.role_needed)) {
        let usage = new discord.RichEmbed()
            .setTitle("Command Help")
            .setColor("a42004")
            .setDescription(`${settings.prefix}room lock [room] OR ${settings.prefix}room unlock [room]`);

        if (!config.game) return message.reply("There is no game currently running");

        if (args.length < 2) {
            message.reply("insufficient arguments. Usage:");
            message.channel.send(usage);
            return;
        }

        var currentRoom = null;
        for (var i = 0; i < config.rooms.length; i++) {
            if (config.rooms[i].name === args[1]) {
                currentRoom = config.rooms[i];
                break;
            }
        }
        if (currentRoom === null) return message.reply('couldn\'t find room "' + args[1] + '".');

        const scope = {
            channel: message.guild.channels.find(channel => channel.name === currentRoom.name),
            config: config
        };

        if (args[0] === "lock") {
            exports.lockRoom(scope, currentRoom);
            message.channel.send("Successfully locked " + currentRoom.name + ".");
        }
        else if (args[0] === "unlock") {
            exports.unlockRoom(scope, currentRoom);
            message.channel.send("Successfully unlocked " + currentRoom.name + ".");
        }
        else return message.reply('function "' + args[0] + '" does not exist. Input must be "lock" or "unlock".');
    }
};

module.exports.lockRoom = function (scope, room) {
    const guild = scope.channel.guild;
    const channel = scope.channel;
    const config = scope.config;

    room.accessible = false;
    sheet.updateCell(room.accessibilityCell(), "FALSE");

    if (room.occupants.length > 0)
        channel.send("The room is now locked.");

    // Post log message
    const logchannel = guild.channels.find(channel => channel.id === config.logChannel);
    var time = new Date();
    logchannel.send(time.toLocaleTimeString() + " - " + room.name + " was locked");
};

module.exports.unlockRoom = function (scope, room) {
    const guild = scope.channel.guild;
    const channel = scope.channel;
    const config = scope.config;

    room.accessible = true;
    sheet.updateCell(room.accessibilityCell(), "TRUE");

    if (room.occupants.length > 0)
        channel.send("The room is now unlocked.");

    // Post log message
    const logchannel = guild.channels.find(channel => channel.id === config.logChannel);
    var time = new Date();
    logchannel.send(time.toLocaleTimeString() + " - " + room.name + " was unlocked");
};

module.exports.help = {
    name: "room"
};