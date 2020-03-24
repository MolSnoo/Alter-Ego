const settings = include('settings.json');

class Event {
    constructor(name, ongoing, duration, remaining, triggerTimes, roomTag, triggeredCommands, endedCommands, effectsStrings, triggeredNarration, endedNarration, row) {
        this.name = name;
        this.ongoing = ongoing;
        this.duration = duration;
        this.remaining = remaining;
        this.triggerTimes = triggerTimes;
        this.roomTag = roomTag;
        this.triggeredCommands = triggeredCommands;
        this.endedCommands = endedCommands;
        this.effectsStrings = effectsStrings;
        this.effects = [...effectsStrings];
        this.triggeredNarration = triggeredNarration;
        this.endedNarration = endedNarration;
        this.row = row;

        this.timer = null;
    }

    triggeredCell() {
        return settings.eventSheetTriggeredColumn + this.row;
    }
    endedCell() {
        return settings.eventSheetEndedColumn + this.row;
    }
}

module.exports = Event;
