const settings = require("../settings.json");
const sheets = require('./sheets.js');
const Narration = require('./Narration.js');

class Player {
    constructor(id, member, name, displayName, talent, clueLevel, alive, location, hidingSpot, status, inventory, row) {
        this.id = id;
        this.member = member;
        this.name = name;
        this.displayName = displayName;
        this.talent = talent;
        this.clueLevel = clueLevel;
        this.alive = alive;
        this.location = location;
        this.hidingSpot = hidingSpot;
        this.status = status;
        this.statusString = "";
        this.inventory = inventory;
        this.row = row;
    }

    inflict(statusName, game, notify, updateSheet) {
        if (this.statusString.includes(statusName)) return "Specified player already has that status effect.";

        var status = null;
        for (let i = 0; i < game.statusEffects.length; i++) {
            if (game.statusEffects[i].name.toLowerCase() === statusName.toLowerCase()) {
                status = game.statusEffects[i];
                break;
            }
        }
        if (!status) return `Couldn't find status effect "${statusName}".`;

        if (notify === null || notify === undefined) notify = true;
        if (updateSheet === null || updateSheet === undefined) updateSheet = true;

        // Apply the effects of any attributes that require immediate action.
        if (status.attributes.includes("no channel")) {
            this.location.leaveChannel(this);
            this.deleteWhispers(game, " left.");
        }
        if (status.attributes.includes("no speech")) game.mutedPlayers.push(this);
        if (status.attributes.includes("no hearing")) {
            game.deafenedPlayers.push(this);
            this.deleteWhispers(game, " can no longer hear.");
        }
        if (status.attributes.includes("hear room")) game.hearingPlayers.push(this);
        if (status.attributes.includes("acute hearing")) game.acuteHearingPlayers.push(this);
        if (status.attributes.includes("hidden")) {
            game.hiddenPlayers.push(this);
            new Narration(game, this, this.location, `${this.displayName} hides in the ${this.hidingSpot}.`).send();
            sheets.updateCell(this.hidingSpotCell(), this.hidingSpot);
        }
        if (status.attributes.includes("concealed")) {
            if (!this.hasAttribute("hidden")) new Narration(game, this, this.location, `${this.displayName} puts on a mask.`).send();
            this.displayName = "A masked figure";
            game.concealedPlayers.push(this);
        }

        const Status = require('./Status.js');
        status = new Status(status.name, status.duration, status.fatal, status.cure, status.nextStage, status.curedCondition, status.rollModifier, status.attributes, status.row);

        // Apply the duration, if applicable.
        if (status.duration) {
            const timeInt = status.duration.substring(0, status.duration.length - 1);
            if (isNaN(timeInt) || (!status.duration.endsWith('m') && !status.duration.endsWith('h')))
                return "Failed to add status. Duration format is incorrect. Must be a number followed by 'm' or 'h'.";

            let time;
            if (status.duration.endsWith('m'))
                // Set the time in minutes.
                time = timeInt * 60000;
            else if (status.duration.endsWith('h'))
                // Set the time in hours.
                time = timeInt * 3600000;
            status.duration = time;

            let player = this;
            status.timer = setInterval(function () {
                status.duration -= 1000;

                if (status.duration <= 0) {
                    if (status.nextStage) {
                        player.cure(status.name, game, false, false, false);
                        player.inflict(status.nextStage.name, game, true, true);
                    }
                    else {
                        if (status.fatal) {
                            clearInterval(status.timer);
                            player.die(game);
                        }
                        else {
                            player.cure(status.name, game, true, true);
                        }
                    }
                }
                /*const timeLeft = status.duration / 1000;  // Gets the total time in seconds.
                const seconds = Math.floor(timeLeft % 60);
                const minutes = Math.floor((timeLeft / 60) % 60);
                const hours = Math.floor(timeLeft / 3600);

                var statusMessage = " (";
                if (hours >= 0 && hours < 10) statusMessage += "0";
                statusMessage += hours + ":";
                if (minutes >= 0 && minutes < 10) statusMessage += "0";
                statusMessage += minutes + ":";
                if (seconds >= 0 && seconds < 10) statusMessage += "0";
                statusMessage += seconds + " remaining)";

                var curtime = new Date();
                console.log(curtime.toLocaleTimeString() + " timer running on " + status.name + statusMessage);*/
            }, 1000);
        }

        this.status.push(status);

        // Inform player what happened.
        if (notify) {
            let player = this;
            sheets.getData(status.inflictedCell(), function (response) {
                player.member.send(response.data.values[0][0]);
            });
        }

        this.statusString = this.generate_statusList();
        if (updateSheet) sheets.updateCell(this.statusCell(), this.statusString);

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.logChannel.send(`${time} - ${this.name} became ${status.name} in ${this.location.channel}`);

        return "Status successfully added.";
    }

