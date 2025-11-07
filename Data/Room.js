const constants = include('Configs/constants.json');
const Narration = include(`${constants.dataDir}/Narration.js`);
const {TextChannel} = require('discord.js');

/**
 * @class Room
 * @classdesc Represents a room in the game.
 * @param {string} name - The name of the room.
 * @param {TextChannel} channel - The channel associated with the room.
 * @param {string[]} tags - The tags associated with the room.
 * @param {string} iconURL - The URL of the icon associated with the room.
 * @param {Exit[]} exit - The exits of the room.
 * @param {string} description - The description of the room.
 * @param {number} row - The row number of the room in the sheet.
 */
class Room {
    /**
     * @param {string} name - The name of the room.
     * @param {TextChannel} channel - The channel associated with the room.
     * @param {string[]} tags - The tags associated with the room.
     * @param {string} iconURL - The URL of the icon associated with the room.
     * @param {Exit[]} exit - The exits of the room.
     * @param {string} description - The description of the room.
     * @param {number} row - The row number of the room in the sheet.
     */
    constructor(name, channel, tags, iconURL, exit, description, row) {
        /** @type {string} */
        this.name = name;
        /** @type {TextChannel} */
        this.channel = channel;
        /** @type {string[]} */
        this.tags = tags;
        /** @type {string} */
        this.iconURL = iconURL;
        /** @type {Exit[]} */
        this.exit = exit;
        /** @type {string} */
        this.description = description;
        /** @type {number} */
        this.row = row;

        /** @type {Player[]} */
        this.occupants = new Array();
        /** @type {string} */
        this.occupantsString = "";
    }

    /**
     * Adds a player to the room.
     * @param game
     * @param {Player} player
     * @param {Exit} entrance
     * @param {string} entranceMessage
     * @param {boolean} sendDescription
     */
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
            /** @type {{x: number, y: number, z: number}} */
            let coordSum = {x: 0, y: 0, z: 0};
            for (let i = 0; i < this.exit.length; i++) {
                coordSum.x += this.exit[i].pos.x;
                coordSum.y += this.exit[i].pos.y;
                coordSum.z += this.exit[i].pos.z;
            }
            /** @type {{x: number, y: number, z: number}} */
            let pos = {x: 0, y: 0, z: 0};
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

    /**
     * Removes a player from the room.
     * @param game
     * @param {Player} player
     * @param {Exit} exit
     * @param {string} exitMessage
     */
    removePlayer(game, player, exit, exitMessage) {
        if (exitMessage) new Narration(game, player, this, exitMessage).send();
        this.leaveChannel(player);
        this.occupants.splice(this.occupants.indexOf(player), 1);
        this.occupantsString = this.generate_occupantsString(this.occupants.filter(occupant => !occupant.hasAttribute("hidden")));
        player.removeFromWhispers(game, `${player.displayName} leaves the room.`);
    }

    /**
     * Generates a string representing the occupants of the room.
     * @param {Player[]} list
     * @returns {string}
     */
    generate_occupantsString(list) {
        list.sort(function (a, b) {
            let nameA = a.displayName.toLowerCase();
            let nameB = b.displayName.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });
        let occupantsString = "";
        if (list.length === 1) occupantsString = list[0].displayName;
        else if (list.length === 2) occupantsString = `${list[0].displayName} and ${list[1].displayName}`;
        else if (list.length >= 3) {
            for (let i = 0; i < list.length - 1; i++)
                occupantsString += `${list[i].displayName}, `;
            occupantsString += `and ${list[list.length - 1].displayName}`;
        }
        return occupantsString;
    }

    /**
     * Gives player permission to view the room's channel.
     * @param {Player} player
     */
    joinChannel(player) {
        if (player.talent !== "NPC") this.channel.permissionOverwrites.create(player.member, {ViewChannel: true});
    }

    /**
     * Removes player's permission to view the room's channel.
     * @param {Player} player
     */
    leaveChannel(player) {
        if (player.talent !== "NPC") this.channel.permissionOverwrites.create(player.member, {ViewChannel: null});
    }

    /**
     * Unlocks an exit in the room.
     * @param game
     * @param {number} index
     */
    unlock(game, index) {
        this.exit[index].unlock();
        if (this.occupants.length > 0) new Narration(game, null, this, `${this.exit[index].name} unlocks.`).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${this.exit[index].name} in ${this.channel} was unlocked.`);
    }

    /**
     * Locks an exit in the room.
     * @param game
     * @param {number} index
     */
    lock(game, index) {
        this.exit[index].lock();
        if (this.occupants.length > 0) new Narration(game, null, this, `${this.exit[index].name} locks.`).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        game.messageHandler.addLogMessage(game.logChannel, `${time} - ${this.exit[index].name} in ${this.channel} was locked.`);
    }

    /** @returns {string} */
    descriptionCell() {
        return constants.roomSheetDescriptionColumn + this.row;
    }
}

module.exports = Room;
