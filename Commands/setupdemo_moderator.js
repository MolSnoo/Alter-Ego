import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { setupdemo } from '../Modules/saver.js';
import { registerRoomCategory, createCategory } from '../Modules/serverManager.js';

import { ChannelType } from 'discord.js';

/** @type {CommandConfig} */
export const config = {
    name: "setupdemo_moderator",
    description: "Sets up a demo game.",
    details: "Populates an empty spreadsheet with default game data as defined in the demodata config file. "
        + "This will create a game environment to demonstrate most of the basics of Neo World Program gameplay. "
        + "By default, it will generate 2 rooms, 8 objects, 14 prefabs, 3 recipes, 3 items, 1 puzzle, 1 event, "
        + "13 status effects, and 6 gestures. If the channels for the demo game's rooms don't exist, they will be "
        + "created automatically. It will not create any players for you. Once this command is used you can use "
        + `the startgame command to add players, or manually add them on the spreadsheet. `
        + "It is recommended that you have at least one other Discord account to use as a player. "
        + `Once the spreadsheet has been fully populated, you can use load all start `
        + "to begin the demo. **If there is already data on the spreadsheet, it will be overwritten. Only use "
        + "this command if the spreadsheet is currently blank.**",
    usableBy: "Moderator",
    aliases: ["setupdemo"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}setupdemo`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (game.inProgress) return messageHandler.addReply(game, message, `You can't use this command while a game is in progress.`);

    try {
        const roomValues = await setupdemo(game);

        // Ensure that a room category exists.
        const roomCategories = game.guildContext.roomCategories;
        let roomCategory = null;
        if (roomCategories.length === 0 || roomCategories.length === 1 && roomCategories[0] === "") {
            try {
                roomCategory = await createCategory(game.guildContext.guild, "Rooms");
                await registerRoomCategory(roomCategory);
            }
            catch (err) {
                messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
            }
        }
        else roomCategory = await game.guildContext.guild.channels.fetch(roomCategories[0].trim());

        // Create the room channels, if they don't already exist.
        if (roomCategory) {
            for (let i = 0; i < roomValues.length; i++) {
                const channel = game.guildContext.guild.channels.cache.find(channel => channel.name === roomValues[i][0]);
                if (!channel) {
                    await game.guildContext.guild.channels.create({
                        name: roomValues[i][0],
                        type: ChannelType.GuildText,
                        parent: roomCategory
                    });
                }
            }

            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel,
                "The spreadsheet was populated with demo data. Once you've populated the Players sheet, either manually or with the "
                + `${game.settings.commandPrefix}startgame command in conjuction with the ${game.settings.commandPrefix}play command, `
                + `use ${game.settings.commandPrefix}load all start to begin the demo.`
            );
        }
        else return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, "The spreadsheet was populated with demo data, but there was an error finding a room category to contain the new room channels.");
    }
    catch (err) {
        console.log(err);
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, "There was an error saving data to the spreadsheet. Error:\n```" + err + "```");
    }

    return;
}
