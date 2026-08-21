import MonologAction from '../Data/Actions/MonologAction.ts';

/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import Player from '../Data/Player.ts' */

/** @type {CommandConfig} */
export const config = {
	name: "monolog_player",
	description: "Narrates your inner thoughts.",
	details: `Narrates your inner thoughts privately. You will receive a copy of your monolog in DMs, and it will be sent to your spectate channel. `
		+ `Other players in the room will not be able to see or hear your private thoughts, so you can enter anything you like. However, keep in mind `
		+ `that if you send the command in the room channel, it will still appear there before being deleted. For that reason, this command works best `
		+ `when it is sent in DMs. Please note that you cannot send a monolog that exceeds Discord's character limit, which is 2000 characters.`,
	usableBy: "Player",
	aliases: ["monolog", "monologue", "mo", "mn"],
	requiresGame: true,
	whitespaceSensitive: true,
    usableInEditMode: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
	return `${settings.commandPrefix}monolog Kyra stares intently at the screen. What could this jumble of text mean, exactly?\n`
		+ `${settings.commandPrefix}monologue I can't believe this. How did this even happen?\n`
		+ `${settings.commandPrefix}monolog No matter what happens, there won't be anything she can do to help anyone after she dies here. That's what hurts most of all.\n`
		+ `${settings.commandPrefix}monologue He could have forgotten about her. Honestly, he seemed to be pretty close to it just now, right? But this photo album... He suddenly remembers so much more than he thought he would.`;
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
		return game.communicationHandler.reply(message, `You need to enter text to monolog. Usage:\n${usage(game.settings)}`);

	const status = player.getBehaviorAttributeStatusEffects("disable monolog");
	if (status.length > 0) return game.communicationHandler.reply(message, `You cannot do that because you are **${status[0].id}**.`);

	const input = args.join(" ");
	if (input.length >= 2000)
		return game.communicationHandler.reply(message, `Your monolog exceeds Discord's character limit. Please split it into multiple messages.`);

	const action = new MonologAction(game, message, player, player.location, false);
	action.performMonolog(input);
}
