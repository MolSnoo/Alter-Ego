import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { saveGame } from '../Modules/saver.js';

/** @type {CommandConfig} */
export const config = {
    name: "clean_moderator",
    description: "Cleans the items and inventory items sheets.",
    details: "Combs through all items and inventory items and deletes any whose quantity is 0. All game data will then "
        + "be saved to the spreadsheet, not just items and inventory items. This process will effectively clean the "
        + "spreadsheet of items and inventory items that no longer exist, reducing the size of both sheets. Note that "
        + "edit mode must be turned on in order to use this command. The items and inventory items sheets must be loaded "
        + "after this command finishes executing, otherwise data may be overwritten on the sheet during gameplay.",
    usableBy: "Moderator",
    aliases: ["clean", "autoclean"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}clean\n`
        + `${settings.commandPrefix}autoclean`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    if (!game.editMode)
        return messageHandler.addReply(game, message, `You cannot clean the items and inventory items sheet while edit mode is disabled. Please turn edit mode on before using this command.`);

    var deletedItemsCount = 0;
    var deletedInventoryItemsCount = 0;
    // Iterate through the lists backwards because the act of splicing ruins the order of iteration going forwards.
    for (let i = game.items.length - 1; i >= 0; i--) {
        if (game.items[i].quantity === 0) {
            game.items.splice(i, 1);
            deletedItemsCount++;
        }
    }
    for (let i = game.inventoryItems.length - 1; i >= 0; i--) {
        if (game.inventoryItems[i].quantity === 0) {
            game.inventoryItems.splice(i, 1);
            deletedInventoryItemsCount++;
        }
    }

    try {
        // Pass deletedItemsCount and deletedInventoryItemsCount so the saver knows how many blank rows to append at the end.
        await saveGame(deletedItemsCount, deletedInventoryItemsCount);
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, "Successfully cleaned items and inventory items. Successfully saved game data to the spreadsheet. Be sure to load items and inventory items before disabling edit mode.");
    }
    catch (err) {
        console.log(err);
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, "Successfully cleaned items and inventory items, but there was an error saving data to the spreadsheet. Proceeding without manually saving and loading may cause additional errors. Error:\n```" + err + "```");
    }

    return;
}
