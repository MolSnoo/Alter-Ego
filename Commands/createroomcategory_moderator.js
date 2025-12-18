import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { registerRoomCategory, createCategory } from '../Modules/serverManager.js';

/** @type {CommandConfig} */
export const config = {
    name: "createroomcategory_moderator",
    description: "Creates a room category.",
    details: "Creates a room category channel with the given name. The ID of the new category channel will "
        + "automatically be added to the roomCategories setting in the serverconfig file. If a room category "
        + "with the given name already exists, but its ID hasn't been registered in the roomCategories setting, "
        + "it will automatically be added. Note that if you create a room category in Discord without using "
        + "this command, you will have to add its ID to the roomCategories setting manually.",
    usableBy: "Moderator",
    aliases: ["createroomcategory","register"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}createroomcategory Floor 1\n`
        + `${settings.commandPrefix}register Floor 2`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to give a name to the new room category. Usage:\n${usage(game.settings)}`);

    var input = args.join(" ");
    var channel = game.guildContext.guild.channels.cache.find(channel => channel.name.toLowerCase() === input.toLowerCase() && channel.parentId === null);
    if (channel) {
        let response = await registerRoomCategory(channel);
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, response);
    }
    else {
        try {
            channel = await createCategory(game.guildContext.guild, input);
            let response = await registerRoomCategory(channel);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, response);
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }

    return;
}
