import NarrateAction from '../Data/Actions/NarrateAction.ts';
import { MessageDisplayType } from '../Modules/enums.ts';

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */

/** @type {CommandConfig} */
export const config = {
	name: "narrate_moderator",
	description: "Narrates an NPC's non-verbal actions.",
	details: `Narrates non-verbal actions for an NPC. The name of an NPC must be specified. This narration will be sent `
        + `to the room or hiding spot the NPC is currently in. This behaves similarly to the \`gesture\` command, but `
		+ `it allows you to write more complex narrations. Please note that you cannot send a narration that exceeds `
		+ `Discord's character limit, which is 2000 characters.\n\n`
		+ `This command cannot be used to narrate actions for a non-NPC player. To do that, send a message in the `
        + `room or whisper channel they're currently in. This will be treated as a narration, `
		+ `but it will be clearly indicated as having been written by you.\n\n`
        + `This command supports NPC latching. For more information, see the help details for the \`latch\` command.`,
	usableBy: "Moderator",
	aliases: ["narrate", "n"],
	requiresGame: true,
	whitespaceSensitive: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
	return `${settings.commandPrefix}narrate Ai She lands with a curtsy while balancing a tray with a tall stack of tablets on it in one hand.\n`
		+ `${settings.commandPrefix}n Unit_050 It sits up straight on the piano bench and prepares to play.\n`
		+ `${settings.commandPrefix}narrate Sid She is utterly perplexed by the $100 bill that's suddenly in the tip jar.\n`
		+ `${settings.commandPrefix}n Haru He walks over to the plushie rack and takes the used dog plushie. He puts it under the counter for safekeeping. Definitely not for easy access.`;
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
		return game.communicationHandler.reply(message, `You need to specify an NPC and something to narrate. Usage:\n${usage(game.settings)}`);
    if (sentMessageInLatchChannel && args.length < 1)
        return game.communicationHandler.reply(message, `You need to specify something to narrate. Usage:\n${usage(game.settings)}`);

	let player = game.entityFinder.getLivingPlayer(args[0]);
    if (player && (moderator.getLatch() === null || moderator.getLatch().name.toLowerCase() !== args[0].toLowerCase()))
        args.splice(0, 1);
    if (!player && sentMessageInLatchChannel)
        player = moderator.getLatch();
	const input = args.join(" ");
	if (input.length >= 2000)
		return game.communicationHandler.reply(message, `Your narration exceeds Discord's character limit. Please split it into multiple messages.`);

	if (player) {
		if (!player.isNPC) return game.communicationHandler.reply(message, `You cannot narrate for a player that isn't an NPC. Send a message directly to their room or whisper channel instead.`);
		const narrateAction = new NarrateAction(game, message, player, player.location, true);
		game.narrationHandler.sendNarrateAction(MessageDisplayType.PLAYER, narrateAction, await game.communicationHandler.replaceEmoji(input), player);
		narrateAction.sendSuccessMessageToCommandChannel();
	}
	else game.communicationHandler.reply(message, `Couldn't find an NPC in your input. Usage:\n${usage(game.settings)}`);
}
