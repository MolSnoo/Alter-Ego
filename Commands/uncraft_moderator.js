import UncraftAction from '../Data/Actions/UncraftAction.ts';

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "uncraft_moderator",
    description: "Uncrafts an item for a player.",
    details: `Separates an item in one of the given player's hands into its component parts. This reverses the process `
		+ `of a crafting recipe, using the product of the recipe as an ingredient, and creating its ingredients as `
        + `products. This will produce two items, so they will need a free hand in order for this command to be usable. `
        + `If there is no crafting recipe that produces the given item which allows it to be uncrafted again, `
        + `this command cannot be used.\n\n`
        + `This command supports NPC latching. For more information, see the help details for the \`latch\` command.`,
    usableBy: "Moderator",
    aliases: ["uncraft", "dismantle", "disassemble", "uc"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}uncraft Olavi SHOVEL\n`
        + `${settings.commandPrefix}dismantle Avani ASSEMBLED CROSSBOW\n`
        + `${settings.commandPrefix}disassemble Juno LOADED PISTOL\n`
        + `${settings.commandPrefix}uc Ray RING STAND WITH SUPPORT RING`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Moderator} moderator - The moderator who issued the command.
 */
export async function execute(game, message, command, args, moderator) {
    const sentMessageInLatchChannel = moderator?.sentMessageInLatchChannel(message) ?? false;
    if (!sentMessageInLatchChannel && args.length < 2)
        return game.communicationHandler.reply(message, `You need to specify a player and an inventory item in their hand. Usage:\n${usage(game.settings)}`);
    if (sentMessageInLatchChannel && args.length < 1)
        return game.communicationHandler.reply(message, `You need to specify an inventory item. Usage:\n${usage(game.settings)}`);

	let player = game.entityFinder.getLivingPlayer(args[0]?.replace(/'s/g, ""));
    if (player && !moderator.latchedPlayerHasName(args[0]))
        args.splice(0, 1);
    if (!player && sentMessageInLatchChannel)
        player = moderator.getLatch();
    if (player === undefined) return game.communicationHandler.reply(message, `Player "${args[0]}" not found.`);

    const input = args.join(' ');
    const parsedInput = input.toUpperCase().replace(/\'/g, "");

    const rightHand = player.inventory.get("RIGHT HAND");
    const leftHand = player.inventory.get("LEFT HAND");

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
        return game.communicationHandler.reply(message, `Couldn't find item "${parsedInput}" in either of ${player.name}'s hands.`);
    }

    // Locate uncrafting recipe.
    const recipes = game.recipes.filter(recipe => recipe.uncraftable === true && recipe.products.length === 1);
    let recipe = null;
    for (let i = 0; i < recipes.length; i++) {
        if (recipes[i].products[0].prefab.id === item.prefab.id) {
            recipe = recipes[i];
            break;
        }
    }
    if (recipe === null) return game.communicationHandler.reply(message, `Couldn't find an uncraftable recipe that produces ${item.prefab.id}.`);

	if (!rightEmpty && !leftEmpty) {
        return game.communicationHandler.reply(message, `${player.name} does not have an empty hand to uncraft ${item.prefab.id}.`);
    }

    const action = new UncraftAction(game, message, player, player.location, true);
    await action.performUncraft(item, recipe);
	action.sendSuccessMessageToCommandChannel();
}
