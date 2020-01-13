const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);
const parser = include(`${settings.modulesDir}/parser.js`);
const queuer = include(`${settings.modulesDir}/queuer.js`);

const Room = include(`${settings.dataDir}/Room.js`);
const Object = include(`${settings.dataDir}/Object.js`);
const Item = include(`${settings.dataDir}/Item.js`);
const Puzzle = include(`${settings.dataDir}/Puzzle.js`);
const InventoryItem = include(`${settings.dataDir}/InventoryItem.js`);
const Status = include(`${settings.dataDir}/Status.js`);
const Narration = include(`${settings.dataDir}/Narration.js`);
const Die = include(`${settings.dataDir}/Die.js`);
const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);

class Player {
    constructor(id, member, name, displayName, talent, stats, alive, location, hidingSpot, status, inventory, row) {
        this.id = id;
        this.member = member;
        this.name = name;
        this.displayName = displayName;
        this.talent = talent;
        this.strength = stats.strength;
        this.intelligence = stats.intelligence;
        this.dexterity = stats.dexterity;
        this.speed = stats.speed;
        this.maxStamina = stats.stamina;
        this.stamina = stats.stamina;
        this.alive = alive;
        this.location = location;
        this.pos = { x: 0, y: 0, z: 0 };
        this.hidingSpot = hidingSpot;
        this.status = status;
        this.statusString = "";
        this.inventory = inventory;
        this.row = row;

        this.isMoving = false;
        this.moveTimer = null;
        this.remainingTime = 0;

        this.reachedHalfStamina = false;
        let player = this;
        this.interval = setInterval(function () {
            if (!player.isMoving) player.regenerateStamina();
        }, 30000);
    }

    move(game, currentRoom, desiredRoom, exit, entrance, exitMessage, entranceMessage) {
        const time = this.calculateMoveTime(exit);
        this.remainingTime = time;
        this.isMoving = true;
        if (time > 1000) new Narration(game, this, this.location, `${this.displayName} starts walking toward ${exit.name}.`).send();
        const startingPos = { x: this.pos.x, y: this.pos.y, z: this.pos.z };

        let player = this;
        this.moveTimer = setInterval(function () {
            player.remainingTime -= 100;
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
            var lostStamina;
            // If distance is 0, we'll treat it like a staircase.
            if (distance === 0 && rise !== 0) {
                const uphill = rise > 0 ? true : false;
                distance = rise;
                lostStamina = uphill ? 4 * settings.staminaUseRate * distance : settings.staminaUseRate / 4 * -distance;
            }
            else {
                const slope = rise / distance;
                lostStamina = !isNaN(slope) ? (settings.staminaUseRate + slope * settings.staminaUseRate) * distance : settings.staminaUseRate * distance;
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
                player.member.send(`You're starting to get tired! You might want to stop moving and rest soon.`);
            }
            // If player runs out of stamina, stop them in their tracks.
            if (player.stamina <= 0) {
                clearInterval(player.moveTimer);
                player.stamina = 0;
                player.inflict(game, "weary", true, true, true, true);
            }
            if (player.remainingTime <= 0 && player.stamina !== 0) {
                clearInterval(player.moveTimer);
                currentRoom.removePlayer(game, player, exit, exitMessage);
                desiredRoom.addPlayer(game, player, entrance, entranceMessage, true);
                player.isMoving = false;
            }
        }, 100);
    }

