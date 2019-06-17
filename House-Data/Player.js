const settings = require("../settings.json");
const sheets = require('./sheets.js');
const parser = require('./parser.js');
const loader = require('./loader.js');

const Room = require('./Room.js');
const Object = require('./Object.js');
const Puzzle = require('./Puzzle.js');
const InventoryItem = require('./InventoryItem.js');
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

    inflict(game, statusName, notify, updateSheet, narrate) {
        if (this.statusString.includes(statusName)) return "Specified player already has that status effect.";

        var status = null;
        for (let i = 0; i < game.statusEffects.length; i++) {
            if (game.statusEffects[i].name.toLowerCase() === statusName.toLowerCase()) {
                status = game.statusEffects[i];
                break;
            }
        }
        if (!status) return `Couldn't find status effect "${statusName}".`;

        if (status.cures !== "") {
            for (let i = 0; i < status.cures.length; i++)
                this.cure(game, status.cures[i], false, false, false, false);
        }

        if (notify === null || notify === undefined) notify = true;
        if (updateSheet === null || updateSheet === undefined) updateSheet = true;
        if (narrate === null || narrate === undefined) narrate = true;

        // Apply the effects of any attributes that require immediate action.
        if (status.attributes.includes("no channel")) {
            this.location.leaveChannel(this);
            this.removeFromWhispers(game, `${this.name} can no longer whisper because they are ${status.name}.`);
        }
        if (status.attributes.includes("no speech")) game.mutedPlayers.push(this);
        if (status.attributes.includes("no hearing")) {
            game.deafenedPlayers.push(this);
            this.removeFromWhispers(game, `${this.displayName} can no longer hear.`);
        }
        if (status.attributes.includes("hear room")) game.hearingPlayers.push(this);
        if (status.attributes.includes("acute hearing")) game.acuteHearingPlayers.push(this);
        if (status.attributes.includes("hidden")) {
            game.hiddenPlayers.push(this);
            if (narrate) new Narration(game, this, this.location, `${this.displayName} hides in the ${this.hidingSpot}.`).send();
            sheets.updateCell(this.hidingSpotCell(), this.hidingSpot);
        }
        if (status.attributes.includes("concealed")) {
            if (!this.hasAttribute("hidden") && narrate) new Narration(game, this, this.location, `${this.displayName} puts on a mask.`).send();
            this.displayName = "A masked figure";
            game.concealedPlayers.push(this);
        }

        const Status = require('./Status.js');
        status = new Status(status.name, status.duration, status.fatal, status.cure, status.nextStage, status.curedCondition, status.rollModifier, status.modifiesSelf, status.attributes, status.row);

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
                        player.inflict(game, status.nextStage.name, true, true, true);
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
        if (notify) {
            let player = this;
            sheets.getData(status.inflictedCell(), function (response) {
                if (response.data.values)
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
            if (narrate) new Narration(game, this, this.location, `${this.displayName} comes out of the ${this.hidingSpot}.`).send();
            this.hidingSpot = "";
            sheets.updateCell(this.hidingSpotCell(), " ");
        }
        if (status.attributes.includes("concealed")) {
            game.concealedPlayers.splice(game.concealedPlayers.indexOf(this), 1);
            this.displayName = this.name;
            if (narrate) new Narration(game, this, this.location, `The mask comes off, revealing the figure to be ${this.displayName}.`).send();
        }

        var returnMessage = "Successfully removed status effect.";
        if (status.curedCondition && doCuredCondition) {
            this.inflict(game, status.curedCondition.name, false, true, true);
            returnMessage += ` Player is now ${status.curedCondition.name}.`;
        }

        // Inform player what happened.
        if (notify) {
            let player = this;
            sheets.getData(status.curedCell(), function (response) {
                if (response.data.values)
                    player.member.send(response.data.values[0][0]);
            });
            // If the player is waking up, send them the description of the room they wake up in.
            if (status.name === "asleep") {
                sheets.getData(this.location.parsedDescriptionCell(), function (response) {
                    player.member.send(response.data.values[0][0]);
                });
            }
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

    use(game, item) {
        if (item.uses === 0) return "that item has no uses left.";
        if (item.effects.length === 0 && item.cures.length === 0) return "that item has no programmed use on its own, but you may be able to use it some other way.";
        if (item.name !== "MASK" && item.effects.length !== 0) {
            for (let i = 0; i < item.effects.length; i++) {
                if (this.statusString.includes(item.effects[i]))
                    return "you cannot use that item as you are already under its effect.";
            }
        }

        if (item.effects.length !== 0) {
            if (item.name === "MASK" && this.statusString.includes("concealed"))
                this.cure(game, "concealed", true, false, true, true);
            else {
                // If the item inflicts multiple status effects, don't update the spreadsheet until inflicting the last one.
                for (let i = 0; i < item.effects.length - 1; i++)
                    this.inflict(game, item.effects[i], true, false, true);
                this.inflict(game, item.effects[item.effects.length - 1], true, true, true);
            }
        }

        if (item.cures.length !== 0) {
            var hasEffect = false;
            // If the item cures multiple status effects, don't update the spreadsheet until curing the last one.
            for (let i = 0; i < item.cures.length; i++) {
                const statusMessage = this.cure(game, item.cures[i], true, true, true, true);
                if (statusMessage !== "Specified player doesn't have that status effect.") hasEffect = true;
            }
            if (!hasEffect) return `you attempted to use the ${item.name}, but it had no effect.`;
        }

        if (!isNaN(item.uses)) {
            item.uses--;
            sheets.updateCell(item.usesCell(), item.uses.toString());
        }
        if (item.name !== "MASK")
            new Narration(game, this, this.location, `${this.displayName} takes out ${item.singleContainingPhrase} and uses it.`).send();

        return;
    }

    async take(game, item, slotNo, container) {
        // Reduce quantity if the quantity is finite.
        if (!isNaN(item.quantity)) {
            item.quantity--;
            sheets.updateCell(item.quantityCell(), item.quantity.toString());
        }

        if (container instanceof Puzzle) {
            const description = await sheets.fetchDescription(container.formattedAlreadySolvedCell());
            const newDescription = parser.removeItem(description, item);
            sheets.updateCell(container.formattedAlreadySolvedCell(), newDescription[0]);
            sheets.updateCell(container.parsedAlreadySolvedCell(), newDescription[1]);
        }
        else if (container instanceof Object) {
            const description = await sheets.fetchDescription(container.formattedDescriptionCell());
            const newDescription = parser.removeItem(description, item);
            sheets.updateCell(container.formattedDescriptionCell(), newDescription[0]);
            sheets.updateCell(container.parsedDescriptionCell(), newDescription[1]);
        }
        else if (container instanceof Room) {
            for (let i = 0; i < container.exit.length; i++) {
                const description = await sheets.fetchDescription(container.exit[i].formattedDescriptionCell());
                const newDescription = parser.removeItem(description, item);
                sheets.updateCell(container.exit[i].formattedDescriptionCell(), newDescription[0]);
                sheets.updateCell(container.exit[i].parsedDescriptionCell(), newDescription[1]);
            }
        }

        // Make a copy of the item and put it in the player's inventory.
        const createdItem = new InventoryItem(
            item.name,
            item.pluralName,
            item.uses,
            item.discreet,
            item.effects,
            item.cures,
            item.singleContainingPhrase,
            item.pluralContainingPhrase,
            this.inventory[slotNo].row
        );
        this.inventory[slotNo] = createdItem;
        this.member.send(`You took ${createdItem.singleContainingPhrase}.`);

        // Add the new item to the Players sheet so that it's in their inventory.
        // First, concatenate the effects, cures, and containing phrases so they're formatted properly on the spreadsheet.
        var effects = createdItem.effects ? createdItem.effects.join(",") : "";
        var cures = createdItem.cures ? createdItem.cures.join(",") : "";
        var containingPhrase = createdItem.singleContainingPhrase;
        if (createdItem.pluralContainingPhrase !== "") containingPhrase += `,${createdItem.pluralContainingPhrase}`;
        sheets.getData(item.descriptionCell(), function (response) {
            const data = new Array(new Array(
                createdItem.name,
                createdItem.pluralName,
                createdItem.uses,
                createdItem.discreet,
                effects,
                cures,
                containingPhrase,
                response.data.values[0][0]
            ));
            sheets.updateData(createdItem.itemCells(), data);
        });

        if (!createdItem.discreet) new Narration(game, this, this.location, `${this.displayName} takes ${createdItem.singleContainingPhrase}.`).send();

        return;
    }

    async drop(game, slotNo, container) {
        // First, check if the player is putting this item back in original spot unmodified.
        const invItem = this.inventory[slotNo];
        const roomItems = game.items.filter(item => item.location === this.location.name);
        var matchedItems = roomItems.filter(item =>
            item.name === invItem.name &&
            item.pluralName === invItem.pluralName &&
            item.location === this.location.name &&
            ((container instanceof Object && item.sublocation === container.name) || (container instanceof Puzzle && item.sublocation === "")) &&
            ((container instanceof Puzzle && item.requires === container.name) || (container instanceof Object && item.requires === "")) &&
            (item.uses === invItem.uses || (isNaN(item.uses) && isNaN(invItem.uses))) &&
            item.discreet === invItem.discreet &&
            arraysEqual(item.effects, invItem.effects) &&
            arraysEqual(item.cures, invItem.cures) &&
            item.singleContainingPhrase === invItem.singleContainingPhrase &&
            item.pluralContainingPhrase === invItem.pluralContainingPhrase
        );
        
        // Now that the list of items to check is significantly smaller,
        // check if the descriptions are the same.
        const invItemDescription = await sheets.fetchDescription(invItem.descriptionCell());
        for (let i = 0; i < matchedItems.length; i++) {
            const item = matchedItems[i];
            const itemDescription = await sheets.fetchDescription(item.descriptionCell());
            if (itemDescription !== invItemDescription) {
                matchedItems.splice(i, 1);
                i--;
            }
        }
        // The player is putting this item somewhere else, or it's changed somehow.
        if (matchedItems.length === 0) {
            var effects = invItem.effects ? invItem.effects.join(",") : "";
            var cures = invItem.cures ? invItem.cures.join(",") : "";
            var containingPhrase = invItem.singleContainingPhrase;
            if (invItem.pluralContainingPhrase !== "") containingPhrase += `,${invItem.pluralContainingPhrase}`;
            const data = new Array(
                invItem.name,
                invItem.pluralName,
                this.location.name,
                container instanceof Object ? container.name : "",
                container instanceof Puzzle ? `=${container.solvedCell()}` : "TRUE",
                container instanceof Puzzle ? container.name : "",
                "1",
                !isNaN(invItem.uses) ? invItem.uses : "",
                invItem.discreet ? "TRUE" : "FALSE",
                effects,
                cures,
                containingPhrase,
                invItemDescription
            );

            // We want to insert this item near items in the same container, so get all of the items in that container.
            var containerItems;
            if (container instanceof Puzzle) containerItems = roomItems.filter(item => item.requires === container.name);
            else containerItems = roomItems.filter(item => item.sublocation === container.name);
            // If the list of items in that container isn't empty and isn't the last row of the spreadsheet, insert the new item.
            const lastRoomItem = roomItems[roomItems.length - 1];
            const lastContainerItem = containerItems[containerItems.length - 1];
            const lastGameItem = game.items[game.items.length - 1];
            if (containerItems.length !== 0 && lastContainerItem.row !== lastGameItem.row) {
                sheets.insertRow(lastContainerItem.itemCells(), data, function (response) {
                    loader.loadItems(game);
                });
            }
            // If there are none, it might just be that there are no items in that container yet. Try to at least put it near items in the same room.
            else if (roomItems.length !== 0 && lastRoomItem.row !== lastGameItem.row) {
                sheets.insertRow(lastRoomItem.itemCells(), data, function (response) {
                    loader.loadItems(game);
                });
            }
            // If there are none, just insert it at the end of the sheet.
            else {
                sheets.appendRow(lastGameItem.itemCells(), data, function (response) {
                    loader.loadItems(game);
                });
            }
        }
        // The player is putting the item back.
        else {
            var item = matchedItems[0];
            // Increase the quantity if the quantity is finite.
            if (!isNaN(item.quantity)) {
                item.quantity++;
                sheets.updateCell(item.quantityCell(), item.quantity.toString());
            }
        }

        var formattedDescriptionCell = "";
        var parsedDescriptionCell = "";
        var objectName = "";
        var preposition = "in";
        if (container instanceof Puzzle) {
            formattedDescriptionCell = container.formattedAlreadySolvedCell();
            parsedDescriptionCell = container.parsedAlreadySolvedCell();
            let object = game.objects.find(object => object.name === container.parentObject && object.requires === container.name);
            objectName = object.name;
            preposition = object.preposition;
        }
        else {
            formattedDescriptionCell = container.formattedDescriptionCell();
            parsedDescriptionCell = container.parsedDescriptionCell();
            objectName = container.name;
            preposition = container.preposition;
        }

        const description = await sheets.fetchDescription(formattedDescriptionCell);
        const newDescription = parser.addItem(description, invItem);
        sheets.updateCell(formattedDescriptionCell, newDescription[0]);
        sheets.updateCell(parsedDescriptionCell, newDescription[1]);

        if (!invItem.discreet) new Narration(game, this, this.location, `${this.displayName} puts ${invItem.singleContainingPhrase} ${preposition} the ${objectName}.`).send();
        this.member.send(`You discarded ${invItem.singleContainingPhrase}.`);

        if (invItem.name === "MASK" && this.statusString.includes("concealed")) {
            this.cure(game, "concealed", true, false, true, true);
        }

        this.clearInventorySlot(slotNo);
        
        return;
    }

    clearInventorySlot(slotNo) {
        this.inventory[slotNo] = new InventoryItem(
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            this.inventory[slotNo].row
        );
        sheets.updateData(this.inventory[slotNo].itemCells(), new Array(settings.emptyInventoryItem));
        return;
    }

    viewInventory(possessive) {
        var itemString = `${possessive} inventory: \n`;
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i].name !== null) itemString += `[${this.inventory[i].name}] `;
            else itemString += `[ ] `;
        }
        return itemString;
    }

    attemptPuzzle(bot, game, puzzle, item, password, command, misc) {
        if (puzzle.accessible) {
            if (puzzle.requiresMod && !puzzle.solved) return "you need moderator assistance to do that.";
            if (puzzle.remainingAttempts === 0) {
                let player = this;
                sheets.getData(puzzle.noMoreAttemptsCell(), function (response) {
                    player.member.send(response.data.values[0][0]);
                });
                new Narration(game, this, this.location, `${this.displayName} attempts and fails to use the ${puzzle.name}.`).send();

                return;
            }

            // Make sure all of the requirements are met before proceeding.
            var hasRequiredItem = false;
            var requirementsMet = false;
            if (puzzle.requires.startsWith("Item: ")) {
                if (item !== null && item.name === puzzle.requires.substring("Item: ".length))
                    hasRequiredItem = true;
                else if (item === null) {
                    const requiredItem = puzzle.requires.substring("Item: ".length);
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
                        else if (password === puzzle.solution) puzzle.solve(bot, game, this, `${this.displayName} uses the ${puzzle.name}.`);
                        else puzzle.fail(game, this, `${this.displayName} uses the ${puzzle.name}.`);
                    }
                }
                else if (puzzle.type === "interact") {
                    if (puzzle.solved) puzzle.alreadySolved(game, this, `${this.displayName} uses the ${puzzle.name}.`);
                    else puzzle.solve(bot, game, this, `${this.displayName} uses the ${puzzle.name}.`);
                }
                else if (puzzle.type === "combination lock") {
                    // The lock is currently unlocked.
                    if (puzzle.solved) {
                        if (command === "unlock") return `${puzzle.parentObject} is already unlocked.`;
                        if (command !== "lock" && (password === "" || password === puzzle.solution))
                            puzzle.alreadySolved(game, this, `${this.displayName} opens the ${puzzle.parentObject}.`);
                        // If the player enters something that isn't the solution, lock it.
                        else puzzle.unsolve(bot, game, this, `${this.displayName} locks the ${puzzle.parentObject}.`, `You lock the ${puzzle.parentObject}.`);
                    }
                    // The lock is locked.
                    else {
                        if (command === "lock") return `${puzzle.parentObject} is already locked.`;
                        if (password === "") return "you need to enter a combination. The format is #-#-#.";
                        else if (password === puzzle.solution) puzzle.solve(bot, game, this, `${this.displayName} unlocks the ${puzzle.parentObject}.`);
                        else puzzle.fail(game, this, `${this.displayName} attempts and fails to unlock the ${puzzle.parentObject}.`);
                    }
                }
                else if (puzzle.type === "key lock") {
                    // The lock is currently unlocked.
                    if (puzzle.solved) {
                        if (command === "unlock") return `${puzzle.parentObject} is already unlocked.`;
                        if (command === "lock" && hasRequiredItem) puzzle.unsolve(bot, game, this, `${this.displayName} locks the ${puzzle.parentObject}.`, `You lock the ${puzzle.parentObject}.`);
                        else if (command === "lock") puzzle.requirementsNotMet(game, this, `${this.displayName} attempts to use the ${puzzle.name}, but struggles.`);
                        else puzzle.alreadySolved(game, this, `${this.displayName} opens the ${puzzle.parentObject}.`);
                    }
                    // The lock is locked.
                    else {
                        if (command === "lock") return `${puzzle.parentObject} is already locked.`;
                        puzzle.solve(bot, game, this, `${this.displayName} unlocks the ${puzzle.parentObject}.`);
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