    cure(statusName, game, notify, doCuredCondition, updateSheet) {
        var status = null;
        var statusIndex = -1;
        for (let i = 0; i < this.status.length; i++) {
            if (this.status[i].name.toLowerCase() === statusName.toLowerCase()) {
                status = this.status[i];
                statusIndex = i;
                break;
            }
        }
        if (!status) return "Specified player doesn't have that status effect.";

        if (notify === null || notify === undefined) notify = true;
        if (doCuredCondition === null || doCuredCondition === undefined) doCuredCondition = true;
        if (updateSheet === null || updateSheet === undefined) updateSheet = true;

        if (status.attributes.includes("no channel") && this.getAttributeStatusEffects("no channel").length - 1 === 0)
            this.location.joinChannel(this);
        if (status.attributes.includes("no speech")) game.mutedPlayers.splice(game.mutedPlayers.indexOf(this), 1);
        if (status.attributes.includes("no hearing")) game.deafenedPlayers.splice(game.deafenedPlayers.indexOf(this), 1);
        if (status.attributes.includes("hear room")) game.hearingPlayers.splice(game.hearingPlayers.indexOf(this), 1);
        if (status.attributes.includes("acute hearing")) game.acuteHearingPlayers.splice(game.acuteHearingPlayers.indexOf(this), 1);
        if (status.attributes.includes("hidden")) {
            game.hiddenPlayers.splice(game.hiddenPlayers.indexOf(this), 1);
            new Narration(game, this, this.location, `${this.displayName} comes out of the ${this.hidingSpot}.`).send();
            this.hidingSpot = "";
            sheets.updateCell(this.hidingSpotCell(), " ");
        }
        if (status.attributes.includes("concealed")) {
            game.concealedPlayers.splice(game.concealedPlayers.indexOf(this), 1);
            this.displayName = this.name;
            new Narration(game, this, this.location, `The mask comes off, revealing the figure to be ${player.displayName}.`).send();
        }

        var returnMessage = "Successfully removed status effect.";
        if (status.curedCondition && doCuredCondition) {
            this.inflict(status.curedCondition.name, game, false, true);
            returnMessage += ` Player is now ${status.curedCondition.name}.`;
        }

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.logChannel.send(`${time} - ${this.name} has been cured of ${status.name} in ${this.location.channel}`);

        clearInterval(status.timer);
        this.status.splice(statusIndex, 1);

        this.statusString = this.generate_statusList();
        if (updateSheet) sheets.updateCell(this.statusCell(), this.statusString);

        return returnMessage;
    }

    generate_statusList() {
        var statusList = this.status[0].name;
        for (let i = 1; i < this.status.length; i++)
            statusList += `, ${this.status[i].name}`;
        return statusList;
    }

    viewStatus_moderator() {
        var statusMessage = this.name + "'s status: ";
        for (let i = 0; i < this.status.length; i++) {
            if (this.status[i].duration === "") {
                statusMessage += `[${this.status[i].name}] `;
            }
            else {
                const time = this.status[i].duration / 1000;  // Gets the total time in seconds.
                const seconds = Math.floor(time % 60);
                const minutes = Math.floor((time / 60) % 60);
                const hours = Math.floor(time / 3600);

                statusMessage += `[${this.status[i].name} (`;
                if (hours >= 0 && hours < 10) statusMessage += '0';
                statusMessage += `${hours}:`;
                if (minutes >= 0 && minutes < 10) statusMessage += '0';
                statusMessage += `${minutes}:`;
                if (seconds >= 0 && seconds < 10) statusMessage += '0';
                statusMessage += `${seconds} remaining)] `;
            }
        }

        return statusMessage;
    }

    hasAttribute(attribute) {
        var hasAttribute = false;
        for (let i = 0; i < this.status.length; i++) {
            if (this.status[i].attributes.includes(attribute)) {
                hasAttribute = true;
                break;
            }
        }
        return hasAttribute;
    }

    getAttributeStatusEffects(attribute) {
        var statusEffects = [];
        for (let i = 0; i < this.status.length; i++) {
            if (this.status[i].attributes.includes(attribute))
                statusEffects.push(this.status[i]);
        }
        return statusEffects;
    }

    die(game) {
        // Remove player from their current channel.
        this.location.leaveChannel(this);
        this.deleteWhispers(game, " has died.");
        if (!this.hasAttribute("hidden")) {
            new Narration(game, this, this.location, `${this.displayName} has died.`).send();
        }

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.logChannel.send(`${time} - ${this.name} died in ${this.location.channel}`);

        // Update various data.
        this.alive = false;
        this.location = "";
        this.hidingSpot = "";
        for (let i = 0; i < this.status.length; i++)
            clearInterval(this.status[i].timer);
        this.status.length = 0;
        // Update that data on the sheet, as well.
        sheets.updateData(this.playerCells(), new Array(new Array(this.id, this.name, this.talent, this.clueLevel, this.alive, "", "", "")));

        // Move player to dead list.
        game.players_dead.push(this);
        // Then remove them from living list.
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].id === this.id) {
                game.players_alive.splice(i, 1);
                break;
            }
        }

        this.member.send("You have died. When your body is discovered, you will be given the Dead role. Until then, please do not speak on the server or to other players.");
        
        return;
    }

    deleteWhispers(game, message) {
        return;
    }

    playerCells() {
        const statusColumn = settings.playerSheetStatusColumn.split('!');
        return settings.playerSheetIDColumn + this.row + ":" + statusColumn[1] + this.row;
    }
    locationCell() {
        return settings.playerSheetLocationColumn + this.row;
    }
    hidingSpotCell() {
        return settings.playerSheetHidingSpotColumn + this.row;
    }
    statusCell() {
        return settings.playerSheetStatusColumn + this.row;
    }
}

module.exports = Player;