    calculateMoveTime(exit) {
        let distance = Math.sqrt(Math.pow(exit.pos.x - this.pos.x, 2) + Math.pow(exit.pos.z - this.pos.z, 2));
        distance = distance * settings.metersPerPixel;
        // The formula to calculate the rate is a quadratic function.
        // The equation is Rate = 0.0183x^2 + 0.005x + 0.916, where x is the player's speed stat.
        let rate = 0.0183 * Math.pow(this.speed, 2) + 0.005 * this.speed + 0.916;
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
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].discreet === false)
                nonDiscreetItems.push(this.inventory[i].singleContainingPhrase);
        }

        var appendString = "";
        if (nonDiscreetItems.length === 0)
            appendString = ".";
        else if (nonDiscreetItems.length === 1)
            appendString = ` carrying ${nonDiscreetItems[0]}.`;
        else if (nonDiscreetItems.length === 2)
            appendString = ` carrying ${nonDiscreetItems[0]} and ${nonDiscreetItems[1]}.`;
        else if (nonDiscreetItems.length >= 3) {
            appendString = " carrying ";
            for (let i = 0; i < nonDiscreetItems.length - 1; i++)
                appendString += `${nonDiscreetItems[i]}, `;
            appendString += `and ${nonDiscreetItems[nonDiscreetItems.length - 1]}.`;
        }

        return appendString;
    }

    inflict(game, statusName, notify, doCures, updateSheet, narrate, item) {
        var status = null;
        for (let i = 0; i < game.statusEffects.length; i++) {
            if (game.statusEffects[i].name.toLowerCase() === statusName.toLowerCase()) {
                status = game.statusEffects[i];
                break;
            }
        }
        if (status === null) return `Couldn't find status effect "${statusName}".`;

        if (this.statusString.includes(statusName)) {
            if (status.duplicatedStatus !== null) {
                this.cure(game, statusName, false, false, false, false);
                this.inflict(game, status.duplicatedStatus.name, true, false, true, true);
                return `Status was duplicated, so inflicted ${status.duplicatedStatus.name} instead.`;
            }
            else return "Specified player already has that status effect.";
        }

        if (notify === null || notify === undefined) notify = true;
        if (doCures === null || doCures === undefined) doCures = true;
        if (updateSheet === null || updateSheet === undefined) updateSheet = true;
        if (narrate === null || narrate === undefined) narrate = true;

        if (status.cures !== "" && doCures) {
            for (let i = 0; i < status.cures.length; i++)
                this.cure(game, status.cures[i].name, false, false, false, false);
        }

        // Apply the effects of any attributes that require immediate action.
        if (status.attributes.includes("no channel")) {
            this.location.leaveChannel(this);
            this.removeFromWhispers(game, `${this.name} can no longer whisper because they are ${status.name}.`);
        }
        if (status.attributes.includes("no hearing")) this.removeFromWhispers(game, `${this.displayName} can no longer hear.`);
        if (status.attributes.includes("hidden")) {
            if (narrate) new Narration(game, this, this.location, `${this.displayName} hides in the ${this.hidingSpot}.`).send();
            game.queue.push(new QueueEntry(Date.now(), "updateCell", this.hidingSpotCell(), `Players!${this.name}`, this.hidingSpot));
        }
        if (status.attributes.includes("concealed")) {
            if (item === null || item === undefined) item = { singleContainingPhrase: "a MASK" };
            if (!this.hasAttribute("hidden") && narrate) new Narration(game, this, this.location, `${this.displayName} puts on ${item.singleContainingPhrase}.`).send();
            this.displayName = `An individual wearing ${item.singleContainingPhrase}`;
        }
        if (status.attributes.includes("disable all") || status.attributes.includes("disable move")) {
            // Clear the player's movement timer.
            this.isMoving = false;
            clearInterval(this.moveTimer);
            this.remainingTime = 0;
        }

        // Announce when a player falls asleep or unconscious.
        if (status.name === "asleep" && narrate) new Narration(game, this, this.location, `${this.displayName} falls asleep.`).send();
        else if (status.name === "unconscious" && narrate) new Narration(game, this, this.location, `${this.displayName} goes unconscious.`).send();
        else if (status.name === "blacked out" && narrate) new Narration(game, this, this.location, `${this.displayName} blacks out.`).send();

        status = new Status(status.name, status.duration, status.fatal, status.cures, status.nextStage, status.duplicatedStatus, status.curedCondition, status.rollModifier, status.modifiesSelf, status.attributes, status.inflictedDescription, status.curedDescription, status.row);

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
                        player.cure(game, status.name, false, false, false, true);
                        player.inflict(game, status.nextStage.name, true, false, true, true);
                    }
                    else {
                        if (status.fatal) {
                            clearInterval(status.timer);
                            player.die(game);
                        }
                        else {
                            player.cure(game, status.name, true, true, true, true);
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
        if (notify)
            this.sendDescription(status.inflictedDescription, status);

        this.statusString = this.generate_statusList();
        if (updateSheet) game.queue.push(new QueueEntry(Date.now(), "updateCell", this.statusCell(), `Players!${this.name}`, this.statusString));

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.logChannel.send(`${time} - ${this.name} became ${status.name} in ${this.location.channel}`);

        return "Status successfully added.";
    }

    cure(game, statusName, notify, doCuredCondition, updateSheet, narrate) {
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
        if (updateSheet === null || updateSheet === undefined) updateSheet = true;

        if (status.attributes.includes("no channel") && this.getAttributeStatusEffects("no channel").length - 1 === 0)
            this.location.joinChannel(this);
        if (status.attributes.includes("hidden")) {
            if (narrate) new Narration(game, this, this.location, `${this.displayName} comes out of the ${this.hidingSpot}.`).send();
            this.hidingSpot = "";
            game.queue.push(new QueueEntry(Date.now(), "updateCell", this.hidingSpotCell(), `Players!${this.name}`, " "));
        }
        if (status.attributes.includes("concealed")) {
            this.displayName = this.name;
            if (narrate) new Narration(game, this, this.location, `The mask comes off, revealing the figure to be ${this.displayName}.`).send();
        }

        // Announce when a player awakens.
        if (status.name === "asleep" && narrate) new Narration(game, this, this.location, `${this.displayName} wakes up.`).send();
        else if (status.name === "unconscious" && narrate) new Narration(game, this, this.location, `${this.displayName} regains consciousness.`).send();
        else if (status.name === "blacked out" && narrate) new Narration(game, this, this.location, `${this.displayName} wakes up.`).send();

        var returnMessage = "Successfully removed status effect.";
        if (status.curedCondition && doCuredCondition) {
            this.inflict(game, status.curedCondition.name, false, false, false, true);
            returnMessage += ` Player is now ${status.curedCondition.name}.`;
        }

        // Inform player what happened.
        if (notify) {
            this.sendDescription(status.curedDescription, status);
            // If the player is waking up, send them the description of the room they wake up in.
            if (status.name === "asleep")
                this.sendDescription(this.location.description, this.location);
        }

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.logChannel.send(`${time} - ${this.name} has been cured of ${status.name} in ${this.location.channel}`);

        clearInterval(status.timer);
        this.status.splice(statusIndex, 1);

        this.statusString = this.generate_statusList();
        if (updateSheet) game.queue.push(new QueueEntry(Date.now(), "updateCell", this.statusCell(), `Players!${this.name}`, this.statusString));

        return returnMessage;
    }
    
    generate_statusList() {
        var statusList = "";
        if (this.status.length > 0) {
            statusList = this.status[0].name;
            for (let i = 1; i < this.status.length; i++)
                statusList += `, ${this.status[i].name}`;
        }
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

    use(game, item) {
        /*if (item.uses === 0) return "that item has no uses left.";
        if (item.effects.length === 0 && item.cures.length === 0) return "that item has no programmed use on its own, but you may be able to use it some other way.";
        if (!item.name.endsWith("MASK") && item.effects.length !== 0) {
            for (let i = 0; i < item.effects.length; i++) {
                if (this.statusString.includes(item.effects[i].name) && item.effects[i].duplicatedStatus === null)
                    return "you cannot use that item as you are already under its effect.";
            }
        }

        if (item.effects.length !== 0) {
            if (item.name.endsWith("MASK") && this.statusString.includes("concealed"))
                this.cure(game, "concealed", true, false, true, true);
            else {
                // If the item inflicts multiple status effects, don't update the spreadsheet until inflicting the last one.
                for (let i = 0; i < item.effects.length - 1; i++)
                    this.inflict(game, item.effects[i].name, true, true, false, true, item);
                this.inflict(game, item.effects[item.effects.length - 1].name, true, true, true, true, item);
            }
        }

        if (item.cures.length !== 0) {
            var hasEffect = false;
            // If the item cures multiple status effects, don't update the spreadsheet until curing the last one.
            for (let i = 0; i < item.cures.length; i++) {
                const statusMessage = this.cure(game, item.cures[i].name, true, true, true, true);
                if (statusMessage !== "Specified player doesn't have that status effect.") hasEffect = true;
            }
            if (!hasEffect) return `you attempted to use the ${item.name}, but it had no effect.`;
        }

        if (!isNaN(item.uses)) {
            item.uses--;
            game.queue.push(new QueueEntry(Date.now(), "updateCell", item.usesCell(), item.uses));
        }
        if (item.name !== "MASK")
            new Narration(game, this, this.location, `${this.displayName} takes out ${item.singleContainingPhrase} and uses it.`).send();
            */
        return;
    }

    take(game, item, hand, container, slotName) {
        // Reduce quantity if the quantity is finite.
        if (!isNaN(item.quantity)) {
            item.quantity--;
            game.queue.push(new QueueEntry(Date.now(), "updateCell", item.quantityCell(), `Items!${item.prefab.id}|${item.location.name}|${item.containerName}`, item.quantity));
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
            container.removeItem(item, slotName);
            container.description = parser.removeItem(container.description, item, slotName);
            game.queue.push(new QueueEntry(Date.now(), "updateCell", container.descriptionCell(), `Items!${container.prefab.id}|${container.location.name}|${container.containerName}`, container.description));
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

        var createdItem = this.convertItem(item, hand, 1);
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
        this.getChildItems(items, createdItem);

        // Now that the item has been converted, we can update the quantities of child items.
        var oldChildItems = [];
        this.getChildItems(oldChildItems, item);
        for (let i = 0; i < oldChildItems.length; i++) {
            oldChildItems[i].quantity = 0;
            game.queue.push(new QueueEntry(Date.now(), "updateCell", oldChildItems[i].quantityCell(), `Items!${oldChildItems[i].name}|${oldChildItems[i].location.name}|${oldChildItems[i].containerName}`, "0"));
        }

        // Add the equipped item to the queue.
        const createdItemData = [
            this.name,
            createdItem.prefab.id,
            createdItem.equipmentSlot,
            createdItem.containerName,
            isNaN(createdItem.quantity) ? "" : createdItem.quantity,
            isNaN(createdItem.uses) ? "" : createdItem.uses,
            createdItem.description
        ];
        game.queue.push(new QueueEntry(Date.now(), "updateRow", createdItem.itemCells(), `Inventory Items!|${this.name}|${createdItem.equipmentSlot}|${createdItem.containerName}`, createdItemData));

        var lastNewItem = this.inventory[this.inventory.length - 1].equippedItem;
        for (let i = 0; i < items.length; i++) {
            // Check if the player is picking this item up again.
            const playerItems = game.inventoryItems.filter(item => item.player.id === this.id);
            let matchedItem = playerItems.find(item =>
                item.prefab !== null &&
                item.prefab.id === items[i].prefab.id &&
                item.equipmentSlot === items[i].equipmentSlot &&
                item.containerName === items[i].containerName &&
                item.slot === items[i].slot &&
                (item.uses === items[i].uses || isNaN(item.uses) && isNaN(items[i].uses)) &&
                item.description === items[i].description
            );
            if (matchedItem) {
                if (!isNaN(matchedItem.quantity)) {
                    matchedItem.quantity += items[i].quantity;
                    game.queue.push(new QueueEntry(Date.now(), "updateCell", matchedItem.quantityCell(), `Inventory Items!${matchedItem.prefab.id}|${this.name}|${matchedItem.equipmentSlot}|${matchedItem.containerName}`, matchedItem.quantity));
                }
                // Update container's references to this item.
                if (items[i].container instanceof InventoryItem) {
                    let foundItem = false;
                    for (let slot = 0; slot < items[i].container.inventory.length; slot++) {
                        if (items[i].container.inventory[slot].name === items[i].slot) {
                            const containerSlot = items[i].container.inventory[slot];
                            for (let j = 0; j < containerSlot.item.length; j++) {
                                if (containerSlot.item[j].prefab.id === items[i].prefab.id) {
                                    foundItem = true;
                                    containerSlot.item.splice(j, 1, matchedItem);
                                    break;
                                }
                            }
                            if (foundItem) break;
                        }
                    }
                }
                this.inventory[slot].items.splice(this.inventory[slot].items.length, 0, matchedItem);
            }
            // The player hasn't picked this item up before or it's been modified somehow.
            else {
                let data = [[
                    this.name,
                    items[i].prefab.id,
                    items[i].equipmentSlot,
                    items[i].containerName,
                    isNaN(items[i].quantity) ? "" : items[i].quantity,
                    isNaN(items[i].uses) ? "" : items[i].uses,
                    items[i].description
                ]];

                // We want to insert this item near items in the same container slot, so get all of the items in that container slot.
                const slotItems = playerItems.filter(item => item.equipmentSlot === items[i].equipmentSlot && item.containerName === items[i].containerName);
                // Just in case there aren't any, get items just within the same container.
                const containerItems = playerItems.filter(item => item.equipmentSlot === items[i].equipmentSlot && item.container !== null && item.container.prefab !== null && item.container.prefab.id === items[i].container.prefab.id);

                const lastSlotItem = slotItems[slotItems.length - 1];
                const lastContainerItem = containerItems[containerItems.length - 1];

                var insertRow = -1;
                // If the list of items in that slot isn't empty, insert the new item.
                if (slotItems.length !== 0) {
                    game.queue.push(new QueueEntry(Date.now(), "insertData", lastSlotItem.itemCells(), `Inventory Items!${lastSlotItem.prefab.id}|${this.name}|${lastSlotItem.equipmentSlot}|${lastSlotItem.containerName}`, data));
                    insertRow = lastSlotItem.row;
                }
                // If there are none, it might just be that there are no items in that slot yet. Try to at least put it near items in the same container.
                else if (containerItems.length !== 0) {
                    game.queue.push(new QueueEntry(Date.now(), "insertData", lastContainerItem.itemCells(), `Inventory Items!${lastContainerItem.prefab.id}|${this.name}|${lastContainerItem.equipmentSlot}|${lastContainerItem.containerName}`, data));
                    insertRow = lastContainerItem.row;
                }
                // If there are none, just insert it after the last new item.
                else {
                    game.queue.push(new QueueEntry(Date.now(), "insertData", lastNewItem.itemCells(), `Inventory Items!|${this.name}|${lastNewItem.equipmentSlot}|${lastNewItem.containerName}`, data));
                    insertRow = lastNewItem.row;
                }
                lastNewItem = items[i];

                // Insert the new item into the inventoryItems list at the appropriate position.
                for (var insertIndex = 0; insertIndex < game.inventoryItems.length; insertIndex++) {
                    if (game.inventoryItems[insertIndex].row === insertRow) {
                        game.inventoryItems.splice(insertIndex + 1, 0, items[i]);
                        this.inventory[slot].items.splice(this.inventory[slot].items.length, 0, items[i]);
                        break;
                    }
                }
                // Update the rows for all of the inventoryItems after this.
                for (let j = insertIndex + 1, newRow = insertRow + 1; j < game.inventoryItems.length; j++ , newRow++)
                    game.inventoryItems[j].row = newRow;

                // Update the rows for all Player EquipmentSlots.
                for (let j = 0; j < game.players.length; j++) {
                    for (let slot = 0; slot < game.players[j].inventory.length; slot++) {
                        if (game.players[j].inventory[slot].equippedItem === null) game.players[j].inventory[slot].row = game.players[j].inventory[slot].items[0].row;
                        else game.players[j].inventory[slot].row = game.players[j].inventory[slot].equippedItem.row;
                    }
                }
            }
        }

        this.member.send(`You take ${createdItem.singleContainingPhrase}.`);
        if (!createdItem.prefab.discreet) new Narration(game, this, this.location, `${this.displayName} takes ${createdItem.singleContainingPhrase}.`).send();

        return;
    }

    steal(game, slotNo, victim) {
        /*// Make sure the victim has items first.
        var hasItems = false;
        for (let i = 0; i < victim.inventory.length; i++) {
            if (victim.inventory[i].name !== null) {
                hasItems = true;
                break;
            }
        }
        if (hasItems === false) return this.member.send(`You try to steal from ${victim.displayName}, but they don't have any items.`);

        // Randomly select an item to be stolen.
        let index;
        do index = Math.floor(Math.random() * victim.inventory.length);
        while (!victim.inventory[index] || victim.inventory[index].name === null);
        // Determine how successful the player is.
        const failMax = Math.floor((settings.diceMax - settings.diceMin) / 3) + settings.diceMin;
        const partialMax = Math.floor(2 * (settings.diceMax - settings.diceMin) / 3) + settings.diceMin;
        var dieRoll = new Die(this, victim);
        if (!victim.inventory[index].discreet && dieRoll.result > partialMax) dieRoll.result = partialMax;

        // Player didn't fail.
        if (dieRoll.result > failMax) {
            const copiedItem = new InventoryItem(
                victim.inventory[index].name,
                victim.inventory[index].pluralName,
                victim.inventory[index].uses,
                victim.inventory[index].discreet,
                victim.inventory[index].effects,
                victim.inventory[index].cures,
                victim.inventory[index].singleContainingPhrase,
                victim.inventory[index].pluralContainingPhrase,
                victim.inventory[index].description,
                this.inventory[slotNo].row
            );
            this.inventory[slotNo] = copiedItem;

            // Add the item to the Players sheet so that it's in their inventory.
            // First, concatenate the effects, cures, and containing phrases so they're formatted properly on the spreadsheet.
            var effects = copiedItem.effects ? copiedItem.effects.map(status => status.name).join(",") : "";
            var cures = copiedItem.cures ? copiedItem.cures.map(status => status.name).join(",") : "";
            var containingPhrase = copiedItem.singleContainingPhrase;
            if (copiedItem.pluralContainingPhrase !== "") containingPhrase += `,${copiedItem.pluralContainingPhrase}`;
            const data = new Array(
                copiedItem.name,
                copiedItem.pluralName,
                copiedItem.uses,
                copiedItem.discreet,
                effects,
                cures,
                containingPhrase,
                copiedItem.description
            );
            game.queue.push(new QueueEntry(Date.now(), "updateRow", copiedItem.itemCells(), data));
            // Delete stolen item from victim's inventory.
            victim.clearInventorySlot(index);

            // Decide what messages to send.
            if (dieRoll.result > partialMax || victim.hasAttribute("unconscious"))
                this.member.send(`You steal ${copiedItem.singleContainingPhrase} from ${victim.displayName} without them noticing!`);
            else {
                this.member.send(`You steal ${copiedItem.singleContainingPhrase} from ${victim.displayName}, but they seem to notice.`);
                victim.member.send(`${this.displayName} steals ${copiedItem.singleContainingPhrase} from you!`);
            }
            if (!copiedItem.discreet)
                new Narration(game, this, this.location, `${this.displayName} steals ${copiedItem.singleContainingPhrase} from ${victim.displayName}.`).send();

            return { itemName: copiedItem.name, successful: true };
        }
        // Player failed to steal the item.
        else {
            this.member.send(`You try to steal ${victim.displayName}'s ${victim.inventory[index].name}, but they notice you before you can.`);
            victim.member.send(`${this.displayName} attempts to steal your ${victim.inventory[index].name}, but you notice in time!`);

            return { itemName: victim.inventory[index].name, successful: false };
        }*/
    }

    drop(game, item, hand, container, slotName) {
        // Unequip the item from the player's hand.
        this.unequip(game, hand, item);

        // Convert the InventoryItem to an Item.
        var createdItem = this.convertInventoryItem(item, container, slotName, 1);
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
            game.queue.push(new QueueEntry(Date.now(), "updateCell", container.descriptionCell(), `Items!${container.prefab.id}|${container.location.name}|${container.containerName}`, container.description));
            containerName = container.name;
            preposition = container.prefab ? container.prefab.preposition : "in";
        }

        // Create a list of all the child items.
        var items = [];
        items.push(createdItem);
        this.getChildItems(items, createdItem);

        // Now that the item has been converted, we can update the quantities of child items.
        // We need a recursive function for this.
        let player = this;
        let deleteChildQuantities = function (item) {
            for (let slot = 0; slot < item.inventory.length; slot++) {
                for (let i = 0; i < item.inventory[slot].item.length; i++) {
                    deleteChildQuantities(item.inventory[slot].item[i]);
                    item.inventory[slot].item[i].quantity = 0;
                    game.queue.push(new QueueEntry(Date.now(), "updateCell", item.inventory[slot].item[i].quantityCell(), `Inventory Items!${item.inventory[slot].item[i].prefab.id}|${player.name}|${item.inventory[slot].item[i].equipmentSlot}|${item.inventory[slot].item[i].containerName}`, "0"));
                }
            }
            return;
        };
        deleteChildQuantities(item);

        
        for (let i = 0; i < items.length; i++) {
            // Check if the player is putting this item back in original spot unmodified.
            const roomItems = game.items.filter(item => item.location.name === this.location.name);
            let matchedItem = roomItems.find(item =>
                item.prefab.id === items[i].prefab.id &&
                item.containerName === items[i].containerName &&
                item.slot === items[i].slot &&
                (item.uses === items[i].uses || isNaN(item.uses) && isNaN(items[i].uses)) &&
                item.description === items[i].description
            );
            if (matchedItem) {
                if (!isNaN(matchedItem.quantity)) {
                    matchedItem.quantity += items[i].quantity;
                    game.queue.push(new QueueEntry(Date.now(), "updateCell", matchedItem.quantityCell(), `Items!${matchedItem.prefab.id}|${matchedItem.location.name}|${matchedItem.containerName}`, matchedItem.quantity));
                }
                // Update container's references to this item.
                if (items[i].container instanceof Item) {
                    let foundItem = false;
                    for (let slot = 0; slot < items[i].container.inventory.length; slot++) {
                        if (items[i].container.inventory[slot].name === items[i].slot) {
                            const containerSlot = items[i].container.inventory[slot];
                            for (let j = 0; j < containerSlot.item.length; j++) {
                                if (containerSlot.item[j].prefab.id === items[i].prefab.id) {
                                    foundItem = true;
                                    containerSlot.item.splice(j, 1, matchedItem);
                                    break;
                                }
                            }
                            if (foundItem) break;
                        }
                    }
                }
            }
            // The player is putting this item somewhere else or it's been modified somehow.
            else {
                let data = [[
                    items[i].prefab.id,
                    items[i].location.name,
                    items[i].accessible,
                    items[i].containerName,
                    items[i].quantity.toString(),
                    !isNaN(items[i].uses) ? items[i].uses.toString() : "",
                    items[i].description
                ]];

                // We want to insert this item near items in the same container, so get all of the items in that container.
                const containerItems = roomItems.filter(item => item.containerName === items[i].containerName);

                const lastRoomItem = roomItems[roomItems.length - 1];
                const lastContainerItem = containerItems[containerItems.length - 1];
                const lastGameItem = game.items[game.items.length - 1];
                var insertRow = -1;
                // If the list of items in that container isn't empty and isn't the last row of the spreadsheet, insert the new item.
                if (containerItems.length !== 0 && lastContainerItem.row !== lastGameItem.row) {
                    game.queue.push(new QueueEntry(Date.now(), "insertData", lastContainerItem.itemCells(), `Items!${lastContainerItem.prefab.id}|${lastContainerItem.location.name}|${lastContainerItem.containerName}`, data));
                    insertRow = lastContainerItem.row;
                }
                // If there are none, it might just be that there are no items in that container yet. Try to at least put it near items in the same room.
                else if (roomItems.length !== 0 && lastRoomItem.row !== lastGameItem.row) {
                    game.queue.push(new QueueEntry(Date.now(), "insertData", lastRoomItem.itemCells(), `Items!${lastRoomItem.prefab.id}|${lastRoomItem.location.name}|${lastRoomItem.containerName}`, data));
                    insertRow = lastRoomItem.row;
                }
                // If there are none, just insert it at the end of the sheet.
                else {
                    game.queue.push(new QueueEntry(Date.now(), "insertData", lastGameItem.itemCells(), `Items!${lastGameItem.prefab.id}|${lastGameItem.location.name}|${lastGameItem.containerName}`, data));
                    insertRow = lastGameItem.row;
                }

                // Insert the new item into the items list at the appropriate position.
                for (var insertIndex = 0; insertIndex < game.items.length; insertIndex++) {
                    if (game.items[insertIndex].row === insertRow) {
                        game.items.splice(insertIndex + 1, 0, items[i]);
                        break;
                    }
                }
                // Update the rows for all of the items after this.
                for (let j = insertIndex + 1, newRow = insertRow + 1; j < game.items.length; j++ , newRow++)
                    game.items[j].row = newRow;
            }
        }

        if (!item.prefab.discreet) new Narration(game, this, this.location, `${this.displayName} puts ${item.singleContainingPhrase} ${preposition} the ${containerName}.`).send();
        this.member.send(`You discard ${item.singleContainingPhrase}.`);

        if (item.name.includes("MASK") && this.statusString.includes("concealed"))
            this.cure(game, "concealed", true, false, true, true);
        
        return;
    }

    stash(game, item, hand, container, slotName) {
        return;
    }

    // This recursive function is used to convert Items to InventoryItems.
    convertItem(item, hand, quantity) {
        // Make a copy of the Item as an InventoryItem.
        var createdItem = new InventoryItem(
            this,
            item.prefab,
            hand,
            item.container && item.container.prefab ? item.container.prefab.id + '/' + item.slot : "",
            quantity,
            item.uses,
            item.description,
            0
        );

        // Initialize the item's inventory slots.
        for (let i = 0; i < item.prefab.inventory.length; i++)
            createdItem.inventory.push({
                name: item.prefab.inventory[i].name,
                capacity: item.prefab.inventory[i].capacity,
                takenSpace: item.prefab.inventory[i].takenSpace,
                weight: item.prefab.inventory[i].weight,
                item: []
            });

        // Now recursively run through all of the inventory items and convert them.
        for (let i = 0; i < item.inventory.length; i++) {
            for (let j = 0; j < item.inventory[i].item.length; j++) {
                let inventoryItem = this.convertItem(item.inventory[i].item[j], hand, item.inventory[i].item[j].quantity);
                if (inventoryItem.containerName !== "") {
                    inventoryItem.container = createdItem;
                    inventoryItem.slot = createdItem.inventory[i].name;
                    createdItem.insertItem(inventoryItem, inventoryItem.slot);
                }
                else createdItem.inventory[i].item.push(inventoryItem);
            }
        }

        return createdItem;
    }

    // This recursive function is used to convert InventoryItems to Items.
    convertInventoryItem(item, container, slotName, quantity) {
        var containerName = "";
        if (container instanceof Puzzle) containerName = "Puzzle: " + container.name;
        else if (container instanceof Object) containerName = "Object: " + container.name;
        else if (container instanceof Item) containerName = "Item: " + container.prefab.id + '/' + slotName;
        else if (container instanceof InventoryItem) containerName = "Item: " + container.prefab.id + '/' + item.slot;
        // Make a copy of the Item as an InventoryItem.
        var createdItem = new Item(
            item.prefab,
            this.location,
            container instanceof Puzzle ? container.accessible && container.solved : true,
            containerName,
            quantity,
            item.uses,
            item.description,
            0
        );

        // Initialize the item's inventory slots.
        for (let i = 0; i < item.prefab.inventory.length; i++)
            createdItem.inventory.push({
                name: item.prefab.inventory[i].name,
                capacity: item.prefab.inventory[i].capacity,
                takenSpace: item.prefab.inventory[i].takenSpace,
                weight: item.prefab.inventory[i].weight,
                item: []
            });

        // Now recursively run through all of the inventory items and convert them.
        for (let i = 0; i < item.inventory.length; i++) {
            for (let j = 0; j < item.inventory[i].item.length; j++) {
                let inventoryItem = this.convertInventoryItem(item.inventory[i].item[j], item, "", item.inventory[i].item[j].quantity);
                if (inventoryItem.containerName !== "") {
                    inventoryItem.container = createdItem;
                    inventoryItem.slot = createdItem.inventory[i].name;
                    createdItem.insertItem(inventoryItem, inventoryItem.slot);
                }
                else createdItem.inventory[i].item.push(inventoryItem);
            }
        }

        return createdItem;
    }

    getChildItems(items, item) {
        for (let i = 0; i < item.inventory.length; i++) {
            for (let j = 0; j < item.inventory[i].item.length; j++) {
                items.push(item.inventory[i].item[j]);
                this.getChildItems(items, item.inventory[i].item[j]);
            }
        }
    }

    unequip(game, slotName, item) {
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
        game.queue.push(new QueueEntry(Date.now(), "updateRow", nullItem.itemCells(), `Inventory Items!|${this.name}|${nullItem.equipmentSlot}|${nullItem.containerName}`, [this.name, "NULL", nullItem.equipmentSlot, "", "", "", "", ""]));

        return;
    }

    viewInventory(game, possessive) {
        var itemString = `__${possessive} inventory:__\n`;
        for (let slot = 0; slot < this.inventory.length; slot++) {
            //itemString += `${equippedItems[i].equipmentSlot}: [${equippedItems[i].prefab.name}]\n `;
            itemString += `${this.inventory[slot].name}: `;
            const equippedItem = this.inventory[slot].equippedItem;
            if (equippedItem === null) itemString += `[ ]\n`;
            else {
                itemString += `[${equippedItem.prefab.name}]\n`;
                // If item is capable of holding other items, show what items it has inside.
                if (equippedItem.inventory.length > 0) {
                    for (let i = 0; i < equippedItem.inventory.length; i++) {
                        itemString += `    ${equippedItem.inventory[i].name}: `;
                        if (equippedItem.inventory[i].item.length === 0) itemString += `[ ]`;
                        else {
                            for (let j = 0; j < equippedItem.inventory[i].item.length; j++)
                                itemString += `[${equippedItem.inventory[i].item[j].prefab.name}] `;
                        }
                        itemString += '\n';
                    }
                }
            }
        }

        return itemString;
    }

    attemptPuzzle(bot, game, puzzle, item, password, command, misc) {
        if (puzzle.accessible) {
            if (puzzle.requiresMod && !puzzle.solved) return "you need moderator assistance to do that.";
            if (puzzle.remainingAttempts === 0) {
                this.sendDescription(puzzle.noMoreAttemptsDescription, puzzle);
                new Narration(game, this, this.location, `${this.displayName} attempts and fails to use the ${puzzle.name}.`).send();

                return;
            }

            // Make sure all of the requirements are met before proceeding.
            var hasRequiredItem = false;
            var requirementsMet = false;
            if (puzzle.solution.startsWith("Item: ")) {
                if (item !== null && item.name === puzzle.solution.substring("Item: ".length))
                    hasRequiredItem = true;
                else if (item === null) {
                    const requiredItem = puzzle.solution.substring("Item: ".length);
                    for (let i = 0; i < this.inventory.length; i++) {
                        if (this.inventory[i].name === requiredItem) {
                            hasRequiredItem = true;
                            break;
                        }
                    }
                }
            }
            else hasRequiredItem = true;

            if (puzzle.solved || hasRequiredItem) requirementsMet = true;

            // Puzzle is solvable.
            if (requirementsMet) {
                if (puzzle.type === "password") {
                    if (puzzle.solved) puzzle.alreadySolved(game, this, `${this.displayName} uses the ${puzzle.name}.`);
                    else {
                        if (password === "") return "you need to enter a password.";
                        else if (password === puzzle.solution) puzzle.solve(bot, game, this, `${this.displayName} uses the ${puzzle.name}.`, true);
                        else puzzle.fail(game, this, `${this.displayName} uses the ${puzzle.name}.`);
                    }
                }
                else if (puzzle.type === "interact") {
                    if (puzzle.solved) puzzle.alreadySolved(game, this, `${this.displayName} uses the ${puzzle.name}.`);
                    else puzzle.solve(bot, game, this, `${this.displayName} uses the ${puzzle.name}.`, true);
                }
                else if (puzzle.type === "toggle") {
                    if (puzzle.solved) {
                        let message = null;
                        if (puzzle.alreadySolvedDescription) message = parser.parseDescription(puzzle.alreadySolvedDescription, puzzle, this);
                        puzzle.unsolve(bot, game, this, `${this.displayName} uses the ${puzzle.name}.`, message, true);
                    }
                    else puzzle.solve(bot, game, this, `${this.displayName} uses the ${puzzle.name}.`, true);
                }
                else if (puzzle.type === "combination lock") {
                    // The lock is currently unlocked.
                    if (puzzle.solved) {
                        if (command === "unlock") return `${puzzle.parentObject.name} is already unlocked.`;
                        if (command !== "lock" && (password === "" || password === puzzle.solution))
                            puzzle.alreadySolved(game, this, `${this.displayName} opens the ${puzzle.parentObject.name}.`);
                        // If the player enters something that isn't the solution, lock it.
                        else puzzle.unsolve(bot, game, this, `${this.displayName} locks the ${puzzle.parentObject.name}.`, `You lock the ${puzzle.parentObject.name}.`, true);
                    }
                    // The lock is locked.
                    else {
                        if (command === "lock") return `${puzzle.parentObject.name} is already locked.`;
                        if (password === "") return "you need to enter a combination. The format is #-#-#.";
                        else if (password === puzzle.solution) puzzle.solve(bot, game, this, `${this.displayName} unlocks the ${puzzle.parentObject.name}.`, true);
                        else puzzle.fail(game, this, `${this.displayName} attempts and fails to unlock the ${puzzle.parentObject.name}.`);
                    }
                }
                else if (puzzle.type === "key lock") {
                    // The lock is currently unlocked.
                    if (puzzle.solved) {
                        if (command === "unlock") return `${puzzle.parentObject.name} is already unlocked.`;
                        if (command === "lock" && hasRequiredItem) puzzle.unsolve(bot, game, this, `${this.displayName} locks the ${puzzle.parentObject.name}.`, `You lock the ${puzzle.parentObject.name}.`, true);
                        else if (command === "lock") puzzle.requirementsNotMet(game, this, `${this.displayName} attempts and fails to lock the ${puzzle.parentObject.name}.`);
                        else puzzle.alreadySolved(game, this, `${this.displayName} opens the ${puzzle.parentObject.name}.`);
                    }
                    // The lock is locked.
                    else {
                        if (command === "lock") return `${puzzle.parentObject.name} is already locked.`;
                        puzzle.solve(bot, game, this, `${this.displayName} unlocks the ${puzzle.parentObject.name}.`, true);
                    }
                }
            }
            // The player is missing an item needed to solve the puzzle.
            else return puzzle.requirementsNotMet(game, this, `${this.displayName} attempts to use the ${puzzle.name}, but struggles.`, misc);
        }
        // The puzzle isn't accessible.
        else return puzzle.requirementsNotMet(game, this, `${this.displayName} uses the ${puzzle.name}.`, misc);

        return;
    }

    die(game) {
        // Remove player from their current channel.
        this.location.leaveChannel(this);
        this.removeFromWhispers(game, `${this.displayName} dies.`);
        if (!this.hasAttribute("hidden")) {
            new Narration(game, this, this.location, `${this.displayName} dies.`).send();
        }

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.logChannel.send(`${time} - ${this.name} died in ${this.location.channel}`);

        // Update various data.
        this.alive = false;
        this.location = null;
        this.hidingSpot = "";
        for (let i = 0; i < this.status.length; i++)
            clearInterval(this.status[i].timer);
        this.status.length = 0;
        // Update that data on the sheet, as well.
        game.queue.push(new QueueEntry(Date.now(), "updateRow", this.playerCells(), `Players!|${this.name}`, new Array(this.id, this.name, this.talent, this.strength, this.intelligence, this.dexterity, this.speed, this.maxStamina, this.alive, "", "", "")));

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

    sendDescription(description, container) {
        if (description)
            this.member.send(parser.parseDescription(description, container, this));
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

// This function is needed solely to compare the effects and cures of two items.
function arraysEqual(a, b) {
    a = a.map(object => object.name);
    b = b.map(object => object.name);
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (a.length !== b.length) return false;

    // Make copies before sorting both arrays so as not to modify the original arrays.
    let c = a.slice(), d = b.slice();
    c.sort();
    d.sort();

    // Now check if both have the same elements.
    for (let i = 0; i < c.length; i++) {
        if (c[i] !== d[i]) return false;
    }
    return true;
}
