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

	setValue(value) {
		this.value = value;
	}

	clearValue() {
		this.value = null;
	}
}

module.exports = Flag;

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
