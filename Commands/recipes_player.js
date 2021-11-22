const settings = include('settings.json');
const discord = require('discord.js');

module.exports.config = {
    name: "recipes_player",
    description: "Lists all recipes available to you.",
    details: "Lists all recipes you can carry out with the items in your inventory and items in the room. Note that only recipes whose ingredients "
        + "include at least one item currently in your inventory are listed. Recipes are split up by crafting recipes and object recipes.\n\n"
        + `To carry out a crafting recipe, you must have both of the ingredients in your hands and combine them with the \`${settings.commandPrefix}craft\``
        + `command. Crafting recipes will be completed instantaneously.\n\n`
        + `To carry out an object recipe, you must use the \`${settings.commandPrefix}drop\` command to place all the ingredients in the appropriate object, and `
        + `then activate the object with the \`${settings.commandPrefix}use\` command. Object recipes take a certain amount of time to be completed. `
        + "If it worked correctly, you will receive a message indicating that the process has begun, and another message when it is completed. "
        + "You will not receive a message if the object was already activated when all of the ingredients were put in, though the recipe "
        + "will still be carried out so long as all of the ingredients are in place.",
    usage: `${settings.commandPrefix}recipes`,
    usableBy: "Player",
    aliases: ["recipes"]
};

const craftingRecipesDescription = `These are recipes you can carry out using the \`${settings.commandPrefix}craft\` command. Note that only recipes whose ingredients include at least one item currently in your inventory are listed.`;
const objectRecipesDescription = `These are recipes you can carry out using the \`${settings.commandPrefix}use\` command on an object after dropping all of the ingredients into it. Note that only recipes whose ingredients include at least one item currently in your inventory are listed.`;

module.exports.run = async (bot, game, message, command, args, player) => {
    const status = player.getAttributeStatusEffects("disable recipes");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    var inventoryItems = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null && item.quantity > 0);
    inventoryItems.sort(function (a, b) {
        if (a.prefab.id < b.prefab.id) return -1;
        if (a.prefab.id > b.prefab.id) return 1;
        return 0;
    });
    var roomItems = game.items.filter(item => item.location.name === player.location.name && (item.quantity > 0 || isNaN(item.quantity)));
    roomItems.sort(function (a, b) {
        if (a.prefab.id < b.prefab.id) return -1;
        if (a.prefab.id > b.prefab.id) return 1;
        return 0;
    });

    var recipes = [];
    for (let i = 0; i < game.recipes.length; i++) {
        let ingredients = [];
        for (let j = 0; j < game.recipes[i].ingredients.length; j++) {
            // Find all the ingredients for this Recipe in the player's inventory or in the room.
            let found = false;
            for (let k = 0; k < inventoryItems.length; k++) {
                if (inventoryItems[k].prefab.id === game.recipes[i].ingredients[j].id) {
                    ingredients.push(inventoryItems[k]);
                    found = true;
                    break;
                }
            }
            if (!found) {
                for (let k = 0; k < roomItems.length; k++) {
                    if (roomItems[k].prefab.id === game.recipes[i].ingredients[j].id) {
                        ingredients.push(roomItems[k]);
                        break;
                    }
                }
            }
        }
        ingredients.sort(function (a, b) {
            if (a.prefab.id < b.prefab.id) return -1;
            if (a.prefab.id > b.prefab.id) return 1;
            return 0;
        });
        if (ingredientsMatch(ingredients, game.recipes[i].ingredients)) {
            let objects = [];
            if (game.recipes[i].objectTag !== "") {
                let recipeObjects = game.objects.filter(object => object.location.name === player.location.name && object.recipeTag === game.recipes[i].objectTag);
                if (recipeObjects.length === 0) continue;
                objects = recipeObjects.map(object => object.name);
            }
            ingredients = ingredients.map(ingredient => ingredient.prefab.singleContainingPhrase);
            let products = game.recipes[i].products.map(product => product.singleContainingPhrase);
            recipes.push({ ingredients: ingredients.join(', '), products: products.join(', '), objects: objects.join(', ') });
        }
    }
    if (recipes.length === 0) return game.messageHandler.addReply(message, `There are no recipes you can carry out with the items currently in your inventory.`);

    // Create a rich embed for the Recipes.
    var craftingFields = [];
    var objectFields = [];
    var pages = [];
    var page = 0;

    for (let i = 0; i < recipes.length; i++) {
        if (recipes[i].objects.length > 0) objectFields.push(recipes[i]);
        else craftingFields.push(recipes[i]);
    }

    let pageNo = 0;
    // Divide the fields into pages. Split them up by crafting Recipes and object Recipes.
    for (let i = 0; i < craftingFields.length; i++) {
        // Divide the menu into groups of 10.
        if (i % 10 === 0) {
            pages.push([]);
            if (i !== 0) pageNo++;
        }
        pages[pageNo].push(craftingFields[i]);
    }
    if (pages[pageNo] && pages[pageNo].length > 0) pageNo++;
    for (let i = 0; i < objectFields.length; i++) {
        // Divide the menu into groups of 10.
        if (i % 10 === 0) {
            pages.push([]);
            if (i !== 0) pageNo++;
        }
        pages[pageNo].push(objectFields[i]);
    }

    let embed = createEmbed(game, page, pages);
    message.author.send(embed).then(msg => {
        msg.react('⏪').then(() => {
            msg.react('⏩');

            const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id;
            const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id;

            const backwards = msg.createReactionCollector(backwardsFilter, { time: 300000 });
            const forwards = msg.createReactionCollector(forwardsFilter, { time: 300000 });

            backwards.on("collect", () => {
                if (page === 0) return;
                page--;
                embed = createEmbed(game, page, pages);
                msg.edit(embed);
            });

            forwards.on("collect", () => {
                if (page === pages.length - 1) return;
                page++;
                embed = createEmbed(game, page, pages);
                msg.edit(embed);
            });
        });
    });

    return;
};

function ingredientsMatch(items, ingredients) {
    if (items.length !== ingredients.length) return false;
    var hasInventoryItem = false;
    for (let i = 0; i < items.length; i++) {
        if (items[i].prefab.id !== ingredients[i].id) return false;
        if (items[i].hasOwnProperty("player")) hasInventoryItem = true;
    }
    if (!hasInventoryItem) return false;
    return true;
}

function createEmbed(game, page, pages) {
    let craftingPage = pages[page][0].objects.length === 0 ? true : false;
    let embed = new discord.RichEmbed()
        .setColor('1F8B4C')
        .setAuthor(`Recipes List`, game.guild.iconURL)
        .setDescription(craftingPage ? craftingRecipesDescription : objectRecipesDescription)
        .setFooter(`Page ${page + 1}/${pages.length}`);

    // Now add the fields of the first page.
    for (let i = 0; i < pages[page].length; i++)
        embed.addField(
            `**Recipe ${i + 1}**`,
            `**Ingredients:** ${pages[page][i].ingredients}\n` +
            `**Products:** ${pages[page][i].products}\n` +
            (craftingPage ? '' : `**Using Object(s):** ${pages[page][i].objects}`)
        );

    return embed;
}
