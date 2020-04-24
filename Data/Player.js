const settings = include('settings.json');
const parser = include(`${settings.modulesDir}/parser.js`);
const commandHandler = include(`${settings.modulesDir}/commandHandler.js`);
const itemManager = include(`${settings.modulesDir}/itemManager.js`);

const Room = include(`${settings.dataDir}/Room.js`);
const Object = include(`${settings.dataDir}/Object.js`);
const Item = include(`${settings.dataDir}/Item.js`);
const Puzzle = include(`${settings.dataDir}/Puzzle.js`);
const InventoryItem = include(`${settings.dataDir}/InventoryItem.js`);
const Status = include(`${settings.dataDir}/Status.js`);
const Gesture = include(`${settings.dataDir}/Gesture.js`);
const Narration = include(`${settings.dataDir}/Narration.js`);
const Die = include(`${settings.dataDir}/Die.js`);
const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

var moment = require('moment');
var timer = require('moment-timer');
moment().format();

class Player {
    constructor(id, member, name, displayName, talent, pronounString, stats, alive, location, hidingSpot, status, description, inventory, spectateChannel, row) {
        this.id = id;
        this.member = member;
        this.name = name;
        this.displayName = displayName;
        this.talent = talent;
        this.pronounString = pronounString;
        this.originalPronouns = {
            sbj: null, Sbj: null,
            obj: null, Obj: null,
            dpos: null, Dpos: null,
            ipos: null, Ipos: null,
            ref: null, Ref: null,
            plural: null
        };
        this.pronouns = {
            sbj: null, Sbj: null,
            obj: null, Obj: null,
            dpos: null, Dpos: null,
            ipos: null, Ipos: null,
            ref: null, Ref: null,
            plural: null
        };

        this.defaultStrength = stats.strength;
        this.strength = this.defaultStrength;
        this.defaultIntelligence = stats.intelligence;
        this.intelligence = this.defaultIntelligence;
        this.defaultDexterity = stats.dexterity;
        this.dexterity = this.defaultDexterity;
        this.defaultSpeed = stats.speed;
        this.speed = this.defaultSpeed;
        this.defaultStamina = stats.stamina;
        this.maxStamina = this.defaultStamina;
        this.stamina = this.defaultStamina;

        this.alive = alive;
        this.location = location;
        this.pos = { x: 0, y: 0, z: 0 };
        this.hidingSpot = hidingSpot;
        this.status = status;
        this.statusString = "";
        this.description = description;
        this.inventory = inventory;
        this.spectateChannel = spectateChannel;
        this.maxCarryWeight = this.getMaxCarryWeight();
        this.carryWeight = 0;
        this.row = row;

        this.isMoving = false;
        this.moveTimer = null;
        this.remainingTime = 0;

        this.reachedHalfStamina = false;
        let player = this;
        this.interval = setInterval(function () {
            if (!player.isMoving) player.regenerateStamina();
        }, 30000);

        this.online = false;
        this.onlineInterval = null;
    }

    setPronouns(pronouns, pronounString) {
        if (pronounString === "male") {
            pronouns.sbj = "he";
            pronouns.Sbj = "He";
            pronouns.obj = "him";
            pronouns.Obj = "Him";
            pronouns.dpos = "his";
            pronouns.Dpos = "His";
            pronouns.ipos = "his";
            pronouns.Ipos = "His";
            pronouns.ref = "himself";
            pronouns.Ref = "Himself";
            pronouns.plural = false;
        }
        else if (pronounString === "female") {
            pronouns.sbj = "she";
            pronouns.Sbj = "She";
            pronouns.obj = "her";
            pronouns.Obj = "Her";
            pronouns.dpos = "her";
            pronouns.Dpos = "Her";
            pronouns.ipos = "hers";
            pronouns.Ipos = "Hers";
            pronouns.ref = "herself";
            pronouns.Ref = "Herself";
            pronouns.plural = false;
        }
        else if (pronounString === "neutral") {
            pronouns.sbj = "they";
            pronouns.Sbj = "They";
            pronouns.obj = "them";
            pronouns.Obj = "Them";
            pronouns.dpos = "their";
            pronouns.Dpos = "Their";
            pronouns.ipos = "theirs";
            pronouns.Ipos = "Theirs";
            pronouns.ref = "themself";
            pronouns.Ref = "Themself";
            pronouns.plural = true;
        }
        // If none of the standard pronouns are given, let the user define their own.
        else {
            var pronounSet = pronounString.split('/');
            if (pronounSet.length === 6) {
                pronouns.sbj = pronounSet[0].trim();
                pronouns.Sbj = pronouns.sbj.charAt(0).toUpperCase() + pronouns.sbj.substring(1);
                pronouns.obj = pronounSet[1].trim();
                pronouns.Obj = pronouns.obj.charAt(0).toUpperCase() + pronouns.obj.substring(1);
                pronouns.dpos = pronounSet[2].trim();
                pronouns.Dpos = pronouns.dpos.charAt(0).toUpperCase() + pronouns.dpos.substring(1);
                pronouns.ipos = pronounSet[3].trim();
                pronouns.Ipos = pronouns.ipos.charAt(0).toUpperCase() + pronouns.ipos.substring(1);
                pronouns.ref = pronounSet[4].trim();
                pronouns.Ref = pronouns.ref.charAt(0).toUpperCase() + pronouns.ref.substring(1);
                pronouns.plural = pronounSet[5] === "true";
            }
        }
    }

    move(game, isRunning, currentRoom, desiredRoom, exit, entrance, exitMessage, entranceMessage) {
        const time = this.calculateMoveTime(exit, isRunning);
        this.remainingTime = time;
        this.isMoving = true;
        const verb = isRunning ? "running" : "walking";
        if (time > 1000) new Narration(game, this, this.location, `${this.displayName} starts ${verb} toward ${exit.name}.`).send();
        const startingPos = { x: this.pos.x, y: this.pos.y, z: this.pos.z };

        let player = this;
        this.moveTimer = setInterval(function () {
            let subtractedTime = 100;
            if (game.heated) subtractedTime = settings.heatedSlowdownRate * subtractedTime;
            player.remainingTime -= subtractedTime;
            // Get the current coordinates based on what percentage of the duration has passed.
            const elapsedTime = time - player.remainingTime;
            const timeRatio = elapsedTime / time;
            let x = startingPos.x + Math.round(timeRatio * (exit.pos.x - startingPos.x));
            let y = startingPos.y + Math.round(timeRatio * (exit.pos.y - startingPos.y));
            let z = startingPos.z + Math.round(timeRatio * (exit.pos.z - startingPos.z));
            // Calculate the distance the player has traveled in this time.
            let distance = Math.sqrt(Math.pow(x - player.pos.x, 2) + Math.pow(z - player.pos.z, 2)) * settings.metersPerPixel;
            let rise = (y - player.pos.y) * settings.metersPerPixel;
            // Calculate the amount of stamina the player has lost traveling this distance.
            const staminaUseMultiplier = isRunning ? 3 : 1;
            var lostStamina;
            // If distance is 0, we'll treat it like a staircase.
            if (distance === 0 && rise !== 0) {
                const uphill = rise > 0 ? true : false;
                distance = rise;
                lostStamina = uphill ? 4 * staminaUseMultiplier * settings.staminaUseRate * distance : staminaUseMultiplier * settings.staminaUseRate / 4 * -distance;
            }
            else {
                const slope = rise / distance;
                lostStamina = !isNaN(slope) ? staminaUseMultiplier * (settings.staminaUseRate + slope * settings.staminaUseRate) * distance : staminaUseMultiplier * settings.staminaUseRate * distance;
                if (isNaN(lostStamina)) lostStamina = 0;
            }
            player.pos.x = x;
            player.pos.y = y;
            player.pos.z = z;
            player.stamina = player.stamina + lostStamina;
            // If player reaches half of their stamina, give them a warning.
            // Be sure to check player.reachedHalfStamina so that this message is only sent once.
            if (player.stamina <= player.maxStamina / 2 && !player.reachedHalfStamina) {
                player.reachedHalfStamina = true;
                player.notify(game, `You're starting to get tired! You might want to stop moving and rest soon.`);
            }
            // If player runs out of stamina, stop them in their tracks.
            if (player.stamina <= 0) {
                clearInterval(player.moveTimer);
                player.stamina = 0;
                player.inflict(game, "weary", true, true, true);
            }
            if (player.remainingTime <= 0 && player.stamina !== 0) {
                clearInterval(player.moveTimer);
                currentRoom.removePlayer(game, player, exit, exitMessage);
                desiredRoom.addPlayer(game, player, entrance, entranceMessage, true);
                player.isMoving = false;
            }
        }, 100);
    }

    calculateMoveTime(exit, isRunning) {
        let distance = Math.sqrt(Math.pow(exit.pos.x - this.pos.x, 2) + Math.pow(exit.pos.z - this.pos.z, 2));
        distance = distance * settings.metersPerPixel;
        // The formula to calculate the rate is a quadratic function.
        // The equation is Rate = 0.0183x^2 + 0.005x + 0.916, where x is the player's speed stat multiplied by 2 or 1, depending on if the player is running or not.
        const speedMultiplier = isRunning ? 2 : 1;
        let rate = 0.0183 * Math.pow(speedMultiplier * this.speed, 2) + 0.005 * speedMultiplier * this.speed + 0.916;
        // Slow down the player relative to how much weight they're carrying.
        // The equation is Slowdown = 15/x, where x is the number of kilograms a player is carrying, and 1/4 <= Slowdown <= 1.
        const slowdown = Math.min(Math.max(15.0 / this.carryWeight, 0.25), 1.0);
        rate = rate * slowdown;
        // Slope should affect the rate.
        const rise = (exit.pos.y - this.pos.y) * settings.metersPerPixel;
        var time = 0;
        // If distance is 0, we'll treat it like a staircase and just use the rise to calculate the time.
        if (distance === 0 && rise !== 0) {
            const uphill = rise > 0 ? true : false;
            // Assume that the staircase is a right triangle leading to another right triangle flipped horizontally.
            const legs = rise / 2;
            // Calculate the length of the hypotenuse of these right triangles.
            distance = Math.sqrt(2 * Math.pow(legs, 2));
            // The distance should be two hypotenuses.
            distance = distance * 2;
            // If the player is moving uphill, reduce their rate of movement by 1/3.
            // Otherwise, increase it by 1/3;
            rate = uphill ? 2 * rate / 3 : 4 * rate / 3;
            // To make it feel a little more realistic, multiply it by 2.
            time = distance / rate * 2 * 1000;
        }
        else {
            const slope = rise / distance;
            rate = !isNaN(slope) ? rate - slope * rate : rate;
            time = distance / rate * 1000;
        }
        if (time < 0) time = 0;
        return time;
    }

