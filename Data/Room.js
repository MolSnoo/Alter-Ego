import constants from '../Configs/constants.json' with { type: 'json' };
import Narration from '../Data/Narration.js';

export default class Room {
    constructor(name, channel, tags, iconURL, exit, description, row) {
        this.name = name;
        this.channel = channel;
        this.tags = tags;
        this.iconURL = iconURL;
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
                player.notify(game, "Fumbling against the wall, you make your way to the next room over.");
            else {
                let description;
                if (entrance) description = entrance.description;
                else description = this.description;
                // Send the room description of the entrance the player enters from.
                player.sendDescription(game, description, this);
            }
        }

        this.occupants.push(player);
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
        list.sort(function (a, b) {
            var nameA = a.displayName.toLowerCase();
            var nameB = b.displayName.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
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
        if (player.talent !== "NPC") this.channel.permissionOverwrites.create(player.member, { ViewChannel: true });
    }

    leaveChannel(player) {
        if (player.talent !== "NPC") this.channel.permissionOverwrites.create(player.member, { ViewChannel: null });
    }

    unlock(game, index) {
        this.exit[index].unlock();
        if (this.occupants.length > 0) new Narration(game, null, this, `${this.exit[index].name} unlocks.`).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${this.exit[index].name} in ${this.channel} was unlocked.`);
    }

    lock(game, index) {
        this.exit[index].lock();
        if (this.occupants.length > 0) new Narration(game, null, this, `${this.exit[index].name} locks.`).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${this.exit[index].name} in ${this.channel} was locked.`);
    }

    descriptionCell() {
        return constants.roomSheetDescriptionColumn + this.row;
    }
}
