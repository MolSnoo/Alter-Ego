const settings = include('settings.json');

module.exports.config = {
    name: "unequip_player",
    description: "Unequips an item.",
    details: "Unequips an item you currently have equipped. The unequipped item will be placed in your hand, so you must have a free hand. "
        + "You can specify which equipment slot you want to unequip the item from, if you want. People in the room will see you unequip an item, "
        + "regardless of its size.",
    usage: `${settings.commandPrefix}unequip sweater\n`
        + `${settings.commandPrefix}unequip glasses from face`,
    usableBy: "Player",
    aliases: ["unequip"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0) {
        message.reply("you need to specify an item. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    const status = player.getAttributeStatusEffects("disable unequip");
    if (status.length > 0) return message.reply(`You cannot do that because you are **${status[0].name}**.`);

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
    if (hand === "") return message.reply("you do not have a free hand to unequip an item. Either drop an item you're currently holding or stash it in one of your equipped items.");

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

    if (!item.prefab.equippable) return message.reply(`you cannot unequip the ${itemName}.`);

    player.unequip(game, item, slotName, hand, bot);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.logChannel.send(`${time} - ${player.name} unequipped ${item.name} from ${slotName} in ${player.location.channel}`);
    
    return;
};
