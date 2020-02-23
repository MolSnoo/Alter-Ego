const settings = include('settings.json');

module.exports.config = {
    name: "unequip_moderator",
    description: "Unequips an item for a player.",
    details: "Unequips an item the given player currently has equipped. The unequipped item will be placed in one of the player's free hands. "
        + "You can specify which equipment slot you want the item to be unequipped from. Any item can be unequipped, whether it's equippable "
        + "or not. People in the room will see the player unequip an item, regardless of its size.",
    usage: `${settings.commandPrefix}unequip lavris's mask\n`
        + `${settings.commandPrefix}unequip keiko lab coat\n`
        + `${settings.commandPrefix}unequip cara's sweater from shirt\n`
        + `${settings.commandPrefix}unequip aria large purse from glasses`,
    usableBy: "Moderator",
    aliases: ["unequip"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2) {
        message.reply("you need to specify a player and an item. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase().replace(/'s/g, "")) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return message.reply(`player "${args[0]}" not found.`);

    // First, check if the player has a free hand.
    var hand = "";
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === "RIGHT HAND" && player.inventory[slot].equippedItem === null) {
            hand = "RIGHT HAND";
            break;
        }
        else if (player.inventory[slot].name === "LEFT HAND" && player.inventory[slot].equippedItem === null) {
            hand = "LEFT HAND";
            break;
        }
        // If it's reached the left hand and it has an equipped item, both hands are taken. Stop looking.
        else if (player.inventory[slot].name === "LEFT HAND")
            break;
    }
    if (hand === "") return message.reply(`${player.name} does not have a free hand to unequip an item.`);

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");
    var newArgs = parsedInput.split(" FROM ");
    var itemName = newArgs[0].trim();
    var slotName = newArgs[1] ? newArgs[1] : "";

    var item = null;
    for (let i = 0; i < player.inventory.length; i++) {
        if (slotName !== "" && slotName !== "RIGHT HAND" && slotName !== "LEFT HAND" && player.inventory[i].name === slotName) {
            if (player.inventory[i].equippedItem !== null && player.inventory[i].equippedItem.name === itemName) {
                item = player.inventory[i].equippedItem;
                break;
            }
            else return message.reply(`couldn't find "${itemName}" equipped to ${slotName}.`);
        }
        else if (slotName === "" && player.inventory[i].equippedItem !== null && player.inventory[i].equippedItem.name === itemName) {
            item = player.inventory[i].equippedItem;
            slotName = player.inventory[i].name;
            break;
        }
    }
    if (slotName !== "" && item === null) return message.reply(`couldn't find equipment slot "${slotName}".`);
    if (item === null) return message.reply(`couldn't find equipped item "${itemName}".`);

    player.unequip(game, item, slotName, hand, bot);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.logChannel.send(`${time} - ${player.name} forcefully unequipped ${item.name} from ${slotName} in ${player.location.channel}`);

    message.channel.send(`Successfully unequipped ${item.name} from ${player.name}'s ${slotName}.`);

    return;
};
