import GameEntity from './GameEntity.js';
import Game from './Game.js';
import Narration from '../Data/Narration.js';
import Status from './Status.js';
import { default as executeCommand } from '../Modules/commandHandler.js';
import { addGameMechanicMessage, addLogMessage } from '../Modules/messageHandler.js';
import { parseDescription } from '../Modules/parser.js';
import Timer from '../Classes/Timer.js';
import dayjs from 'dayjs';
dayjs().format();

/**
 * @class Event
 * @classdesc Represents a timed event in the game.
 * @extends GameEntity
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/event.html
 */
export default class Event extends GameEntity {
    /**
     * The unique ID of the event.
     * @readonly
     * @type {string}
     */
    id;
    /**
     * The unique name of the event. Deprecated. Use `id` instead.
     * @deprecated
     * @readonly
     * @type {string}
     */
    name;
    /**
     * Whether the event is ongoing.
     * @type {boolean}
     */
    ongoing;
    /**
     * The string representation of how long the event lasts after being triggered.
     * @type {string}
     */
    durationString;
    /**
     * The duration object of the event.
     * @type {import('dayjs/plugin/duration.js').Duration}
     */
    duration;
    /**
     * The string representation of the remaining time of the event.
     * @type {string}
     */
    remainingString;
    /**
     * The remaining time of the event.
     * @type {import('dayjs/plugin/duration.js').Duration}
     */
    remaining;
    /**
     * The string representation of what times the event will be automatically triggered. Deprecated. Use triggerTimesStrings instead.
     * @deprecated
     * @type {string}
     */
    triggerTimesString;
    /**
     * What times the event will be automatically triggered. Deprecated. Use triggerTimesStrings instead.
     * @deprecated
     * @type {string[]}
     */
    triggerTimes;
    /**
     * The string representations of what times the event will be automatically triggered.
     * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/event.html#trigger-times-strings
     * @type {string[]}
     */
    triggerTimesStrings;
    /**
     * The keyword or phrase assigned to the event that allows it to affect rooms.
     * @type {string}
     */
    roomTag;
    /**
     * Forward slash separated list of comma-separated bot commands to be executed when the event is triggered or ended.
     * @type {string}
     */
    commandsString;
    /**
     * The bot commands to be executed when the event is triggered.
     * @type {string[]}
     */
    triggeredCommands;
    /**
     * The bot commands to be executed when the event is ended.
     * @type {string[]}
     */
    endedCommands;
    /**
     * String representations of status effects to be inflicted on occupants of affected rooms every second that the event is ongoing.
     * @type {string[]}
     */
    effectsStrings;
    /** 
     * The status effects to be inflicted on occupants of affected rooms every second that the event is ongoing.
     * @type {Status[]}
     */
    effects;
    /**
     * String representations of status effects whose durations will be reset to full for all occupants of affected rooms every second that the event is ongoing.
     * @type {string[]}
     */
    refreshesStrings;
    /** 
     * The status effects whose durations will be reset to full for all occupants of affected rooms every second that the event is ongoing.
     * @type {Status[]} 
     */
    refreshes;
    /**
     * The narration to be sent to affected rooms when the event is triggered.
     * @readonly
     * @type {string}
     */
    triggeredNarration;
    /**
     * The narration to be sent to affected rooms when the event is ended.
     * @readonly
     * @type {string}
     */
    endedNarration;
    /** 
     * A timer counting down from the event's initial duration every second. When it reaches 0, the event ends, and this becomes `null`.
     * @type {Timer | null} 
     */
    timer;
    /** 
     * A timer that inflicts and refreshes status effects every second whil the event is ongoing.
     * @type {Timer | null}
     */
    effectsTimer;

