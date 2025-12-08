import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { Message } from "discord.js";

/** @type {CommandConfig} */
export const config = {
    name: "uncraft_player",
    description: "Separates an item in your inventory into its component parts.",
    details: "Separates an item in one of your hands into its component parts, assuming they can be separated. "
        + "This will produce two items, so you will need a free hand in order to use this command. "
        + "If there is no crafting recipe for its components that allows them to be separated again, the item cannot be uncrafted. "
        + `If you want to re-assemble them, use the craft command.`,
    usableBy: "Player",
    aliases: ["uncraft", "dismantle", "disassemble"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}uncraft shovel\n`
        + `${settings.commandPrefix}dismantle crossbow\n`
        + `${settings.commandPrefix}disassemble pistol`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 * @param {Player} player 
 */
export async function execute (game, message, command, args, player) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify an item in your hand. Usage:\n${usage(game.settings)}`);

    const status = player.getAttributeStatusEffects("disable uncraft");
    if (status.length > 0) return messageHandler.addReply(game, message, `You cannot do that because you are **${status[1].id}**.`);

    var input = args.join(' ');
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var rightHand = null;
    var leftHand = null;
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].id === "RIGHT HAND") rightHand = player.inventory[slot];
        else if (player.inventory[slot].id === "LEFT HAND") leftHand = player.inventory[slot];
    }

    // Now find the item in the player's inventory.
    var item = null;
    var rightEmpty = true;
    var leftEmpty = true;
    if (rightHand.equippedItem !== null) {
        if (parsedInput === rightHand.equippedItem.name) {
            item = rightHand.equippedItem;
        }
        rightEmpty = false;
    }
    if (leftHand.equippedItem !== null) {
        if (parsedInput === leftHand.equippedItem.name) {
            item = leftHand.equippedItem;
        }
        leftEmpty = false;
    }

    if (item === null) {
        return messageHandler.addReply(game, message, `Couldn't find item "${parsedInput}" in either of your hands.`);
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
    if (recipe === null) return messageHandler.addReply(game, message, `Couldn't find an uncraftable recipe that produces ${item.singleContainingPhrase}. Contact a moderator if you think there should be one.`);

    if (!rightEmpty && !leftEmpty) {
        return messageHandler.addReply(game, message, `You do not have an empty hand to uncraft ${item.singleContainingPhrase}. Either drop the item in your other hand or stash it in one of your equipped items.`);
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
    messageHandler.addLogMessage(game, `${time} - ${player.name} uncrafted ${itemName} into ${ingredientPhrase} in ${player.location.channel}`);

    return;
}
