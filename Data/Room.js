const settings = include('settings.json');
const QueueEntry = include(`${settings.dataDir}/QueueEntry.js`);
const Narration = include(`${settings.dataDir}/Narration.js`);

//var game = include('game.json');

class Room {
    constructor(name, channel, exit, description, row) {
        this.name = name;
        this.channel = channel;
        this.exit = exit;
        this.description = description;
        this.row = row;

        this.occupants = new Array();
        this.occupantsString = "";
    }

    addPlayer(game, player, entrance, entranceMessage, sendDescription) {
        player.location = this;
        // Set the player's position.
        if (entrance) {
            player.pos.x = entrance.pos.x;
            player.pos.y = entrance.pos.y;
            player.pos.z = entrance.pos.z;
        }
        // If no entrance is given, try to calculate the center of the room by averaging the coordinates of all exits.
        else {
            let coordSum = { x: 0, y: 0, z: 0 };
            for (let i = 0; i < this.exit.length; i++) {
                coordSum.x += this.exit[i].pos.x;
                coordSum.y += this.exit[i].pos.y;
                coordSum.z += this.exit[i].pos.z;
            }
            let pos = { x: 0, y: 0, z: 0 };
            pos.x = Math.floor(coordSum.x / this.exit.length);
            pos.y = Math.floor(coordSum.y / this.exit.length);
            pos.z = Math.floor(coordSum.z / this.exit.length);
            player.pos = pos;
        }
        if (entranceMessage) new Narration(game, player, this, entranceMessage).send();
        
        if (player.getAttributeStatusEffects("no channel").length === 0)  
            this.joinChannel(player);

        if (sendDescription) {
            if (player.hasAttribute("no sight"))
                player.member.send("Fumbling against the wall, you make your way to the next room over.");
            else {
                let description;
                if (entrance) description = entrance.description;
                else description = this.description;
                // Send the room description of the entrance the player enters from.
                player.sendDescription(description, this);
            }
        }
        if (player.hasAttribute("see occupants") && !player.hasAttribute("no sight") && this.occupants.length > 0) {
            if (this.occupantsString !== "")
                player.member.send(`You see ${this.occupantsString} in this room.`);
        }
        else if (!player.hasAttribute("no sight") && this.occupants.length > 0) {
            // Come up with lists of concealed and sleeping players.
            let concealedPlayersString = this.generate_occupantsString(this.occupants.filter(occupant => occupant.hasAttribute("concealed") && !occupant.hasAttribute("hidden")));
            if (concealedPlayersString !== "") player.member.send(`You see ${concealedPlayersString} in this room.`);
            let sleepingPlayersString = this.generate_occupantsString(this.occupants.filter(occupant => occupant.hasAttribute("unconscious") && !occupant.hasAttribute("hidden")));
            if (sleepingPlayersString !== "") player.member.send(`You see ${sleepingPlayersString} sleeping in this room.`);
        }

        // Update the player's location on the spreadsheet.
        game.queue.push(new QueueEntry(Date.now(), "updateCell", player.locationCell(), `Players!|${player.name}`, this.name));

        this.occupants.push(player);
        this.occupants.sort(function (a, b) {
            var nameA = a.name.toLowerCase();
            var nameB = b.name.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
        this.occupantsString = this.generate_occupantsString(this.occupants.filter(occupant => !occupant.hasAttribute("hidden")));
    }

    removePlayer(game, player, exit, exitMessage) {
        if (exitMessage) new Narration(game, player, this, exitMessage).send();
        this.leaveChannel(player);
        this.occupants.splice(this.occupants.indexOf(player), 1);
        this.occupantsString = this.generate_occupantsString(this.occupants.filter(occupant => !occupant.hasAttribute("hidden")));
        player.removeFromWhispers(game, `${player.displayName} leaves the room.`);
    }

    // List should be an array of Players.
    generate_occupantsString(list) {
        var occupantsString = "";
        if (list.length === 1) occupantsString = list[0].displayName;
        else if (list.length === 2) occupantsString = `${list[0].displayName} and ${list[1].displayName}`;
        else if (list.length >= 3) {
            for (let i = 0; i < list.length - 1; i++)
                occupantsString += `${list[i].displayName}, `;
            occupantsString += `and ${list[list.length - 1].displayName}`;
        }
        return occupantsString;
    }

    joinChannel(player) {
        this.channel.overwritePermissions(player.member, { VIEW_CHANNEL: true });
    }

    leaveChannel(player) {
        this.channel.overwritePermissions(player.member, { VIEW_CHANNEL: null });
    }

    unlock(game, index) {
        this.exit[index].unlock();
        if (this.occupants.length > 0) new Narration(game, null, this, `${this.exit[index].name} unlocks.`).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.logChannel.send(`${time} - ${this.exit[index].name} in ${this.channel} was unlocked.`);
    }

    lock(game, index) {
        this.exit[index].lock();
        if (this.occupants.length > 0) new Narration(game, null, this, `${this.exit[index].name} locks.`).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.logChannel.send(`${time} - ${this.exit[index].name} in ${this.channel} was locked.`);
    }

    descriptionCell() {
        return settings.roomSheetDescriptionColumn + this.row;
    }
}

module.exports = Room;
