const settings = include('settings.json');

module.exports.config = {
    name: "equip_moderator",
    description: "Equips an item for a player.",
    details: "Equips an item currently in the given player's hand. You can specify which equipment slot you want the item to be equipped to, if you want. "
        + "Any item (whether equippable or not) can be equipped to any slot using this command. People in the room will see the player equip an item, "
        + "regardless of its size.",
    usage: `${settings.commandPrefix}equip lavris's mask\n`
        + `${settings.commandPrefix}equip keiko lab coat\n`
        + `${settings.commandPrefix}equip cara's sweater to shirt\n`
        + `${settings.commandPrefix}equip aria large purse to glasses`,
    usableBy: "Moderator",
    aliases: ["equip"],
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

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");
    var newArgs = parsedInput.split(" TO ");
    var itemName = newArgs[0].trim();
    var slotName = newArgs[1] ? newArgs[1] : "";

    var item = null;
    var hand = "";
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === "RIGHT HAND" && player.inventory[slot].equippedItem !== null && player.inventory[slot].equippedItem.name === itemName) {
            item = player.inventory[slot].equippedItem;
            hand = "RIGHT HAND";
            break;
        }
        else if (player.inventory[slot].name === "LEFT HAND" && player.inventory[slot].equippedItem !== null && player.inventory[slot].equippedItem.name === itemName) {
            item = player.inventory[slot].equippedItem;
            hand = "LEFT HAND";
            break;
        }
        // If it's reached the left hand and it doesn't have the desired item, neither hand has it. Stop looking.
        else if (player.inventory[slot].name === "LEFT HAND")
            break;
    }
    if (item === null) return message.reply(`couldn't find item "${itemName}" in either of ${player.name}'s hands.`);

    // If no slot name was given, pick the first one this item can be equipped to.
    if (slotName === "") slotName = item.prefab.equipmentSlots[0];

    let foundSlot = false;
    for (let i = 0; i < player.inventory.length; i++) {
        if (slotName && player.inventory[i].name === slotName) {
            foundSlot = true;
            if (player.inventory[i].equippedItem !== null) return message.reply(`cannot equip items to ${slotName} because ${player.inventory[i].equippedItem.name} is already equipped to it.`);
        }
    }
    if (!foundSlot) return message.reply(`couldn't find equipment slot "${slotName}".`);

    player.equip(game, item, slotName, hand, bot);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.logChannel.send(`${time} - ${player.name} forcefully equipped ${item.name} to ${slotName} in ${player.location.channel}`);

    message.channel.send(`Successfully equipped ${item.name} to ${player.name}'s ${slotName}.`);

    return;
};
