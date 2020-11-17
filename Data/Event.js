const settings = include('settings.json');
const commandHandler = include(`${settings.modulesDir}/commandHandler.js`);
const parser = include(`${settings.modulesDir}/parser.js`);

const Narration = include(`${settings.dataDir}/Narration.js`);

var moment = require('moment');
var timer = require('moment-timer');
moment().format();

class Event {
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
        this.effects = [...effectsStrings];
        this.refreshesStrings = refreshStrings;
        this.refreshes = [...refreshStrings];
        this.triggeredNarration = triggeredNarration;
        this.endedNarration = endedNarration;
        this.row = row;

        this.timer = null;
        this.effectsTimer = null;
    }

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
                }
                else {
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

        return;
    }

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
                }
                else {
                    commandHandler.execute(this.endedCommands[i], bot, game, null, null, this);
                }
            }
        }

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${this.name} was ended.`);

        return;
    }

    async startTimer(bot, game) {
        if (this.remaining === null)
            this.remaining = this.duration.clone();
        let event = this;
        this.timer = new moment.duration(1000).timer({ start: true, loop: true }, async function () {
            event.remaining.subtract(1000, 'ms');

            const days = Math.floor(event.remaining.asDays());
            const hours = event.remaining.hours();
            const minutes = event.remaining.minutes();
            const seconds = event.remaining.seconds();

            var displayString = "";
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

    startEffectsTimer(game) {
        let event = this;
        this.effectsTimer = new moment.duration(1000).timer({ start: true, loop: true }, function () {
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

    triggeredCell() {
        return settings.eventSheetTriggeredColumn + this.row;
    }
    endedCell() {
        return settings.eventSheetEndedColumn + this.row;
    }
}

module.exports = Event;

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
