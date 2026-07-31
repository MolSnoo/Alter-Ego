import { parse } from "date-fns";
import { DateTime, type Duration } from "luxon";
import Timer from "../Classes/Timer.ts";
import EndAction from "./Actions/EndAction.ts";
import InflictAction from "./Actions/InflictAction.ts";
import Description from "./Description.ts";
import type Game from "./Game.ts";
import GameEntity from "./GameEntity.ts";
import type Status from "./Status.ts";

export type EventField = "id"|"ongoing"|"durationString"|"timeRemaining"|"triggerTimesString"|"roomTag"|"commandsString"|"effectsString"|"refreshesString"|"triggeredNarration"|"endedNarration";

interface ParsedTriggerTime {
    datetime?: DateTime<true>;
    format?: string;
    valid: boolean;
}

/**
 * Represents a timed event in the game.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/event.html
 */
export default class Event extends GameEntity implements PersistentGameEntity {
    /**
     * The unique ID of the event.
     */
    readonly id: string;
    /**
     * The unique name of the event. Deprecated. Use `id` instead.
     * @deprecated
     */
    readonly name: string;
    /**
     * Whether the event is ongoing.
     */
    ongoing: boolean;
    /**
     * The string representation of how long the event lasts after being triggered.
     */
    durationString: string;
    /**
     * The duration object of the event.
     */
    duration: Duration<true>;
    /**
     * The string representation of the remaining time of the event.
     */
    remainingString: string;
    /**
     * The remaining time of the event.
     */
    remaining: Duration<true>;
    /**
     * The string representations of what times the event will be automatically triggered.
     *
     * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/event.html#trigger-times-strings
     */
    triggerTimesStrings: string[];
    /**
     * The keyword or phrase assigned to the event that allows it to affect rooms.
     */
    roomTag: string;
    /**
     * Forward slash separated list of comma-separated bot commands to be executed when the event is triggered or ended.
     */
    commandsString: string;
    /**
     * The bot commands to be executed when the event is triggered.
     */
    triggeredCommands: string[];
    /**
     * The bot commands to be executed when the event is ended.
     */
    endedCommands: string[];
    /**
     * String representations of status effects to be inflicted on occupants of affected rooms every second that the event is ongoing.
     */
    effectsStrings: string[];
    /**
     * The status effects to be inflicted on occupants of affected rooms every second that the event is ongoing.
     */
    effects: Status[];
    /**
     * String representations of status effects whose durations will be reset to full for all occupants of affected rooms every second that the event is ongoing.
     */
    refreshesStrings: string[];
    /**
     * The status effects whose durations will be reset to full for all occupants of affected rooms every second that the event is ongoing.
     */
    refreshes: Status[];
    /**
     * The narration to be sent to affected rooms when the event is triggered.
     */
    readonly triggeredNarration: Description;
    /**
     * The narration to be sent to affected rooms when the event is ended.
     */
    readonly endedNarration: Description;
    /**
     * A timer counting down from the event's initial duration every second. When it reaches 0, the event ends, and this becomes `null`.
     */
    timer: Timer | null;
    /**
     * A timer that inflicts and refreshes status effects every second while the event is ongoing.
     */
    effectsTimer: Timer | null;

    /**
     * @param id - The unique ID of the event.
     * @param ongoing - Whether the event is ongoing.
     * @param durationString - The string representation of how long the event lasts after being triggered.
     * @param duration - The duration object of the event.
     * @param remainingString - The string representation of the remaining time of the event.
     * @param remaining - The remaining time of the event.
     * @param triggerTimesStrings - The string representations of what times the event will be automatically triggered. Refer to this link for accepted formats: {@link https://msvblank.github.io/Alter-Ego/reference/data_structures/event.html#trigger-times-string}
     * @param roomTag - The keyword or phrase assigned to the event that allows it to affect rooms.
     * @param commandsString - Forward slash separated list of comma-separated bot commands to be executed when the event is triggered or ended.
     * @param triggeredCommands - The bot commands to be executed when the event is triggered.
     * @param endedCommands - The bot commands to be executed when the event is ended.
     * @param effectsStrings - String representations of status effects to be inflicted on occupants of affected rooms every second that the event is ongoing.
     * @param refreshesStrings - String representations of status effects whose durations will be reset to full for all occupants of affected rooms every second that the event is ongoing.
     * @param triggeredNarration - The narration to be sent to affected rooms when the event is triggered.
     * @param endedNarration - The narration to be sent to affected rooms when the event is ended.
     * @param row - The row of the event in the event sheet.
     * @param game - The game this belongs to.
     */
    constructor(id: string, ongoing: boolean, durationString: string, duration: Duration, remainingString: string,
        remaining: Duration, triggerTimesStrings: string[], roomTag: string, commandsString: string,
        triggeredCommands: string[], endedCommands: string[], effectsStrings: string[], refreshesStrings: string[],
        triggeredNarration: string, endedNarration: string, row: number, game: Game) {
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
        this.triggeredNarration = new Description(triggeredNarration, this, game);
        this.endedNarration = new Description(endedNarration, this, game);

        this.timer = null;
        this.effectsTimer = null;
    }

