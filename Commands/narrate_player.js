import NarrateAction from '../Data/Actions/NarrateAction.ts';
import { MessageDisplayType } from '../Modules/enums.ts';

/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import Player from '../Data/Player.ts' */

/** @type {CommandConfig} */
export const config = {
	name: "narrate_player",
	description: "Narrates your non-verbal actions.",
	details: `Narrates non-verbal actions. This narration will be sent to the room or hiding spot you're currently in. `
		+ `This behaves similarly to the \`gesture\` command, but it allows you to write more complex narrations. `
		+ `Please note that you cannot send a narration that exceeds Discord's character limit, which is 2000 characters.`,
	usableBy: "Player",
	aliases: ["narrate", "n"],
    requiresGame: true,
	whitespaceSensitive: true,
    usableInEditMode: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
	return `${settings.commandPrefix}narrate She slowly sinks behind the podium.\n`
		+ `${settings.commandPrefix}n 06 shakes his head, as if he's clearing a thought from his mind.\n`
		+ `${settings.commandPrefix}narrate Their eyes widen and they cross their arms, looking down. They'd clearly never considered this before.\n`
		+ `${settings.commandPrefix}n He coughs a little, blood trickling down his face. His smile doesn't waver, though.`;
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
		return game.communicationHandler.reply(message, `You need to enter text to narrate. Usage:\n${usage(game.settings)}`);

	const status = player.getBehaviorAttributeStatusEffects("disable narrate");
	if (status.length > 0) return game.communicationHandler.reply(message, `You cannot do that because you are **${status[0].id}**.`);

	const input = args.join(" ");
	if (input.length >= 2000)
		return game.communicationHandler.reply(message, `Your narration exceeds Discord's character limit. Please split it into multiple messages.`);

	const narrateAction = new NarrateAction(game, message, player, player.location, false);
	game.narrationHandler.sendNarrateAction(MessageDisplayType.PLAYER, narrateAction, input, player);
}
