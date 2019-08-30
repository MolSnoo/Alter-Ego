const settings = include('settings.json');
const sheets = include(`${settings.modulesDir}/sheets.js`);

const Narration = include(`${settings.dataDir}/Narration.js`);

class Room {
    constructor(name, channel, exit, row) {
        this.name = name;
        this.channel = channel;
        this.exit = exit;
        this.row = row;

        this.occupants = new Array();
        this.occupantsString = "";
    }

    addPlayer(game, player, entrance, entranceMessage, sendDescription) {
        player.location = this;
        // Set the player's position.
        if (entrance) player.pos = entrance.pos;
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
            let descriptionCell;
            if (entrance) descriptionCell = entrance.descriptionCell();
            else descriptionCell = this.descriptionCell();
            // Send the room description of the entrance the player enters from.
            player.sendDescription(descriptionCell);
        }

        // Update the player's location on the spreadsheet.
        sheets.updateCell(player.locationCell(), this.name);

        this.occupants.push(player);
        this.occupants.sort(function (a, b) {
            var nameA = a.name.toLowerCase();
            var nameB = b.name.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
        this.occupantsString = this.occupants.map(player => player.name).join(", ");
    }
    removePlayer(game, player, exit, exitMessage) {
        if (exit) {
            console.log(exit.pos);
            console.log(player.pos);
            let distance = Math.sqrt(Math.pow(exit.pos.x - player.pos.x, 2) + Math.pow(exit.pos.y - player.pos.y, 2) + Math.pow(exit.pos.z - player.pos.z, 2));
            console.log(`Distance (pixels): ${distance}`);
            distance = distance * 0.25;
            console.log(`Distance (meters): ${distance}`);
            let time = distance / 1.4;
            console.log(`Time (seconds): ${time}`);
        }
        if (exitMessage) new Narration(game, player, this, exitMessage).send();
        this.leaveChannel(player);
        this.occupants.splice(this.occupants.indexOf(player), 1);
        this.occupantsString = this.occupants.map(player => player.name).join(", ");
        player.removeFromWhispers(game, `${player.displayName} leaves the room.`);
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
