import Dialog from '../Data/Dialog.js';
import NarrateAction from '../Data/Actions/NarrateAction.js';
import SayAction from '../Data/Actions/SayAction.js';
import { ChannelType } from 'discord.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

/** @type {CommandConfig} */
export const config = {
    name: "say_moderator",
    description: "Sends a message.",
    details: 'Sends a message. A channel or player must be specified. Messages can be sent to any '
        + 'channel, but if it is sent to a room channel, it will be treated as a narration so that players with the '
        + '"see room" attribute can see it. If the name of a player is specified and that player has the talent "NPC", '
        + 'the player will speak in the channel of the room they\'re in. Their dialog will be treated just like that of '
        + 'any normal player\'s. The image URL set in the player\'s Discord ID will be used for the player\'s avatar.',
    usableBy: "Moderator",
    aliases: ["say"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
    return `${settings.commandPrefix}say #park Hello. My name is Alter Ego.\n`
        + `${settings.commandPrefix}say #general Thank you for speaking with me today.\n`
        + `${settings.commandPrefix}say amy One appletini, coming right up.`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute(game, message, command, args) {
    if (args.length < 2)
        return game.communicationHandler.reply(message, `You need to specify a channel or player and something to say. Usage:\n${usage(game.settings)}`);

    const channel = message.mentions.channels.first();
    const content = args.slice(1).join(" ");
    const player = game.entityFinder.getLivingPlayer(args[0]);

    if (player) {
        if (!player.isNPC) return game.communicationHandler.reply(message, `You cannot speak for a player that isn't an NPC.`);
        const dialog = new Dialog(game, message, player, player.location, content, false);
        const dialogMessage = await game.communicationHandler.sendDialogAsWebhook(player.location.channel, dialog, dialog.getDisplayNameForWebhook(false), dialog.getDisplayIconForWebhook(false));
        const sayAction = new SayAction(game, dialogMessage, player, player.location, true);
        sayAction.performSay(dialog);
    }
    else if (channel.type === ChannelType.GuildText && game.guildContext.roomCategories.includes(channel.parentId)) {
        const room = game.entityFinder.getRoom(channel.name);
        const whisper = game.entityFinder.getWhisperByChannelId(channel.id);
        const location = whisper ? whisper.location : room;
        if (room !== null) {
            const narrateAction = new NarrateAction(game, message, undefined, location, true, whisper);
            game.narrationHandler.sendNarration(narrateAction, content);
        }
    }
    else if (channel.type === ChannelType.GuildText)
        channel.send(content);
    else game.communicationHandler.reply(message, `Couldn't find a player or channel in your input. Usage:\n${usage(game.settings)}`);
}
