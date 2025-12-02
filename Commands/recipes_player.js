import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";
import { EmbedBuilder } from 'discord.js';

/** @type {CommandConfig} */
export const config = {
    name: "recipes_player",
    description: "Lists all recipes available to you.",
    details: "Lists all recipes you can carry out with the items in your inventory and items in the room. If you supply the name of an item in your inventory, "
        + "you will receive a list of all recipes that use that item as an ingredient. There are crafting and processing recipes.\n\n"
        + `To carry out a crafting recipe, you must have both of the ingredients in your hands and combine them with the craft `
        + `command. These recipes take no time. If reversible, you can use the uncraft command to get the ingredients again.\n\n`
        + `To carry out a processing recipe, use the drop command to place all the ingredients in an object, and `
        + `then activate the object with the use command. These recipes take a set amount of time to complete. `
        + "If it worked, you'll receive a message indicating that the process has begun, and another message when it finishes. "
        + "You won't receive a message if the object was already activated when all of the ingredients were put in, but the recipe "
        + "will still be carried out so long as all of the ingredients are in place.",
    usableBy: "Player",
    aliases: ["recipes"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}recipes\n`
        + `${settings.commandPrefix}recipes glass\n`
        + `${settings.commandPrefix}recipes pot of rice`;
}

var uncraftingRecipesDescription = "";
var craftingRecipesDescription = "";
var objectRecipesDescription = "";

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 * @param {Player} player 
 */
export async function execute (game, message, command, args, player) {
    const status = player.getAttributeStatusEffects("disable recipes");
    if (status.length > 0) return messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    var recipes = [];
    if (args.length > 0) {
        var input = args.join(" ");
        var parsedInput = input.toUpperCase().replace(/\'/g, "");

        let item = null;
        // Check if the input is an item in the player's inventory.
        const inventory = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null);
        for (let i = 0; i < inventory.length; i++) {
            if (inventory[i].prefab.name === parsedInput && inventory[i].quantity > 0) {
                item = inventory[i];
                break;
            }
        }
        if (item === null) return messageHandler.addReply(message, `Couldn't find item "${input}" in your inventory.`);

        for (let i = 0; i < game.recipes.length; i++) {
            for (let j = 0; j < game.recipes[i].ingredients.length; j++) {
                if (game.recipes[i].ingredients[j].id === item.prefab.id) {
                    // This recipe contains the given item as an ingredient.
                    // Gather a list of objects in the room that can be used to process this recipe, if applicable.
                    let objects = [];
                    if (game.recipes[i].objectTag !== "") {
                        let recipeObjects = game.objects.filter(object => object.location.name === player.location.name && object.recipeTag === game.recipes[i].objectTag);
                        // If there are no objects in the room, provide the object tag.
                        if (recipeObjects.length === 0) objects.push(game.recipes[i].objectTag);
                        else objects = recipeObjects.map(object => object.name);
                    }
                    let ingredients = game.recipes[i].ingredients.map(ingredient => ingredient.singleContainingPhrase);
                    let products = game.recipes[i].products.map(product => product.singleContainingPhrase);
                    recipes.push({ ingredients: ingredients.join(', '), products: products.join(', '), objects: objects.join(', '), duration: game.recipes[i].duration.humanize(), uncraftable: false });
                    break;
                }
            }
            if (game.recipes[i].uncraftable && game.recipes[i].products.length === 1 && game.recipes[i].products[0].id === item.prefab.id) {
                // This recipe contains the given item as the sole product and is uncraftable.
                let ingredients = game.recipes[i].products.map(product => product.singleContainingPhrase);
                let products = game.recipes[i].ingredients.map(ingredient => ingredient.singleContainingPhrase);
                recipes.push({ ingredients: ingredients.join(', '), products: products.join(', '), objects: "", duration: game.recipes[i].duration.humanize(), uncraftable: true });
            }
        }
        if (recipes.length === 0) return messageHandler.addReply(message, `There are no recipes that can be carried out with ${item.singleContainingPhrase}.`);

        craftingRecipesDescription = `These are recipes you can carry out using the \`${game.settings.commandPrefix}craft\` command with your ${item.name} as an ingredient. The other ingredient may not be available in this room, or you may need to create it yourself.`;
        uncraftingRecipesDescription = `These are recipes you can carry out using the \`${game.settings.commandPrefix}uncraft\` command with your ${item.name} as an ingredient.`;
        objectRecipesDescription = `These are recipes you can carry out using the \`${game.settings.commandPrefix}use\` command on an object after dropping your ${item.name} and any other required ingredients into it. The other ingredients may not be available in this room, or you may need to create them yourself. `;
        objectRecipesDescription += `If there is no object listed in all uppercase, then you cannot carry out this recipe in the room you're currently in and must find a suitable object elsewhere.`;
    }
    else {
        // Get lists of all the player's inventory items and items in the room.
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

        for (let i = 0; i < game.recipes.length; i++) {
            let ingredients = [];
            let products = [];
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
                // Gather a list of objects in the room that can be used to process this recipe, if applicable.
                let objects = [];
                if (game.recipes[i].objectTag !== "") {
                    let recipeObjects = game.objects.filter(object => object.location.name === player.location.name && object.recipeTag === game.recipes[i].objectTag);
                    if (recipeObjects.length === 0) continue;
                    objects = recipeObjects.map(object => object.name);
                }
                ingredients = ingredients.map(ingredient => ingredient.prefab.singleContainingPhrase);
                products = game.recipes[i].products.map(product => product.singleContainingPhrase);
                recipes.push({ ingredients: ingredients.join(', '), products: products.join(', '), objects: objects.join(', '), duration: game.recipes[i].duration.humanize(), uncraftable: false });
            }

            if (game.recipes[i].products.length === 1 && game.recipes[i].uncraftable) {
                products = [];
                for (let j = 0; j < inventoryItems.length; j++) {
                    if (inventoryItems[j].prefab.id == game.recipes[i].products[0].id) {
                        products.push(inventoryItems[j]);
                        break;
                    }
                }
            }
            if (products.length !== 0) {
                products.sort(function (a, b) {
                    if (a.prefab.id < b.prefab.id) return -1;
                    if (a.prefab.id > b.prefab.id) return 1;
                    return 0;
                });
                ingredients = game.recipes[i].products.map(product => product.singleContainingPhrase);
                products = game.recipes[i].ingredients.map(ingredient => ingredient.singleContainingPhrase);
                recipes.push({ ingredients: ingredients.join(', '), products: products.join(', '), objects: "", duration: game.recipes[i].duration.humanize(), uncraftable: true });
            }
        }
        if (recipes.length === 0) return messageHandler.addReply(message, `There are no recipes you can carry out with the items currently in your inventory and the items in this room.`);

        craftingRecipesDescription = `These are recipes you can carry out using the \`${game.settings.commandPrefix}craft\` command. Note that only recipes whose ingredients include at least one item currently in your inventory are listed.`;
        uncraftingRecipesDescription = `These are recipes you can carry out using the \`${game.settings.commandPrefix}uncraft\` command. Note that only recipes whose sole product is an item currently in your inventory are listed.`;
        objectRecipesDescription = `These are recipes you can carry out using the \`${game.settings.commandPrefix}use\` command on an object after dropping all of the ingredients into it. Note that only recipes whose ingredients include at least one item currently in your inventory are listed.`;
    }

    // Create a rich embed for the Recipes.
    var craftingFields = [];
    var objectFields = [];
    var uncraftingFields = [];
    var pages = [];
    var page = 0;

    for (let i = 0; i < recipes.length; i++) {
        if (recipes[i].objects.length > 0) objectFields.push(recipes[i]);
        else if (recipes[i].uncraftable) uncraftingFields.push(recipes[i]);
        else craftingFields.push(recipes[i]);
    }

    let pageNo = 0;
    // Divide the fields into pages. Split them up by crafting Recipes and object Recipes.
    for (let i = 0; i < craftingFields.length; i++) {
        // Divide the menu into groups of 5.
        if (i % 5 === 0) {
            pages.push([]);
            if (i !== 0) pageNo++;
        }
        pages[pageNo].push(craftingFields[i]);
    }
    if (pages[pageNo] && pages[pageNo].length > 0) pageNo++;
    for (let i = 0; i < objectFields.length; i++) {
        // Divide the menu into groups of 5.
        if (i % 5 === 0) {
            pages.push([]);
            if (i !== 0) pageNo++;
        }
        pages[pageNo].push(objectFields[i]);
    }
    if (pages[pageNo] && pages[pageNo].length > 0) pageNo++;
    for (let i = 0; i < uncraftingFields.length; i++) {
        // Divide the menu into groups of 5.
        if (i % 5 === 0) {
            pages.push([]);
            if (i !== 0) pageNo++;
        }
        pages[pageNo].push(uncraftingFields[i]);
    }

    let embed = createEmbed(game, page, pages);
    message.author.send({ embeds: [embed] }).then(msg => {
        msg.react('⏪').then(() => {
            msg.react('⏩');

            const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id;
            const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id;

            const backwards = msg.createReactionCollector({ filter: backwardsFilter, time: 300000 });
            const forwards = msg.createReactionCollector({ filter: forwardsFilter, time: 300000 });

            backwards.on("collect", () => {
                if (page === 0) return;
                page--;
                embed = createEmbed(game, page, pages);
                msg.edit({ embeds: [embed] });
            });

            forwards.on("collect", () => {
                if (page === pages.length - 1) return;
                page++;
                embed = createEmbed(game, page, pages);
                msg.edit({ embeds: [embed] });
            });
        });
    });

    return;
}

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

