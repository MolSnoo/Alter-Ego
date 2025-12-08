import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "uncraft_moderator",
    description: "Separates an item in a player's inventory into its component parts.",
    details: "Separates an item in one of the given player's hands into its component parts, assuming they can be separated. "
		+ "This reverses the process of a crafting recipe, using the product of the recipe as an ingredient, and creating its ingredients as products. "
        + "This will produce two items, so they will need a free hand in order for this command to be usable. "
        + "If there is no crafting recipe that produces the supplied item which allows it to be uncrafted again, this command cannot be used.",
    usableBy: "Moderator",
    aliases: ["uncraft", "dismantle", "disassemble"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}uncraft olavi shovel\n`
        + `${settings.commandPrefix}dismantle avani crossbow\n`
        + `${settings.commandPrefix}disassemble juno pistol`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return messageHandler.addReply(game, message, `You need to specify a player and an inventory item in their hand. Usage:\n${usage(game.settings)}`);

	var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase().replace(/'s/g, "")) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var rightHand = null;
    var leftHand = null;
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === "RIGHT HAND") rightHand = player.inventory[slot];
        else if (player.inventory[slot].name === "LEFT HAND") leftHand = player.inventory[slot];
    }

    // Now find the item in the player's inventory.
    var item = null;
    var rightEmpty = true;
    var leftEmpty = true;
    if (rightHand.equippedItem !== null) {
        if (rightHand.equippedItem.identifier && parsedInput === rightHand.equippedItem.identifier || parsedInput === rightHand.equippedItem.prefab.id) {
            item = rightHand.equippedItem;
        }
        rightEmpty = false;
    }
    if (leftHand.equippedItem !== null) {
        if (leftHand.equippedItem.identifier && parsedInput === leftHand.equippedItem.identifier || parsedInput === leftHand.equippedItem.prefab.id) {
            item = leftHand.equippedItem;
        }
        leftEmpty = false;
    }

    if (item === null) {
        return messageHandler.addReply(game, message, `Couldn't find item "${parsedInput}" in either of ${player.name}'s hands.`);
    }

    // Locate uncrafting recipe.
    const recipes = game.recipes.filter(recipe => recipe.uncraftable === true && recipe.products.length === 1);
    var recipe = null;
    for (let i = 0; i < recipes.length; i++) {
        if (recipes[i].products[0].id === item.prefab.id) {
            recipe = recipes[i];
            break;
        }
    }
    if (recipe === null) return messageHandler.addReply(game, message, `Couldn't find an uncraftable recipe that produces ${item.prefab.id}.`);

	if (!rightEmpty && !leftEmpty) {
        return messageHandler.addReply(game, message, `${player.name} does not have an empty hand to uncraft ${item.prefab.id}.`);
    }

    let itemName = item.identifier ? item.identifier : item.prefab.id;

    const ingredients = player.uncraft(item, recipe);

    let ingredientPhrase = "";
    let ingredient1Phrase = "";
    let ingredient2Phrase = "";
    if (ingredients.ingredient1) ingredient1Phrase = ingredients.ingredient1.identifier ? ingredients.ingredient1.identifier : ingredients.ingredient1.prefab.id;
    if (ingredients.ingredient2) ingredient2Phrase = ingredients.ingredient2.identifier ? ingredients.ingredient2.identifier : ingredients.ingredient2.prefab.id;
    if (ingredient1Phrase !== "" && ingredient2Phrase !== "") ingredientPhrase = `${ingredient1Phrase} and ${ingredient2Phrase}`;
    else if (ingredient1Phrase !== "") ingredientPhrase = ingredient1Phrase;
    else if (ingredient2Phrase !== "") ingredientPhrase = ingredient2Phrase;
    else ingredientPhrase = "nothing";

    // Post log message.
    const time = new Date().toLocaleTimeString();
    messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly uncrafted ${itemName} into ${ingredientPhrase} in ${player.location.channel}`);

	messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully uncrafted ${itemName} into ${ingredientPhrase} for ${player.name}.`);

    return;
}
