const discord = require("discord.js");
const settings = require("../settings.json");

const status = require("./status.js");
const sheet = require("../House-Data/sheets.js");

//>hide [object]

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

    if (!config.game) return message.reply("There is no game currently running");

    let usage = new discord.RichEmbed()
        .setTitle("Command Help")
        .setColor("a42004")
        .setDescription(`${settings.prefix}hide [object] OR ${settings.prefix}hide unhide`);

    if ((message.channel.parentID !== config.parent_channel)
        && (!isPlayer || message.channel.type !== "dm")) return;

    const guild = bot.guilds.find(guild => guild.id === config);
    const channel = guild.channels.find(channel => channel.name === currentPlayer.location);

    const statuses = currentPlayer.statusString;
    if (statuses.includes("asleep")) return message.reply("you are **asleep**. You cannot do anything.");
    if (statuses.includes("unconscious")) return message.reply("you are **unconscious**. You cannot do anything.");
    if (statuses.includes("heated")) return message.reply("the situation is **heated**. Moderator intervention is required.");    
    if (statuses.includes("restricted")) return message.reply("you are **restricted**. You cannot move.");

    if (statuses.includes("hidden") && args[0] === "unhide") {
        var currentStatus;
        for (var i = 0; i < config.statusEffects.length; i++) {
            if (config.statusEffects[i].name === "hidden") {
                currentStatus = config.statusEffects[i];
                break;
            }
        }

        status.cure(currentPlayer, currentStatus, config, bot, true);

        // Log message is sent in status.js
    }
    else if (statuses.includes("hidden")) {
        message.reply("you are already **hidden**. If you wish to stop hiding, use 'unhide'. Usage:");
        message.channel.send(usage);
        return;
    }
    else {
        if (!args.length) {
            message.reply("insufficient arguments. Usage:");
            message.channel.send(usage);
            return;
        }

        var input = args.join(" ");
        var parsedInput = input.toUpperCase();
        parsedInput = parsedInput.replace(/\'/g, "");

        // Check if the input is an object and a hiding spot.
        const object = config.objects;
        var isObject = false;
        var objectIsHidingSpot = false;

        // Get the row number of the desired object.
        var current = 0;
        while (current < object.length) {
            if ((object[current].name === parsedInput)
                && (object[current].location === currentPlayer.location)
                && (object[current].accessible)) {
                isObject = true;
                if (object[current].isHidingSpot)
                    objectIsHidingSpot = true;
                break;
            }
            current++;
        }

        if (isObject && objectIsHidingSpot) {
            var currentStatus;
            for (var i = 0; i < config.statusEffects.length; i++) {
                if (config.statusEffects[i].name === "hidden") {
                    currentStatus = config.statusEffects[i];
                    break;
                }
            }

            var hidingSpotTaken = false;

            for (var i = 0; i < config.players_alive.length; i++) {
                if (config.players_alive[i].hidingSpot === object[current].name) {
                    hidingSpotTaken = true;
                    if (config.players_alive[i].statusString.includes("concealed"))
                        message.author.send("You attempt to hide in the " + object[current].name + ", but you find a masked figure is already there!");
                    else
                        message.author.send("You attempt to hide in the " + object[current].name + ", but you find " + config.players_alive[i].name + " is already there!");

                    status.cure(config.players_alive[i], currentStatus, config, bot, false);
                    const hiddenPlayer = guild.members.find(member => member.id === config.players_alive[i].id);
                    if (statuses.includes("concealed")) hiddenPlayer.send("You've been found by a masked figure. You are no longer hidden.");
                    else hiddenPlayer.send("You've been found by " + currentPlayer.name + ". You are no longer hidden.");
                    break;
                }
            }

            if (!hidingSpotTaken) {
                currentPlayer.hidingSpot = object[current].name;
                status.inflict(currentPlayer, currentStatus, config, bot, true);
            }

            // Log message is sent in status.js
        }
        else if (isObject) return message.reply(object[current].name + " is not a hiding spot.");
        else return message.reply("couldn't find \"" + input + "\".");
    }

    if (message.channel.type !== "dm")
        message.delete().catch();
};

module.exports.help = {
    name: "hide"
};