    regenerateStamina() {
        if (this.stamina < this.maxStamina) {
            // Recover 1/20th of the player's max stamina per cycle.
            const staminaAmount = this.maxStamina / 20;
            const newStamina = this.stamina + staminaAmount;
            // Make sure not to exceed the max stamina for this player.
            if (newStamina > this.maxStamina)
                this.stamina = this.maxStamina;
            else
                this.stamina = newStamina;
        }
        return;
    }

    createMoveAppendString() {
        var nonDiscreetItems = new Array();
        for (let slot = 0; slot < this.inventory.length; slot++) {
            if ((this.inventory[slot].name === "RIGHT HAND" || this.inventory[slot].name === "LEFT HAND") &&
                this.inventory[slot].equippedItem !== null &&
                this.inventory[slot].equippedItem.prefab.discreet === false)
                nonDiscreetItems.push(this.inventory[slot].equippedItem.singleContainingPhrase);
        }

        var appendString = "";
        if (nonDiscreetItems.length === 0)
            appendString = ".";
        else if (nonDiscreetItems.length === 1)
            appendString = ` carrying ${nonDiscreetItems[0]}.`;
        else if (nonDiscreetItems.length === 2)
            appendString = ` carrying ${nonDiscreetItems[0]} and ${nonDiscreetItems[1]}.`;

        return appendString;
    }

