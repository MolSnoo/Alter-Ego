const settings = require('../Configs/settings.json');

module.exports.config = {
    name: "use_moderator",
    description: "Uses an item in the given player's inventory.",
    details: "Uses an item in one of the given player's hands. You can specify a second player for the first player to use their item on. "
        + "If you do, players in the room will be notified, so you should generally give a string for the bot to use, "
        + 'otherwise the bot will say "[player] uses [item single containing phrase] on [target]." which may not sound right. '
        + "Both players must be in the same room. If no second player is given, the first player will use the item on themself. "
        + "Note that you cannot solve puzzles using this command. To do that, use the puzzle command.",
    usage: `${settings.commandPrefix}use princeton first aid kit\n`
        + `${settings.commandPrefix}use celia's food\n`
        + `${settings.commandPrefix}use pollux first aid spray ximena "Pollux uncaps and applies a can of FIRST AID SPRAY to Ximena's wounds."\n`
        + `${settings.commandPrefix}use ayaka's black lipstick on wynne "Ayaka applies a tube of BLACK LIPSTICK to Wynne's lips."`,
    usableBy: "Moderator",
    aliases: ["use"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2)
        return game.messageHandler.addReply(message, `You need to specify a player and an item in their inventory. Usage:\n${exports.config.usage}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase().replace(/'s/g, "")) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    var input = args.join(" ");

    // If an announcement is present, it's the next easiest thing to find.
    var announcement = "";
    var index = input.indexOf('"');
    if (index === -1) index = input.indexOf('“');
    if (index !== -1) {
        announcement = input.substring(index + 1);
        // Remove the announcement from the list of arguments.
        input = input.substring(0, index - 1);
        args = input.split(" ");
        // Now clean up the announcement text.
        if (announcement.endsWith('"') || announcement.endsWith('”'))
            announcement = announcement.substring(0, announcement.length - 1);
        if (!announcement.endsWith('.') && !announcement.endsWith('!'))
            announcement += '.';
    }

    var target = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        // If "on" precedes the target's name, remove both args.
        if (args.length > 1 && game.players_alive[i].name.toLowerCase() === args[args.length - 1].toLowerCase() && args[args.length - 2].toLowerCase() === "on") {
            target = game.players_alive[i];
            args.splice(args.length - 2, 2);
            break;
        }
        if (game.players_alive[i].name.toLowerCase() === args[args.length - 1].toLowerCase()) {
            target = game.players_alive[i];
            args.splice(args.length - 1, 1);
            break;
        }
    }
    if (announcement !== "" && target === null) return game.messageHandler.addReply(message, `Player "${args[args.length - 1]}" not found.`);
    if (target !== null && player.name === target.name) return game.messageHandler.addReply(message, `${player.name} cannot use an item on ${player.originalPronouns.ref} with this command syntax.`);
    if (target !== null && player.location.name !== target.location.name) return game.messageHandler.addReply(message, `${player.name} and ${target.name} are not in the same room.`);

    // args should now only contain the name of the item.
    input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // First, find the item in the player's inventory.
    var item = null;
    // Get references to the right and left hand equipment slots so we don't have to iterate through the player's inventory to find them every time.
    var rightHand = null;
    var leftHand = null;
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === "RIGHT HAND")
            rightHand = player.inventory[slot];
        else if (player.inventory[slot].name === "LEFT HAND")
            leftHand = player.inventory[slot];
    }
    // Check for the identifier first.
    if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.identifier !== "" && rightHand.equippedItem.identifier === parsedInput)
        item = rightHand.equippedItem;
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.identifier !== "" && leftHand.equippedItem.identifier === parsedInput)
        item = leftHand.equippedItem;
    // Check for the prefab ID next.
    else if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.prefab.id === parsedInput)
        item = rightHand.equippedItem;
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.prefab.id === parsedInput)
        item = leftHand.equippedItem;
    // Check for the name last.
    else if (item === null && rightHand.equippedItem !== null && rightHand.equippedItem.name === parsedInput)
        item = rightHand.equippedItem;
    else if (item === null && leftHand.equippedItem !== null && leftHand.equippedItem.name === parsedInput)
        item = leftHand.equippedItem;
    if (item === null) return game.messageHandler.addReply(message, `Couldn't find item "${parsedInput}" in either of ${player.name}'s hands.`);

    // Use the player's item.
    const itemName = item.identifier ? item.identifier : item.prefab.id;
    if (target !== null) {
        const response = player.use(game, item, target, announcement);
        if (response === "" || !response) {
            game.messageHandler.addGameMechanicMessage(message.channel, `Successfully used ${itemName} on ${target.name} for ${player.name}.`);
            // Post log message.
            const time = new Date().toLocaleTimeString();
            game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly used ${itemName} from ${player.originalPronouns.dpos} inventory on ${target.name} in ${player.location.channel}`);
            return;
        }
        else if (response.startsWith("That item has no programmed use")) return game.messageHandler.addReply(message, "That item has no programmed use.");
        else if (response.startsWith("You attempt to use the")) return game.messageHandler.addReply(message, `${itemName} currently has no effect on ${target.name}.`);
        else return game.messageHandler.addReply(message, response);
    }
    else {
        const response = player.use(game, item);
        if (response === "" || !response) {
            game.messageHandler.addGameMechanicMessage(message.channel, `Successfully used ${itemName} for ${player.name}.`);
            // Post log message.
            const time = new Date().toLocaleTimeString();
            game.messageHandler.addLogMessage(game.logChannel, `${time} - ${player.name} forcibly used ${itemName} from ${player.originalPronouns.dpos} inventory in ${player.location.channel}`);
            return;
        }
        else if (response.startsWith("That item has no programmed use")) return game.messageHandler.addReply(message, "That item has no programmed use.");
        else if (response.startsWith("You attempt to use the")) return game.messageHandler.addReply(message, `${itemName} currently has no effect on ${player.name}.`);
        else return game.messageHandler.addReply(message, response);
    }
};
