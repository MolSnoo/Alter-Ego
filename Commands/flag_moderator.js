import Flag from '../Data/Flag.js';
import Game from '../Data/Game.js';
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */

/** @type {CommandConfig} */
export const config = {
	name: "flag_moderator",
	description: "Set and clear flags.",
	details: 'Set and clear flags.\n\n'
		+ '-**set**: Sets the flag value as the specified input. If the flag does not already exist, then a new one '
		+ 'will be created with the specified name. The specified value must be a boolean, number, or string. '
		+ 'String values must be surrounded by quotation marks. If you want to set the flag\'s value script, '
		+ 'surround your input with `` `tics` ``. This script will immediately be evaluated, '
		+ 'and the flag\'s value will be set accordingly. Whether the flag\'s value or value script '
		+ 'is set, the flag\'s set commands will be executed, unless the flag was set by another flag.\n\n'
		+ '-**clear**: Clears the flag value. This will replace the flag\'s current value with `null`. '
		+ 'When this is cleared, the flag\'s cleared commands will be executed unless the flag was cleared by another flag.',
	usableBy: "Moderator",
	aliases: ["flag", "setflag", "clearflag"],
	requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
	return `${settings.commandPrefix}flag set COLD SEASON FLAG true\n`
		+ `${settings.commandPrefix}setflag HOT SEASON FLAG False\n`
		+ `${settings.commandPrefix}flag set TV PROGRAMMING 4\n`
		+ `${settings.commandPrefix}setflag INDOOR TEMPERATURE 25.3\n`
		+ `${settings.commandPrefix}flag set SOUP OF THE DAY "French Onion"\n`
		+ `${settings.commandPrefix}setflag BLOOD SPLATTER “TWO MILKMEN GO COMEDY”\n`
		+ `${settings.commandPrefix}flag set PRECIPITATION \`\` \`findEvent('RAIN').ongoing === true || findEvent('SNOW').ongoing === true\` \`\`\n`
		+ `${settings.commandPrefix}setflag RANDOM ANIMAL \`\` \`getRandomString(['dog', 'cat', 'mouse', 'owl', 'bear'])\` \`\`\n`
		+ `${settings.commandPrefix}flag clear BLOOD SPLATTER\n`
		+ `${settings.commandPrefix}clearflag TV PROGRAMMING\n`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute(game, message, command, args) {
	let input = args.join(" ");
	if (command === "flag") {
		if (args[0] === "set") command = "setflag";
		else if (args[0] === "clear") command = "clearflag";
		args = args.slice(1);
		input = args.join(" ");
	}

	if (args.length === 0)
		return addReply(game, message, `You need to input all required arguments. Usage:\n${usage(game.settings)}`);

	// The value, if it exists, is the easiest to find at the beginning. Look for that first.
	let valueScript;
	let value;
	if (command === "setflag") {
		const scriptMatch = input.match(/(?<!"|“)`(.*)`(?!"|”)/);
		const stringMatch = input.match(/(?<!`)(?:"|“)(.*)(?:"|”)(?!`)/);
		if (scriptMatch && scriptMatch.length === 2) {
			valueScript = scriptMatch[1];
			input = input.substring(0, input.indexOf(scriptMatch[0]));
		}
		else if (stringMatch && stringMatch.length === 2) {
			value = stringMatch[1];
			input = input.substring(0, input.indexOf(stringMatch[0]));
		}
		else if (!isNaN(parseFloat(args[args.length - 1]))) {
			value = parseFloat(args[args.length - 1]);
			input = input.substring(0, input.lastIndexOf(args[args.length - 1]));
		}
		else {
			const lastArg = args[args.length - 1].toLowerCase();
			if (lastArg === "true") value = true;
			else if (lastArg === "false") value = false;
			if (value !== undefined)
				input = input.substring(0, input.toLowerCase().lastIndexOf(lastArg));
		}
		if (valueScript === undefined && value === undefined) return addReply(game, message, `Couldn't find a valid value in "${input}". The value must be a string, number, or boolean.`);

		let flag = game.entityFinder.getFlag(input);
		// If no flag was found, create a new one.
		let newFlag = false;
		if (!flag) {
			newFlag = true;
			// It needs a row number. Get the flag with the highest row number and add 1.
			const rowNumber = [...game.flags.values()].reduce((max, current) => max < current.row ? current.row : max, 0) + 1;
			flag = new Flag(
				Game.generateValidEntityName(input),
				value,
				valueScript,
				"",
				[],
				rowNumber,
				game
			);
		}
		if (valueScript) {
			try {
				value = flag.evaluate(valueScript);
				if (newFlag) game.flags.set(flag.id, flag);
				flag.valueScript = valueScript;
				flag.setValue(value, true);
			}
			catch (err) {
				return addReply(game, message, `The specified script returned an error. ${err}`);
			}
		}
		else {
			if (newFlag) game.flags.set(flag.id, flag);
			flag.setValue(value, true);
		}

		const valueDisplay =
			typeof flag.value === "string" ? `"${flag.value}"` :
				typeof flag.value === "boolean" ? `\`${flag.value}\`` :
					flag.value;
		addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully set flag ${flag.id} with value ${valueDisplay}.`);
	}
	else if (command === "clearflag") {
		const flag = game.entityFinder.getFlag(input);
		if (!flag) return addReply(game, message, `Couldn't find flag "${input}".`);

		flag.clearValue(true);
		addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully cleared flag ${flag.id}.`);
	}
}
