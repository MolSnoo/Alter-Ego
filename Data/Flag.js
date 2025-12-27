import Game from './Game.js';
import GameEntity from './GameEntity.js';
import Player from './Player.js';
import { parseAndExecuteBotCommands } from '../Modules/commandHandler.js';
import { default as evaluateScript } from '../Modules/scriptParser.js';
import { addLogMessage } from '../Modules/messageHandler.js';

/**
 * @class Flag
 * @classdesc Represents a flag that can hold various forms of data for easy access elsewhere in the game.
 * @extends GameEntity
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/flag.html
 */
export default class Flag extends GameEntity {
	/**
	 * The unique identifier for this flag.
	 * @readonly
	 * @type {string}
	 */
	id;
	/**
	 * The current value of the flag.
	 * @type {string | number | boolean}
	 */
	value;
	/**
	 * A script which will determine the flag's value programatically.
	 * @type {string}
	 */
	valueScript;
	/**
	 * The string representation of the bot commands to be executed when the flag is set or cleared with specified values.
	 * @readonly
	 * @type {string}
	 */
	commandSetsString;
	/**
	 * Sets of commands to be executed when the flag is set or cleared with specified values.
	 * @type {FlagCommandSet[]}
	 */
	commandSets;

	/**
	 * @constructor
	 * @param {string} id - The unique identifier for this flag.
	 * @param {string | number | boolean} value - The current value of the flag.
	 * @param {string} valueScript - A script which will determine the flag's value programatically.
	 * @param {string} commandSetsString - The string representation of the bot commands to be executed when the flag is set or cleared with specified values.
	 * @param {FlagCommandSet[]} commandSets - Sets of commands to be executed when the flag is set or cleared with specified values.
	 * @param {number} row - The row number of the flag in the sheet.
	 * @param {Game} game - The game this belongs to.
	 */
	constructor(id, value, valueScript, commandSetsString, commandSets, row, game) {
		super(game, row);
		this.id = id;
		this.value = value;
		this.valueScript = valueScript
		this.commandSetsString = commandSetsString;
		this.commandSets = commandSets;
	}

	/**
	 * Evaluates the supplied valueScript to get the new value.
	 * @param {string} [valueScript=this.valueScript] - The script to evaluate. Defaults to the flag's own valueScript if one isn't supplied.
	 * @returns {string | number | boolean}
	 */
	evaluate(valueScript = this.valueScript) {
		return evaluateScript(valueScript, this);
	}

	/**
	 * Sets the flag's value.
	 * @param {string | number | boolean} value - The value to set. 
	 * @param {boolean} doSetCommands - Whether or not to execute the flag's setCommands.
	 * @param {Player} [player] - The player who caused the flag to be set, if applicable.
	 */
	setValue(value, doSetCommands, player) {
		this.value = value;

		// Post log message.
		const valueDisplay =
			typeof this.value === "string" ? `"${this.value}"` :
				typeof this.value === "boolean" ? `\`${this.value}\`` :
					this.value;
		const time = new Date().toLocaleTimeString();
		addLogMessage(this.getGame(), `${time} - ${this.id} was set with value ${valueDisplay}`);

		if (doSetCommands === true) {
			// Find commandSet.
			/** @type {string[]} */
			let commandSet = [];
			if (this.commandSets.length === 1 && this.commandSets[0].values.length === 0)
				commandSet = this.commandSets[0].setCommands;
			else {
				for (let i = 0; i < this.commandSets.length; i++) {
					let foundCommandSet = false;
					for (let j = 0; j < this.commandSets[i].values.length; j++) {
						if (this.commandSets[i].values[j] === String(this.value)) {
							commandSet = this.commandSets[i].setCommands;
							foundCommandSet = true;
							break;
						}
					}
					if (foundCommandSet) break;
				}
			}
			// Execute the command set's set commands.
			parseAndExecuteBotCommands(commandSet, this.getGame(), this, player);
		}
	}

	/**
	 * Sets the flag's value to null.
	 * @param {boolean} doClearedCommands - Whether or not to execute the flag's clearedCommands.
	 * @param {Player} [player] - The player who caused the flag to be cleared, if applicable.
	 */
	clearValue(doClearedCommands, player) {
		const originalValue = this.value;
		this.value = null;
		this.valueScript = '';

		// Post log message.
		const time = new Date().toLocaleTimeString();
		addLogMessage(this.getGame(), `${time} - ${this.id} was cleared`);

		if (doClearedCommands === true) {
			// Find commandSet.
			/** @type {string[]} */
			let commandSet = [];
			if (this.commandSets.length === 1 && this.commandSets[0].values.length === 0)
				commandSet = this.commandSets[0].clearedCommands;
			else {
				for (let i = 0; i < this.commandSets.length; i++) {
					let foundCommandSet = false;
					for (let j = 0; j < this.commandSets[i].values.length; j++) {
						if (this.commandSets[i].values[j] === String(originalValue)) {
							commandSet = this.commandSets[i].clearedCommands;
							foundCommandSet = true;
							break;
						}
					}
					if (foundCommandSet) break;
				}
			}
			// Execute the command set's cleared commands.
			parseAndExecuteBotCommands(commandSet, this.getGame(), this, player);
		}
	}
}
