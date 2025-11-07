const constants = require('../Configs/constants.json');
const commandHandler = require('../Modules/commandHandler.js');
const parser = require('../Modules/parser.js');

const Narration = require('./Narration.js');

var moment = require('moment');
var timer = require('moment-timer');
moment().format();

/**
 * @class Event
 * @classdesc Represents an event.
 * @param {string} name - The name of the event.
 * @param {boolean} ongoing - Whether the event is ongoing.
 * @param {string} durationString - The string representation of the duration of the event.
 * @param {Duration} duration - The duration of the event.
 * @param {string} remainingString - The string representation of the remaining time of the event.
 * @param {Duration} remaining - The remaining time of the event.
 * @param {string} triggerTimesString - The string representation of the trigger times of the event.
 * @param {string[]} triggerTimes - The trigger times of the event.
 * @param {string} roomTag - The keyword or phrase assigned to the event that allows it to affect rooms.
 * @param {string} commandsString - Comma separated list of bot commands to be executed when the event is triggered or ended.
 * @param {string[]} triggeredCommands - The bot commands to be executed when the event is triggered.
 * @param {string[]} endedCommands - The bot commands to be executed when the event is ended.
 * @param {string[]} effectsStrings - String representations of status effects to be inflicted on occupants when the event is ongoing.
 * @param {string[]} refreshStrings - String representations of status effects whose status effect duration will be reset to full when the event is ongoing.
 * @param {string} triggeredNarration - The narration to be sent to rooms when the event is triggered.
 * @param {string} endedNarration - The narration to be sent to rooms when the event is ended.
 * @param {number} row - The row of the event in the event sheet.
 */
class Event {
    /**
     * @param {string} name - The name of the event.
     * @param {boolean} ongoing - Whether the event is ongoing.
     * @param {string} durationString - The string representation of the duration of the event.
     * @param {Duration} duration - The duration of the event.
     * @param {string} remainingString - The string representation of the remaining time of the event.
     * @param {Duration} remaining - The remaining time of the event.
     * @param {string} triggerTimesString - The string representation of the trigger times of the event.
     * @param {string[]} triggerTimes - The trigger times of the event.
     * @param {string} roomTag - The keyword or phrase assigned to the event that allows it to affect rooms.
     * @param {string} commandsString - Comma separated list of bot commands to be executed when the event is triggered or ended.
     * @param {string[]} triggeredCommands - The bot commands to be executed when the event is triggered.
     * @param {string[]} endedCommands - The bot commands to be executed when the event is ended.
     * @param {string[]} effectsStrings - String representations of status effects to be inflicted on occupants when the event is ongoing.
     * @param {string[]} refreshStrings - String representations of status effects whose status effect duration will be reset to full when the event is ongoing.
     * @param {string} triggeredNarration - The narration to be sent to rooms when the event is triggered.
     * @param {string} endedNarration - The narration to be sent to rooms when the event is ended.
     * @param {number} row - The row of the event in the event sheet.
     */
    constructor(name, ongoing, durationString, duration, remainingString, remaining, triggerTimesString, triggerTimes, roomTag, commandsString, triggeredCommands, endedCommands, effectsStrings, refreshStrings, triggeredNarration, endedNarration, row) {
        this.name = name;
        this.ongoing = ongoing;
        this.durationString = durationString;
        this.duration = duration;
        this.remainingString = remainingString;
        this.remaining = remaining;
        this.triggerTimesString = triggerTimesString;
        this.triggerTimes = triggerTimes;
        this.roomTag = roomTag;
        this.commandsString = commandsString;
        this.triggeredCommands = triggeredCommands;
        this.endedCommands = endedCommands;
        this.effectsStrings = effectsStrings;
        /** @type {string[] | Status[]} */
        this.effects = [...effectsStrings];
        this.refreshesStrings = refreshStrings;
        /** @type {string[] | Status[]} */
        this.refreshes = [...refreshStrings];
        this.triggeredNarration = triggeredNarration;
        this.endedNarration = endedNarration;
        this.row = row;

        /** @type {timer | null} */
        this.timer = null;
        /** @type {timer | null} */
        this.effectsTimer = null;
    }

    static formats = [
        "LT", "LTS", "HH:mm", "hh:mm a",
        "ddd LT", "ddd LTS", "ddd HH:mm", "ddd hh:mm a",
        "dddd LT", "dddd LTS", "dddd HH:mm", "dddd hh:mm a",
        "Do LT", "Do LTS", "Do HH:mm", "Do hh:mm a",
        "Do MMM LT", "Do MMM LTS", "Do MMM HH:mm", "Do MMM hh:mm a",
        "Do MMMM LT", "Do MMMM LTS", "Do MMMM HH:mm", "Do MMMM hh:mm a",
        "D MMM LT", "D MMM LTS", "D MMM HH:mm", "D MMM hh:mm a",
        "D MMMM LT", "D MMMM LTS", "D MMMM HH:mm", "D MMMM hh:mm a",
        "MMM Do LT", "MMM Do LTS", "MMM Do HH:mm", "MMM Do hh:mm a",
        "MMMM Do LT", "MMMM Do LTS", "MMMM Do HH:mm", "MMMM Do hh:mm a",
        "MMM D LT", "MMM D LTS", "MMM D HH:mm", "MMM D hh:mm a",
        "MMMM D LT", "MMMM D LTS", "MMMM D HH:mm", "MMMM D hh:mm a"
    ];

