const constants = include('Configs/constants.json');
const commandHandler = include(`${constants.modulesDir}/commandHandler.js`);

class Flag {
	constructor(id, value, commandSetsString, commandSets, row) {
		this.id = id;
		this.value = value;
		this.commandSetsString = commandSetsString;
		this.commandSets = commandSets;
		this.row = row;
	}
}

module.exports = Flag;

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
