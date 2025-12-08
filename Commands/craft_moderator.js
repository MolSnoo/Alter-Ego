import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "craft_moderator",
    description: "Crafts two items in a player's inventory together.",
    details: 'Creates a new item using the two items in the given player\'s hand. The prefab IDs or container identifiers of the '
        + 'items must be separated by "with" or "and". If no recipe for those two items exists, the items cannot be crafted together. '
        + "Note that this command can also be used to use one item on another item, which may produce something new.",
    usableBy: "Moderator",
    aliases: ["craft", "combine", "mix"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}craft chris drain cleaner and plastic bottle\n`
        + `${settings.commandPrefix}combine keiko's bread and cheese\n`
        + `${settings.commandPrefix}mix finn red vial with blue vial\n`
        + `${settings.commandPrefix}craft dayne's soap with knife`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    if (args.length < 4)
        return messageHandler.addReply(game, message, `You need to specify a player and two items separated by "with" or "and". Usage:\n${usage(game.settings)}`);

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

    if (!parsedInput.includes(" WITH ") && !parsedInput.includes(" AND "))
        return messageHandler.addReply(game, message, `You need to specify two items separated by "with" or "and". Usage:\n${usage(game.settings)}`);

    var rightHand = null;
    var leftHand = null;
    for (let slot = 0; slot < player.inventory.length; slot++) {
        if (player.inventory[slot].name === "RIGHT HAND") rightHand = player.inventory[slot];
        else if (player.inventory[slot].name === "LEFT HAND") leftHand = player.inventory[slot];
    }

    // Now find the item in the player's inventory.
    var item1 = null;
    var item2 = null;
    let item1Id = "";
    let item2Id = "";
    let rightFirst = false;
    if (rightHand.equippedItem !== null) {
        if (item1 === null && rightHand.equippedItem.identifier !== "" && (parsedInput.startsWith(rightHand.equippedItem.identifier + " WITH ") || parsedInput.startsWith(rightHand.equippedItem.identifier + " AND "))) {
            item1 = rightHand.equippedItem;
            item1Id = rightHand.equippedItem.identifier;
            rightFirst = true;
        }
        else if (item1 === null && rightHand.equippedItem.identifier !== "" && (parsedInput.endsWith(" WITH " + rightHand.equippedItem.identifier) || parsedInput.endsWith(" AND " + rightHand.equippedItem.identifier))) {
            item1 = rightHand.equippedItem;
            item1Id = rightHand.equippedItem.identifier;
        }
        else if (item1 === null && (parsedInput.startsWith(rightHand.equippedItem.prefab.id + " WITH ") || parsedInput.startsWith(rightHand.equippedItem.prefab.id + " AND "))) {
            item1 = rightHand.equippedItem;
            item1Id = rightHand.equippedItem.prefab.id;
            rightFirst = true;
        }
        else if (item1 === null && (parsedInput.endsWith(" WITH " + rightHand.equippedItem.prefab.id) || parsedInput.endsWith(" AND " + rightHand.equippedItem.prefab.id))) {
            item1 = rightHand.equippedItem;
            item1Id = rightHand.equippedItem.prefab.id;
        }
        else if (item1 === null && (parsedInput.startsWith(rightHand.equippedItem.name + " WITH ") || parsedInput.startsWith(rightHand.equippedItem.name + " AND "))) {
            item1 = rightHand.equippedItem;
            item1Id = rightHand.equippedItem.name;
            rightFirst = true;
        }
        else if (item1 === null && (parsedInput.endsWith(" WITH " + rightHand.equippedItem.name) || parsedInput.endsWith(" AND " + rightHand.equippedItem.name))) {
            item1 = rightHand.equippedItem;
            item1Id = rightHand.equippedItem.name;
        }
    }
    if (leftHand.equippedItem !== null) {
        if (item2 === null && leftHand.equippedItem.identifier !== "" &&
            (rightFirst && (parsedInput.endsWith(" WITH " + leftHand.equippedItem.identifier) || parsedInput.endsWith(" AND " + leftHand.equippedItem.identifier))
            || !rightFirst && (parsedInput.startsWith(leftHand.equippedItem.identifier + " WITH ") || parsedInput.startsWith(leftHand.equippedItem.identifier + " AND ")))) {
            item2 = leftHand.equippedItem;
            item2Id = leftHand.equippedItem.identifier;
        }
        else if (item2 === null &&
            (rightFirst && (parsedInput.endsWith(" WITH " + leftHand.equippedItem.prefab.id) || parsedInput.endsWith(" AND " + leftHand.equippedItem.prefab.id))
            || !rightFirst && (parsedInput.startsWith(leftHand.equippedItem.prefab.id + " WITH ") || parsedInput.startsWith(leftHand.equippedItem.prefab.id + " AND ")))) {
            item2 = leftHand.equippedItem;
            item2Id = leftHand.equippedItem.prefab.id;
        }
        else if (item2 === null &&
            (rightFirst && (parsedInput.endsWith(" WITH " + leftHand.equippedItem.name) || parsedInput.endsWith(" AND " + leftHand.equippedItem.name))
            || !rightFirst && (parsedInput.startsWith(leftHand.equippedItem.name + " WITH ") || parsedInput.startsWith(leftHand.equippedItem.name + " AND ")))) {
            item2 = leftHand.equippedItem;
            item2Id = leftHand.equippedItem.name;
        }
    }

    let item1Name = "";
    let item2Name = "";
    if (item1 === null && item2 !== null) {
        item1Name = parsedInput.replace(item2Id, "").replace(" WITH ", "").replace(" AND ", "");
        return messageHandler.addReply(game, message, `Couldn't find item "${item1Name}" in either of ${player.name}'s hands.`);
    }
    else if (item1 !== null && item2 === null) {
        item2Name = parsedInput.replace(item1Id, "").replace(" WITH ", "").replace(" AND ", "");
        return messageHandler.addReply(game, message, `Couldn't find item "${item2Name}" in either of ${player.name}'s hands.`);
    }
    else if (item1 === null && item2 === null) {
        if (parsedInput.includes(" WITH ")) args = parsedInput.split(" WITH ");
        else if (parsedInput.includes(" AND ")) args = parsedInput.split(" AND ");
        item1Name = args[0];
        item2Name = args[1];
        return messageHandler.addReply(game, message, `Couldn't find items "${item1Name}" and "${item2Name}" in either of ${player.name}'s hands.`);
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
    if (recipe === null) return messageHandler.addReply(game, message, `Couldn't find recipe requiring ${ingredients[0].prefab.id} and ${ingredients[1].prefab.id}.`);

    item1Name = ingredients[0].identifier ? ingredients[0].identifier : ingredients[0].prefab.id;
    item2Name = ingredients[1].identifier ? ingredients[1].identifier : ingredients[1].prefab.id;

    const products = player.craft(ingredients[0], ingredients[1], recipe);

    let productPhrase = "";
    let product1Phrase = "";
    let product2Phrase = "";
    if (products.product1) product1Phrase = products.product1.identifier ? products.product1.identifier : products.product1.prefab.id;
    if (products.product2) product2Phrase = products.product2.identifier ? products.product2.identifier : products.product2.prefab.id;
    if (product1Phrase !== "" && product2Phrase !== "") productPhrase = `${product1Phrase} and ${product2Phrase}`;
    else if (product1Phrase !== "") productPhrase = product1Phrase;
    else if (product2Phrase !== "") productPhrase = product2Phrase;
    else productPhrase = "nothing";

    // Post log message.
    const time = new Date().toLocaleTimeString();
    messageHandler.addLogMessage(game, `${time} - ${player.name} forcibly crafted ${productPhrase} from ${item1Name} and ${item2Name} in ${player.location.channel}`);

    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully crafted ${productPhrase} from ${item1Name} and ${item2Name} for ${player.name}.`);

    return;
}