function productsMatch(items, products) {
    if (items.length !== products.length) return false;
    var hasInventoryItem = false;
    for (let i = 0; i < items.length; i++) {
        if (items[i].prefab.id !== products[i].id) return false;
        if (items[i].hasOwnProperty("player")) hasInventoryItem = true;
    }
    if (!hasInventoryItem) return false;
    return true;
}

function createEmbed(game, page, pages) {
    let objectRecipe = pages[page][0].objects.length > 0;
    let uncraftRecipe = pages[page][0].uncraftable;
    let embed = new EmbedBuilder()
        .setColor(game.settings.embedColor)
        .setAuthor({ name: `Recipes List`, iconURL: game.guildContext.guild.iconURL() })
        .setDescription(objectRecipe ? objectRecipesDescription : uncraftRecipe ? uncraftingRecipesDescription : craftingRecipesDescription)
        .setFooter({ text: `Page ${page + 1}/${pages.length}` });

    let fields = [];
    // Now add the fields of the first page.
    for (let i = 0; i < pages[page].length; i++)
        fields.push({
            name: `**Recipe ${i + 1}**`,
            value: `**Ingredients:** ${pages[page][i].ingredients}\n` +
            `**Products:** ${pages[page][i].products}\n` +
            (objectRecipe ? `**Using Object(s):** ${pages[page][i].objects}\n` : '') +
            (objectRecipe ? `**Duration:** ${pages[page][i].duration}` : '')
        });
    embed.addFields(fields);

    return embed;
}
