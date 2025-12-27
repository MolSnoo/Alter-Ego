import UncraftAction from '../Data/Actions/UncraftAction.js';
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

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
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length < 2)
        return addReply(game, message, `You need to specify a player and an inventory item in their hand. Usage:\n${usage(game.settings)}`);

	const player = game.entityFinder.getLivingPlayer(args[0].toLowerCase().replace(/'s/g, ""));
    if (player === undefined) return addReply(game, message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    const input = args.join(' ');
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    const rightHand = player.inventoryCollection.get("RIGHT HAND");
    const leftHand = player.inventoryCollection.get("LEFT HAND");

    // Now find the item in the player's inventory.
    let item = null;
    let rightEmpty = true;
    let leftEmpty = true;
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
        return addReply(game, message, `Couldn't find item "${parsedInput}" in either of ${player.name}'s hands.`);
    }

    // Locate uncrafting recipe.
    const recipes = game.recipes.filter(recipe => recipe.uncraftable === true && recipe.products.length === 1);
    let recipe = null;
    for (let i = 0; i < recipes.length; i++) {
        if (recipes[i].products[0].id === item.prefab.id) {
            recipe = recipes[i];
            break;
        }
    }
    if (recipe === null) return addReply(game, message, `Couldn't find an uncraftable recipe that produces ${item.prefab.id}.`);

	if (!rightEmpty && !leftEmpty) {
        return addReply(game, message, `${player.name} does not have an empty hand to uncraft ${item.prefab.id}.`);
    }

    const itemIdentifier = item.getIdentifier();

    const action = new UncraftAction(game, message, player, player.location, true);
    action.performUncraft(item, recipe);
	addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully uncrafted ${itemIdentifier} for ${player.name}.`);
}