    /**
     * @constructor
     * @param {string} id - The unique ID of the event.
     * @param {boolean} ongoing - Whether the event is ongoing.
     * @param {string} durationString - The string representation of how long the event lasts after being triggered.
     * @param {import('dayjs/plugin/duration.js').Duration} duration - The duration object of the event.
     * @param {string} remainingString - The string representation of the remaining time of the event.
     * @param {import('dayjs/plugin/duration.js').Duration} remaining - The remaining time of the event.
     * @param {string[]} triggerTimesStrings - The string representations of what times the event will be automatically triggered. Refer to this link for accepted formats: {@link https://molsnoo.github.io/Alter-Ego/reference/data_structures/event.html#trigger-times-string}
     * @param {string} roomTag - The keyword or phrase assigned to the event that allows it to affect rooms.
     * @param {string} commandsString - Forward slash separated list of comma-separated bot commands to be executed when the event is triggered or ended.
     * @param {string[]} triggeredCommands - The bot commands to be executed when the event is triggered.
     * @param {string[]} endedCommands - The bot commands to be executed when the event is ended.
     * @param {string[]} effectsStrings - String representations of status effects to be inflicted on occupants of affected rooms every second that the event is ongoing.
     * @param {string[]} refreshesStrings - String representations of status effects whose durations will be reset to full for all occupants of affected rooms every second that the event is ongoing.
     * @param {string} triggeredNarration - The narration to be sent to affected rooms when the event is triggered.
     * @param {string} endedNarration - The narration to be sent to affected rooms when the event is ended.
     * @param {number} row - The row of the event in the event sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(id, ongoing, durationString, duration, remainingString, remaining, triggerTimesStrings, roomTag, commandsString, triggeredCommands, endedCommands, effectsStrings, refreshesStrings, triggeredNarration, endedNarration, row, game) {
        super(game, row);
        this.id = id;
        this.name = id;
        this.ongoing = ongoing;
        this.durationString = durationString;
        this.duration = duration;
        this.remainingString = remainingString;
        this.remaining = remaining;
        this.triggerTimesStrings = triggerTimesStrings;
        this.roomTag = roomTag;
        this.commandsString = commandsString;
        this.triggeredCommands = triggeredCommands;
        this.endedCommands = endedCommands;
        this.effectsStrings = effectsStrings;
        this.effects = new Array(this.effectsStrings.length);
        this.refreshesStrings = refreshesStrings;
        this.refreshes = new Array(this.refreshesStrings.length);
        this.triggeredNarration = triggeredNarration;
        this.endedNarration = endedNarration;

        this.timer = null;
        this.effectsTimer = null;
    }

    /** A list of acceptable formats for triggerTimes. */
    static formats = [
        "LT",           "LTS",          "HH:mm",            "hh:mm a",
        "ddd LT",       "ddd LTS",      "ddd HH:mm",        "ddd hh:mm a",
        "dddd LT",      "dddd LTS",     "dddd HH:mm",       "dddd hh:mm a",
        "Do LT",        "Do LTS",       "Do HH:mm",         "Do hh:mm a",
        "Do MMM LT",    "Do MMM LTS",   "Do MMM HH:mm",     "Do MMM hh:mm a",
        "Do MMMM LT",   "Do MMMM LTS",  "Do MMMM HH:mm",    "Do MMMM hh:mm a",
        "D MMM LT",     "D MMM LTS",    "D MMM HH:mm",      "D MMM hh:mm a",
        "D MMMM LT",    "D MMMM LTS",   "D MMMM HH:mm",     "D MMMM hh:mm a",
        "MMM Do LT",    "MMM Do LTS",   "MMM Do HH:mm",     "MMM Do hh:mm a",
        "MMMM Do LT",   "MMMM Do LTS",  "MMMM Do HH:mm",    "MMMM Do hh:mm a",
        "MMM D LT",     "MMM D LTS",    "MMM D HH:mm",      "MMM D hh:mm a",
        "MMMM D LT",    "MMMM D LTS",   "MMMM D HH:mm",     "MMMM D hh:mm a"
    ];

