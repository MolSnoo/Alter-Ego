const discord = require("discord.js");
const settings = require("../settings.json");

const sheet = require("../House-Data/sheets.js");
const status = require("./status.js");

//>inspect [object/item]

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

    if ((message.channel.parentID !== config.parent_channel)
        && (!isPlayer || message.channel.type !== "dm")) return;

    let usage = new discord.RichEmbed()
        .setTitle("Command Help")
        .setColor("a42004")
        .setDescription(`${settings.prefix}inspect [object/item]`);

    if (!config.game) return message.reply("There is no game currently running");

    if (!args.length) {
        message.reply("you need to specify an object/item. Usage:");
        message.channel.send(usage);
        return;
    }

    const guild = bot.guilds.first();
    const channel = guild.channels.find(channel => channel.name === currentPlayer.location);
    const logchannel = guild.channels.find(channel => channel.id === config.logChannel);

    const statuses = currentPlayer.statusString;
    if (statuses.includes("asleep")) return message.reply("you are **asleep**. You cannot do anything.");
    if (statuses.includes("unconscious")) return message.reply("you are **unconscious**. You cannot do anything.");
    if (statuses.includes("heated")) return message.reply("the situation is **heated**. Moderator intervention is required.");
    if (statuses.includes("restricted")) return message.reply("you are **restricted**. You cannot move.");
    if (statuses.includes("hidden")) return message.reply(`you are currently **hidden**. Use "${settings.prefix}hide unhide" first.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase();
    parsedInput = parsedInput.replace(/\'/g, "");

    // If there is an investigation ongoing, search through the clues first.
    if (config.investigation) {
        const clue = config.clues;
        var isClue = false;

        // Get the row number of the desired clue.
        var current;
        for (current = 0; current < clue.length; current++) {
            if ((clue[current].name === parsedInput)
                && (clue[current].location === currentPlayer.location)
                && (clue[current].accessible)) {
                isClue = true;
                break;
            }
        }

        if (isClue) {
            var intelligence = currentPlayer.clueLevel;
            if (statuses.includes("tired")) intelligence -= 1;
            if (statuses.includes("intelligent")) intelligence += 1;

            var descriptionCell;
            switch (intelligence) {
                case NaN:
                    descriptionCell = clue[current].level0DescriptionCell();
                    break;
                case -1:
                    descriptionCell = clue[current].level0DescriptionCell();
                    break;
                case 0:
                    descriptionCell = clue[current].level0DescriptionCell();
                    break;
                case 1:
                    descriptionCell = clue[current].level1DescriptionCell();
                    break;
                case 2:
                    descriptionCell = clue[current].level2DescriptionCell();
                    break;
                case 3:
                    descriptionCell = clue[current].level3DescriptionCell();
                    break;
                default:
                    descriptionCell = clue[current].level3DescriptionCell();
                    break;
            }

            sheet.getData(descriptionCell, function (response) {
                if (response.data.values) {
                    if (statuses.includes("concealed")) channel.send("A masked figure begins inspecting the " + clue[current].name + ".");
                    else {
                        channel.send(currentPlayer.name + " begins inspecting the " + clue[current].name + ".");
                        if (config.concealedPlayer.member !== null && config.concealedPlayer.location === currentPlayer.location && !config.concealedPlayer.hidden) {
                            config.concealedPlayer.member.send(currentPlayer.name + " begins inspecting the " + clue[current].name + ".");
                        }
                    }
                    message.author.send(response.data.values[0][0]);
                }
                else return message.reply("couldn't find \"" + input + "\".");
            });

            // Post log message
            var time = new Date();
            logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " inspected " + clue[current].name + " in " + channel);
        }
    }

    if (!isClue) {
        // Check if the input is an object.
        const object = config.objects;
        var isObject = false;

        // Get the row number of the desired object.
        var current = 0;
        while (current < object.length) {
            if ((object[current].name === parsedInput)
                && (object[current].location === currentPlayer.location)
                && (object[current].accessible)) {
                isObject = true;
                break;
            }
            current++;
        }

        if (isObject) {
            sheet.getData(object[current].descriptionCell(), function (response) {
                if (statuses.includes("concealed")) channel.send("A masked figure begins inspecting the " + object[current].name + ".");
                else {
                    channel.send(currentPlayer.name + " begins inspecting the " + object[current].name + ".");
                    if (config.concealedPlayer.member !== null && config.concealedPlayer.location === currentPlayer.location && !config.concealedPlayer.hidden) {
                        config.concealedPlayer.member.send(currentPlayer.name + " begins inspecting the " + object[current].name + ".");
                    }
                }
                message.author.send(response.data.values[0][0]);
            });

            for (var i = 0; i < config.players_alive.length; i++) {
                if (config.players_alive[i].hidingSpot === object[current].name) {
                    if (config.players_alive[i].statusString.includes("concealed")) message.author.send("While inspecting the " + object[current].name + ", you find a masked figure hiding!");
                    else message.author.send("While inspecting the " + object[current].name + ", you find " + config.players_alive[i].name + " hiding!");

                    var hiddenStatus;
                    for (var j = 0; j < config.statusEffects.length; j++) {
                        if (config.statusEffects[j].name === "hidden") {
                            hiddenStatus = config.statusEffects[j];
                            break;
                        }
                    }
                    status.cure(config.players_alive[i], hiddenStatus, config, bot, false);
                    const hiddenPlayer = guild.members.find(member => member.id === config.players_alive[i].id);
                    if (statuses.includes("concealed")) hiddenPlayer.send("You've been found by a masked figure. You are no longer hidden.");
                    else hiddenPlayer.send("You've been found by " + currentPlayer.name + ". You are no longer hidden.");
                    break;
                }
            }

            // Post log message
            var time = new Date();
            logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " inspected " + object[current].name + " in " + channel);
        }
        // Now check if the input is an item instead.
        else {
            const item = config.items;
            var isItem = false;

            if (!parsedInput.startsWith("MY ")) {
                current = 0;
                while (current < item.length) {
                    if ((item[current].name === parsedInput || item[current].pluralName === parsedInput)
                        && (item[current].location === currentPlayer.location)
                        && (item[current].accessible)
                        && (item[current].quantity > 0 || isNaN(item[current].quantity))) {
                        isItem = true;
                        break;
                    }
                    current++;
                }
            }

            var hasItem = false;
            var slot = 0;
            for (slot; slot < currentPlayer.inventory.length; slot++) {
                if (currentPlayer.inventory[slot].name === parsedInput.replace("MY ", "")) {
                    hasItem = true;
                    break;
                }
            }

            if (isItem) {
                sheet.getData(item[current].descriptionCell(), function (response) {
                    message.author.send(response.data.values[0][0]);
                });

                // Post log message
                var time = new Date();
                logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " inspected " + item[current].name + " in " + channel);
            }
            else if (hasItem) {
                sheet.getData(currentPlayer.inventory[slot].descriptionCell(), function (response) {
                    message.author.send(response.data.values[0][0]);
                });
                if (!currentPlayer.inventory[slot].discreet) {
                    if (statuses.includes("concealed")) channel.send("A masked figure takes out " + currentPlayer.inventory[slot].singleContainingPhrase + " and begins inspecting it.");
                    else {
                        channel.send(currentPlayer.name + " takes out " + currentPlayer.inventory[slot].singleContainingPhrase + " and begins inspecting it.");
                        if (config.concealedPlayer.member !== null && config.concealedPlayer.location === currentPlayer.location && !config.concealedPlayer.hidden) {
                            config.concealedPlayer.member.send(currentPlayer.name + " takes out " + currentPlayer.inventory[slot].singleContainingPhrase + " and begins inspecting it.");
                        }
                    }
                }

                // Post log message
                var time = new Date();
                logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " inspected " + currentPlayer.inventory[slot].name + " from their inventory in " + channel);
            }
            else return message.reply("couldn't find \"" + input + "\".");
        }
    }

    if (message.channel.type !== "dm")
        message.delete().catch();
};

module.exports.help = {
	name: "inspect"
};