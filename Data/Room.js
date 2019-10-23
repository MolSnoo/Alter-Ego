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
                let descriptionCell;
                if (entrance) descriptionCell = entrance.descriptionCell();
                else descriptionCell = this.descriptionCell();
                // Send the room description of the entrance the player enters from.
                player.sendDescription(descriptionCell);
            }
        }
        if (player.hasAttribute("see occupants") && !player.hasAttribute("no sight") && this.occupants.length > 0) {
            let occupants = new Array();
            for (let i = 0; i < this.occupants.length; i++) {
                if (!this.occupants[i].hasAttribute("hidden"))
                    occupants.push(this.occupants[i]);
            }
            if (occupants.length > 0) {
                let occupantsString = occupants.map(player => player.displayName).join(", ");
                player.member.send(`Players in the room: ${occupantsString}.`);
            }
        }
        else if (!player.hasAttribute("no sight") && this.occupants.length > 0) {
            // Come up with lists of concealed and sleeping players.
            let concealedPlayers = new Array();
            let sleepingPlayers = new Array();
            for (let i = 0; i < this.occupants.length; i++) {
                if (this.occupants[i].hasAttribute("concealed") && !this.occupants[i].hasAttribute("hidden"))
                    concealedPlayers.push(this.occupants[i]);
                if (this.occupants[i].hasAttribute("unconscious") && !this.occupants[i].hasAttribute("hidden"))
                    sleepingPlayers.push(this.occupants[i]);
            }
            if (concealedPlayers.length > 0) {
                let concealedPlayersString = concealedPlayers.map(player => player.displayName).join(", ");
                player.member.send(`In this room you see: ${concealedPlayersString}.`);
            }
            if (sleepingPlayers.length > 0) {
                let sleepingPlayersString = "";
                if (sleepingPlayers.length === 1) sleepingPlayersString = `${sleepingPlayers[0].displayName} is `;
                else if (sleepingPlayers.length === 2) sleepingPlayersString = `${sleepingPlayers[0].displayName} and ${sleepingPlayers[1].displayName} are `;
                else if (sleepingPlayers.length >= 3) {
                    for (let i = 0; i < sleepingPlayers.length - 1; i++)
                        sleepingPlayersString += `${sleepingPlayers[i].displayName}, `;
                    sleepingPlayersString += `and ${sleepingPlayers[sleepingPlayers.length - 1].displayName} are `;
                }
                sleepingPlayersString += "sleeping in this room.";
                player.member.send(sleepingPlayersString);
            }
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
    }
    removePlayer(game, player, exit, exitMessage) {
        if (exitMessage) new Narration(game, player, this, exitMessage).send();
        this.leaveChannel(player);
        this.occupants.splice(this.occupants.indexOf(player), 1);
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
