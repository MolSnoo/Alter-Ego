const discord = require("discord.js");
const settings = require("../settings.json");

const InventoryItem = require("../House-Data/InventoryItem.js");
const sheet = require("../House-Data/sheets.js");
const parser = require("../House-Data/parser.js");

//>take [item] || >take [item] [object]

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
    // Determine if the user is a moderator.
    var isModerator = false;
    if (message.channel.type !== "dm" && message.member.roles.find(role => role.name === config.role_needed)) isModerator = true;

    if ((message.channel.parentID !== config.parent_channel)
        && (message.channel.id !== config.commandsChannel)
        && (!isPlayer || message.channel.type !== "dm")) return;

    let usage;
    if (isPlayer) {
        usage = new discord.RichEmbed()
            .setTitle("Command Help")
            .setColor("a42004")
            .setDescription(`${settings.prefix}take [item] OR ${settings.prefix}take [item] [object]`);
    }
    else if (isModerator) {
        usage = new discord.RichEmbed()
            .setTitle("Command Help")
            .setColor("a42004")
            .setDescription(`${settings.prefix}take [item] [player] OR ${settings.prefix}take [item] [object] [player]`);
    }

    if (!config.game) return message.reply("There is no game currently running");

    if (!args.length) {
        message.reply("you need to specify an item. Usage:");
        message.channel.send(usage);
        return;
    }

    var input;
    var parsedInput;

    if (isPlayer) {
        const statuses = currentPlayer.statusString;
        if (statuses.includes("asleep")) return message.reply("you are **asleep**. You cannot do anything.");
        if (statuses.includes("unconscious")) return message.reply("you are **unconscious**. You cannot do anything.");
        if (statuses.includes("heated")) return message.reply("the situation is **heated**. Moderator intervention is required.");
        if (statuses.includes("restricted")) return message.reply("you are **restricted**. You cannot move.");
        if (statuses.includes("hidden")) return message.reply(`you are currently **hidden**. Use "${settings.prefix}hide unhide" first.`);

        input = args.join(" ");
        parsedInput = input.toUpperCase();
        parsedInput = parsedInput.replace(/\'/g, "");
    }
    else if (isModerator) {
        const playerName = args[args.length - 1].toLowerCase();
        for (var i = 0; i < config.players_alive.length; i++) {
            if (config.players_alive[i].name.toLowerCase() === playerName) {
                currentPlayer = config.players_alive[i];
                break;
            }
        }
        if (!currentPlayer) return message.reply('Player "' + args[args.length - 1] + '" not found.');

        input = args.join(" ");
        input = input.substring(0, input.indexOf(args[args.length - 1])).trim();
        parsedInput = input.toUpperCase();
        parsedInput = parsedInput.replace(/\'/g, "");
    }
    const guild = bot.guilds.find(guild => guild.id === config);

    const statuses = currentPlayer.statusString;

    // Check if the input is an item.
    const item = config.items;
    var roomItems = new Array();
    var objectName = "";
    var matchedIndex = new Array();
    for (var i = 0; i < item.length; i++) {
        if ((item[i].pluralName !== "" && parsedInput.startsWith(item[i].pluralName))
            && (item[i].location === currentPlayer.location)
            && (item[i].accessible)
            && (item[i].quantity > 0 || isNaN(item[i].quantity))) {
            roomItems.push(item[i]);
            matchedIndex.push(i);
            objectName = parsedInput.substring(item[i].pluralName.length + 1);
        }
        else if ((parsedInput.startsWith(item[i].name))
            && (item[i].location === currentPlayer.location)
            && (item[i].accessible)
            && (item[i].quantity > 0 || isNaN(item[i].quantity))) {
            roomItems.push(item[i]);
            matchedIndex.push(i);
            objectName = parsedInput.substring(item[i].name.length + 1);
        }
    }
    if (roomItems.length !== 0) {
        var currentObject;
        var currentPuzzle;
        if (objectName !== "" && objectName !== " ") {
            for (var i = 0; i < config.objects.length; i++) {
                if (config.objects[i].name === objectName
                    && config.objects[i].location === currentPlayer.location
                    && config.objects[i].accessible) {
                    currentObject = config.objects[i];
                    if (config.objects[i].requires !== "") {
                        for (var j = 0; j < config.puzzles.length; j++) {
                            if (config.puzzles[j].parentObject === currentObject.name
                                && config.puzzles[j].location === currentObject.location
                                && config.puzzles[j].accessible) {
                                if (config.puzzles[j].solved) {
                                    isPuzzle = true;
                                    currentPuzzle = config.puzzles[j];
                                    break;
                                }
                                else return message.reply("couldn't find \"" + input + "\".");
                            }
                        }
                    }
                    break;
                }
            }
            if (!currentObject) return message.reply("couldn't find \"" + objectName + "\".");
        }

        var current = -1;

        if (currentPuzzle) {
            for (var i = 0; i < roomItems.length; i++) {
                if (roomItems[i].sublocation === "" && roomItems[i].requires === currentPuzzle.name) {
                    current = matchedIndex[i];
                    break;
                }
            }
            if (current === -1) return message.reply("couldn't find that item in " + objectName + ".");
        }
        else if (currentObject) {
            for (var i = 0; i < roomItems.length; i++) {
                if (roomItems[i].sublocation === currentObject.name) {
                    current = matchedIndex[i];
                    break;
                }
            }
            if (current === -1) return message.reply("couldn't find that item in " + objectName + ".");
        }
        else current = matchedIndex[0];

        // Check for free space in the player's inventory.
        var playerHasFreeSpace = false;
        var slot = 0;
        for (slot; slot < currentPlayer.inventory.length; slot++) {
            if (currentPlayer.inventory[slot].name === null || currentPlayer.inventory[slot].name === undefined) {
                playerHasFreeSpace = true;
                break;
            }
        }
        if (!playerHasFreeSpace) {
            if (isPlayer) message.reply("your inventory is full.");
            else if (isModerator) message.reply("that player's inventory is full.");
        }
        else {
            var quantity = "";
            if (!isNaN(item[current].quantity)) {
                item[current].quantity--;
                quantity = item[current].quantity.toString();
            }

            sheet.updateCell(item[current].quantityCell(), quantity);

            // Make a copy of the item and put it in the player's inventory. This item will be added to the Players list.
            const createdItem = new InventoryItem(
                item[current].name,
                item[current].pluralName,
                item[current].uses,
                item[current].discreet,
                item[current].effect,
                item[current].cures,
                item[current].singleContainingPhrase,
                item[current].pluralContainingPhrase,
                currentPlayer.inventory[slot].row
            );
            currentPlayer.inventory[slot] = createdItem;
            if (isPlayer) message.author.send("You took the " + createdItem.name + ".");
            else if (isModerator) {
                message.reply(currentPlayer.name + " successfully took the " + createdItem.name + ".");
                const member = guild.members.find(member => member.id === currentPlayer.id);
                member.user.send("You took the " + createdItem.name + ".");
            }

            var containingPhrase = createdItem.singleContainingPhrase;
            if (createdItem.pluralContainingPhrase !== "") containingPhrase += "," + createdItem.pluralContainingPhrase;

            sheet.getData(item[current].descriptionCell(), function (response) {
                const data = new Array(new Array(
                    createdItem.name,
                    createdItem.pluralName,
                    createdItem.uses,
                    createdItem.discreet,
                    createdItem.effect,
                    createdItem.cures,
                    containingPhrase,
                    response.data.values[0][0]
                ));
                sheet.updateData(createdItem.itemCells(), data);
            });

            const channel = guild.channels.find(channel => channel.name === currentPlayer.location);
            const logchannel = guild.channels.find(channel => channel.id === config.logChannel);

            // If the item is not discreet, notify everyone in the channel that it's been taken.
            if (!createdItem.discreet) {
                if (statuses.includes("concealed")) channel.send("A masked figure takes " + createdItem.singleContainingPhrase + ".");
                else {
                    channel.send(currentPlayer.name + " takes " + createdItem.singleContainingPhrase + ".");
                    if (config.concealedPlayer.member !== null && config.concealedPlayer.location === currentPlayer.location && !config.concealedPlayer.hidden) {
                        config.concealedPlayer.member.send(currentPlayer.name + " takes " + createdItem.singleContainingPhrase + ".");
                    }
                }
            }

            if (item[current].requires !== "") {
                // Item is mentioned in a puzzle's "Already Solved" message.
                var i = 0;
                for (i; i < config.puzzles.length; i++) {
                    if ((config.puzzles[i].name === item[current].requires)
                        && (config.puzzles[i].location === item[current].location))
                        break;
                }
                const descriptionCell = config.puzzles[i].formattedAlreadySolvedCell();
                const parsedDescriptionCell = config.puzzles[i].alreadySolvedCell();
                sheet.getDataFormulas(descriptionCell, function (response) {
                    const newDescription = parser.removeItem(response.data.values[0][0], item[current]);
                    sheet.updateCell(descriptionCell, newDescription[0]);
                    sheet.updateCell(parsedDescriptionCell, newDescription[1]);
                });

                // Post log message
                var time = new Date();
                logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " took " + item[current].name + " from " + item[current].requires + " in " + channel);
            }
            else if (item[current].sublocation === "") {
                // Item is mentioned in a room description.
                var i = 0;
                for (i; i < config.rooms.length; i++) {
                    if (config.rooms[i].name === item[current].location)
                        break;
                }
                for (var j = 0; j < config.rooms[i].exit.length; j++) {
                    const descriptionCell = config.rooms[i].exit[j].formattedDescriptionCell();
                    const parsedDescriptionCell = config.rooms[i].exit[j].descriptionCell();
                    sheet.getDataFormulas(descriptionCell, function (response) {
                        const newDescription = parser.removeItem(response.data.values[0][0], item[current]);
                        sheet.updateCell(descriptionCell, newDescription[0]);
                        sheet.updateCell(parsedDescriptionCell, newDescription[1]);
                    });
                }

                // Post log message
                var time = new Date();
                logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " took " + item[current].name + " from " + channel);
            }
            else {
                // Item is mentioned in an object description.
                var i = 0;
                for (i; i < config.objects.length; i++) {
                    if ((config.objects[i].name === item[current].sublocation)
                        && (config.objects[i].location === item[current].location))
                        break;
                }
                const descriptionCell = config.objects[i].formattedDescriptionCell();
                const parsedDescriptionCell = config.objects[i].descriptionCell();
                sheet.getDataFormulas(descriptionCell, function (response) {
                    const newDescription = parser.removeItem(response.data.values[0][0], item[current]);
                    sheet.updateCell(descriptionCell, newDescription[0]);
                    sheet.updateCell(parsedDescriptionCell, newDescription[1].replace(", Puzzles!M", ", Puzzles!N"));
                });

                // Post log message
                var time = new Date();
                logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " took " + item[current].name + " from " + item[current].sublocation + " in " + channel);
            }
        }
    }
    else message.reply("couldn't find \"" + input + "\".");

    if (isPlayer && message.channel.type !== "dm")
        message.delete().catch();
};

module.exports.help = {
    name: "take"
};