    /** A list of acceptable formats for triggerTimes. */
    static formats: string[] = [
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
     */
    trigger(): void {
        // Mark it as ongoing.
        this.ongoing = true;
        // Begin the timer, if applicable.
        if (this.duration)
            this.startTimer();
        if (this.effects.length > 0 || this.refreshes.length > 0)
            this.startEffectsTimer();
    }

    /**
     * Executes the event's triggered commands.
     */
    executeTriggeredCommands(): void {
        this.getGame().clientContext.commandHandler.parseAndExecuteBotCommands(this.triggeredCommands, this.getGame(), this);
    }

    /**
     * End the event.
     */
    end(): void {
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
    }

    /**
     * Executes the event's ended commands.
     */
    executeEndedCommands(): void {
        this.getGame().clientContext.commandHandler.parseAndExecuteBotCommands(this.endedCommands, this.getGame(), this);
    }

    startTimer(): void {
        if (this.remaining === null)
            this.remaining = this.duration;
        let event = this;
        this.timer = new Timer(1000, { start: true, loop: true }, function () {
            event.remaining = event.remaining.minus(1000);

            const format = Math.floor(event.remaining.as('days')) !== 0 ? 'd hh:mm:ss' : 'hh:mm:ss';
            event.remainingString = event.remaining.toFormat(format);

            if (event.remaining.as('milliseconds') <= 0) {
                const endAction = new EndAction(event.getGame(), undefined, undefined, undefined, false);
                endAction.performEnd(event);
            }
        });
    }

    startEffectsTimer(): void {
        let event = this;
        this.effectsTimer = new Timer(1000, { start: true, loop: true }, async function () {
            const rooms = event.getGame().entityFinder.getRooms(null, event.roomTag, true);
            for (let room of rooms) {
                for (let occupant of room.occupants) {
                    for (const effect of event.effects) {
                        if (!occupant.hasStatus(effect.id)) {
                            const action = new InflictAction(event.getGame(), undefined, occupant, occupant.location, true);
                            await action.performInflict(effect, true, true, true);
                        }
                    }
                    for (const refresh of event.refreshes) {
                        let status: Status = occupant.status.get(refresh.id);
                        if (status !== undefined && status.remaining !== null)
                            status.remaining = refresh.duration;
                    }
                }
            }
        });
    }

    triggeredCell(): string {
        return this.getGame().constants.eventSheetTriggeredColumn + this.row;
    }
    endedCell(): string {
        return this.getGame().constants.eventSheetEndedColumn + this.row;
    }

    /**
     * Parses a triggerTime string and returns an object that stores the parsed time and the format used to parse it.
     *
     * @param timeString - The string to parse.
     */
    static parseTriggerTime(timeString: string): ParsedTriggerTime {
        for (const format of Event.formats) {
            let parsedTime = DateTime.fromJSDate(parse(timeString, format, new Date()));
            if (parsedTime.isValid) {
                return { format: format, datetime: parsedTime, valid: true };
            }
        }
        return { format: null, datetime: undefined, valid: false };
    }

    getEntityID(): string {
        return this.id;
    }

    getLabel(field: EventField): string {
        switch (field) {
            case "id": return "Event ID";
            case "ongoing": return "Ongoing?";
            case "durationString": return "Duration";
            case "timeRemaining": return "Time Remaining";
            case "triggerTimesString": return "Triggers At";
            case "roomTag": return "In Rooms with Tag";
            case "commandsString": return "When Triggered / Ended";
            case "effectsString": return "Inflicts Status Effect(s)";
            case "refreshesString": return "Refreshes Status Effect(s)";
            case "triggeredNarration": return "Narration When Triggered";
            case "endedNarration": return "Narration When Ended";
        }
    }

    getValue(field: EventField): string {
        switch (field) {
            case "id": return this.id;
            case "ongoing": return this.ongoing ? "TRUE" : "FALSE";
            case "durationString": return this.durationString;
            case "timeRemaining": return this.remainingString;
            case "triggerTimesString": return this.triggerTimesStrings.join(", ");
            case "roomTag": return this.roomTag;
            case "commandsString": return this.commandsString;
            case "effectsString": return this.effectsStrings.join(", ");
            case "refreshesString": return this.refreshesStrings.join(", ");
            case "triggeredNarration": return this.triggeredNarration.text;
            case "endedNarration": return this.endedNarration.text;
        }
    }

    getViewField(field: EventField): ViewField {
        return { label: this.getLabel(field), value: this.getValue(field) };
    }

    override getEntityType(): string {
        return "Event";
    }
}
