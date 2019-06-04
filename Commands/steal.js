const discord = require("discord.js");
const settings = require("../settings.json");

const InventoryItem = require("../House-Data/InventoryItem.js");
const sheet = require("../House-Data/sheets.js");
const roll = require("./roll.js");

//>steal [player]

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
        .setDescription(`${settings.prefix}steal [player]`);

    if (!config.game) return message.reply("There is no game currently running");

    if (!args.length) {
        message.reply("you need to choose a player to steal from. Usage:");
        message.channel.send(usage);
        return;
    }

    var input = args.join(" ");

    if ((message.channel.parentID !== config.parent_channel)
        && (!isPlayer || message.channel.type !== "dm")) return;

    const statuses = currentPlayer.statusString;
    if (statuses.includes("asleep")) return message.reply("you are **asleep**. You cannot do anything.");
    if (statuses.includes("unconscious")) return message.reply("you are **unconscious**. You cannot do anything.");
    if (statuses.includes("heated")) return message.reply("the situation is **heated**. Moderator intervention is required.");
    if (statuses.includes("hidden")) return message.reply(`you are currently **hidden**. Use "${settings.prefix}hide unhide" first.`);
    if (statuses.includes("restricted")) return message.reply("you are **restricted**. You cannot move.");

    // Make sure the player has free space in their inventory.
    var playerHasFreeSpace = false;
    var slot = 0;
    for (slot; slot < currentPlayer.inventory.length; slot++) {
        if (currentPlayer.inventory[slot].name === null || currentPlayer.inventory[slot].name === undefined) {
            playerHasFreeSpace = true;
            break;
        }
    }
    if (!playerHasFreeSpace) return message.reply("cannot steal an item because your inventory is full.");

    // Get the victim.
    var victim = null;
    // Player cannot steal from themselves.
    if (input.toLowerCase() === currentPlayer.name.toLowerCase()) return message.reply("you can't steal from yourself.");
    for (var i = 0; i < config.players_dead.length; i++) {
        if (config.players_dead[i].name.toLowerCase() === input.toLowerCase()) return message.reply("can't steal from " + config.players_dead[i].name + " because they aren't in the room with you.");
    }
    for (var i = 0; i < config.players_alive.length; i++) {
        // Check if player exists and is in the same room.
        if ((config.players_alive[i].name.toLowerCase() === input.toLowerCase())
            && (config.players_alive[i].location === currentPlayer.location)) {
            // Check statuses that would prohibit the player from stealing from someone in the room.
            if (config.players_alive[i].statusString.includes("hidden") || config.players_alive[i].statusString.includes("concealed"))
                return message.reply("can't steal from " + config.players_alive[i].name + " because they aren\'t in the room with you.");
            // If there are no interfering status effects, they are the victim.
            victim = config.players_alive[i];
            break;
        }
        // If player exists but is not in the same room, return error.
        else if (config.players_alive[i].name.toLowerCase() === input.toLowerCase()) return message.reply("can't steal from " + config.players_alive[i].name + " because they aren't in the room with you.");
    }
    if (victim === null) return message.reply("couldn't find player \"" + input + "\". Make sure you spelled it right.");
    const guild = bot.guilds.first();
    const victimMember = guild.members.find(member => member.id === victim.id);
    const channel = guild.channels.find(channel => channel.name === currentPlayer.location);
    const logchannel = guild.channels.find(channel => channel.id === config.logChannel);

    // Make sure the victim has items first.
    var hasItems = false;
    for (var i = 0; i < victim.inventory.length; i++) {
        if (victim.inventory[i].name !== null) {
            hasItems = true;
            break;
        }
    }

    if (hasItems) {
        // Randomly select an item to be stolen.
        var index = Math.floor(Math.random() * victim.inventory.length);
        while (!victim.inventory[index] || victim.inventory[index].name === null)
            index = Math.floor(Math.random() * victim.inventory.length);
        // Determine how successful the player is.
        var dieRoll = roll.rollDie(currentPlayer, victim);
        if (victim.statusString.includes("unconscious")) dieRoll.number = 6;                        // If the victim is unconscious, the player automatically succeeds.
        if (victim.statusString.includes("restricted") && dieRoll.number < 3) dieRoll.number = 3;   // If the victim is unable to move, then the player can't fail.
        if (!victim.inventory[index].discreet && dieRoll.number > 4) dieRoll.number = 4;            // If the item isn't discreet, the victim will always notice.
        
        if (dieRoll.number >= 3) {
            const copiedItem = new InventoryItem(
                victim.inventory[index].name,
                victim.inventory[index].pluralName,
                victim.inventory[index].uses,
                victim.inventory[index].discreet,
                victim.inventory[index].effect,
                victim.inventory[index].cures,
                victim.inventory[index].singleContainingPhrase,
                victim.inventory[index].pluralContainingPhrase,
                currentPlayer.inventory[slot].row
            );
            currentPlayer.inventory[slot] = copiedItem;

            var containingPhrase = copiedItem.singleContainingPhrase;
            if (copiedItem.pluralContainingPhrase !== "") containingPhrase += "," + copiedItem.pluralContainingPhrase;

            const itemDescription = await fetchDescription(victim.inventory[index].descriptionCell());
            const data = new Array(new Array(
                copiedItem.name,
                copiedItem.pluralName,
                copiedItem.uses,
                copiedItem.discreet,
                copiedItem.effect,
                copiedItem.cures,
                containingPhrase,
                itemDescription
            ));
            sheet.updateData(copiedItem.itemCells(), data);

            // Delete stolen item from victim's inventory.
            victim.inventory[index].name = null;
            victim.inventory[index].pluralName = null;
            victim.inventory[index].uses = null;
            victim.inventory[index].discreet = null;
            victim.inventory[index].effect = null;
            victim.inventory[index].cures = null;
            victim.inventory[index].singleContainingPhrase = null;
            victim.inventory[index].pluralContainingPhrase = null;
            sheet.updateData(victim.inventory[index].itemCells(), new Array(new Array("NULL", "", "", "", "", "", "", "")));

            // Decide what messages to send.
            if (dieRoll.number >= 5) {
                message.author.send("You stole " + copiedItem.singleContainingPhrase + " from " + victim.name + " without them noticing!");
            }
            else {
                var thief;
                if (statuses.includes("concealed")) thief = "A masked figure";
                else thief = currentPlayer.name;

                if (victim.statusString.includes("unconscious"))
                    message.author.send("You stole " + copiedItem.singleContainingPhrase + " from " + victim.name + " without them noticing!");
                else {
                    message.author.send("You stole " + copiedItem.singleContainingPhrase + " from " + victim.name + ", but they seem to have noticed.");
                    victimMember.send(thief + " stole " + copiedItem.singleContainingPhrase + " from you!");
                }

                if (!copiedItem.discreet)
                    channel.send(thief + " steals " + copiedItem.singleContainingPhrase + " from " + victim.name + ".");
            }
            // Post log message
            var time = new Date();
            logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " stole " + copiedItem.name + " from " + victim.name + " in " + channel);
        }
        else {
            // Fail to steal the item and notify the victim.
            message.author.send("You tried to steal " + victim.name + "'s " + victim.inventory[index].name + ", but they noticed you before you could.");
            if (statuses.includes("concealed"))
                victimMember.send("A masked figure attempted to steal your " + victim.inventory[index].name + ", but you noticed in time!");
            else
                victimMember.send(currentPlayer.name + " attempted to steal your " + victim.inventory[index].name + ", but you noticed in time!");
            // Post log message
            var time = new Date();
            logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " attempted and failed to steal " + victim.inventory[index].name + " from " + victim.name + " in " + channel);
        }
    }
    else message.author.send("You tried to steal from " + victim.name + ", but they didn't have any items.");

    if (message.channel.type !== "dm")
        message.delete().catch();
};

function fetchDescription(descriptionCell) {
    return new Promise((resolve, reject) => {
        sheet.getData(descriptionCell, (response) => {
            resolve(response.data.values[0][0]);
        });
    });
}

module.exports.help = {
    name: "steal"
};