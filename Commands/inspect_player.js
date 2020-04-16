const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);

const Narration = include(`${settings.dataDir}/Narration.js`);

module.exports.config = {
    name: "inspect_player",
    description: "Learn more about an object, item, or player.",
    details: 'Tells you about an object, item, or player in the room you\'re in. The description will be sent to you via DMs. '
        + 'An object is something in the room that you can interact with but not take with you. '
        + 'An item is something that you can both interact with and take with you. If you inspect an object, '
        + 'everyone in the room will see you inspect it. The same goes for very large items. '
        + 'You can also inspect items in your inventory. If you have an item with the same name as an item in the room you\'re currently in, '
        + 'you can specify that you want to inspect your item by adding "my" before the item name. '
        + 'You can even inspect visible items in another player\'s inventory by adding "[player name]\'s" before the item name. No one will '
        + 'see you do this, however you will receive slightly less info when inspecting another player\'s items. '
        + `You can use "${settings.commandPrefix}inspect room" to get the description of the room you're currently in.`,
    usage: `${settings.commandPrefix}inspect desk\n`
        + `${settings.commandPrefix}examine knife\n`
        + `${settings.commandPrefix}investigate my knife\n`
        + `${settings.commandPrefix}look faust\n`
        + `${settings.commandPrefix}examine an individual wearing a mask\n`
        + `${settings.commandPrefix}look marielle's glasses\n`
        + `${settings.commandPrefix}investigate an individual wearing a bucket's shirt\n`
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
        player.sendDescription(player.location.description, player.location);

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
        player.sendDescription(object.description, object);

        for (let i = 0; i < game.players_alive.length; i++) {
            const hiddenPlayer = game.players_alive[i];
            if (hiddenPlayer.location.name === player.location.name && hiddenPlayer.hidingSpot === object.name) {
                player.notify(`While inspecting the ${object.name}, you find ${hiddenPlayer.displayName} hiding!`);
                hiddenPlayer.cure(game, "hidden", false, false, true);
                hiddenPlayer.notify(`You've been found by ${player.displayName}. You are no longer hidden.`);
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
            if (items[i].prefab.name === parsedInput || items[i].prefab.pluralName === parsedInput) {
                item = items[i];
                break;
            }
        }

        if (item !== null) {
            if (!item.prefab.discreet) new Narration(game, player, player.location, `${player.displayName} begins inspecting ${item.prefab.singleContainingPhrase}.`).send();
            player.sendDescription(item.description, item);

            const time = new Date().toLocaleTimeString();
            game.logChannel.send(`${time} - ${player.name} inspected ${item.prefab.id} in ${player.location.channel}`);

            return;
        }
    }

    // Check if the input is an item in the player's inventory.
    const inventory = game.inventoryItems.filter(item => item.player.id === player.id && item.prefab !== null);
    for (let i = 0; i < inventory.length; i++) {
        parsedInput = parsedInput.replace("MY ", "").replace(`${player.name.toUpperCase()}S `, "");
        if (inventory[i].prefab.name === parsedInput && inventory[i].quantity > 0) {
            const item = inventory[i];
            if (!item.prefab.discreet) new Narration(game, player, player.location, `${player.displayName} takes out ${item.prefab.singleContainingPhrase} and begins inspecting it.`).send();
            player.sendDescription(item.description, item);

            const time = new Date().toLocaleTimeString();
            game.logChannel.send(`${time} - ${player.name} inspected ${item.prefab.id} from their inventory in ${player.location.channel}`);

            return;
        }
    }

    // Check if the input is a player in the room.
    for (let i = 0; i < player.location.occupants.length; i++) {
        let occupant = player.location.occupants[i];
        const possessive = occupant.displayName.toUpperCase() + "S ";
        if (occupant.displayName.toUpperCase() === parsedInput) {
            // Don't let player inspect themselves.
            if (occupant.id === player.id) return message.reply(`can't inspect yourself.`);
            player.sendDescription(occupant.description, occupant);

            const time = new Date().toLocaleTimeString();
            game.logChannel.send(`${time} - ${player.name} inspected ${occupant.name} in ${player.location.channel}`);

            return;
        }
        else if (parsedInput.startsWith(possessive)) {
            // Don't let the player inspect their own items this way.
            if (occupant.id === player.id) return message.reply(`can't inspect your own items this way. Use "my" instead of your name.`);
            parsedInput = parsedInput.replace(possessive, "");
            // Only equipped items should be an option.
            const inventory = game.inventoryItems.filter(item => item.player.id === occupant.id && item.prefab !== null && item.containerName === "" && item.container === null);
            for (let j = 0; j < inventory.length; j++) {
                if (inventory[j].prefab.name === parsedInput && (inventory[j].equipmentSlot !== "LEFT HAND" && inventory[j].equipmentSlot !== "RIGHT HAND" || !inventory[j].prefab.discreet)) {
                    // Make sure the item isn't covered by anything first.
                    const coveringItems = inventory.filter(item =>
                        item.equipmentSlot !== "RIGHT HAND" &&
                        item.equipmentSlot !== "LEFT HAND" &&
                        item.prefab.coveredEquipmentSlots.includes(inventory[j].equipmentSlot)
                    );
                    if (coveringItems.length === 0) {
                        // Clear out any il tags in the description.
                        let description = inventory[j].description.replace(/(<(il)(\s[^>]+?)*>)[\s\S]+?(<\/\2>)/g, "$1$4");
                        player.sendDescription(description, inventory[j]);

                        const time = new Date().toLocaleTimeString();
                        game.logChannel.send(`${time} - ${player.name} inspected ${inventory[j].prefab.id} from ${occupant.name}'s inventory in ${player.location.channel}`);

                        return;
                    }
                }
            }
        }
    }

    return message.reply(`couldn't find "${input}".`);
};
