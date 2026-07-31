// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { default as evaluateScript } from "../Modules/scriptParser.js";
import type Game from "./Game.ts";
import GameEntity from "./GameEntity.ts";
import type Player from "./Player.ts";

export type FlagField = "id"|"value"|"valueScript"|"commandSetsString";

export interface FlagCommandSet {
    /** Strings indicating which flag values will execute the commands in this command set. Optional. */
    values?: string[];
    /** Bot commands that will be executed when the flag is set. */
    setCommands: string[];
    /** Bot commands that will be executed when the flag is cleared. */
    clearedCommands: string[];
}

/**
 * Represents a flag that can hold various forms of data for easy access elsewhere in the game.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/flag.html
 */
export default class Flag extends GameEntity implements PersistentGameEntity {
	/**
	 * The unique identifier for this flag.
	 */
	readonly id: string;
	/**
	 * The current value of the flag.
	 */
	value: string | number | boolean;
	/**
	 * A script which will determine the flag's value programmatically.
	 */
	valueScript: string;
	/**
	 * The string representation of the bot commands to be executed when the flag is set or cleared with specified values.
	 */
	readonly commandSetsString: string;
	/**
	 * Sets of commands to be executed when the flag is set or cleared with specified values.
	 */
	commandSets: FlagCommandSet[];

	/**
	 * @param id - The unique identifier for this flag.
	 * @param value - The current value of the flag.
	 * @param valueScript - A script which will determine the flag's value programmatically.
	 * @param commandSetsString - The string representation of the bot commands to be executed when the flag is set or cleared with specified values.
	 * @param commandSets - Sets of commands to be executed when the flag is set or cleared with specified values.
	 * @param row - The row number of the flag in the sheet.
	 * @param game - The game this belongs to.
	 */
	constructor(id: string, value: string | number | boolean, valueScript: string, commandSetsString: string,
        commandSets: FlagCommandSet[], row: number, game: Game) {
		super(game, row);
		this.id = id;
		this.value = value;
		this.valueScript = valueScript
		this.commandSetsString = commandSetsString;
		this.commandSets = commandSets;
	}

	/**
	 * Evaluates the supplied valueScript to get the new value.
     *
	 * @param valueScript - The script to evaluate. Defaults to the flag's own valueScript if one isn't supplied.
	 * @param player - The player to evaluate the script with. Optional.
	 */
	evaluate(valueScript: string = this.valueScript, player?: Player): string | number | boolean {
		return evaluateScript(valueScript, this, player ?? undefined);
	}

	/**
	 * Sets the flag's value.
     *
	 * @param value - The value to set.
	 * @param doSetCommands - Whether or not to execute the flag's setCommands.
	 * @param player - The player who caused the flag to be set, if applicable.
	 */
	setValue(value: string | number | boolean, doSetCommands: boolean, player?: Player): void {
		this.value = value;
		this.getGame().logHandler.logSetFlag(this);

		if (doSetCommands === true) {
			// Find commandSet.
			let commandSet: string[] = [];
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
			this.getGame().clientContext.commandHandler.parseAndExecuteBotCommands(commandSet, this.getGame(), this, player);
		}
	}

	/**
	 * Sets the flag's value to null.
     *
	 * @param doClearedCommands - Whether or not to execute the flag's clearedCommands.
	 * @param player - The player who caused the flag to be cleared, if applicable.
	 */
	clearValue(doClearedCommands: boolean, player?: Player): void {
		const originalValue = this.value;
		this.value = null;
		this.valueScript = '';
		this.getGame().logHandler.logClearFlag(this);

		if (doClearedCommands === true) {
			// Find commandSet.
			let commandSet: string[] = [];
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
			this.getGame().clientContext.commandHandler.parseAndExecuteBotCommands(commandSet, this.getGame(), this, player);
		}
	}

    getEntityID(): string {
        return this.id;
    }

    getLabel(field: FlagField): string {
        switch (field) {
            case "id": return "Flag ID";
            case "value": return "Value";
            case "valueScript": return "Value Computed By";
            case "commandSetsString": return "When Set / Cleared";
        }
    }

    getValue(field: FlagField): string {
        switch (field) {
            case "id": return this.id;
            case "value":
                if (typeof this.value === 'boolean') return this.value ? "TRUE" : "FALSE";
                if (typeof this.value === 'number') return String(this.value);
                else return this.value;
            case "valueScript": return this.valueScript;
            case "commandSetsString": return this.commandSetsString;
        }
    }

    getViewField(field: FlagField): ViewField {
        return { label: this.getLabel(field), value: this.getValue(field) };
    }

    override getEntityType(): string {
        return "Flag";
    }
}
