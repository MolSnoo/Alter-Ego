const settings = include('Configs/settings.json');

module.exports.config = {
    name: "unequip_player",
    description: "Unequips an item.",
    details: "Unequips an item you currently have equipped. The unequipped item will be placed in your hand, so you must have a free hand. "
        + "You can specify which equipment slot you want to unequip the item from, if you want. People in the room will see you unequip an item, "
        + "regardless of its size.",
    usage: `${settings.commandPrefix}unequip sweater\n`
        + `${settings.commandPrefix}unequip glasses from face`,
    usableBy: "Player",
    aliases: ["unequip", "u"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify an item. Usage:\n${exports.config.usage}`);

    const status = player.getAttributeStatusEffects("disable unequip");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

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
    if (hand === "") return game.messageHandler.addReply(message, "You do not have a free hand to unequip an item. Either drop an item you're currently holding or stash it in one of your equipped items.");

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var item = null;
    var slotName = "";
    for (let i = 0; i < player.inventory.length; i++) {
        if (parsedInput.endsWith(` FROM ${player.inventory[i].name}`)) {
            slotName = player.inventory[i].name;
            let itemName = parsedInput.substring(0, parsedInput.lastIndexOf(` FROM ${slotName}`)).trim();
            if (player.inventory[i].equippedItem === null) return game.messageHandler.addReply(message, `Nothing is equipped to ${slotName}.`);
            if (player.inventory[i].equippedItem.name === itemName) {
                item = player.inventory[i].equippedItem;
                break;
            }
            else return game.messageHandler.addReply(message, `Couldn't find "${itemName}" equipped to ${slotName}.`);
        }
        else if (player.inventory[i].equippedItem !== null && player.inventory[i].equippedItem.name === parsedInput) {
            item = player.inventory[i].equippedItem;
            slotName = player.inventory[i].name;
            break;
        }
    }
    if (slotName === "RIGHT HAND" || slotName === "LEFT HAND")
        return game.messageHandler.addReply(message, `You cannot unequip items from either of your hands. To get rid of this item, use the drop command.`);
    if (parsedInput.includes(" FROM ") && slotName === "") {
        slotName = parsedInput.substring(parsedInput.lastIndexOf(" FROM ") + " FROM ".length).trim();
        return game.messageHandler.addReply(message, `Couldn't find equipment slot "${slotName}".`);
    }
    if (item === null) return game.messageHandler.addReply(message, `Couldn't find equipped item "${parsedInput}".`);

    if (!item.prefab.equippable) return game.messageHandler.addReply(message, `You cannot unequip the ${item.name}.`);

    player.unequip(game, item, slotName, hand, bot);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} unequipped ${item.identifier ? item.identifier : item.prefab.id} from ${slotName} in ${player.location.channel}`);

    return;
};
