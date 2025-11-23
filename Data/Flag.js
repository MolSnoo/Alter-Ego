const constants = include('Configs/constants.json');
const commandHandler = include(`${constants.modulesDir}/commandHandler.js`);
const scriptParser = require('../Modules/scriptParser.js');

class Flag {
	constructor(id, value, valueScript, commandSetsString, commandSets, row) {
		this.id = id;
		this.value = value;
		this.valueScript = valueScript
		this.commandSetsString = commandSetsString;
		this.commandSets = commandSets;
		this.row = row;
	}

	evaluate(valueScript = this.valueScript) {
		return scriptParser.evaluate(valueScript, this);
	}

	async setValue(value, doSetCommands, bot, game, player) {
		this.value = value;

		if (game) {
			// Post log message.
			const valueDisplay = 
				typeof this.value === "string" ? `"${this.value}"` :
				typeof this.value === "boolean" ? `\`${this.value}\`` :
				this.value;
			const time = new Date().toLocaleTimeString();
			game.messageHandler.addLogMessage(game.logChannel, `${time} - ${this.id} was set with value ${valueDisplay}`);
		}

		if (doSetCommands === true) {
            // Find commandSet.
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
            // Run any needed commands.
            for (let i = 0; i < commandSet.length; i++) {
                if (commandSet[i].startsWith("wait")) {
                    let args = commandSet[i].split(" ");
                    if (!args[1]) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${commandSet[i]}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${commandSet[i]}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                }
                else {
                    let command = commandSet[i];
                    commandHandler.execute(command, bot, game, null, player, this);
                }
            }
        }
	}

	async clearValue(doClearedCommands, bot, game, player) {
		const originalValue = this.value;
		this.value = null;
		this.valueScript = '';

		if (game) {
			// Post log message.
			const time = new Date().toLocaleTimeString();
			game.messageHandler.addLogMessage(game.logChannel, `${time} - ${this.id} was cleared`);
		}		

		if (doClearedCommands === true) {
            // Find commandSet.
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
            // Run any needed commands.
            for (let i = 0; i < commandSet.length; i++) {
                if (commandSet[i].startsWith("wait")) {
                    let args = commandSet[i].split(" ");
                    if (!args[1]) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${commandSet[i]}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${commandSet[i]}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                }
                else {
                    let command = commandSet[i];
                    commandHandler.execute(command, bot, game, null, player, this);
                }
            }
        }
	}
}

module.exports = Flag;

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
