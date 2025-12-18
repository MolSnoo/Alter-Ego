import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "setdisplayicon_moderator",
    description: "Sets a player's display icon.",
    details: "Sets the icon that will display when the given player's dialog appears in spectator channels. It will also appear in Room channels when the "
        + "player uses the say command. The icon given must be a URL with an extension of .jpg, .jpeg, .png, .webp, or .avif. When player data is reloaded, "
        + "their display icon will be reverted to their Discord avatar. Note that if the player is inflicted  with or cured of a status effect with the "
        + "concealed attribute, their display icon will be updated, thus overwriting one that was set manually. However, this command can be used to overwrite "
        + "their new display icon afterwards as well. Note that this command will not change the player's avatar when they send messages to Room channels "
        + "normally. To reset a player's display icon to their Discord avatar, simply do not specify a new display icon.",
    usableBy: "Moderator",
    aliases: ["setdisplayicon"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}setdisplayicon kyra https://cdn.discordapp.com/attachments/697623260736651335/912103115241697301/mm.png\n`
        + `${settings.commandPrefix}setdisplayicon kyra`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify a player. Usage:\n${usage(game.settings)}`);

    const player = game.entityFinder.getLivingPlayer(args[0].toLowerCase());
    if (player === undefined) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);
    args.splice(0, 1);

    const iconURLSyntax = RegExp('(http(s?)://.*?.(jpg|jpeg|png|webp|avif))$');
    let input = args.join(" ");
    if (input === "") {
        if (player.isNPC) input = player.id;
        else input = null;
    }
    else if (!iconURLSyntax.test(input)) return messageHandler.addReply(game, message, `The display icon must be a URL with an extension of .jpg, .jpeg, .png, .webp, or .avif.`);

    player.displayIcon = input;
    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully updated ${player.name}'s display icon.`);

    return;
}