    /**
     * Trigger the event.
     * @param {Client} bot
     * @param {Game} game
     * @param {boolean} doTriggeredCommands
     * @returns {Promise<void>}
     */
    async trigger(bot, game, doTriggeredCommands) {
        // Mark it as ongoing.
        this.ongoing = true;

        // Send the triggered narration to all rooms with occupants.
        if (this.triggeredNarration !== "") {
            for (let i = 0; i < game.rooms.length; i++) {
                if (game.rooms[i].tags.includes(this.roomTag) && game.rooms[i].occupants.length > 0)
                    new Narration(game, null, game.rooms[i], parser.parseDescription(this.triggeredNarration, this, null, false)).send();
            }
        }

        if (doTriggeredCommands) {
            // Run any needed commands.
            for (let i = 0; i < this.triggeredCommands.length; i++) {
                if (this.triggeredCommands[i].startsWith("wait")) {
                    let args = this.triggeredCommands[i].split(" ");
                    if (!args[1]) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${this.triggeredCommands[i]}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${this.triggeredCommands[i]}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                } else {
                    commandHandler.execute(this.triggeredCommands[i], bot, game, null, null, this);
                }
            }
        }

        // Begin the timer, if applicable.
        if (this.duration)
            this.startTimer(bot, game);
        if (this.effects.length > 0 || this.refreshes.length > 0)
            this.startEffectsTimer(game);

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${this.name} was triggered.`);
    }

    /**
     * Ends the event.
     * @param {Client} bot
     * @param {Game} game
     * @param {boolean} doEndedCommands
     * @returns {Promise<void>}
     */
    async end(bot, game, doEndedCommands) {
        // Unmark it as ongoing.
        this.ongoing = false;

        // Stop the timer.
        if (this.timer !== null) {
            this.timer.stop();
            this.timer = null;
            this.remaining = null;
            this.remainingString = "";
        }
        if (this.effectsTimer !== null) {
            this.effectsTimer.stop();
            this.effectsTimer = null;
        }

        // Send the ended narration to all rooms with occupants.
        if (this.endedNarration !== "") {
            for (let i = 0; i < game.rooms.length; i++) {
                if (game.rooms[i].tags.includes(this.roomTag) && game.rooms[i].occupants.length > 0)
                    new Narration(game, null, game.rooms[i], parser.parseDescription(this.endedNarration, this, null, false)).send();
            }
        }

        if (doEndedCommands) {
            // Run any needed commands.
            for (let i = 0; i < this.endedCommands.length; i++) {
                if (this.endedCommands[i].startsWith("wait")) {
                    let args = this.endedCommands[i].split(" ");
                    if (!args[1]) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${this.endedCommands[i]}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${this.endedCommands[i]}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                } else {
                    commandHandler.execute(this.endedCommands[i], bot, game, null, null, this);
                }
            }
        }

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${this.name} was ended.`);
    }

    /**
     * Starts the event timer.
     * @param {Client} bot
     * @param {Game} game
     * @returns {Promise<void>}
     */
    async startTimer(bot, game) {
        if (this.remaining === null)
            this.remaining = this.duration.clone();
        let event = this;
        this.timer = new moment.duration(1000).timer({start: true, loop: true}, async function () {
            event.remaining.subtract(1000, 'ms');

            const days = Math.floor(event.remaining.asDays());
            const hours = event.remaining.hours();
            const minutes = event.remaining.minutes();
            const seconds = event.remaining.seconds();

            let displayString = "";
            if (days !== 0) displayString += `${days} `;
            if (hours >= 0 && hours < 10) displayString += '0';
            displayString += `${hours}:`;
            if (minutes >= 0 && minutes < 10) displayString += '0';
            displayString += `${minutes}:`;
            if (seconds >= 0 && seconds < 10) displayString += '0';
            displayString += `${seconds}`;
            event.remainingString = displayString;

            if (event.remaining.asMilliseconds() <= 0)
                await event.end(bot, game, true);
        });
    }

    /**
     * Starts the event effects timer.
     * @param {Game} game
     */
    startEffectsTimer(game) {
        let event = this;
        this.effectsTimer = new moment.duration(1000).timer({start: true, loop: true}, function () {
            for (let i = 0; i < game.rooms.length; i++) {
                if (game.rooms[i].tags.includes(event.roomTag)) {
                    for (let j = 0; j < game.rooms[i].occupants.length; j++) {
                        const occupant = game.rooms[i].occupants[j];
                        for (let k = 0; k < event.effects.length; k++) {
                            if (!occupant.statusString.includes(event.effects[k].name))
                                occupant.inflict(game, event.effects[k], true, true, true);
                        }
                        for (let k = 0; k < event.refreshes.length; k++) {
                            let status = null;
                            for (let l = 0; l < occupant.status.length; l++) {
                                if (occupant.status[l].name === event.refreshes[k].name) {
                                    status = occupant.status[l];
                                    break;
                                }
                            }
                            if (status !== null && status.remaining !== null)
                                status.remaining = event.effects[k].duration.clone();
                        }
                    }
                }
            }
        });
    }

    /** @return {string} */
    triggeredCell() {
        return constants.eventSheetTriggeredColumn + this.row;
    }

    /** @return {string} */
    endedCell() {
        return constants.eventSheetEndedColumn + this.row;
    }
}

module.exports = Event;

/**
 * Sleeps for the specified number of seconds.
 * @param {number} seconds
 * @returns {Promise<Timeout>}
 */
function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