    /**
     * Trigger the event.
     * @param {boolean} doTriggeredCommands - Whether or not to execute the event's triggeredCommands.
     */
    async trigger(doTriggeredCommands) {
        // Mark it as ongoing.
        this.ongoing = true;

        // Send the triggered narration to all rooms with occupants.
        if (this.triggeredNarration !== "") {
            for (let i = 0; i < this.game.rooms.length; i++) {
                if (this.game.rooms[i].tags.includes(this.roomTag) && this.game.rooms[i].occupants.length > 0)
                    new Narration(this.game, null, this.game.rooms[i], parseDescription(this.triggeredNarration, this, null)).send();
            }
        }

        if (doTriggeredCommands) {
            // Run any needed commands.
            for (let i = 0; i < this.triggeredCommands.length; i++) {
                if (this.triggeredCommands[i].startsWith("wait")) {
                    let args = this.triggeredCommands[i].split(" ");
                    if (!args[1]) return addGameMechanicMessage(this.game, this.game.guildContext.commandChannel, `Error: Couldn't execute command "${this.triggeredCommands[i]}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return addGameMechanicMessage(this.game, this.game.guildContext.commandChannel, `Error: Couldn't execute command "${this.triggeredCommands[i]}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                }
                else {
                    executeCommand(this.triggeredCommands[i], this.game, null, null, this);
                }
            }
        }

        // Begin the timer, if applicable.
        if (this.duration)
            this.startTimer();
        if (this.effects.length > 0 || this.refreshes.length > 0)
            this.startEffectsTimer();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(this.game, `${time} - ${this.id} was triggered.`);
    }

    /**
     * End the event.
     * @param {boolean} doEndedCommands - Whether or not to execute the event's endedCommands.
     */
    async end(doEndedCommands) {
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
            for (let i = 0; i < this.game.rooms.length; i++) {
                if (this.game.rooms[i].tags.includes(this.roomTag) && this.game.rooms[i].occupants.length > 0)
                    new Narration(this.game, null, this.game.rooms[i], parseDescription(this.endedNarration, this, null)).send();
            }
        }

        if (doEndedCommands) {
            // Run any needed commands.
            for (let i = 0; i < this.endedCommands.length; i++) {
                if (this.endedCommands[i].startsWith("wait")) {
                    let args = this.endedCommands[i].split(" ");
                    if (!args[1]) return addGameMechanicMessage(this.game, this.game.guildContext.commandChannel, `Error: Couldn't execute command "${this.endedCommands[i]}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return addGameMechanicMessage(this.game, this.game.guildContext.commandChannel, `Error: Couldn't execute command "${this.endedCommands[i]}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                }
                else {
                    executeCommand(this.endedCommands[i], this.game, null, null, this);
                }
            }
        }

        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(this.game, `${time} - ${this.id} was ended.`);

        return;
    }

    async startTimer() {
        if (this.remaining === null)
            this.remaining = this.duration.clone();
        let event = this;
        this.timer = new Timer(dayjs.duration(1000), { start: true, loop: true }, async function () {
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
                await event.end(true);
        });
    }

    startEffectsTimer() {
        let event = this;
        this.effectsTimer = new Timer(dayjs.duration(1000), { start: true, loop: true }, function () {
            for (let i = 0; i < event.game.rooms.length; i++) {
                if (event.game.rooms[i].tags.includes(event.roomTag)) {
                    for (let j = 0; j < event.game.rooms[i].occupants.length; j++) {
                        const occupant = event.game.rooms[i].occupants[j];
                        for (let k = 0; k < event.effects.length; k++) {
                            if (!occupant.statusString.includes(event.effects[k].id))
                                occupant.inflict(event.effects[k], true, true, true);
                        }
                        for (let k = 0; k < event.refreshes.length; k++) {
                            let status = null;
                            for (let l = 0; l < occupant.status.length; l++) {
                                if (occupant.status[l].id === event.refreshes[k].id) {
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

    triggeredCell() {
        return this.game.constants.eventSheetTriggeredColumn + this.row;
    }
    endedCell() {
        return this.game.constants.eventSheetEndedColumn + this.row;
    }
}

/**
 * @param {number} seconds 
 */
function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