    inflict(game, statusName, notify, doCures, narrate, item, duration) {
        var status = null;
        if (statusName instanceof Status) status = statusName;
        else {
            for (let i = 0; i < game.statusEffects.length; i++) {
                if (game.statusEffects[i].name.toLowerCase() === statusName.toLowerCase()) {
                    status = game.statusEffects[i];
                    break;
                }
            }
            if (status === null) return `Couldn't find status effect "${statusName}".`;
        }

        if (notify === null || notify === undefined) notify = true;
        if (doCures === null || doCures === undefined) doCures = true;
        if (narrate === null || narrate === undefined) narrate = true;
        if (duration === undefined) duration = null;

        for (let i = 0; i < status.overriders.length; i++) {
            if (this.statusString.includes(status.overriders[i].name))
                return `Couldn't inflict status effect "${statusName}" because ${this.name} is already ${status.overriders[i].name}.`;
        }

        if (this.statusString.includes(statusName)) {
            if (status.duplicatedStatus !== null) {
                this.cure(game, statusName, false, false, false);
                this.inflict(game, status.duplicatedStatus.name, true, false, true);
                return `Status was duplicated, so inflicted ${status.duplicatedStatus.name} instead.`;
            }
            else return "Specified player already has that status effect.";
        }

        if (status.cures !== "" && doCures) {
            for (let i = 0; i < status.cures.length; i++)
                this.cure(game, status.cures[i].name, false, false, false);
        }

        // Apply the effects of any attributes that require immediate action.
        if (status.name === "heated")
            game.heated = true;
        if (status.attributes.includes("no channel")) {
            this.location.leaveChannel(this);
            this.removeFromWhispers(game, `${this.name} can no longer whisper because ${this.originalPronouns.sbj} ` + (this.originalPronouns.plural ? `are` : `is`) + ` ${status.name}.`);
        }
        if (status.attributes.includes("no hearing")) this.removeFromWhispers(game, `${this.displayName} can no longer hear.`);
        if (status.attributes.includes("hidden")) {
            if (narrate) new Narration(game, this, this.location, `${this.displayName} hides in the ${this.hidingSpot}.`).send();
            game.queue.push(new QueueEntry(Date.now(), "updateCell", this.hidingSpotCell(), `Players!${this.name}|Hiding Spot`, this.hidingSpot));
        }
        if (status.attributes.includes("concealed")) {
            if (item === null || item === undefined) item = { singleContainingPhrase: "a MASK" };
            this.displayName = `An individual wearing ${item.singleContainingPhrase}`;
            this.setPronouns(this.pronouns, "neutral");
        }
        if (status.attributes.includes("disable all") || status.attributes.includes("disable move") || status.attributes.includes("disable run")) {
            // Clear the player's movement timer.
            this.isMoving = false;
            clearInterval(this.moveTimer);
            this.remainingTime = 0;
        }

        // Announce when a player falls asleep or unconscious.
        if (status.name === "asleep" && narrate) new Narration(game, this, this.location, `${this.displayName} falls asleep.`).send();
        else if (status.name === "blacked out" && narrate) new Narration(game, this, this.location, `${this.displayName} blacks out.`).send();
        else if (status.attributes.includes("unconscious") && narrate) new Narration(game, this, this.location, `${this.displayName} goes unconscious.`).send();

        status = new Status(status.name, status.duration, status.fatal, status.visible, status.overriders, status.cures, status.nextStage, status.duplicatedStatus, status.curedCondition, status.statModifiers, status.attributes, status.inflictedDescription, status.curedDescription, status.row);

        // Apply the duration, if applicable.
        if (status.duration) {
            if (duration !== null) status.remaining = duration;
            else status.remaining = status.duration.clone();

            let player = this;
            status.timer = new moment.duration(1000).timer({ start: true, loop: true }, function () {
                let subtractedTime = 1000;
                if (game.heated) subtractedTime = settings.heatedSlowdownRate * subtractedTime;
                status.remaining.subtract(subtractedTime, 'ms');
                player.statusString = player.generate_statusList(true, true);
                game.queue.push(new QueueEntry(Date.now(), "updateCell", player.statusCell(), `Players!${player.name}|Status`, player.statusString));

                if (status.remaining.asMilliseconds() <= 0) {
                    if (status.nextStage) {
                        player.cure(game, status.name, false, false, true);
                        const response = player.inflict(game, status.nextStage.name, true, false, true);
                        if (response.startsWith(`Couldn't inflict status effect`))
                            player.sendDescription(game, status.curedDescription, status);
                    }
                    else {
                        if (status.fatal) {
                            status.timer.stop();
                            player.die(game);
                        }
                        else {
                            player.cure(game, status.name, true, true, true);
                        }
                    }
                }
            });
        }

        this.status.push(status);
        this.recalculateStats();

        // Inform player what happened.
        if (notify)
            this.sendDescription(game, status.inflictedDescription, status);

        this.statusString = this.generate_statusList(true, true);
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.statusCell(), `Players!${this.name}|Status`, this.statusString));

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${this.name} became ${status.name} in ${this.location.channel}`);

        return "Status successfully added.";
    }

    cure(game, statusName, notify, doCuredCondition, narrate, item) {
        var status = null;
        var statusIndex = -1;
        for (let i = 0; i < this.status.length; i++) {
            if (this.status[i].name.toLowerCase() === statusName.toLowerCase()) {
                status = this.status[i];
                statusIndex = i;
                break;
            }
        }
        if (status === null) return "Specified player doesn't have that status effect.";

        if (notify === null || notify === undefined) notify = true;
        if (doCuredCondition === null || doCuredCondition === undefined) doCuredCondition = true;

        if (status.attributes.includes("no channel") && this.getAttributeStatusEffects("no channel").length - 1 === 0)
            this.location.joinChannel(this);
        if (status.attributes.includes("hidden")) {
            if (narrate) new Narration(game, this, this.location, `${this.displayName} comes out of the ${this.hidingSpot}.`).send();
            this.hidingSpot = "";
            game.queue.push(new QueueEntry(Date.now(), "updateCell", this.hidingSpotCell(), `Players!${this.name}|Hiding Spot`, " "));
        }
        if (status.attributes.includes("concealed")) {
            this.displayName = this.name;
            if (item === null || item === undefined) item = { name: "MASK" };
            if (narrate) new Narration(game, this, this.location, `The ${item.name} comes off, revealing the figure to be ${this.displayName}.`).send();
            this.setPronouns(this.pronouns, this.pronounString);
        }

        // Announce when a player awakens.
        if (status.name === "asleep" && narrate) new Narration(game, this, this.location, `${this.displayName} wakes up.`).send();
        else if (status.name === "blacked out" && narrate) new Narration(game, this, this.location, `${this.displayName} wakes up.`).send();
        else if (status.attributes.includes("unconscious") && narrate) new Narration(game, this, this.location, `${this.displayName} regains consciousness.`).send();

        var returnMessage = "Successfully removed status effect.";
        if (status.curedCondition && doCuredCondition) {
            this.inflict(game, status.curedCondition.name, false, false, true);
            returnMessage += ` Player is now ${status.curedCondition.name}.`;
        }

        // Inform player what happened.
        if (notify) {
            this.sendDescription(game, status.curedDescription, status);
            // If the player is waking up, send them the description of the room they wake up in.
            if (status.name === "asleep")
                this.sendDescription(game, this.location.description, this.location);
        }

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${this.name} has been cured of ${status.name} in ${this.location.channel}`);

        // Stop the timer.
        if (status.timer !== null)
            status.timer.stop();
        this.status.splice(statusIndex, 1);
        this.recalculateStats();

        this.statusString = this.generate_statusList(true, true);
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.statusCell(), `Players!${this.name}|Status`, this.statusString));

        if (status.name === "heated") {
            let noMoreHeated = true;
            for (let i = 0; i < game.players_alive.length; i++) {
                if (game.players_alive[i].statusString.includes("heated")) {
                    noMoreHeated = false;
                    break;
                }
            }
            if (noMoreHeated) game.heated = false;
        }

        return returnMessage;
    }
    
    generate_statusList(includeHidden, includeDurations) {
        var statusList = "";
        for (let i = 0; i < this.status.length; i++) {
            if (this.status[i].visible || includeHidden) {
                statusList += this.status[i].name;
                if (includeDurations && this.status[i].remaining !== null) {
                    const days = Math.floor(this.status[i].remaining.asDays());
                    const hours = this.status[i].remaining.hours();
                    const minutes = this.status[i].remaining.minutes();
                    const seconds = this.status[i].remaining.seconds();

                    let timeString = "";
                    if (days !== 0) timeString += `${days} `;
                    if (hours >= 0 && hours < 10) timeString += '0';
                    timeString += `${hours}:`;
                    if (minutes >= 0 && minutes < 10) timeString += '0';
                    timeString += `${minutes}:`;
                    if (seconds >= 0 && seconds < 10) timeString += '0';
                    timeString += `${seconds}`;

                    statusList += ` (${timeString})`;
                }
                statusList += ", ";
            }
        }
        return statusList.substring(0, statusList.lastIndexOf(", "));
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

    recalculateStats() {
        var strength = this.defaultStrength;
        var intelligence = this.defaultIntelligence;
        var dexterity = this.defaultDexterity;
        var speed = this.defaultSpeed;
        var stamina = this.defaultStamina;

        var strModifiers = [];
        var intModifiers = [];
        var dexModifiers = [];
        var spdModifiers = [];
        var staModifiers = [];

        for (let i = 0; i < this.status.length; i++) {
            for (let j = 0; j < this.status[i].statModifiers.length; j++) {
                const modifier = this.status[i].statModifiers[j];
                if (modifier.modifiesSelf) {
                    switch (modifier.stat) {
                        case "str":
                            strModifiers.push(modifier);
                            break;
                        case "int":
                            intModifiers.push(modifier);
                            break;
                        case "dex":
                            dexModifiers.push(modifier);
                            break;
                        case "spd":
                            spdModifiers.push(modifier);
                            break;
                        case "sta":
                            staModifiers.push(modifier);
                            break;
                    }
                }
            }
        }

        this.strength = this.recalculateStat(strength, strModifiers);
        this.maxCarryWeight = this.getMaxCarryWeight();
        this.intelligence = this.recalculateStat(intelligence, intModifiers);
        this.dexterity = this.recalculateStat(dexterity, dexModifiers);
        this.speed = this.recalculateStat(speed, spdModifiers);
        const staminaRatio = this.stamina / this.maxStamina;
        this.maxStamina = this.recalculateStat(stamina, staModifiers);
        this.stamina = staminaRatio * this.maxStamina;
    }

    recalculateStat(stat, modifiers) {
        var assignModifiers = modifiers.filter(modifier => modifier.assignValue === true).sort((a, b) => a.value - b.value);
        if (assignModifiers.length !== 0) return assignModifiers[0].value;

        for (let i = 0; i < modifiers.length; i++)
            stat += modifiers[i].value;
        if (stat < 1) stat = 1;
        if (stat > 10) stat = 10;
        return stat;
    }

    getStatModifier(stat) {
        const statMax = 10;
        let modifier = Math.floor(Math.floor((stat - statMax / 3) / 2) + (settings.diceMax - settings.diceMin) / settings.diceMax);
        return modifier;
    }

    getMaxCarryWeight() {
        return Math.floor(1.783 * Math.pow(this.strength, 2) - 2 * this.strength + 22);
    }

    use(game, item) {
        if (item.uses === 0) return "that item has no uses left.";
        if (!item.prefab.usable) return "that item has no programmed use on its own, but you may be able to use it some other way.";
        let hasEffect = false;
        let hasCure = false;
        if (item.prefab.effects.length !== 0) {
            for (let i = 0; i < item.prefab.effects.length; i++) {
                if (!this.statusString.includes(item.prefab.effects[i].name) || item.prefab.effects[i].duplicatedStatus !== null)
                    hasEffect = true;
            }
        }
        if (item.prefab.cures.length !== 0) {
            for (let i = 0; i < item.prefab.cures.length; i++) {
                if (this.statusString.includes(item.prefab.cures[i].name))
                    hasCure = true;
            }
        }
        if (!hasEffect && !hasCure) return `you attempt to use the ${item.name}, but it has no effect.`;

        if (item.prefab.effects.length !== 0) {
            for (let i = 0; i < item.prefab.effects.length; i++)
                this.inflict(game, item.prefab.effects[i].name, true, true, true, item);
        }

        if (item.prefab.cures.length !== 0) {
            // If the item cures multiple status effects, don't update the spreadsheet until curing the last one.
            for (let i = 0; i < item.prefab.cures.length; i++)
                this.cure(game, item.prefab.cures[i].name, true, true, true, item);
        }

        const verb = item.prefab.verb ? item.prefab.verb : "uses";
        new Narration(game, this, this.location, `${this.displayName} ${verb} ${item.singleContainingPhrase}.`).send();

        if (!isNaN(item.uses)) {
            item.uses--;

            if (item.uses === 0) {
                const nextStage = item.prefab.nextStage ? true : false;
                if (nextStage && !item.prefab.discreet) {
                    this.description = parser.removeItem(this.description, item, "hands");
                    game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));
                }
                itemManager.replaceInventoryItem(item, item.prefab.nextStage);
                if (nextStage && !item.prefab.discreet) {
                    this.description = parser.addItem(this.description, item, "hands");
                    game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));
                }
            }
            else game.queue.push(new QueueEntry(Date.now(), "updateCell", item.usesCell(), `Inventory Items!${item.prefab.id}|${item.identifier}|${this.name}|${item.equipmentSlot}|${item.containerName}`, item.uses));
        }

        return;
    }

    take(game, item, hand, container, slotName) {
        // Reduce quantity if the quantity is finite.
        if (!isNaN(item.quantity)) {
            item.quantity--;
            game.queue.push(new QueueEntry(Date.now(), "updateCell", item.quantityCell(), `Items!${item.prefab.id}|${item.identifier}|${item.location.name}|${item.containerName}`, item.quantity));
        }

        if (container instanceof Puzzle) {
            container.alreadySolvedDescription = parser.removeItem(container.alreadySolvedDescription, item);
            game.queue.push(new QueueEntry(Date.now(), "updateCell", container.alreadySolvedCell(), `Puzzles!${container.name}|${container.location.name}`, container.alreadySolvedDescription));
        }
        else if (container instanceof Object) {
            container.description = parser.removeItem(container.description, item);
            game.queue.push(new QueueEntry(Date.now(), "updateCell", container.descriptionCell(), `Objects!${container.name}|${container.location.name}`, container.description));
        }
        else if (container instanceof Item) {
            container.removeItem(item, slotName, 1);
            container.description = parser.removeItem(container.description, item, slotName);
            game.queue.push(new QueueEntry(Date.now(), "updateCell", container.descriptionCell(), `Items!${container.prefab.id}|${container.identifier}|${container.location.name}|${container.containerName}`, container.description));
        }
        else if (container instanceof Room) {
            container.description = parser.removeItem(container.description, item);
            for (let i = 0; i < container.exit.length; i++) {
                container.exit[i].description = parser.removeItem(container.exit[i].description, item);
                game.queue.push(new QueueEntry(Date.now(), "updateCell", container.exit[i].descriptionCell(), `Rooms!${container.name}|${container.exit[i].name}`, container.exit[i].description));
            }
        }

        // Get the row number of the EquipmentSlot that the item will go into.
        var rowNumber = 0;
        for (var slot = 0; slot < this.inventory.length; slot++) {
            if (this.inventory[slot].name === hand) {
                rowNumber = this.inventory[slot].row;
                break;
            }
        }

        var createdItem = itemManager.convertItem(item, this, hand, 1);
        createdItem.containerName = "";
        createdItem.container = null;
        createdItem.row = rowNumber;

        // Equip the item and add it to the player's inventory.
        this.inventory[slot].equippedItem = createdItem;
        this.inventory[slot].items.length = 0;
        this.inventory[slot].items.push(createdItem);
        // Replace the null entry in the inventoryItems list.
        for (let i = 0; i < game.inventoryItems.length; i++) {
            if (game.inventoryItems[i].row === createdItem.row) {
                game.inventoryItems.splice(i, 1, createdItem);
                break;
            }
        }
        // Create a list of all the child items.
        var items = [];
        itemManager.getChildItems(items, createdItem);

        // Now that the item has been converted, we can update the quantities of child items.
        var oldChildItems = [];
        itemManager.getChildItems(oldChildItems, item);
        for (let i = 0; i < oldChildItems.length; i++) {
            oldChildItems[i].quantity = 0;
            game.queue.push(new QueueEntry(Date.now(), "updateCell", oldChildItems[i].quantityCell(), `Items!${oldChildItems[i].name}|${oldChildItems[i].identifier}|${oldChildItems[i].location.name}|${oldChildItems[i].containerName}`, "0"));
        }

        // Add the equipped item to the queue.
        const createdItemData = [
            this.name,
            createdItem.prefab.id,
            createdItem.identifier,
            createdItem.equipmentSlot,
            createdItem.containerName,
            isNaN(createdItem.quantity) ? "" : createdItem.quantity,
            isNaN(createdItem.uses) ? "" : createdItem.uses,
            createdItem.description
        ];
        game.queue.push(new QueueEntry(Date.now(), "updateRow", createdItem.itemCells(), `Inventory Items!||${this.name}|${createdItem.equipmentSlot}|${createdItem.containerName}`, createdItemData));

        itemManager.insertInventoryItems(game, this, items, slot);

        this.carryWeight += createdItem.weight;
        this.notify(game, `You take ${createdItem.singleContainingPhrase}.`);
        if (!createdItem.prefab.discreet) {
            new Narration(game, this, this.location, `${this.displayName} takes ${createdItem.singleContainingPhrase}.`).send();
            // Add the new item to the player's hands item list.
            this.description = parser.addItem(this.description, createdItem, "hands");
            game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));
        }

        return;
    }

    steal(game, hand, victim, container, slotNo) {
        // There might be multiple of the same item, so we need to make an array where each item's index is inserted as many times as its quantity.
        var actualItems = [];
        for (let i = 0; i < container.inventory[slotNo].item.length; i++) {
            const item = container.inventory[slotNo].item[i];
            for (let j = 0; j < item.quantity; j++)
                actualItems.push(i);
        }
        const actualItemsIndex = Math.floor(Math.random() * actualItems.length);
        const index = actualItems[actualItemsIndex];
        var item = container.inventory[slotNo].item[index];

        // Determine how successful the player is.
        const failMax = Math.floor((settings.diceMax - settings.diceMin) / 3) + settings.diceMin;
        const partialMax = Math.floor(2 * (settings.diceMax - settings.diceMin) / 3) + settings.diceMin;
        var dieRoll = new Die("dex", this, victim);
        if (!item.prefab.discreet && dieRoll.result > partialMax) dieRoll.result = partialMax;

        // Player didn't fail.
        if (dieRoll.result > failMax) {
            // Reduce quantity if the quantity is finite.
            if (!isNaN(item.quantity)) {
                item.quantity--;
                game.queue.push(new QueueEntry(Date.now(), "updateCell", item.quantityCell(), `Inventory Items!${item.prefab.id}|${item.identifier}|${victim.name}|${item.equipmentSlot}|${item.containerName}`, item.quantity));
            }

            container.removeItem(item, container.inventory[slotNo].name, 1);
            container.description = parser.removeItem(container.description, item, container.inventory[slotNo].name);
            game.queue.push(new QueueEntry(Date.now(), "updateCell", container.descriptionCell(), `Inventory Items!${container.prefab.id}|${container.identifier}|${victim.name}|${container.equipmentSlot}|${container.containerName}`, container.description));

            // Remove the item from its EquipmentSlot.
            for (let slot = 0; slot < victim.inventory.length; slot++) {
                let foundItem = false;
                if (victim.inventory[slot].name === item.equipmentSlot) {
                    for (let i = 0; i < victim.inventory[slot].items.length; i++) {
                        if (victim.inventory[slot].items[i].row === item.row) {
                            foundItem = true;
                            victim.inventory[slot].items.splice(i, 1);
                            break;
                        }
                    }
                }
                if (foundItem) break;
            }
            // Get the row number of the EquipmentSlot that the item will go into.
            var rowNumber = 0;
            for (var slot = 0; slot < this.inventory.length; slot++) {
                if (this.inventory[slot].name === hand) {
                    rowNumber = this.inventory[slot].row;
                    break;
                }
            }

            var createdItem = itemManager.copyInventoryItem(item, this, hand, 1);
            createdItem.containerName = "";
            createdItem.container = null;
            createdItem.row = rowNumber;

            // Equip the item and add it to the player's inventory.
            this.inventory[slot].equippedItem = createdItem;
            this.inventory[slot].items.length = 0;
            this.inventory[slot].items.push(createdItem);
            // Replace the null entry in the inventoryItems list.
            for (let i = 0; i < game.inventoryItems.length; i++) {
                if (game.inventoryItems[i].row === createdItem.row) {
                    game.inventoryItems.splice(i, 1, createdItem);
                    break;
                }
            }
            // Create a list of all the child items.
            var items = [];
            itemManager.getChildItems(items, createdItem);

            // Now that the item has been converted, we can update the quantities of child items.
            var oldChildItems = [];
            itemManager.getChildItems(oldChildItems, item);
            for (let i = 0; i < oldChildItems.length; i++) {
                oldChildItems[i].quantity = 0;
                game.queue.push(new QueueEntry(Date.now(), "updateCell", oldChildItems[i].quantityCell(), `Inventory Items!${oldChildItems[i].prefab.id}|${oldChildItems[i].identifier}|${victim.name}|${oldChildItems[i].equipmentSlot}|${oldChildItems[i].containerName}`, "0"));
            }

            // Add the equipped item to the queue.
            const createdItemData = [
                this.name,
                createdItem.prefab.id,
                createdItem.identifier,
                createdItem.equipmentSlot,
                createdItem.containerName,
                isNaN(createdItem.quantity) ? "" : createdItem.quantity,
                isNaN(createdItem.uses) ? "" : createdItem.uses,
                createdItem.description
            ];
            game.queue.push(new QueueEntry(Date.now(), "updateRow", createdItem.itemCells(), `Inventory Items!||${this.name}|${createdItem.equipmentSlot}|${createdItem.containerName}`, createdItemData));

            itemManager.insertInventoryItems(game, this, items, slot);

            victim.carryWeight -= createdItem.weight;
            this.carryWeight += createdItem.weight;
            // Decide what messages to send.
            if (dieRoll.result > partialMax || victim.hasAttribute("unconscious")) {
                if (container.inventory.length === 1)
                    this.notify(game, `You steal ${createdItem.singleContainingPhrase} from ${victim.displayName}'s ${container.name} without ${victim.pronouns.obj} noticing!`);
                else
                    this.notify(game, `You steal ${createdItem.singleContainingPhrase} from ${container.inventory[slotNo].name} of ${victim.displayName}'s ${container.name} without ${victim.pronouns.obj} noticing!`);
            }
            else {
                if (container.inventory.length === 1) {
                    this.notify(game, `You steal ${createdItem.singleContainingPhrase} from ${victim.displayName}'s ${container.name}, but ${victim.pronouns.sbj} ` + (victim.pronouns.plural ? `seem` : `seems`) + ` to notice.`);
                    victim.notify(game, `${this.displayName} steals ${createdItem.singleContainingPhrase} from your ${container.name}!`);
                }
                else {
                    this.notify(game, `You steal ${createdItem.singleContainingPhrase} from ${container.inventory[slotNo].name} of ${victim.displayName}'s ${container.name}, but ${victim.pronouns.sbj} ` + (victim.pronouns.plural ? `seem` : `seems`) + ` to notice.`);
                    victim.notify(game, `${this.displayName} steals ${createdItem.singleContainingPhrase} from ${container.inventory[slotNo].name} of your ${container.name}!`);
                }
            }
            if (!createdItem.prefab.discreet) {
                if (container.inventory.length === 1)
                    new Narration(game, this, this.location, `${this.displayName} steals ${createdItem.singleContainingPhrase} from ${victim.displayName}'s ${container.name}.`).send();
                else
                    new Narration(game, this, this.location, `${this.displayName} steals ${createdItem.singleContainingPhrase} from ${container.inventory[slotNo].name} of ${victim.displayName}'s ${container.name}.`).send();

                // Add the new item to the player's hands item list.
                this.description = parser.addItem(this.description, createdItem, "hands");
                game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));
            }

            return { itemName: createdItem.identifier ? createdItem.identifier : createdItem.prefab.id, successful: true };
        }
        // Player failed to steal the item.
        else {
            if (container.inventory.length === 1) {
                this.notify(game, `You try to steal ${item.singleContainingPhrase} from ${victim.displayName}'s ${container.name}, but ${victim.pronouns.sbj} ` + (victim.pronouns.plural ? `notice` : `notices`) + ` you before you can.`);
                victim.notify(game, `${this.displayName} attempts to steal ${item.singleContainingPhrase} from your ${container.name}, but you notice in time!`);
            }
            else {
                this.notify(game, `You try to steal ${item.singleContainingPhrase} from ${container.inventory[slotNo].name} of ${victim.displayName}'s ${container.name}, but ${victim.pronouns.sbj} ` + (victim.pronouns.plural ? `notice` : `notices`) + ` you before you can.`);
                victim.notify(game, `${this.displayName} attempts to steal ${item.singleContainingPhrase} from ${container.inventory[slotNo].name} of your ${container.name}, but you notice in time!`);
            }

            return { itemName: item.identifier ? item.identifier : item.prefab.id, successful: false };
        }
    }

    drop(game, item, hand, container, slotName) {
        // Unequip the item from the player's hand.
        this.unequip(game, item, hand, null);

        // Convert the InventoryItem to an Item.
        var createdItem = itemManager.convertInventoryItem(item, this, container, slotName, 1);
        createdItem.container = container;
        createdItem.slot = slotName;

        // These two variables are needed at the end, but since we're checking the data type of the container anyway, set them now.
        var containerName = "";
        var preposition = "in";
        // Update the container's description.
        if (container instanceof Puzzle) {
            container.alreadySolvedDescription = parser.addItem(container.alreadySolvedDescription, item);
            game.queue.push(new QueueEntry(Date.now(), "updateCell", container.alreadySolvedCell(), `Puzzles!${container.name}|${container.location.name}`, container.alreadySolvedDescription));
            containerName = container.parentObject ? container.parentObject.name : container.name;
            preposition = container.parentObject ? container.parentObject.preposition : "in";
        }
        else if (container instanceof Object) {
            container.description = parser.addItem(container.description, item);
            game.queue.push(new QueueEntry(Date.now(), "updateCell", container.descriptionCell(), `Objects!${container.name}|${container.location.name}`, container.description));
            containerName = container.name;
            preposition = container.preposition;
        }
        else if (container instanceof Item) {
            container.insertItem(createdItem, slotName);
            container.description = parser.addItem(container.description, item, slotName);
            game.queue.push(new QueueEntry(Date.now(), "updateCell", container.descriptionCell(), `Items!${container.prefab.id}|${container.identifier}|${container.location.name}|${container.containerName}`, container.description));
            containerName = container.name;
            preposition = container.prefab ? container.prefab.preposition : "in";
        }

        // Create a list of all the child items.
        var items = [];
        items.push(createdItem);
        itemManager.getChildItems(items, createdItem);

        // Now that the item has been converted, we can update the quantities of child items.
        // We need a recursive function for this.
        let player = this;
        let deleteChildQuantities = function (item) {
            for (let slot = 0; slot < item.inventory.length; slot++) {
                for (let i = 0; i < item.inventory[slot].item.length; i++) {
                    deleteChildQuantities(item.inventory[slot].item[i]);
                    item.inventory[slot].item[i].quantity = 0;
                    game.queue.push(new QueueEntry(Date.now(), "updateCell", item.inventory[slot].item[i].quantityCell(), `Inventory Items!${item.inventory[slot].item[i].prefab.id}|${item.inventory[slot].item[i].identifier}|${player.name}|${item.inventory[slot].item[i].equipmentSlot}|${item.inventory[slot].item[i].containerName}`, "0"));
                }
            }
            return;
        };
        deleteChildQuantities(item);
        item.quantity = 0;
        
        itemManager.insertItems(game, this.location, items);

        this.carryWeight -= item.weight;
        this.notify(game, `You discard ${item.singleContainingPhrase}.`);
        if (!item.prefab.discreet) {
            new Narration(game, this, this.location, `${this.displayName} puts ${item.singleContainingPhrase} ${preposition} the ${containerName}.`).send();
            // Remove the item from the player's hands item list.
            this.description = parser.removeItem(this.description, item, "hands");
            game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));
        }
        
        return;
    }

    give(game, item, hand, recipient, recipientHand) {
        // Unequip the item from the player's hand.
        this.unequip(game, item, hand, null);

        // Get the row number of the EquipmentSlot that the item will go into.
        var rowNumber = 0;
        for (var slot = 0; slot < recipient.inventory.length; slot++) {
            if (recipient.inventory[slot].name === recipientHand) {
                rowNumber = recipient.inventory[slot].row;
                break;
            }
        }

        var createdItem = itemManager.copyInventoryItem(item, recipient, recipientHand, 1);
        createdItem.containerName = "";
        createdItem.container = null;
        createdItem.row = rowNumber;

        // Equip the item and add it to the recipient's inventory.
        recipient.inventory[slot].equippedItem = createdItem;
        recipient.inventory[slot].items.length = 0;
        recipient.inventory[slot].items.push(createdItem);
        // Replace the null entry in the inventoryItems list.
        for (let i = 0; i < game.inventoryItems.length; i++) {
            if (game.inventoryItems[i].row === createdItem.row) {
                game.inventoryItems.splice(i, 1, createdItem);
                break;
            }
        }
        // Create a list of all the child items.
        var items = [];
        itemManager.getChildItems(items, createdItem);

        // Now that the item has been converted, we can update the quantities of child items.
        var oldChildItems = [];
        itemManager.getChildItems(oldChildItems, item);
        for (let i = 0; i < oldChildItems.length; i++) {
            oldChildItems[i].quantity = 0;
            game.queue.push(new QueueEntry(Date.now(), "updateCell", oldChildItems[i].quantityCell(), `Inventory Items!${oldChildItems[i].prefab.id}|${oldChildItems[i].identifier}|${this.name}|${oldChildItems[i].equipmentSlot}|${oldChildItems[i].containerName}`, "0"));
        }

        // Add the equipped item to the queue.
        const createdItemData = [
            recipient.name,
            createdItem.prefab.id,
            createdItem.identifier,
            createdItem.equipmentSlot,
            createdItem.containerName,
            isNaN(createdItem.quantity) ? "" : createdItem.quantity,
            isNaN(createdItem.uses) ? "" : createdItem.uses,
            createdItem.description
        ];
        game.queue.push(new QueueEntry(Date.now(), "updateRow", createdItem.itemCells(), `Inventory Items!||${recipient.name}|${createdItem.equipmentSlot}|${createdItem.containerName}`, createdItemData));

        itemManager.insertInventoryItems(game, recipient, items, slot);

        this.carryWeight -= createdItem.weight;
        recipient.carryWeight += createdItem.weight;

        this.notify(game, `You give ${createdItem.singleContainingPhrase} to ${recipient.displayName}.`);
        recipient.notify(game, `${this.displayName} gives you ${createdItem.singleContainingPhrase}!`);
        if (!createdItem.prefab.discreet) {
            new Narration(game, this, this.location, `${this.displayName} gives ${createdItem.singleContainingPhrase} to ${recipient.displayName}.`).send();
            // Remove the item from the player's hands item list.
            this.description = parser.removeItem(this.description, createdItem, "hands");
            game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));
            // Add the item to the recipient's hands item list.
            recipient.description = parser.addItem(recipient.description, createdItem, "hands");
            game.queue.push(new QueueEntry(Date.now(), "updateCell", recipient.descriptionCell(), `Players!${recipient.name}|Description`, recipient.description));
        }

        return;
    }

    stash(game, item, hand, container, slotName) {
        // Unequip the item from the player's hand.
        this.unequip(game, item, hand, null);

        // Get the slot number of the EquipmentSlot that the item will go into.
        for (var slot = 0; slot < this.inventory.length; slot++) {
            if (this.inventory[slot].name === container.equipmentSlot)
                break;
        }

        var createdItem = itemManager.copyInventoryItem(item, this, this.inventory[slot].name, 1);
        createdItem.containerName = container.identifier + '/' + slotName;
        createdItem.container = container;
        createdItem.slot = slotName;

        // Update container.
        container.insertItem(createdItem, slotName);
        container.description = parser.addItem(container.description, createdItem, slotName);
        game.queue.push(new QueueEntry(Date.now(), "updateCell", container.descriptionCell(), `Inventory Items!${container.prefab.id}|${container.identifier}|${this.name}|${container.equipmentSlot}|${container.containerName}`, container.description));

        // Create a list of all the child items.
        var items = [];
        items.push(createdItem);
        itemManager.getChildItems(items, createdItem);

        // Now that the item has been converted, we can update the quantities of child items.
        var oldChildItems = [];
        itemManager.getChildItems(oldChildItems, item);
        for (let i = 0; i < oldChildItems.length; i++) {
            oldChildItems[i].quantity = 0;
            game.queue.push(new QueueEntry(Date.now(), "updateCell", oldChildItems[i].quantityCell(), `Inventory Items!${oldChildItems[i].prefab.id}|${oldChildItems[i].identifier}|${this.name}|${oldChildItems[i].equipmentSlot}|${oldChildItems[i].containerName}`, "0"));
        }

        itemManager.insertInventoryItems(game, this, items, slot);

        this.notify(game, `You stash ${createdItem.singleContainingPhrase}.`);
        if (!item.prefab.discreet) {
            var preposition = container.prefab ? container.prefab.preposition : "in";
            new Narration(game, this, this.location, `${this.displayName} stashes ${item.singleContainingPhrase} ${preposition} ${this.pronouns.dpos} ${container.name}.`).send();
            // Remove the item from the player's hands item list.
            this.description = parser.removeItem(this.description, item, "hands");
            game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));
        }

        return;
    }

    unstash(game, item, hand, container, slotName) {
        // Reduce quantity if the quantity is finite.
        if (!isNaN(item.quantity)) {
            item.quantity--;
            game.queue.push(new QueueEntry(Date.now(), "updateCell", item.quantityCell(), `Inventory Items!${item.prefab.id}|${item.identifier}|${this.name}|${item.equipmentSlot}|${item.containerName}`, item.quantity));
        }

        container.removeItem(item, slotName, 1);
        container.description = parser.removeItem(container.description, item, slotName);
        game.queue.push(new QueueEntry(Date.now(), "updateCell", container.descriptionCell(), `Inventory Items!${container.prefab.id}|${container.identifier}|${this.name}|${container.equipmentSlot}|${container.containerName}`, container.description));

        // Remove the item from its EquipmentSlot.
        for (let slot = 0; slot < this.inventory.length; slot++) {
            let foundItem = false;
            if (this.inventory[slot].name === item.equipmentSlot) {
                for (let i = 0; i < this.inventory[slot].items.length; i++) {
                    if (this.inventory[slot].items[i].row === item.row) {
                        foundItem = true;
                        this.inventory[slot].items.splice(i, 1);
                        break;
                    }
                }
            }
            if (foundItem) break;
        }
        // Get the row number of the EquipmentSlot that the item will go into.
        var rowNumber = 0;
        for (var slot = 0; slot < this.inventory.length; slot++) {
            if (this.inventory[slot].name === hand) {
                rowNumber = this.inventory[slot].row;
                break;
            }
        }

        var createdItem = itemManager.copyInventoryItem(item, this, hand, 1);
        createdItem.containerName = "";
        createdItem.container = null;
        createdItem.row = rowNumber;

        // Equip the item and add it to the player's inventory.
        this.inventory[slot].equippedItem = createdItem;
        this.inventory[slot].items.length = 0;
        this.inventory[slot].items.push(createdItem);
        // Replace the null entry in the inventoryItems list.
        for (let i = 0; i < game.inventoryItems.length; i++) {
            if (game.inventoryItems[i].row === createdItem.row) {
                game.inventoryItems.splice(i, 1, createdItem);
                break;
            }
        }
        // Create a list of all the child items.
        var items = [];
        itemManager.getChildItems(items, createdItem);

        // Now that the item has been converted, we can update the quantities of child items.
        var oldChildItems = [];
        itemManager.getChildItems(oldChildItems, item);
        for (let i = 0; i < oldChildItems.length; i++) {
            oldChildItems[i].quantity = 0;
            game.queue.push(new QueueEntry(Date.now(), "updateCell", oldChildItems[i].quantityCell(), `Inventory Items!${oldChildItems[i].prefab.id}|${oldChildItems[i].identifier}|${this.name}|${oldChildItems[i].equipmentSlot}|${oldChildItems[i].containerName}`, "0"));
        }

        // Add the equipped item to the queue.
        const createdItemData = [
            this.name,
            createdItem.prefab.id,
            createdItem.identifier,
            createdItem.equipmentSlot,
            createdItem.containerName,
            isNaN(createdItem.quantity) ? "" : createdItem.quantity,
            isNaN(createdItem.uses) ? "" : createdItem.uses,
            createdItem.description
        ];
        game.queue.push(new QueueEntry(Date.now(), "updateRow", createdItem.itemCells(), `Inventory Items!||${this.name}|${createdItem.equipmentSlot}|${createdItem.containerName}`, createdItemData));

        itemManager.insertInventoryItems(game, this, items, slot);
        
        this.notify(game, `You take ${item.singleContainingPhrase} out of the ${container.name}.`);
        if (!item.prefab.discreet) {
            new Narration(game, this, this.location, `${this.displayName} takes ${item.singleContainingPhrase} out of ${this.pronouns.dpos} ${container.name}.`).send();
            // Add the new item to the player's hands item list.
            this.description = parser.addItem(this.description, item, "hands");
            game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));
        }

        return;
    }

    async equip(game, item, slotName, hand, bot) {
        // Unequip the item from the player's hand.
        this.unequip(game, item, hand, null);

        // Get the row number of the EquipmentSlot that the item will go into.
        var rowNumber = 0;
        for (var slot = 0; slot < this.inventory.length; slot++) {
            if (this.inventory[slot].name === slotName) {
                rowNumber = this.inventory[slot].row;
                break;
            }
        }

        var createdItem = itemManager.copyInventoryItem(item, this, slotName, 1);
        createdItem.row = rowNumber;

        // Equip the item to the player's hand.
        this.inventory[slot].equippedItem = createdItem;
        this.inventory[slot].items.length = 0;
        this.inventory[slot].items.push(createdItem);
        // Replace the null entry in the inventoryItems list.
        for (let i = 0; i < game.inventoryItems.length; i++) {
            if (game.inventoryItems[i].row === createdItem.row) {
                game.inventoryItems.splice(i, 1, createdItem);
                break;
            }
        }
        // Create a list of all the child items.
        var items = [];
        itemManager.getChildItems(items, createdItem);

        // Update the quantities of child items.
        var oldChildItems = [];
        itemManager.getChildItems(oldChildItems, item);
        for (let i = 0; i < oldChildItems.length; i++) {
            oldChildItems[i].quantity = 0;
            game.queue.push(new QueueEntry(Date.now(), "updateCell", oldChildItems[i].quantityCell(), `Inventory Items!${oldChildItems[i].prefab.id}|${oldChildItems[i].identifier}|${this.name}|${oldChildItems[i].equipmentSlot}|${oldChildItems[i].containerName}`, "0"));
        }
        item.quantity = 0;

        // Add the equipped item to the queue.
        const createdItemData = [
            this.name,
            createdItem.prefab.id,
            createdItem.identifier,
            createdItem.equipmentSlot,
            createdItem.containerName,
            isNaN(createdItem.quantity) ? "" : createdItem.quantity,
            isNaN(createdItem.uses) ? "" : createdItem.uses,
            createdItem.description
        ];
        game.queue.push(new QueueEntry(Date.now(), "updateRow", createdItem.itemCells(), `Inventory Items!||${this.name}|${createdItem.equipmentSlot}|${createdItem.containerName}`, createdItemData));

        itemManager.insertInventoryItems(game, this, items, slot);

        this.notify(game, `You equip the ${createdItem.name}.`);
        new Narration(game, this, this.location, `${this.displayName} puts on ${createdItem.singleContainingPhrase}.`).send();
        // Remove mention of any equipped items that this item covers.
        for (let i = 0; i < createdItem.prefab.coveredEquipmentSlots.length; i++) {
            const coveredEquipmentSlot = createdItem.prefab.coveredEquipmentSlots[i];
            for (let j = 0; j < this.inventory.length; j++) {
                if (this.inventory[j].name === coveredEquipmentSlot && this.inventory[j].equippedItem !== null) {
                    // Preserve quantity.
                    const quantity = this.inventory[j].equippedItem.quantity;
                    this.inventory[j].equippedItem.quantity = 0;
                    this.description = parser.removeItem(this.description, this.inventory[j].equippedItem, "equipment");
                    this.inventory[j].equippedItem.quantity = quantity;
                    break;
                }
            }
        }
        // Remove the item from the player's hands item list.
        if (!item.prefab.discreet)
            this.description = parser.removeItem(this.description, item, "hands");

        // Check to make sure that this item isn't covered by something else the player has equipped.
        var isCovered = false;
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].equippedItem !== null) {
                for (let j = 0; j < this.inventory[i].equippedItem.prefab.coveredEquipmentSlots.length; j++) {
                    if (this.inventory[i].equippedItem.prefab.coveredEquipmentSlots[j] === createdItem.equipmentSlot) {
                        isCovered = true;
                        break;
                    }
                }
            }
        }
        // If it's not covered, add mention of this item to the player's equipment item list.
        if (!isCovered) {
            this.description = parser.addItem(this.description, createdItem, "equipment");
            game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));
        }

        // Run equip commands.
        for (let i = 0; i < createdItem.prefab.equipCommands.length; i++) {
            const command = createdItem.prefab.equipCommands[i];
            if (command.startsWith("wait")) {
                let args = command.split(" ");
                if (!args[1]) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${command}". No amount of seconds to wait was specified.`);
                const seconds = parseInt(args[1]);
                if (isNaN(seconds) || seconds < 0) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${command}". Invalid amount of seconds to wait.`);
                await sleep(seconds);
            }
            else {
                commandHandler.execute(command, bot, game, null, this, createdItem);
            }
        }
        return;
    }

    async fastEquip(game, item, slotName, bot) {
        // Get the row number of the EquipmentSlot that the item will go into.
        var rowNumber = 0;
        for (var slot = 0; slot < this.inventory.length; slot++) {
            if (this.inventory[slot].name === slotName) {
                rowNumber = this.inventory[slot].row;
                break;
            }
        }
        item.row = rowNumber;

        // Equip the item to the player's equipment slot.
        this.inventory[slot].equippedItem = item;
        this.inventory[slot].items.length = 0;
        this.inventory[slot].items.push(item);
        // Replace the null entry in the inventoryItems list.
        for (let i = 0; i < game.inventoryItems.length; i++) {
            if (game.inventoryItems[i].row === item.row) {
                game.inventoryItems.splice(i, 1, item);
                break;
            }
        }

        // Add the equipped item to the queue.
        const itemData = [
            this.name,
            item.prefab.id,
            item.identifier,
            item.equipmentSlot,
            item.containerName,
            isNaN(item.quantity) ? "" : item.quantity,
            isNaN(item.uses) ? "" : item.uses,
            item.description
        ];
        game.queue.push(new QueueEntry(Date.now(), "updateRow", item.itemCells(), `Inventory Items!||${this.name}|${item.equipmentSlot}|${item.containerName}`, itemData));

        if (item.equipmentSlot === "RIGHT HAND" || item.equipmentSlot === "LEFT HAND") {
            this.notify(game, `You take ${item.singleContainingPhrase}.`);
            if (!item.prefab.discreet) {
                new Narration(game, this, this.location, `${this.displayName} takes ${item.singleContainingPhrase}.`).send();
                // Add the new item to the player's hands item list.
                this.description = parser.addItem(this.description, item, "hands");
                game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));
            }
        }
        else {
            this.notify(game, `You equip the ${item.name}.`);
            new Narration(game, this, this.location, `${this.displayName} puts on ${item.singleContainingPhrase}.`).send();
            // Remove mention of any equipped items that this item covers.
            for (let i = 0; i < item.prefab.coveredEquipmentSlots.length; i++) {
                const coveredEquipmentSlot = item.prefab.coveredEquipmentSlots[i];
                for (let j = 0; j < this.inventory.length; j++) {
                    if (this.inventory[j].name === coveredEquipmentSlot && this.inventory[j].equippedItem !== null) {
                        // Preserve quantity.
                        const quantity = this.inventory[j].equippedItem.quantity;
                        this.inventory[j].equippedItem.quantity = 0;
                        this.description = parser.removeItem(this.description, this.inventory[j].equippedItem, "equipment");
                        this.inventory[j].equippedItem.quantity = quantity;
                        break;
                    }
                }
            }

            // Check to make sure that this item isn't covered by something else the player has equipped.
            var isCovered = false;
            for (let i = 0; i < this.inventory.length; i++) {
                if (this.inventory[i].equippedItem !== null) {
                    for (let j = 0; j < this.inventory[i].equippedItem.prefab.coveredEquipmentSlots.length; j++) {
                        if (this.inventory[i].equippedItem.prefab.coveredEquipmentSlots[j] === item.equipmentSlot) {
                            isCovered = true;
                            break;
                        }
                    }
                }
            }
            // If it's not covered, add mention of this item to the player's equipment item list.
            if (!isCovered) {
                this.description = parser.addItem(this.description, item, "equipment");
                game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));
            }

            // Run equip commands.
            for (let i = 0; i < item.prefab.equipCommands.length; i++) {
                const command = item.prefab.equipCommands[i];
                if (command.startsWith("wait")) {
                    let args = command.split(" ");
                    if (!args[1]) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${command}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${command}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                }
                else {
                    commandHandler.execute(command, bot, game, null, this, item);
                }
            }
        }
        return;
    }

    async unequip(game, item, slotName, hand, bot) {
        // Get the row number of the EquipmentSlot that the item is being unequipped from.
        var rowNumber = 0;
        for (var slot = 0; slot < this.inventory.length; slot++) {
            if (this.inventory[slot].name === slotName) {
                rowNumber = this.inventory[slot].row;
                break;
            }
        }

        // Replace this inventory slot with a null item.
        const nullItem = new InventoryItem(
            this,
            null,
            "",
            slotName,
            "",
            null,
            null,
            "",
            rowNumber
        );
        this.inventory[slot].equippedItem = null;
        this.inventory[slot].items.length = 0;
        this.inventory[slot].items.push(nullItem);
        // Replace the equipped item's entry in the inventoryItems list.
        for (let i = 0; i < game.inventoryItems.length; i++) {
            if (game.inventoryItems[i].row === item.row) {
                game.inventoryItems.splice(i, 1, nullItem);
                break;
            }
        }
        game.queue.push(new QueueEntry(Date.now(), "updateRow", nullItem.itemCells(), `Inventory Items!||${this.name}|${nullItem.equipmentSlot}|${nullItem.containerName}`, [this.name, "NULL", "", nullItem.equipmentSlot, "", "", "", "", ""]));

        // If the item is going to be put in the player's hand, move it.
        if (hand !== null) {
            // Get the row number of the EquipmentSlot that the item will go into.
            rowNumber = 0;
            for (slot = 0; slot < this.inventory.length; slot++) {
                if (this.inventory[slot].name === hand) {
                    rowNumber = this.inventory[slot].row;
                    break;
                }
            }

            var createdItem = itemManager.copyInventoryItem(item, this, hand, 1);
            createdItem.row = rowNumber;

            // Equip the item to the player's hand.
            this.inventory[slot].equippedItem = createdItem;
            this.inventory[slot].items.length = 0;
            this.inventory[slot].items.push(createdItem);
            // Replace the null entry in the inventoryItems list.
            for (let i = 0; i < game.inventoryItems.length; i++) {
                if (game.inventoryItems[i].row === createdItem.row) {
                    game.inventoryItems.splice(i, 1, createdItem);
                    break;
                }
            }
            // Create a list of all the child items.
            var items = [];
            itemManager.getChildItems(items, createdItem);

            // Update the quantities of child items.
            var oldChildItems = [];
            itemManager.getChildItems(oldChildItems, item);
            for (let i = 0; i < oldChildItems.length; i++) {
                oldChildItems[i].quantity = 0;
                game.queue.push(new QueueEntry(Date.now(), "updateCell", oldChildItems[i].quantityCell(), `Inventory Items!${oldChildItems[i].prefab.id}|${oldChildItems[i].identifier}|${this.name}|${oldChildItems[i].equipmentSlot}|${oldChildItems[i].containerName}`, "0"));
            }
            item.quantity = 0;

            // Add the equipped item to the queue.
            const createdItemData = [
                this.name,
                createdItem.prefab.id,
                createdItem.identifier,
                createdItem.equipmentSlot,
                createdItem.containerName,
                isNaN(createdItem.quantity) ? "" : createdItem.quantity,
                isNaN(createdItem.uses) ? "" : createdItem.uses,
                createdItem.description
            ];
            game.queue.push(new QueueEntry(Date.now(), "updateRow", createdItem.itemCells(), `Inventory Items!||${this.name}|${createdItem.equipmentSlot}|${createdItem.containerName}`, createdItemData));

            itemManager.insertInventoryItems(game, this, items, slot);

            this.notify(game, `You unequip the ${createdItem.name}.`);
            new Narration(game, this, this.location, `${this.displayName} takes off ${this.pronouns.dpos} ${createdItem.name}.`).send();
            // Remove mention of this item from the player's equipment item list.
            this.description = parser.removeItem(this.description, item, "equipment");
            // Add mention of this item to the player's hands item list.
            if (!createdItem.prefab.discreet)
                this.description = parser.addItem(this.description, createdItem, "hands");
            // Find any items that were covered by this item and add them to the equipment item list.
            for (let i = 0; i < item.prefab.coveredEquipmentSlots.length; i++) {
                const coveredEquipmentSlot = item.prefab.coveredEquipmentSlots[i];
                for (let j = 0; j < this.inventory.length; j++) {
                    if (this.inventory[j].name === coveredEquipmentSlot && this.inventory[j].equippedItem !== null) {
                        // Before adding this item to the equipment item slot, make sure it isn't covered by something else.
                        const coveringItems = game.inventoryItems.filter(item =>
                            item.player.id === this.id &&
                            item.prefab !== null &&
                            item.equipmentSlot !== "RIGHT HAND" &&
                            item.equipmentSlot !== "LEFT HAND" &&
                            item.containerName === "" &&
                            item.container === null &&
                            item.prefab.coveredEquipmentSlots.includes(this.inventory[j].name)
                        );
                        if (coveringItems.length === 0) this.description = parser.addItem(this.description, this.inventory[j].equippedItem, "equipment");
                        break;
                    }
                }
            }
            game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));

            // Run unequip commands.
            for (let i = 0; i < createdItem.prefab.unequipCommands.length; i++) {
                const command = createdItem.prefab.unequipCommands[i];
                if (command.startsWith("wait")) {
                    let args = command.split(" ");
                    if (!args[1]) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${command}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${command}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                }
                else {
                    commandHandler.execute(command, bot, game, null, this, createdItem);
                }
            }
        }
        return;
    }

    async fastUnequip(game, item, bot) {
        // Get the row number of the EquipmentSlot that the item is being unequipped from.
        var rowNumber = 0;
        for (var slot = 0; slot < this.inventory.length; slot++) {
            if (this.inventory[slot].name === item.equipmentSlot) {
                rowNumber = this.inventory[slot].row;
                break;
            }
        }

        // Replace this inventory slot with a null item.
        const nullItem = new InventoryItem(
            this,
            null,
            "",
            item.equipmentSlot,
            "",
            null,
            null,
            "",
            rowNumber
        );
        this.inventory[slot].equippedItem = null;
        this.inventory[slot].items.length = 0;
        this.inventory[slot].items.push(nullItem);
        this.carryWeight -= item.weight * item.quantity;
        // Replace the equipped item's entry in the inventoryItems list.
        for (let i = 0; i < game.inventoryItems.length; i++) {
            if (game.inventoryItems[i].row === item.row) {
                game.inventoryItems.splice(i, 1, nullItem);
                break;
            }
        }
        game.queue.push(new QueueEntry(Date.now(), "updateRow", nullItem.itemCells(), `Inventory Items!||${this.name}|${nullItem.equipmentSlot}|${nullItem.containerName}`, [this.name, "NULL", "", nullItem.equipmentSlot, "", "", "", "", ""]));

        if (item.equipmentSlot === "RIGHT HAND" || item.equipmentSlot === "LEFT HAND") {
            // Remove the item from the player's hands item list.
            if (!item.prefab.discreet)
                this.description = parser.removeItem(this.description, item, "hands");
        }
        else {
            this.notify(game, `You unequip the ${item.name}.`);
            new Narration(game, this, this.location, `${this.displayName} takes off ${this.pronouns.dpos} ${item.name}.`).send();
            // Remove mention of this item from the player's equipment item list.
            this.description = parser.removeItem(this.description, item, "equipment");
            // Find any items that were covered by this item and add them to the equipment item list.
            for (let i = 0; i < item.prefab.coveredEquipmentSlots.length; i++) {
                const coveredEquipmentSlot = item.prefab.coveredEquipmentSlots[i];
                for (let j = 0; j < this.inventory.length; j++) {
                    if (this.inventory[j].name === coveredEquipmentSlot && this.inventory[j].equippedItem !== null) {
                        // Before adding this item to the equipment item slot, make sure it isn't covered by something else.
                        const coveringItems = game.inventoryItems.filter(item =>
                            item.player.id === this.id &&
                            item.prefab !== null &&
                            item.equipmentSlot !== "RIGHT HAND" &&
                            item.equipmentSlot !== "LEFT HAND" &&
                            item.containerName === "" &&
                            item.container === null &&
                            item.prefab.coveredEquipmentSlots.includes(this.inventory[j].name)
                        );
                        if (coveringItems.length === 0) this.description = parser.addItem(this.description, this.inventory[j].equippedItem, "equipment");
                        break;
                    }
                }
            }

            // Run unequip commands.
            for (let i = 0; i < item.prefab.unequipCommands.length; i++) {
                const command = item.prefab.unequipCommands[i];
                if (command.startsWith("wait")) {
                    let args = command.split(" ");
                    if (!args[1]) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${command}". No amount of seconds to wait was specified.`);
                    const seconds = parseInt(args[1]);
                    if (isNaN(seconds) || seconds < 0) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${command}". Invalid amount of seconds to wait.`);
                    await sleep(seconds);
                }
                else {
                    commandHandler.execute(command, bot, game, null, this, item);
                }
            }
        }
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));
        return;
    }

    viewInventory(possessive, useID) {
        var itemString = `__${possessive} inventory:__\n`;
        for (let slot = 0; slot < this.inventory.length; slot++) {
            itemString += `${this.inventory[slot].name}: `;
            const equippedItem = this.inventory[slot].equippedItem;
            if (equippedItem === null) itemString += `[ ]\n`;
            else {
                itemString += `[${useID ? equippedItem.identifier ? equippedItem.identifier : equippedItem.prefab.id : equippedItem.name}]\n`;
                let listChildItems = function (itemString, item) {
                    // If item is capable of holding other items, show what items it has inside.
                    if (item.inventory.length > 0) {
                        for (let i = 0; i < item.inventory.length; i++) {
                            var parentItemIndexes = [];
                            itemString += `    ${item.inventory[i].name}: `;
                            if (item.inventory[i].item.length === 0) itemString += `[ ]`;
                            else {
                                for (let j = 0; j < item.inventory[i].item.length; j++) {
                                    const childItem = item.inventory[i].item[j];
                                    if (childItem.quantity === 1) itemString += `[${useID ? childItem.identifier ? childItem.identifier : childItem.prefab.id : childItem.name}] `;
                                    else if (useID) itemString += `[${childItem.quantity} ${childItem.identifier ? childItem.identifier : childItem.prefab.id}] `;
                                    else {
                                        if (childItem.pluralName) itemString += `[${childItem.quantity} ${childItem.pluralName}] `;
                                        else itemString += `[${childItem.quantity} ${childItem.name}] `;
                                    }
                                    if (childItem.inventory.length !== 0) parentItemIndexes.push(j);
                                }
                                for (let j = 0; j < parentItemIndexes.length; j++) {
                                    itemString += `\n`;
                                    itemString = listChildItems(itemString, item.inventory[i].item[parentItemIndexes[j]]);
                                }
                            }
                            if (itemString[itemString.length - 1] !== '\n') itemString += '\n';
                        }
                    }
                    return itemString;
                };
                itemString = listChildItems(itemString, equippedItem);
            }
        }

        return itemString.replace(/\n{2,}/g, '\n');
    }

    craft(game, item1, item2, recipe) {
        var product1 = recipe.products[0];
        var product2 = recipe.products[1];
        // First, check if either of the ingredients are also products.
        // If they are, simply decrease their uses.
        // If their uses would become 0, change the product to its next stage, if it has one.
        var item1Uses = null;
        var item2Uses = null;
        if (product1 && item1.prefab.id === product1.id) {
            if (item1.uses - 1 === 0) product1 = product1.nextStage;
            else if (!isNaN(item1.uses)) item1Uses = item1.uses - 1;
        }
        else if (product2 && item1.prefab.id === product2.id) {
            if (item1.uses - 1 === 0) product2 = product2.nextStage;
            else if (!isNaN(item1.uses)) item2Uses = item1.uses - 1;
        }
        if (product1 && item2.prefab.id === product1.id) {
            if (item2.uses - 1 === 0) product1 = product1.nextStage;
            else if (!isNaN(item2.uses)) item1Uses = item2.uses - 1;
        }
        else if (product2 && item2.prefab.id === product2.id) {
            if (item2.uses - 1 === 0) product2 = product2.nextStage;
            else if (!isNaN(item2.uses)) item2Uses = item2.uses - 1;
        }

        if (!item1.prefab.discreet) this.description = parser.removeItem(this.description, item1, "hands");
        if (!item2.prefab.discreet) this.description = parser.removeItem(this.description, item2, "hands");
        itemManager.replaceInventoryItem(item1, product1);
        itemManager.replaceInventoryItem(item2, product2);
        if (item1Uses !== null) {
            item1.uses = item1Uses;
            game.queue.push(new QueueEntry(Date.now(), "updateCell", item1.usesCell(), `Inventory Items!${item1.prefab.id}|${item1.identifier}|${this.name}|${item1.equipmentSlot}|${item1.containerName}`, item1.uses));
        }
        if (item2Uses !== null) {
            item2.uses = item2Uses;
            game.queue.push(new QueueEntry(Date.now(), "updateCell", item2.usesCell(), `Inventory Items!${item2.prefab.id}|${item2.identifier}|${this.name}|${item2.equipmentSlot}|${item2.containerName}`, item2.uses));
        }

        this.sendDescription(game, recipe.completedDescription, recipe);
        // Decide if this should be narrated or not.
        if (product1 && !product1.discreet || product2 && !product2.discreet) {
            let productPhrase = "";
            let product1Phrase = "";
            let product2Phrase = "";
            if (product1 && !product1.discreet) {
                product1Phrase = product1.singleContainingPhrase;
                this.description = parser.addItem(this.description, item1, "hands");
            }
            if (product2 && !product2.discreet) {
                product2Phrase = product2.singleContainingPhrase;
                this.description = parser.addItem(this.description, item2, "hands");
            }
            if (product1Phrase !== "" && product2Phrase !== "") productPhrase = `${product1Phrase} and ${product2Phrase}`;
            else if (product1Phrase !== "") productPhrase = product1Phrase;
            else if (product2Phrase !== "") productPhrase = product2Phrase;

            if (productPhrase !== "") new Narration(game, this, this.location, `${this.displayName} crafts ${productPhrase}.`).send();
        }
        game.queue.push(new QueueEntry(Date.now(), "updateCell", this.descriptionCell(), `Players!${this.name}|Description`, this.description));

        return { product1: product1 ? item1 : null, product2: product2 ? item2 : null };
    }

    hasItem(game, id) {
        const playerItems = game.inventoryItems.filter(item => item.player.id === this.id && item.prefab !== null && item.quantity > 0);
        for (let i = 0; i < playerItems.length; i++) {
            if (playerItems[i].prefab.id === id) return true;
        }
        return false;
    }

    attemptPuzzle(bot, game, puzzle, item, password, command, misc) {
        const puzzleName = puzzle.parentObject ? puzzle.parentObject.name : puzzle.name;
        // Make sure all the requirements are solved.
        var allRequirementsSolved = true;
        for (let i = 0; i < puzzle.requirements.length; i++) {
            if (puzzle.requirements[i] instanceof Puzzle && !puzzle.requirements[i].solved) {
                allRequirementsSolved = false;
                break;
            }
            else if (puzzle.requirements[i].hasOwnProperty("id")) {
                if (item !== null && item.prefab.id !== puzzle.requirements[i].id) {
                    allRequirementsSolved = false;
                    break;
                }
                else if (item === null) {
                    if (!this.hasItem(game, puzzle.requirements[i].id)) {
                        allRequirementsSolved = false;
                        break;
                    }
                }
            }
        }
        if (allRequirementsSolved && !puzzle.accessible && puzzle.requirements.length !== 0)
            puzzle.setAccessible(game);
        else if (!allRequirementsSolved && puzzle.accessible)
            puzzle.setInaccessible(game);
        if (puzzle.accessible) {
            if (puzzle.requiresMod && !puzzle.solved) return "you need moderator assistance to do that.";
            if (puzzle.remainingAttempts === 0) {
                this.sendDescription(game, puzzle.noMoreAttemptsDescription, puzzle);
                new Narration(game, this, this.location, `${this.displayName} attempts and fails to use the ${puzzleName}.`).send();

                return;
            }

            // Make sure all of the requirements are met before proceeding.
            var hasRequiredItem = false;
            var requiredItemName = "";
            var requirementsMet = false;
            if (puzzle.solutions.join(',').includes("Item: ")) {
                for (let i = 0; i < puzzle.solutions.length; i++) {
                    if (puzzle.solutions[i].startsWith("Item: ")) {
                        if (item !== null && item.prefab.id === puzzle.solutions[i].substring("Item: ".length)) {
                            hasRequiredItem = true;
                            requiredItemName = puzzle.solutions[i];
                            break;
                        }
                        else if (item === null) {
                            const requiredItem = puzzle.solutions[i].substring("Item: ".length);
                            if (this.hasItem(game, requiredItem)) {
                                hasRequiredItem = true;
                                requiredItemName = puzzle.solutions[i];
                                break;
                            }
                        }
                        if (hasRequiredItem) break;
                    }
                }
            }
            else hasRequiredItem = true;

            if (puzzle.solved || hasRequiredItem) requirementsMet = true;

            // Puzzle is solvable.
            if (requirementsMet) {
                if (puzzle.type === "password") {
                    if (puzzle.solved) puzzle.alreadySolved(game, this, `${this.displayName} uses the ${puzzleName}.`);
                    else {
                        if (password === "") return "you need to enter a password.";
                        else if (puzzle.solutions.includes(password)) puzzle.solve(bot, game, this, `${this.displayName} uses the ${puzzleName}.`, password, true);
                        else puzzle.fail(game, this, `${this.displayName} uses the ${puzzleName}.`);
                    }
                }
                else if (puzzle.type === "interact") {
                    if (puzzle.solved) puzzle.alreadySolved(game, this, `${this.displayName} uses the ${puzzleName}.`);
                    else puzzle.solve(bot, game, this, `${this.displayName} uses the ${puzzleName}.`, requiredItemName, true);
                }
                else if (puzzle.type === "toggle") {
                    if (puzzle.solved && hasRequiredItem) {
                        let message = null;
                        if (puzzle.alreadySolvedDescription) message = parser.parseDescription(puzzle.alreadySolvedDescription, puzzle, this);
                        puzzle.unsolve(bot, game, this, `${this.displayName} uses the ${puzzleName}.`, message, true);
                    }
                    else if (puzzle.solved) puzzle.requirementsNotMet(game, this, `${this.displayName} attempts to use the ${puzzleName}, but struggles.`);
                    else puzzle.solve(bot, game, this, `${this.displayName} uses the ${puzzleName}.`, requiredItemName, true);
                }
                else if (puzzle.type === "combination lock") {
                    // The lock is currently unlocked.
                    if (puzzle.solved) {
                        if (command === "unlock") return `${puzzleName} is already unlocked.`;
                        if (command !== "lock" && (password === "" || puzzle.solutions.includes(password)))
                            puzzle.alreadySolved(game, this, `${this.displayName} opens the ${puzzleName}.`);
                        // If the player enters something that isn't the solution, lock it.
                        else puzzle.unsolve(bot, game, this, `${this.displayName} locks the ${puzzleName}.`, `You lock the ${puzzleName}.`, true);
                    }
                    // The lock is locked.
                    else {
                        if (command === "lock") return `${puzzleName} is already locked.`;
                        if (password === "") return "you need to enter a combination. The format is #-#-#.";
                        else if (puzzle.solutions.includes(password)) puzzle.solve(bot, game, this, `${this.displayName} unlocks the ${puzzleName}.`, password, true);
                        else puzzle.fail(game, this, `${this.displayName} attempts and fails to unlock the ${puzzleName}.`);
                    }
                }
                else if (puzzle.type === "key lock") {
                    // The lock is currently unlocked.
                    if (puzzle.solved) {
                        if (command === "unlock") return `${puzzleName} is already unlocked.`;
                        if (command === "lock" && hasRequiredItem) puzzle.unsolve(bot, game, this, `${this.displayName} locks the ${puzzleName}.`, `You lock the ${puzzleName}.`, true);
                        else if (command === "lock") puzzle.requirementsNotMet(game, this, `${this.displayName} attempts and fails to lock the ${puzzleName}.`);
                        else puzzle.alreadySolved(game, this, `${this.displayName} opens the ${puzzleName}.`);
                    }
                    // The lock is locked.
                    else {
                        if (command === "lock") return `${puzzleName} is already locked.`;
                        puzzle.solve(bot, game, this, `${this.displayName} unlocks the ${puzzleName}.`, requiredItemName, true);
                    }
                }
                else if (puzzle.type === "probability") {
                    if (puzzle.solved) puzzle.alreadySolved(game, this, `${this.displayName} uses the ${puzzleName}.`);
                    else {
                        const outcome = puzzle.solutions[Math.floor(Math.random() * puzzle.solutions.length)];
                        puzzle.solve(bot, game, this, `${this.displayName} uses the ${puzzleName}.`, outcome, true);
                    }
                }
                else if (puzzle.type === "channels") {
                    if (puzzle.solved) {
                        if (password === "") puzzle.unsolve(bot, game, this, `${this.displayName} turns off the ${puzzleName}.`, `You turn off the ${puzzleName}.`, true);
                        else if (puzzle.solutions.includes(password)) puzzle.solve(bot, game, this, `${this.displayName} changes the channel on the ${puzzleName}.`, password, true);
                        else puzzle.fail(game, this, `${this.displayName} attempts and fails to change the channel on the ${puzzleName}.`);
                    }
                    else {
                        if (!puzzle.solutions.includes(password)) password = puzzle.outcome ? puzzle.outcome : "";
                        puzzle.solve(bot, game, this, `${this.displayName} turns on the ${puzzleName}.`, password, true);
                    }
                }
                else if (puzzle.type === "weight") {
                    if (puzzle.solved) {
                        if (!puzzle.solutions.includes(password)) puzzle.unsolve(bot, game, this, "", null, true);
                    }
                    else {
                        if (puzzle.solutions.includes(password)) puzzle.solve(bot, game, this, "", password, true);
                        else puzzle.fail(game, this, "");
                    }
                }
            }
            // The player is missing an item needed to solve the puzzle.
            else return puzzle.requirementsNotMet(game, this, `${this.displayName} attempts to use the ${puzzleName}, but struggles.`, misc);
        }
        // The puzzle isn't accessible.
        else return puzzle.requirementsNotMet(game, this, `${this.displayName} uses the ${puzzleName}.`, misc);

        return;
    }

    gesture(game, gesture, targetType, target) {
        var newGesture = new Gesture(gesture.name, [...gesture.requires], [...gesture.disabledStatusesStrings], gesture.description, gesture.narration, gesture.row);
        newGesture.targetType = targetType;
        newGesture.target = target;
        new Narration(game, this, this.location, parser.parseDescription(newGesture.narration, newGesture, this, false)).send();

        return;
    }

    die(game) {
        // Remove player from their current channel.
        this.location.leaveChannel(this);
        this.location.occupants.splice(this.location.occupants.indexOf(this), 1);
        this.location.occupantsString = this.location.generate_occupantsString(this.location.occupants.filter(occupant => !occupant.hasAttribute("hidden")));
        this.removeFromWhispers(game, `${this.displayName} dies.`);
        if (!this.hasAttribute("hidden")) {
            new Narration(game, this, this.location, `${this.displayName} dies.`).send();
        }

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${this.name} died in ${this.location.channel}`);

        // Update various data.
        this.alive = false;
        this.location = null;
        this.hidingSpot = "";
        this.isMoving = false;
        clearInterval(this.moveTimer);
        this.remainingTime = 0;
        for (let i = 0; i < this.status.length; i++) {
            if (this.status[i].timer !== null)
                this.status[i].timer.stop();
        }
        this.status.length = 0;
        // Update that data on the sheet, as well.
        game.queue.push(new QueueEntry(Date.now(), "updateRow", this.playerCells(), `Players!|${this.name}`, new Array(this.id, this.name, this.talent, this.pronounString, this.defaultStrength, this.defaultIntelligence, this.defaultDexterity, this.defaultSpeed, this.defaultStamina, this.alive, "", "", "", "")));

        // Move player to dead list.
        game.players_dead.push(this);
        // Then remove them from living list.
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].id === this.id) {
                game.players_alive.splice(i, 1);
                break;
            }
        }

        game.messageHandler.addGameMechanicMessage(this.member, "You have died. When your body is discovered, you will be given the Dead role. Until then, please do not speak on the server or to other players.");
        
        return;
    }

    removeFromWhispers(game, message) {
        var deleteWhisperIndexes = new Array();
        for (let i = 0; i < game.whispers.length; i++) {
            for (let j = 0; j < game.whispers[i].players.length; j++) {
                if (game.whispers[i].players[j].id === this.id) {
                    // Remove player from the whisper.
                    const deleteWhisper = game.whispers[i].removePlayer(game, j, message);
                    if (deleteWhisper) deleteWhisperIndexes.push(i);
                    break;
                }
            }
        }
        // Sort the whisper indexes to delete by decreasing value.
        deleteWhisperIndexes.sort((a, b) => b - a);
        // Now delete each one.
        for (let i = 0; i < deleteWhisperIndexes.length; i++) {
            const index = deleteWhisperIndexes[i];
            game.whispers[index].delete(game, index);
        }

        return;
    }

    sendDescription(game, description, container) {
        if (description && (!this.hasAttribute("unconscious") || container && container instanceof Status))
            game.messageHandler.addDirectNarration(this, parser.parseDescription(description, container, this));
        return;
    }

    notify(game, message) {
        if (!this.hasAttribute("unconscious"))
            game.messageHandler.addDirectNarration(this, message);
        return;
    }

    setOnline() {
        this.online = true;

        // Clear the existing timeout if necessary
        this.onlineInterval && clearTimeout(this.onlineInterval);
        // Set the timeout to the number of minutes in the settings
        let player = this;
        this.onlineInterval = setTimeout(function () {
            player.setOffline();
        }, 1000 * 60 * settings.offlineStatusInterval);
    }

    setOffline() {
        this.online = false;
        this.onlineInterval && clearTimeout(this.onlineInterval);
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
    descriptionCell() {
        return settings.playerSheetDescriptionColumn + this.row;
    }
}

module.exports = Player;

function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
