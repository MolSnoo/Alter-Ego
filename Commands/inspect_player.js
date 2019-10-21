const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);

const Narration = include(`${settings.dataDir}/Narration.js`);

module.exports.config = {
    name: "inspect_player",
    description: "Learn more about an object or item.",
    details: 'Tells you about an object or item in the room you\'re in. The description will be sent to you via DMs. '
        + 'An object is something in the room that you can interact with but not take with you. '
        + 'An item is something that you can both interact with and take with you. If you inspect an object, '
        + 'everyone in the room will see you inspect it. The same goes for very large items. '
        + 'You can also inspect items in your inventory. If you have an item with the same name as an item in the room you\'re currently in, '
        + 'you can specify that you want to inspect your item by adding "my" before the item name. '
        + `You can use "${settings.commandPrefix}inspect room" to get the description of the room you're currently in.`,
    usage: `${settings.commandPrefix}inspect desk\n`
        + `${settings.commandPrefix}examine knife\n`
        + `${settings.commandPrefix}investigate my knife\n`
        + `${settings.commandPrefix}inspect room`,
    usableBy: "Player",
    aliases: ["inspect", "investigate", "examine", "look"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0) {
        message.reply("you need to specify an object/item. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    const status = player.getAttributeStatusEffects("disable inspect");
    if (status.length > 0) return message.reply(`You cannot do that because you are **${status[0].name}**.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    // Before anything else, check if the player is trying to inspect the room.
    if (parsedInput === "ROOM") {
        new Narration(game, player, player.location, `${player.displayName} begins looking around the room.`).send();
        player.sendDescription(player.location.descriptionCell());

        return;
    }

    // Check if the input is an object.
    const objects = game.objects.filter(object => object.location.name === player.location.name && object.accessible);
    var object = null;
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].name === parsedInput) {
            object = objects[i];
            break;
        }
    }

    if (object !== null) {
        new Narration(game, player, player.location, `${player.displayName} begins inspecting the ${object.name}.`).send();
        player.sendDescription(object.descriptionCell());

        for (let i = 0; i < game.players_alive.length; i++) {
            const hiddenPlayer = game.players_alive[i];
            if (hiddenPlayer.location.name === player.location.name && hiddenPlayer.hidingSpot === object.name) {
                player.member.send(`While inspecting the ${object.name}, you find ${hiddenPlayer.displayName} hiding!`);
                hiddenPlayer.cure(game, "hidden", false, false, true, true);
                hiddenPlayer.member.send(`You've been found by ${player.displayName}. You are no longer hidden.`);
                break;
            }
        }

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.logChannel.send(`${time} - ${player.name} inspected ${object.name} in ${player.location.channel}`);

        return;
    }

    var onlySearchInventory = false;
    if (parsedInput.startsWith("MY ")) onlySearchInventory = true;

    if (!onlySearchInventory) {
        // Now check if the input is an item.
        const items = game.items.filter(item => item.location.name === player.location.name
            && item.accessible
            && (item.quantity > 0 || isNaN(item.quantity)));
        var item = null;
        for (let i = 0; i < items.length; i++) {
            if (items[i].name === parsedInput || items[i].pluralName === parsedInput) {
                item = items[i];
                break;
            }
        }

        if (item !== null) {
            if (!item.discreet) new Narration(game, player, player.location, `${player.displayName} begins inspecting ${item.singleContainingPhrase}.`).send();
            player.sendDescription(item.descriptionCell());

            const time = new Date().toLocaleTimeString();
            game.logChannel.send(`${time} - ${player.name} inspected ${item.name} in ${player.location.channel}`);

            return;
        }
    }

    // Finally, check if the input is an item in the player's inventory.
    for (let i = 0; i < player.inventory.length; i++) {
        parsedInput = parsedInput.replace("MY ", "");
        if (player.inventory[i].name === parsedInput) {
            const item = player.inventory[i];
            if (!item.discreet) new Narration(game, player, player.location, `${player.displayName} takes out ${item.singleContainingPhrase} and begins inspecting it.`).send();
            player.sendDescription(item.descriptionCell());

            const time = new Date().toLocaleTimeString();
            game.logChannel.send(`${time} - ${player.name} inspected ${item.name} from their inventory in ${player.location.channel}`);

            return;
        }
    }

    return message.reply(`couldn't find "${input}".`);
};
