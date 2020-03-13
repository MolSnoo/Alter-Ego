const settings = include('settings.json');

module.exports.config = {
    name: "craft_moderator",
    description: "Crafts two items in a player's inventory together.",
    details: 'Creates a new item using the two items in the given player\'s hand. The names of the items must be separated by "with" or "and". '
        + "If no recipe for those two items exists, the items cannot be crafted together. "
        + "Note that this command can also be used to use one item on another item, which may produce something new.",
    usage: `${settings.commandPrefix}craft chris drain cleaner and plastic bottle\n`
        + `${settings.commandPrefix}combine keiko's bread and cheese\n`
        + `${settings.commandPrefix}mix finn red vial with blue vial\n`
        + `${settings.commandPrefix}craft dayne's soap with knife`,
    usableBy: "Moderator",
    aliases: ["craft", "combine", "mix"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 4) {
        message.reply('you need to specify a player and two items separated by "with" or "and". Usage:');
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

    if (!parsedInput.includes(" WITH ") && !parsedInput.includes(" AND ")) {
        message.reply('you need to specify two items separated by "with" or "and". Usage:');
        message.channel.send(exports.config.usage);
        return;
    }

    var rightHand = null;
    var leftHand = null;
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === "RIGHT HAND") rightHand = player.inventory[slot];
        else if (player.inventory[slot].name === "LEFT HAND") leftHand = player.inventory[slot];
    }

    // Now find the item in the player's inventory.
    var item1 = null;
    var item2 = null;
    let rightFirst = false;
    if (rightHand.equippedItem !== null) {
        if (parsedInput.startsWith(rightHand.equippedItem.name + " WITH ") || parsedInput.startsWith(rightHand.equippedItem.name + " AND ")) {
            item1 = rightHand.equippedItem;
            rightFirst = true;
        }
        else if (parsedInput.endsWith(" WITH " + rightHand.equippedItem.name) || parsedInput.endsWith(" AND " + rightHand.equippedItem.name))
            item1 = rightHand.equippedItem;
    }
    if (leftHand.equippedItem !== null) {
        if (rightFirst && (parsedInput.endsWith(" WITH " + leftHand.equippedItem.name) || parsedInput.endsWith(" AND " + leftHand.equippedItem.name))
            || !rightFirst && (parsedInput.startsWith(leftHand.equippedItem.name + " WITH ") || parsedInput.startsWith(leftHand.equippedItem.name + " AND ")))
            item2 = leftHand.equippedItem;
    }

    let item1Name = "";
    let item2Name = "";
    if (item1 === null && item2 !== null) {
        item1Name = parsedInput.replace(item2.name, "").replace(" WITH ", "").replace(" AND ", "");
        return message.reply(`couldn't find item "${item1Name}" in either of ${player.name}'s hands.`);
    }
    else if (item1 !== null && item2 === null) {
        item2Name = parsedInput.replace(item1.name, "").replace(" WITH ", "").replace(" AND ", "");
        return message.reply(`couldn't find item "${item2Name}" in either of ${player.name}'s hands.`);
    }
    else if (item1 === null && item2 === null) {
        if (parsedInput.includes(" WITH ")) args = parsedInput.split(" WITH ");
        else if (parsedInput.includes(" AND ")) args = parsedInput.split(" AND ");
        item1Name = args[0];
        item2Name = args[1];
        return message.reply(`couldn't find items "${item1Name}" and "${item2Name}" in either of ${player.name}'s hands.`);
    }

    let ingredients = [item1, item2].sort(function (a, b) {
        if (a.prefab.id < b.prefab.id) return -1;
        if (a.prefab.id > b.prefab.id) return 1;
        return 0;
    });

    const recipes = game.recipes.filter(recipe => recipe.ingredients.length === 2 && recipe.objectTag === "");
    var recipe = null;
    for (let i = 0; i < recipes.length; i++) {
        if (recipes[i].ingredients[0].id === ingredients[0].prefab.id && recipes[i].ingredients[1].id === ingredients[1].prefab.id) {
            recipe = recipes[i];
            break;
        }
    }
    if (recipe === null) return message.reply(`couldn't find recipe requiring ${ingredients[0].name} and ${ingredients[1].name}.`);

    item1Name = ingredients[0].prefab.id;
    item2Name = ingredients[1].prefab.id;
    const productString = recipe.products.length === 2 ? `${recipe.products[0].id} and ${recipe.products[1].id}` :
        recipe.products.length === 1 ? `${recipe.products[0].id}` : "nothing";

    player.craft(game, ingredients[0], ingredients[1], recipe);

    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.logChannel.send(`${time} - ${player.name} forcefully crafted ${productString} from ${item1Name} and ${item2Name} in ${player.location.channel}`);

    message.channel.send(`Successfully crafted ${productString} from ${item1Name} and ${item2Name} for ${player.name}.`);

    return;
};
