const discord = require("discord.js");
const settings = require("../settings.json");

const Whisper = require("../House-Data/Whisper.js");

//>whisper [player1] [player2] [playerN]

module.exports.run = async (bot, config, message, args) => {
    // Determine if the user is a player.
    var isPlayer = false;
    var currentPlayer;
    for (var i = 0; i < config.players_alive.length; i++) {
        if (message.author.id === config.players_alive[i].id) {
            isPlayer = true;
            currentPlayer = config.players_alive[i];
            break;
        }
    }
    let usage = new discord.RichEmbed()
        .setTitle("Command Help")
        .setColor("a42004")
        .setDescription(`${settings.prefix}whisper [player1] [player2] [playerN]`);

    if (!config.game) return message.reply("There is no game currently running");

    if (!args.length) {
        message.reply("you need to choose at least one player. Usage:");
        message.channel.send(usage);
        return;
    }
    
    if ((message.channel.parentID !== config.parent_channel)
        && (!isPlayer || message.channel.type !== "dm")) return;

    const statuses = currentPlayer.statusString;
    if (statuses.includes("asleep")) return message.reply("you are **asleep**. You cannot do anything.");
    if (statuses.includes("unconscious")) return message.reply("you are **unconscious**. You cannot do anything.");
    if (statuses.includes("hidden")) return message.reply(`you are currently **hidden**. Use "${settings.prefix}hide unhide" first.`);
    if (statuses.includes("restricted")) return message.reply("you are **restricted**. You cannot move.");
    if (statuses.includes("concealed")) return message.reply("your face is currently **concealed**. You cannot whisper to anyone.");
    if (statuses.includes("mute")) return message.reply("you are **mute**. You cannot whisper.");
    if (statuses.includes("deaf")) return message.reply("no one can hear you, so you cannot whisper.");

    // Get all players mentioned.
    var recipients = new Array();
    recipients.push(currentPlayer);
    for (var i = 0; i < args.length; i++) {
        var playerExists = false;
        // Player cannot whisper to themselves.
        if (args[i].toLowerCase() === currentPlayer.name.toLowerCase()) return message.reply("you can't include yourself as a whisper recipient.");
        for (var j = 0; j < config.players_dead.length; j++) {
            if (config.players_dead[j].name.toLowerCase() === args[i].toLowerCase()) return message.reply("can't whisper to " + args[i] + " because they aren't in the room with you.");
        }
        for (var j = 0; j < config.players_alive.length; j++) {
            // Check if player exists and is in the same room.
            if ((config.players_alive[j].name.toLowerCase() === args[i].toLowerCase())
                && (config.players_alive[j].location === currentPlayer.location)) {
                // Check statuses that would prohibit the player from whispering to someone in the room.
                if (config.players_alive[j].statusString.includes("unconscious"))
                    return message.reply("can't whisper to " + args[i] + " because they are unconscious.");
                if (config.players_alive[j].statusString.includes("hidden") || config.players_alive[j].statusString.includes("concealed"))
                    return message.reply("can't whisper to " + args[i] + " because they aren\'t in the room with you.");
                // If there are no interfering status effects,  add them to the array.
                playerExists = true;
                recipients.push(config.players_alive[j]);
                break;
            }
            // If player exists but is not in the same room, return error.
            else if (config.players_alive[j].name.toLowerCase() === args[i].toLowerCase()) return message.reply("can't whisper to " + args[i] + " because they aren't in the room with you.");
        }
        if (!playerExists) return message.reply("couldn't find player \"" + args[i] + "\". Make sure you spelled it right.");
    }

    // Check if whisper already exists.
    for (var i = 0; i < config.whispers.length; i++) {
        // No need to compare the members of the current whispers and the new whisper if they have different numbers of people.
        if (config.whispers[i].players.length === recipients.length) {
            var matchedUsers = 0;
            for (var j = 0; j < recipients.length; j++) {
                for (var k = 0; k < config.whispers[i].players.length; k++) {
                    if (recipients[j].id === config.whispers[i].players[k].id) {
                        matchedUsers++;
                        break;
                    }
                }
            }
            if (matchedUsers === recipients.length) return message.reply("whisper group already exists.");
        }
    }

    // Whisper does not exist, so create it.
    var playerListString;
    if (recipients.length === 2)
        playerListString = recipients[0].name + " and " + recipients[1].name;
    for (var i = 0; i < recipients.length; i++) {
        if (recipients.length >= 3) {
            if (i === 0)
                playerListString = recipients[i].name + ", ";
            else if (i === recipients.length - 1)
                playerListString += "and " + recipients[i].name;
            else
                playerListString += recipients[i].name + ", ";
        }
    }

    const whisper = new Whisper(recipients, currentPlayer.location);

    const guild = bot.guilds.find(guild => guild.id === config);
    guild.createChannel(whisper.channelName, "text").then(function (channel) {
        channel.setParent('548248180962361347');
        for (var i = 0; i < recipients.length; i++) {
            channel.overwritePermissions(recipients[i].id, { VIEW_CHANNEL: true, READ_MESSAGE_HISTORY: true });
        }
    });
    config.whispers.push(whisper);

    const channel = guild.channels.find(channel => channel.name === currentPlayer.location);
    channel.send(playerListString + " begin whispering.");
    if (config.concealedPlayer.member !== null && config.concealedPlayer.location === currentPlayer.location && !config.concealedPlayer.hidden) {
        config.concealedPlayer.member.send(playerListString + " begin whispering.");
    }

    // Post log message
    const logchannel = guild.channels.find(channel => channel.id === config.logChannel);
    var time = new Date();
    logchannel.send(time.toLocaleTimeString() + " - " + playerListString + " began whispering in " + channel);

    if (message.channel.type !== "dm")
        message.delete().catch();
};

module.exports.help = {
    name: "whisper"
};