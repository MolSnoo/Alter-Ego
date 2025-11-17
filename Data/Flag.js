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

	evaluate(player) {
		try {
			let value = scriptParser.evaluate(this.valueScript, this, player);
			this.value = value;
		}
		catch (err) {}
	}
}

module.exports = Flag;

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
