import CraftAction from '../Data/Actions/CraftAction.js';
import { addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */
/** @typedef {import('../Data/InventoryItem.js').default} InventoryItem */

/** @type {CommandConfig} */
export const config = {
    name: "craft_player",
    description: "Crafts two items in your inventory together.",
    details: 'Creates a new item using the two items in your hand. The names of the items must be separated by "with" or "and". '
        + "If no recipe for those two items exists, the items cannot be crafted together. "
        + "Note that this command can also be used to use one item on another item, which may produce something new.",
    usableBy: "Player",
    aliases: ["craft", "combine", "mix"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}craft drain cleaner and plastic bottle\n`
        + `${settings.commandPrefix}combine bread and cheese\n`
        + `${settings.commandPrefix}mix red vial with blue vial\n`
        + `${settings.commandPrefix}craft soap with knife`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    if (args.length < 3)
        return addReply(game, message, `You need to specify two items separated by "with" or "and". Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable craft");
    if (status.length > 0) return addReply(game, message, `You cannot do that because you are **${status[0].id}**.`);

    const parsedInput = args.join(' ').toUpperCase().replace(/\'/g, "");

    if (!parsedInput.includes(" WITH ") && !parsedInput.includes(" AND "))
        return addReply(game, message, `You need to specify two items separated by "with" or "and". Usage:\n${usage(game.settings)}`);

    // Now find the item in the player's inventory.
    /** @type {InventoryItem[]} */
    const items = [];
    for (let i = 0; i < args.length; i++) {
        const handEquipmentSlot = game.entityFinder.getPlayerHandHoldingItem(player, args.slice(i).join(" "), "player");
        if (handEquipmentSlot) {
            items.push(handEquipmentSlot.equippedItem);
            args = args.slice(0, i);
            break;
        }
    }
    for (let i = args.length; i > 0; i--) {
        const handEquipmentSlot = game.entityFinder.getPlayerHandHoldingItem(player, args.slice(0, i).join(" "), "player");
        if (handEquipmentSlot) {
            items.push(handEquipmentSlot.equippedItem);
            args = args.slice(i);
            break;
        }
    }

    if (items.length !== 2) {
        if (items.length === 0) {
            let itemNames = parsedInput.includes(" WITH ") ? parsedInput.split(" WITH ") : parsedInput.split(" AND ");
            return addReply(game, message, `Couldn't find items "${itemNames[0]}" and "${itemNames[1]}" in either of your hands.`);
        } else {
            let itemNames = parsedInput.includes(" WITH ") ? parsedInput.split(" WITH ") : parsedInput.split(" AND ");
            if (items[0].name === itemNames[0]) return addReply(game, message, `Couldn't find item "${itemNames[1]}" in either of your hands.`);
            else return addReply(game, message, `Couldn't find item "${itemNames[0]} in either of your hands.`);
        }
    }

    items.sort(function (a, b) {
        if (a.prefab.id < b.prefab.id) return -1;
        if (a.prefab.id > b.prefab.id) return 1;
        return 0;
    });

    const recipes = game.recipes.filter(recipe => recipe.ingredients.length === 2 && recipe.fixtureTag === "");
    let recipe = null;
    for (let i = 0; i < recipes.length; i++) {
        if (recipes[i].ingredients[0].id === items[0].prefab.id && recipes[i].ingredients[1].id === items[1].prefab.id) {
            recipe = recipes[i];
            break;
        }
    }
    if (recipe === null) return addReply(game, message, `Couldn't find recipe requiring ${items[0].name} and ${items[1].name}. Contact a moderator if you think there should be one.`);

    const action = new CraftAction(game, message, player, player.location, false);
    action.performCraft(items[0], items[1], recipe);
}
