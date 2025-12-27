import GameEntity from './GameEntity.js';
import Narration from '../Data/Narration.js';
import { parseAndExecuteBotCommands } from '../Modules/commandHandler.js';
import { addLogMessage } from '../Modules/messageHandler.js';
import { parseDescription } from '../Modules/parser.js';
import Timer from '../Classes/Timer.js';
import { DateTime } from 'luxon';
import { parse } from 'date-fns';

/** @typedef {import('./Game.js').default} Game */
/** @typedef {import('./Status.js').default} Status */
/** @typedef {import('luxon').Duration} Duration */

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
     * @type {Duration}
     */
    duration;
    /**
     * The string representation of the remaining time of the event.
     * @type {string}
     */
    remainingString;
    /**
     * The remaining time of the event.
     * @type {Duration}
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
     * @param {Duration} duration - The duration object of the event.
     * @param {string} remainingString - The string representation of the remaining time of the event.
     * @param {Duration} remaining - The remaining time of the event.
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
        "p",           "pp",          "HH:mm",            "hh:mm a",
        "ccc p",       "ccc pp",      "ccc HH:mm",        "ccc hh:mm a",
        "cccc p",      "cccc pp",     "cccc HH:mm",       "cccc hh:mm a",
        "do p",        "do pp",       "do HH:mm",         "do hh:mm a",
        "do MMM p",    "do MMM pp",   "do MMM HH:mm",     "do MMM hh:mm a",
        "do MMMM p",   "do MMMM pp",  "do MMMM HH:mm",    "do MMMM hh:mm a",
        "d MMM p",     "d MMM pp",    "d MMM HH:mm",      "d MMM hh:mm a",
        "d MMMM p",    "d MMMM pp",   "d MMMM HH:mm",     "d MMMM hh:mm a",
        "MMM do p",    "MMM do pp",   "MMM do HH:mm",     "MMM do hh:mm a",
        "MMMM do p",   "MMMM do pp",  "MMMM do HH:mm",    "MMMM do hh:mm a",
        "MMM d p",     "MMM d pp",    "MMM d HH:mm",      "MMM d hh:mm a",
        "MMMM d p",    "MMMM d pp",   "MMMM d HH:mm",     "MMMM d hh:mm a"
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
            const rooms = this.getGame().entityFinder.getRooms(null, this.roomTag, false);
            for (let room of rooms)
                new Narration(this.getGame(), null, room, parseDescription(this.triggeredNarration, this, null)).send();
        }

        // Execute triggered commands.
        if (doTriggeredCommands)
            await parseAndExecuteBotCommands(this.triggeredCommands, this.getGame(), this);

        // Begin the timer, if applicable.
        if (this.duration)
            this.startTimer();
        if (this.effects.length > 0 || this.refreshes.length > 0)
            this.startEffectsTimer();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(this.getGame(), `${time} - ${this.id} was triggered.`);
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
            const rooms = this.getGame().entityFinder.getRooms(null, this.roomTag, false);
            for (let room of rooms)
                new Narration(this.getGame(), null, room, parseDescription(this.endedNarration, this, null)).send();
        }

        // Execute ended commands.
        if (doEndedCommands)
            await parseAndExecuteBotCommands(this.endedCommands, this.getGame(), this);

        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(this.getGame(), `${time} - ${this.id} was ended.`);
    }

    async startTimer() {
        if (this.remaining === null)
            this.remaining = this.duration;
        let event = this;
        this.timer = new Timer(1000, { start: true, loop: true }, async function () {
            event.remaining = event.remaining.minus(1000);

            const days = Math.floor(event.remaining.as('days'));
            const hours = event.remaining.hours;
            const minutes = event.remaining.minutes;
            const seconds = event.remaining.seconds;

            let displayString = "";
            if (days !== 0) displayString += `${days} `;
            if (hours >= 0 && hours < 10) displayString += '0';
            displayString += `${hours}:`;
            if (minutes >= 0 && minutes < 10) displayString += '0';
            displayString += `${minutes}:`;
            if (seconds >= 0 && seconds < 10) displayString += '0';
            displayString += `${seconds}`;
            event.remainingString = displayString;

            if (event.remaining.as('milliseconds') <= 0)
                await event.end(true);
        });
    }

    startEffectsTimer() {
        let event = this;
        this.effectsTimer = new Timer(1000, { start: true, loop: true }, function () {
            const rooms = event.getGame().entityFinder.getRooms(null, event.roomTag, true);
            for (let room of rooms) {
                for (let occupant of room.occupants) {
                    event.effects.forEach(effect => {
                        if (!occupant.hasStatus(effect.id))
                            occupant.inflict(effect, true, true, true);
                    });
                    event.refreshes.forEach(refresh => {
                        /** @type {Status} */
                        let status = occupant.statusCollection.get(refresh.id);
                        if (status !== undefined && status.remaining !== null)
                            status.remaining = refresh.duration;
                    });
                }
            }
        });
    }

    triggeredCell() {
        return this.getGame().constants.eventSheetTriggeredColumn + this.row;
    }
    endedCell() {
        return this.getGame().constants.eventSheetEndedColumn + this.row;
    }

    /**
     * Parses a triggerTime string and returns an object that stores the parsed time and the format used to parse it.
     * @param {string} timeString - The string to parse. 
     * @returns {ParsedTriggerTime}
     */
    static parseTriggerTime(timeString) {
        for (const format of Event.formats) {
            let parsedTime = DateTime.fromJSDate(parse(timeString, format, new Date()));
            if (parsedTime.isValid) {
                return { format: format, datetime: parsedTime, valid: true };
            }
        }
        return { format: null, datetime: undefined, valid: false };
    }
}
