import Dialog from "../Data/Dialog.js";
import SayAction from "../Data/Actions/SayAction.js";
import { ChannelType } from "discord.js";

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */

/** @type {CommandConfig} */
export const config = {
    name: "say_player",
    description: "Sends your message to the room you're in.",
    details: "Sends your message to the channel of the room you're currently in. This command is "
        + "only available to players with certain status effects.",
    usableBy: "Player",
    aliases: ["say", "speak"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
    return `${settings.commandPrefix}say What happened?\n`
        + `${settings.commandPrefix}speak Did someone turn out the lights?`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute(game, message, command, args, player) {
    if (args.length === 0)
        return game.communicationHandler.reply(message, `You need to specify something to say. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("enable say");
    if (status.length === 0) return game.communicationHandler.reply(message, `You have no reason to use the say command. Speak in the room channel instead.`);

    const input = args.join(" ");
    if (!input.startsWith("(")) {
        const dialog = new Dialog(game, message, player, player.location, input, false);
        const dialogMessage = await game.communicationHandler.sendDialogAsWebhook(player.location.channel, dialog, dialog.getDisplayNameForWebhook(false), dialog.getDisplayIconForWebhook(false));
        const sayAction = new SayAction(game, dialogMessage, player, player.location, false);
        sayAction.performSay(dialog);
        // The say command isn't deleted by the commandHandler because it has necessary data. Delete it now.
        if (message.channel.type !== ChannelType.DM) message.delete().catch();
    }
}
