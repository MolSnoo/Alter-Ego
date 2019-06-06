const discord = require("discord.js");
const settings = require("../settings.json");

const sheet = require("../House-Data/sheets.js");
const parser = require("../House-Data/parser.js");
const house = require("./gethousedata.js");
const status = require("./status.js");

//>drop [item] || >drop [item] [object]

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
    
    if (!config.room_categories.includes(message.channel.parentID)
        && (message.channel.id !== config.commandsChannel)
        && (!isPlayer || message.channel.type !== "dm")) return;

    let usage;
    if (isPlayer) {
        usage = new discord.RichEmbed()
            .setTitle("Command Help")
            .setColor("a42004")
            .setDescription(`${settings.prefix}drop [item] OR ${settings.prefix}drop [item] [object]`);
    }
    else if (isModerator) {
        usage = new discord.RichEmbed()
            .setTitle("Command Help")
            .setColor("a42004")
            .setDescription(`${settings.prefix}drop [item] [player] OR ${settings.prefix}drop [item] [object] [player]`);
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
    const guild = bot.guilds.first();
    const channel = guild.channels.find(channel => channel.name === currentPlayer.location);
    const logchannel = guild.channels.find(channel => channel.id === config.logChannel);
    const statuses = currentPlayer.statusString;

    // Check if the input is an item in the player's inventory.
    const inventory = currentPlayer.inventory;
    var hasItem = false;
    var objectName = "";

    var current = 0;
    for (current; current < inventory.length; current++) {
        if (parsedInput.startsWith(inventory[current].name)) {
            hasItem = true;
            objectName = parsedInput.substring(inventory[current].name.length + 1);
            break;
        }
    }

    // Check if object exists and that it can contain items.
    var preposition;
    var currentObject;
    var isPuzzle = false;
    var currentPuzzle;
    if (objectName === "") objectName = "FLOOR";
    for (var i = 0; i < config.objects.length; i++) {
        if (config.objects[i].name === objectName
            && config.objects[i].location === currentPlayer.location
            && config.objects[i].accessible) {
            if (config.objects[i].preposition === "") return message.reply("can't put items there.");
            else {
                preposition = config.objects[i].preposition;
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
                            else return message.reply("can't put items there.");
                        }
                    }
                }
                break;
            }
        }
    }

    if (!currentObject) return message.reply("couldn't find \"" + input.substring(inventory[current].name.length + 1) + "\".");

    if (hasItem) {
        const itemName = inventory[current].name;
        const itemPhrase = inventory[current].singleContainingPhrase;
        const discreet = inventory[current].discreet;

        const roomItems = config.items.filter(item => (item.location === currentPlayer.location));
        const objectItems = roomItems.filter(item => (item.sublocation === currentObject.name));
        var matchedIndex = new Array();
        for (var i = 0; i < roomItems.length; i++) {
            const currentItem = roomItems[i];
            // First check if the player is putting this item back in its original spot unmodified.
            if ((currentItem.name === inventory[current].name)
                && (currentItem.pluralName === inventory[current].pluralName)
                && (currentItem.location === currentPlayer.location)
                && ((!isPuzzle && currentItem.sublocation === currentObject.name) || (isPuzzle && currentItem.sublocation === ""))
                && (currentItem.uses === inventory[current].uses || (isNaN(currentItem.uses) && isNaN(inventory[current].uses))) // Fun fact: NaN does not equal NaN
                && (currentItem.discreet === inventory[current].discreet)
                && (currentItem.effect === inventory[current].effect)
                && (currentItem.cures === inventory[current].cures)
                && (currentItem.singleContainingPhrase === inventory[current].singleContainingPhrase)
                && (currentItem.pluralContainingPhrase === inventory[current].pluralContainingPhrase)) {
                matchedIndex.push(i);
            }
        }
        // The player is putting this item somewhere else, or it's changed somehow.
        if (matchedIndex.length === 0) {
            var containingPhrase = inventory[current].singleContainingPhrase;
            if (inventory[current].pluralContainingPhrase !== "") containingPhrase += "," + inventory[current].pluralContainingPhrase;
            const inventoryItemDescription = await fetchDescription(inventory[current].descriptionCell());
            const data = new Array(
                inventory[current].name,
                inventory[current].pluralName,
                currentPlayer.location,
                isPuzzle ? "" : currentObject.name,
                isPuzzle ? "=" + currentPuzzle.solvedCell() : "TRUE",
                isPuzzle ? currentPuzzle.name : "",
                "1",
                !isNaN(inventory[current].uses) ? inventory[current].uses : "",
                inventory[current].discreet ? "TRUE" : "FALSE",
                inventory[current].effect,
                inventory[current].cures,
                containingPhrase,
                inventoryItemDescription
            );
            // We want to insert this item near items with the same location and sublocation, so check if there are any first.
            if (objectItems.length !== 0 && objectItems[objectItems.length - 1].row !== config.items[config.items.length - 1].row) {
                sheet.insertRow(objectItems[objectItems.length - 1].itemCells(), data, function (response) {
                    house.getItems(config);
                });
            }
            // If there are none, it might just be that there are no items with that sublocation yet. Try to at least put it near items in the same room.
            else if (roomItems.length !== 0 && roomItems[roomItems.length - 1].row !== config.items[config.items.length - 1].row) {
                sheet.insertRow(roomItems[roomItems.length - 1].itemCells(), data, function (response) {
                    house.getItems(config);
                });
            }
            // If there are none, just insert it at the end of the sheet.
            else {
                sheet.appendRow(config.items[config.items.length - 1].itemCells(), data, function (response) {
                    house.getItems(config);
                });
            }

            // If the item is not discreet, notify everyone in the channel that it's been dropped.
            if (!discreet) {
                if (statuses.includes("concealed")) channel.send("A masked figure puts " + itemPhrase + " " + preposition + " the " + currentObject.name + ".");
                else {
                    channel.send(currentPlayer.name + " puts " + itemPhrase + " " + preposition + " the " + currentObject.name + ".");
                    if (config.concealedPlayer.member !== null && config.concealedPlayer.location === currentPlayer.location && !config.concealedPlayer.hidden) {
                        config.concealedPlayer.member.send(currentPlayer.name + " puts " + itemPhrase + " " + preposition + " the " + currentObject.name + ".");
                    }
                }
            }
            if (isPlayer) message.author.send("You discarded the " + itemName + ".");
            else if (isModerator) {
                message.reply(currentPlayer.name + " successfully discarded the " + itemName + ".");
                const member = guild.members.find(member => member.id === currentPlayer.id);
                member.user.send("You discarded the " + itemName + ".");
            }

            // Post log message
            var time = new Date();
            logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " dropped " + itemName + " " + preposition + " the " + currentObject.name + " in " + channel);
        }
        // The player is likely putting the item back.
        else {
            for (var j = 0; j < matchedIndex.length; j++) {
                const index = matchedIndex[j];
                const currentItem = roomItems[index];

                // Make sure the descriptions match.
                const itemDescription = await fetchDescription(currentItem.descriptionCell());
                const inventoryItemDescription = await fetchDescription(inventory[current].descriptionCell());
                // The items are the exact same, so put it back.
                if (itemDescription === inventoryItemDescription) {
                    var quantity = "";
                    if (!isNaN(currentItem.quantity)) {
                        currentItem.quantity++;
                        quantity = currentItem.quantity.toString();
                    }
                    
                    sheet.updateCell(currentItem.quantityCell(), quantity);

                    // If the item is not discreet, notify everyone in the channel that it's been taken.
                    if (!discreet) {
                        if (statuses.includes("concealed")) channel.send("A masked figure puts " + itemPhrase + " " + preposition + " the " + currentObject.name + ".");
                        else {
                            channel.send(currentPlayer.name + " puts " + itemPhrase + " " + preposition + " the " + currentObject.name + ".");
                            if (config.concealedPlayer.member !== null && config.concealedPlayer.location === currentPlayer.location && !config.concealedPlayer.hidden) {
                                config.concealedPlayer.member.send(currentPlayer.name + " puts " + itemPhrase + " " + preposition + " the " + currentObject.name + ".");
                            }
                        }
                    }
                    if (isPlayer) message.author.send("You discarded the " + itemName + ".");
                    else if (isModerator) {
                        message.reply(currentPlayer.name + " successfully discarded the " + itemName + ".");
                        const member = guild.members.find(member => member.id === currentPlayer.id);
                        member.user.send("You discarded the " + itemName + ".");
                    }

                    j = matchedIndex.length;

                    // Post log message
                    var time = new Date();
                    logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " dropped " + itemName + " " + preposition + " the " + currentObject.name + " in " + channel);
                }
                // The items are mostly the same, but their descriptions are different. Make a new item.
                else if (itemDescription !== inventoryItemDescription && j === matchedIndex.length - 1) {
                    var containingPhrase = currentItem.singleContainingPhrase;
                    if (currentItem.pluralContainingPhrase !== "") containingPhrase += "," + currentItem.pluralContainingPhrase;
                    const data = new Array(
                        currentItem.name,
                        currentItem.pluralName,
                        currentItem.location,
                        currentItem.sublocation,
                        isPuzzle ? "=" + currentPuzzle.solvedCell() : "TRUE",
                        currentItem.requires,
                        "1",
                        !isNaN(currentItem.uses) ? currentItem.uses : "",
                        currentItem.discreet ? "TRUE" : "FALSE",
                        currentItem.effect,
                        currentItem.cures,
                        containingPhrase,
                        inventoryItemDescription
                    );
                    sheet.insertRow(currentItem.itemCells(), data, function (response) {
                        house.getItems(config);
                    });

                    // If the item is not discreet, notify everyone in the channel that it's been taken.
                    if (!discreet) {
                        if (statuses.includes("concealed")) channel.send("A masked figure puts " + itemPhrase + " " + preposition + " the " + currentObject.name + ".");
                        else {
                            channel.send(currentPlayer.name + " puts " + itemPhrase + " " + preposition + " the " + currentObject.name + ".");
                            if (config.concealedPlayer.member !== null && config.concealedPlayer.location === currentPlayer.location && !config.concealedPlayer.hidden) {
                                config.concealedPlayer.member.send(currentPlayer.name + " puts " + itemPhrase + " " + preposition + " the " + currentObject.name + ".");
                            }
                        }
                    }
                    if (isPlayer) message.author.send("You discarded the " + itemName + ".");
                    else if (isModerator) {
                        message.reply(currentPlayer.name + " successfully discarded the " + itemName + ".");
                        const member = guild.members.find(member => member.id === currentPlayer.id);
                        member.user.send("You discarded the " + itemName + ".");
                    }
                    
                    // Post log message
                    var time = new Date();
                    logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " dropped " + itemName + " " + preposition + " the " + currentObject.name + " in " + channel);
                }
            }
        }

        if (isPuzzle) {
            const descriptionCell = currentPuzzle.formattedAlreadySolvedCell();
            const parsedDescriptionCell = currentPuzzle.alreadySolvedCell();
            const puzzleDescription = await fetchDescription(descriptionCell);
            if (puzzleDescription.includes('<')) {
                const newDescription = parser.addItem(puzzleDescription, inventory[current]);
                sheet.updateCell(descriptionCell, newDescription[0]);
                sheet.updateCell(parsedDescriptionCell, newDescription[1]);
            }
        }
        else {
            const descriptionCell = currentObject.formattedDescriptionCell();
            const parsedDescriptionCell = currentObject.descriptionCell();
            const objectDescription = await fetchDescription(descriptionCell);
            if (objectDescription.includes('<')) {
                const newDescription = parser.addItem(objectDescription, inventory[current]);
                sheet.updateCell(descriptionCell, newDescription[0]);
                sheet.updateCell(parsedDescriptionCell, newDescription[1].replace(", Puzzles!M", ", Puzzles!N"));
            }
        }

        if (itemName === "MASK") {
            if (statuses.includes("concealed")) {
                var concealedStatus;
                for (var i = 0; i < config.statusEffects.length; i++) {
                    if (config.statusEffects[i].name === "concealed") {
                        concealedStatus = config.statusEffects[i];
                        break;
                    }
                }
                status.cure(currentPlayer, concealedStatus, config, bot, true);
            }
        }

        inventory[current].name = null;
        inventory[current].pluralName = null;
        inventory[current].uses = null;
        inventory[current].discreet = null;
        inventory[current].effect = null;
        inventory[current].cures = null;
        inventory[current].singleContainingPhrase = null;
        inventory[current].pluralContainingPhrase = null;
        sheet.updateData(inventory[current].itemCells(), new Array(new Array("NULL", "", "", "", "", "", "", "")));
    }
    else message.reply("couldn't find \"" + input + "\" in your inventory. Contact a moderator if you believe this to be a mistake.");

    if (isPlayer && message.channel.type !== "dm")
        message.delete().catch();
};

function fetchDescription(descriptionCell) {
    return new Promise((resolve, reject) => {
        sheet.getDataFormulas(descriptionCell, (response) => {
            resolve(response.data.values[0][0]);
        });
    });
}

module.exports.help = {
    name: "drop"
};