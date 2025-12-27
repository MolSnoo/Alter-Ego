import InventoryItem from '../Data/InventoryItem.js';
import humanize from 'humanize-duration';
import { createPaginatedEmbed } from '../Modules/helpers.js';
import { addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */
/** @typedef {import('../Data/Prefab.js').default} Prefab */
/** @typedef {import('../Data/ItemInstance.js').default} ItemInstance */

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
var fixtureRecipesDescription = "";

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    const status = player.getBehaviorAttributeStatusEffects("disable recipes");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    const recipes = [];
    if (args.length > 0) {
        const input = args.join(" ");
        const parsedInput = input.toUpperCase().replace(/\'/g, "");

        let item = null;
        // Check if the input is an item in the player's inventory.
        const inventory = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null);
        for (let i = 0; i < inventory.length; i++) {
            if (inventory[i].prefab.name === parsedInput && inventory[i].quantity > 0) {
                item = inventory[i];
                break;
            }
        }
        if (item === null) return addReply(game, message, `Couldn't find item "${input}" in your inventory.`);

        for (let i = 0; i < game.recipes.length; i++) { // TODO: optimize this ENTIRE for block later!
            for (let j = 0; j < game.recipes[i].ingredients.length; j++) {
                if (game.recipes[i].ingredients[j].id === item.prefab.id) {
                    // This recipe contains the given item as an ingredient.
                    // Gather a list of fixtures in the room that can be used to process this recipe, if applicable.
                    let fixtures = [];
                    if (game.recipes[i].fixtureTag !== "") {
                        const recipeFixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.recipeTag === game.recipes[i].fixtureTag);
                        // If there are no fixtures in the room, provide the fixture tag.
                        if (recipeFixtures.length === 0) fixtures.push(game.recipes[i].fixtureTag);
                        else fixtures = recipeFixtures.map(fixture => fixture.name);
                    }
                    const ingredients = game.recipes[i].ingredients.map(ingredient => ingredient.singleContainingPhrase);
                    const products = game.recipes[i].products.map(product => product.singleContainingPhrase);
                    recipes.push({ ingredients: ingredients.join(', '), products: products.join(', '), fixtures: fixtures.join(', '), duration: humanize(game.recipes[i].duration.as('milliseconds')), uncraftable: false });
                    break;
                }
            }
            if (game.recipes[i].uncraftable && game.recipes[i].products.length === 1 && game.recipes[i].products[0].id === item.prefab.id) {
                // This recipe contains the given item as the sole product and is uncraftable.
                const ingredients = game.recipes[i].products.map(product => product.singleContainingPhrase);
                const products = game.recipes[i].ingredients.map(ingredient => ingredient.singleContainingPhrase);
                recipes.push({ ingredients: ingredients.join(', '), products: products.join(', '), fixtures: "", duration: humanize(game.recipes[i].duration.as('milliseconds')), uncraftable: true });
            }
        }
        if (recipes.length === 0) return addReply(game, message, `There are no recipes that can be carried out with ${item.singleContainingPhrase}.`);

        craftingRecipesDescription = `These are recipes you can carry out using the \`${game.settings.commandPrefix}craft\` command with your ${item.name} as an ingredient. The other ingredient may not be available in this room, or you may need to create it yourself.`;
        uncraftingRecipesDescription = `These are recipes you can carry out using the \`${game.settings.commandPrefix}uncraft\` command with your ${item.name} as an ingredient.`;
        fixtureRecipesDescription = `These are recipes you can carry out using the \`${game.settings.commandPrefix}use\` command on a fixture after dropping your ${item.name} and any other required ingredients into it. The other ingredients may not be available in this room, or you may need to create them yourself. `;
        fixtureRecipesDescription += `If there is no fixture listed in all uppercase, then you cannot carry out this recipe in the room you're currently in and must find a suitable fixture elsewhere.`;
    }
    else {
        // Get lists of all the player's inventory items and items in the room.
        const inventoryItems = game.inventoryItems.filter(item => item.player.name === player.name && item.prefab !== null && item.quantity > 0);
        inventoryItems.sort(function (a, b) {
            if (a.prefab.id < b.prefab.id) return -1;
            if (a.prefab.id > b.prefab.id) return 1;
            return 0;
        });
        const roomItems = game.entityFinder.getRoomItems(null, player.location.id);
        roomItems.sort(function (a, b) {
            if (a.prefab.id < b.prefab.id) return -1;
            if (a.prefab.id > b.prefab.id) return 1;
            return 0;
        });

        for (let i = 0; i < game.recipes.length; i++) { // TODO: optimize this ENTIRE for block later!
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
                // Gather a list of fixtures in the room that can be used to process this recipe, if applicable.
                let fixtures = [];
                if (game.recipes[i].fixtureTag !== "") {
                    const recipeFixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id && fixture.recipeTag === game.recipes[i].fixtureTag);
                    if (recipeFixtures.length === 0) continue;
                    fixtures = recipeFixtures.map(fixture => fixture.name);
                }
                ingredients = ingredients.map(ingredient => ingredient.prefab.singleContainingPhrase);
                products = game.recipes[i].products.map(product => product.singleContainingPhrase);
                recipes.push({ ingredients: ingredients.join(', '), products: products.join(', '), fixtures: fixtures.join(', '), duration: humanize(game.recipes[i].duration.as('milliseconds')), uncraftable: false });
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
                recipes.push({ ingredients: ingredients.join(', '), products: products.join(', '), fixtures: "", duration: humanize(game.recipes[i].duration.as('milliseconds')), uncraftable: true });
            }
        }
        if (recipes.length === 0) return addReply(game, message, `There are no recipes you can carry out with the items currently in your inventory and the items in this room.`);

        craftingRecipesDescription = `These are recipes you can carry out using the \`${game.settings.commandPrefix}craft\` command. Note that only recipes whose ingredients include at least one item currently in your inventory are listed.`;
        uncraftingRecipesDescription = `These are recipes you can carry out using the \`${game.settings.commandPrefix}uncraft\` command. Note that only recipes whose sole product is an item currently in your inventory are listed.`;
        fixtureRecipesDescription = `These are recipes you can carry out using the \`${game.settings.commandPrefix}use\` command on a fixture after dropping all of the ingredients into it. Note that only recipes whose ingredients include at least one item currently in your inventory are listed.`;
    }

    // Create a rich embed for the Recipes.
    const craftingFields = [];
    const fixtureFields = [];
    const uncraftingFields = [];
    const pages = [];
    let page = 0;

    for (let i = 0; i < recipes.length; i++) {
        if (recipes[i].fixtures.length > 0) fixtureFields.push(recipes[i]);
        else if (recipes[i].uncraftable) uncraftingFields.push(recipes[i]);
        else craftingFields.push(recipes[i]);
    }

    let pageNo = 0;
    // Divide the fields into pages. Split them up by crafting Recipes and fixture Recipes.
    for (let i = 0; i < craftingFields.length; i++) {
        // Divide the menu into groups of 5.
        if (i % 5 === 0) {
            pages.push([]);
            if (i !== 0) pageNo++;
        }
        pages[pageNo].push(craftingFields[i]);
    }
    if (pages[pageNo] && pages[pageNo].length > 0) pageNo++;
    for (let i = 0; i < fixtureFields.length; i++) {
        // Divide the menu into groups of 5.
        if (i % 5 === 0) {
            pages.push([]);
            if (i !== 0) pageNo++;
        }
        pages[pageNo].push(fixtureFields[i]);
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

    const embedAuthorName = `Recipes List`;
    const embedAuthorIcon = game.guildContext.guild.members.me.avatarURL() || game.guildContext.guild.members.me.user.avatarURL();
    let processingRecipe = pages[page].at(0).fixtures.length > 0;
    let uncraftingRecipe = pages[page].at(0).uncraftable;
    let fieldDescription = processingRecipe ? fixtureRecipesDescription : uncraftingRecipe ? uncraftingRecipesDescription : craftingRecipesDescription;
    const fieldName = (entryIndex) => `**Recipe ${entryIndex + 1}**`;
    const fieldValue = (entryIndex) => `**Ingredients:** ${pages[page][entryIndex].ingredients}\n` +
        `**Products:** ${pages[page][entryIndex].products}\n` +
        (processingRecipe ? `**Using Fixture(s):** ${pages[page][entryIndex].fixtures}\n` : '') +
        (processingRecipe ? `**Duration:** ${pages[page][entryIndex].duration}` : '');
    let embed = createPaginatedEmbed(game, page, pages, embedAuthorName, embedAuthorIcon, fieldDescription, fieldName, fieldValue);
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
                processingRecipe = pages[page][0].fixtures.length > 0;
                uncraftingRecipe = pages[page][0].uncraftable;
                fieldDescription = processingRecipe ? fixtureRecipesDescription : uncraftingRecipe ? uncraftingRecipesDescription : craftingRecipesDescription;
                embed = createPaginatedEmbed(game, page, pages, embedAuthorName, embedAuthorIcon, fieldDescription, fieldName, fieldValue);
                msg.edit({ embeds: [embed] });
            });

            forwards.on("collect", () => {
                if (page === pages.length - 1) return;
                page++;
                processingRecipe = pages[page][0].fixtures.length > 0;
                uncraftingRecipe = pages[page][0].uncraftable;
                fieldDescription = processingRecipe ? fixtureRecipesDescription : uncraftingRecipe ? uncraftingRecipesDescription : craftingRecipesDescription;
                embed = createPaginatedEmbed(game, page, pages, embedAuthorName, embedAuthorIcon, fieldDescription, fieldName, fieldValue);
                msg.edit({ embeds: [embed] });
            });
        });
    });

    return;
}

/**
 * Returns true if the items and ingredients match.
 * @param {ItemInstance[]} items - The actually existing items. 
 * @param {Prefab[]} ingredients - The list of ingredients in the recipe.
 */
function ingredientsMatch(items, ingredients) {
    if (items.length !== ingredients.length) return false;
    let hasInventoryItem = false;
    for (let i = 0; i < items.length; i++) {
        if (items[i].prefab.id !== ingredients[i].id) return false;
        if (items[i] instanceof InventoryItem) hasInventoryItem = true;
    }
    if (!hasInventoryItem) return false;
    return true;
}

/**
 * Returns true if the items and ingredients match.
 * @param {ItemInstance[]} items - The actually existing items. 
 * @param {Prefab[]} products - The list of products in the recipe.
 */
function productsMatch(items, products) {
    if (items.length !== products.length) return false;
    let hasInventoryItem = false;
    for (let i = 0; i < items.length; i++) {
        if (items[i].prefab.id !== products[i].id) return false;
        if (items[i] instanceof InventoryItem) hasInventoryItem = true;
    }
    if (!hasInventoryItem) return false;
    return true;
}
