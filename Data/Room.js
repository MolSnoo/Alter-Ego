import Exit from './Exit.js';
import Game from './Game.js';
import GameEntity from './GameEntity.js';
import Narration from '../Data/Narration.js';
import Player from './Player.js';
import { addLogMessage } from '../Modules/messageHandler.js';
import { TextChannel } from 'discord.js';

/**
 * @class Room
 * @classdesc Represents a room in the game.
 * @extends GameEntity
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/room.html
 */
export default class Room extends GameEntity {
    /**
     * The unique ID of the room.
     * @type {string}
     */
    id;
    /**
     * The name of the room. Deprecated. Use `id` instead.
     * @deprecated
     * @type {string}
     */
    name;
    /**
     * The channel associated with the room.
     * @type {TextChannel}
     */
    channel;
    /**
     * The tags associated with the room.
     * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/room.html#tags
     * @type {string[]}
     */
    tags;
    /**
     * The URL of the icon associated with the room.
     * @type {string}
     */
    iconURL;
    /**
     * The exits of the room.
     * @type {Exit[]}
     */
    exit;
    /**
     * The default description of the room for when a player enters from the first listed exit or inspects the room.
     * @type {string}
     */
    description;
    /**
     * An array of all players currently in the room.
     * @type {Player[]}
     */
    occupants;
    /**
     * A list of all players currently in the room, listed by their displayNames in alphabetical order.
     * Players with the `hidden` behavior attribute are omitted.
     * @type {string}
     */
    occupantsString;

    /**
     * @constructor
     * @param {string} id - The unique ID of the room.
     * @param {TextChannel} channel - The channel associated with the room.
     * @param {string[]} tags - The tags associated with the room. {@link https://molsnoo.github.io/Alter-Ego/reference/data_structures/room.html#tags}
     * @param {string} iconURL - The URL of the icon associated with the room.
     * @param {Exit[]} exit - The exits of the room.
     * @param {string} description - The default description of the room for when a player enters from the first listed exit or inspects the room.
     * @param {number} row - The row number of the room in the sheet.
     * @param {Game} game - The game this belongs to.
     */
    constructor(id, channel, tags, iconURL, exit, description, row, game) {
        super(game, row);
        this.id = id;
        this.name = id;
        this.channel = channel;
        this.tags = tags;
        this.iconURL = iconURL;
        this.exit = exit;
        this.description = description;

         /** @type {Player[]} */
        this.occupants = [];
        this.occupantsString = "";
    }

    /**
     * Adds a player to the room.
     * @param {Player} player - The player to add to the room.
     * @param {Exit} entrance - The exit they're entering from.
     * @param {string} entranceMessage - The message that should be narrated in the room when they enter.
     * @param {boolean} sendDescription - Whether or not to send the player the room description.
     */
    addPlayer(player, entrance, entranceMessage, sendDescription) {
        player.location = this;
        // Set the player's position.
        if (entrance) {
            player.pos.x = entrance.pos.x;
            player.pos.y = entrance.pos.y;
            player.pos.z = entrance.pos.z;
        }
        // If no entrance is given, try to calculate the center of the room by averaging the coordinates of all exits.
        else {
            /** @type {Pos} */
            let coordSum = { x: 0, y: 0, z: 0 };
            for (let i = 0; i < this.exit.length; i++) {
                coordSum.x += this.exit[i].pos.x;
                coordSum.y += this.exit[i].pos.y;
                coordSum.z += this.exit[i].pos.z;
            }
            /** @type {Pos} */
            let pos = { x: 0, y: 0, z: 0 };
            pos.x = Math.floor(coordSum.x / this.exit.length);
            pos.y = Math.floor(coordSum.y / this.exit.length);
            pos.z = Math.floor(coordSum.z / this.exit.length);
            player.pos = pos;
        }
        if (entranceMessage) new Narration(this.game, player, this, entranceMessage).send();
        
        if (player.getAttributeStatusEffects("no channel").length === 0)  
            this.joinChannel(player);

        if (sendDescription) {
            if (player.hasAttribute("no sight"))
                player.notify("Fumbling against the wall, you make your way to the next room over.");
            else {
                let description;
                if (entrance) description = entrance.description;
                else description = this.description;
                // Send the room description of the entrance the player enters from.
                player.sendDescription(description, this);
            }
        }

        this.occupants.push(player);
        this.occupantsString = this.generate_occupantsString(this.occupants.filter(occupant => !occupant.hasAttribute("hidden")));
    }

    /**
     * Removes a player from the room.
     * @param {Player} player - The player to remove from the room.
     * @param {Exit} exit - The exit they're leaving through.
     * @param {string} exitMessage - The message that should be narrated in the room when they leave.
     */
    removePlayer(player, exit, exitMessage) {
        if (exitMessage) new Narration(this.game, player, this, exitMessage).send();
        this.leaveChannel(player);
        this.occupants.splice(this.occupants.indexOf(player), 1);
        this.occupantsString = this.generate_occupantsString(this.occupants.filter(occupant => !occupant.hasAttribute("hidden")));
        player.removeFromWhispers(`${player.displayName} leaves the room.`);
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
        if (player.title !== "NPC") this.channel.permissionOverwrites.create(player.member, { ViewChannel: true });
    }

    /**
     * Removes player's permission to view the room's channel.
     * @param {Player} player
     */
    leaveChannel(player) {
        if (player.title !== "NPC") this.channel.permissionOverwrites.create(player.member, { ViewChannel: null });
    }

    /**
     * Unlocks an exit in the room.
     * @param {number} index - The exit's index within the room's array of exits.
     */
    unlock(index) {
        this.exit[index].unlock();
        if (this.occupants.length > 0) new Narration(this.game, null, this, `${this.exit[index].name} unlocks.`).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(this.game.guildContext.logChannel, `${time} - ${this.exit[index].name} in ${this.channel} was unlocked.`);
    }

    /**
     * Locks an exit in the room.
     * @param {number} index - The exit's index within the room's array of exits.
     */
    lock(index) {
        this.exit[index].lock();
        if (this.occupants.length > 0) new Narration(this.game, null, this, `${this.exit[index].name} locks.`).send();

        // Post log message.
        const time = new Date().toLocaleTimeString();
        addLogMessage(this.game.guildContext.logChannel, `${time} - ${this.exit[index].name} in ${this.channel} was locked.`);
    }

    /** @returns {string} */
    descriptionCell() {
        return this.game.constants.roomSheetDescriptionColumn + this.row;
    }
}
