import Action from './Action.js';
import Game from './Game.js';
import GameEntity from './GameEntity.js';
import Exit from './Exit.js';
import Room from './Room.js';
import Fixture from './Fixture.js';
import Prefab from './Prefab.js';
import Recipe from './Recipe.js';
import RoomItem from './RoomItem.js';
import ItemContainer from './ItemContainer.js';
import Puzzle from './Puzzle.js';
import Event from './Event.js';
import EquipmentSlot from './EquipmentSlot.js';
import InventoryItem from './InventoryItem.js';
import InventorySlot from './InventorySlot.js';
import Status from './Status.js';
import Flag from './Flag.js';
import Narration from './Narration.js';
import Die from './Die.js';

import { parseDescription } from '../Modules/parser.js';
import { parseAndExecuteBotCommands } from '../Modules/commandHandler.js';
import * as itemManager from '../Modules/itemManager.js';
import * as messageHandler from '../Modules/messageHandler.js';

import Timer from '../Classes/Timer.js';

import { Collection, GuildMember, TextChannel } from 'discord.js';

/**
 * @class Player
 * @classdesc Represents a player in the game.
 * @extends ItemContainer
 * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/player.html
 */
export default class Player extends ItemContainer {
    /**
     * The Discord ID of the player, or the avatar URL for an NPC.
     * @type {string}
     */
    id;
    /**
     * member - The Discord member object of the player.
     * @readonly
     * @type {GuildMember | null} 
     */
    member;
    /**
     * The name of the player.
     * @type {string}
     */
    name;
    /**
     * The name that will be displayed in most public gameplay narrations in lieu of the player's actual name.
     * @type {string}
     */
    displayName;
    /**
     * An image URL that will be used as an avatar when the player's dialog is sent through a webhook. If this is not set, the member's displayAvatar will be used instead.
     * @type {string}
     */
    displayIcon;
    /**
     * A title that can be used in descriptions. If this is set to "NPC", the player will be marked as an NPC.
     * @readonly
     * @type {string}
     */
    title;
    /**
     * A title that can be used in descriptions. If this is set to "NPC", the player will be marked as an NPC. Will eventually be removed.
     * @deprecated
     * @readonly
     * @type {string}
     */
    talent;
    /**
     * Whether or not the player is an NPC.
     * @readonly
     * @type {boolean}
     */
    isNPC;
    /**
     * The player's third person personal pronouns. 
     * @see https://molsnoo.github.io/Alter-Ego/reference/data_structures/player.html#pronoun-string
     * @type {string}
     */
    pronounString;
    /**
     * The player's default pronouns.
     * @type {Pronouns}
     */
    originalPronouns;
    /**
     * The player's current pronouns. If the player is inflicted with a status effect that has the `concealed`
     * behavior attribute, this is automatically changed to they/them.
     * @type {Pronouns}
     */
    pronouns;
    /**
     * A phrase that will be used to describe the player's voice to other players when their identity is obscured in some way.
     * This should begin with "a" or "an" and end with "voice".
     * @type {string}
     */
    originalVoiceString;
    /**
     * The player's current voice string.
     * If this is the name of another player, the player's voice will be indistinguishable from theirs.
     * @type {string}
     */
    voiceString;
    /**
     * The player's default strength stat.
     * @type {number}
     */
    defaultStrength;
    /**
     * The player's current strength stat.
     * @type {number}
     */
    strength;
    /**
     * The player's default perception stat.
     * @type {number}
     */
    defaultPerception;
    /**
     * The player's current perception stat.
     * @type {number}
     */
    perception;
    /**
     * The player's default intelligence stat. Deprecated. Use defaultPerception instead.
     * @deprecated
     * @type {number}
     */
    defaultIntelligence;
    /**
     * The player's current intelligence stat. Deprecated. Use perception instead.
     * @deprecated
     * @type {number}
     */
    intelligence;
    /**
     * The player's default dexterity stat.
     * @type {number}
     */
    defaultDexterity;
    /**
     * The player's current dexterity stat.
     * @type {number}
     */
    dexterity;
    /**
     * The player's default speed stat.
     * @type {number}
     */
    defaultSpeed;
    /**
     * The player's current speed stat.
     * @type {number}
     */
    speed;
    /**
     * The player's default stamina stat.
     * @type {number}
     */
    defaultStamina;
    /**
     * The player's current maximum stamina stat.
     * @type {number}
     */
    maxStamina;
    /**
     * The amount of stamina the player currently has left.
     * When this reaches 0, the player will be inflicted with the `weary` status effect.
     * @type {number}
     */
    stamina;
    /**
     * Whether the player is alive or not.
     * @type {boolean}
     */
    alive;
    /**
     * The display name of the room the player was loaded into.
     * @type {string}
     */
    locationDisplayName;
    /**
     * The room the player is currently in.
     * @type {Room}
     */
    location;
    /**
     * The player's current position in 3D space.
     * @type {Pos}
     */
    pos;
    /**
     * The name of the fixture the player is currently hiding in. The fixture doesn't actually have to exist.
     * @type {string}
     */
    hidingSpot;
    /**
     * A list of the names of all status effects the player currently has, including those that aren't visible.
     * Also contains a string representation of the {@link Status.remaining|remaining time} of each status.
     * @type {StatusDisplay[]}
     */
    statusDisplays;
    /**
     * All status effects the player currently has.
     * Every time a status is inflicted or cured, the player's stats are recalculated.
     * Deprecated. Use statusCollection instead.
     * @type {Status[]}
     * @deprecated
     */
    status;
    /**
     * A comma-separated list of the names of all status effects the player currently has, including those that aren't visible.
     * Also contains a string representation of the {@link Status.remaining|remaining time} of the status.
     * Deprecated. Use statusDisplays instead.
     * @deprecated
     * @type {string}
     */
    statusString;
    /**
     * All status effects the player currently has as a collection.
     * Every time a status is inflicted or cured, the player's stats are recalculated.
     * @type {Collection<string, Status>}
     */
    statusCollection;
    /**
     * All of the player's {@link EquipmentSlot | equipment slots}. Deprecated. Use inventoryCollection instead.
     * @deprecated
     * @type {EquipmentSlot[]}
     */
    inventory;
    /**
     * All of the player's {@link EquipmentSlot | equipment slots}. The key is the equipment slot's ID.
     * @type {Collection<string, EquipmentSlot>}
     */
    inventoryCollection;
    /**
     * The spectate channel of the player.
     * @type {TextChannel | null}
     */
    spectateChannel;
    /**
     * The maximum weight of inventory items that the player can carry in kilograms.
     * @type {number}
     */
    maxCarryWeight;
    /**
     * The combined weight of all inventory items the player is currently carrying.
     * @type {number}
     */
    carryWeight;
    /**
     * Whether the player is currently moving or not.
     * @type {boolean}
     */
    isMoving;
    /**
     * A timeout that updates the player's position and stamina every 100 milliseconds while the player is moving.
     * @type {NodeJS.Timeout | null}
     */
    moveTimer;
    /**
     * How many milliseconds until the player is done moving to the exit they're currently moving to.
     * @type {number}
     */
    remainingTime;
    /**
     * A list of all movements the player wishes to make in sequential order.
     * When the player finishes moving to one destination, they will begin moving to the next one in the queue, if it exists.
     * @type {string[]}
     */
    moveQueue;
    /**
     * Whether or not the player has depleted half of their stamina while moving.
     * The first time they do, they will be warned that they're starting to become tired.
     * @type {boolean}
     */
    #reachedHalfStamina;
    /**
     * A timeout that regenerates the player's stamina every 30 seconds while they're not moving.
     * @type {NodeJS.Timeout}
     */
    #staminaRegenerationInterval;
    /**
     * Whether or not the player is considered online.
     * This is automatically set to `false` after 15 minutes of inactivity.
     * @type {boolean}
     */
    online;
    /**
     * A timeout that sets the player as offline after 15 minutes of inactivity.
     * @type {NodeJS.Timeout}
     */
    #onlineInterval;

    /**
     * @param {string} id - The Discord ID of the player, or the avatar URL for an NPC.
     * @param {GuildMember | null} member - The Discord member object of the player.
     * @param {string} name - The name of the player.
     * @param {string} title - The player's title.
     * @param {string} pronounString - The player's third person personal pronouns. For formatting, see {@link https://molsnoo.github.io/Alter-Ego/reference/data_structures/player.html#pronoun-string}
     * @param {string} originalVoiceString - A phrase that will be used to describe the player's voice to other players when their identity is obscured in some way. This should begin with "a" or "an" and end with "voice".
     * @param {Stats} stats - The stats of the player. For more details, see {@link https://molsnoo.github.io/Alter-Ego/reference/data_structures/player.html#stats}
     * @param {boolean} alive - Whether the player is alive or not.
     * @param {string} locationDisplayName - The display name of the room the player was loaded into.
     * @param {string} hidingSpot - The name of the fixture the player is currently hiding in. The fixture doesn't actually have to exist.
     * @param {StatusDisplay[]} statusDisplays - A list of the names of all status effects the player currently has, including those that aren't visible. Also contains a string representation of the {@link Status.remaining|remaining time} of each status.
     * @param {string} description - The description of the player. Can contain two item lists: hands and equipment.
     * @param {Collection<string, EquipmentSlot>} inventory - All of the player's {@link EquipmentSlot | equipment slots}.
     * @param {TextChannel | null} spectateChannel - The spectate channel of the player.
     * @param {number} row - The row of the player.
     * @param {Game} game - The game this belongs to.
     */
    constructor(id, member, name, title, pronounString, originalVoiceString, stats, alive, locationDisplayName, hidingSpot, statusDisplays, description, inventory, spectateChannel, row, game) {
        super(game, row, description);
        this.id = id;
        this.member = member;
        this.name = name;
        this.displayName = this.name;
        this.displayIcon = null;
        this.title = title;
        this.talent = title;
        this.isNPC = this.title === "NPC";
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
        this.originalVoiceString = originalVoiceString;
        this.voiceString = this.originalVoiceString;

        this.defaultStrength = stats.strength;
        this.strength = this.defaultStrength;
        this.defaultPerception = stats.perception;
        this.perception = this.defaultPerception;
        this.defaultIntelligence = this.defaultPerception;
        this.intelligence = this.perception;
        this.defaultDexterity = stats.dexterity;
        this.dexterity = this.defaultDexterity;
        this.defaultSpeed = stats.speed;
        this.speed = this.defaultSpeed;
        this.defaultStamina = stats.stamina;
        this.maxStamina = this.defaultStamina;
        this.stamina = this.defaultStamina;

        this.alive = alive;
        this.locationDisplayName = locationDisplayName;
        this.location = null;
        this.pos = { x: 0, y: 0, z: 0 };
        this.hidingSpot = hidingSpot;
        this.statusCollection = new Collection();
        this.statusDisplays = statusDisplays;
        this.status = [];
        this.statusString = "";
        this.description = description;
        this.inventory = [];
        this.inventoryCollection = inventory;
        this.spectateChannel = spectateChannel;
        this.maxCarryWeight = this.getMaxCarryWeight();
        this.carryWeight = 0;

        this.isMoving = false;
        this.moveTimer = null;
        this.remainingTime = 0;
        this.moveQueue = [];

        /** @private */
        this.#reachedHalfStamina = false;
        let player = this;
        /** @private */
        this.#staminaRegenerationInterval = setInterval(function () {
            if (!player.isMoving) player.regenerateStamina();
        }, 30000);

        this.online = false;
        /** @private */
        this.#onlineInterval = null;
    }

    /**
     * Sets the location.
     * @param {Room} room
     */
    setLocation(room) {
        this.location = room;
        this.locationDisplayName = room.displayName;
    }

    /**
     * Sets the inventory.
     * @param {Collection<string, EquipmentSlot>} inventory 
     */
    setInventory(inventory) {
        this.inventoryCollection = inventory;
    }

    /**
     * Sets the pronouns of the player.
     * Modifies whichever pronoun set is passed into it.
     * @param {Pronouns} pronouns - A set of pronouns
     * @param {string} pronounString - A string representation of a set of pronouns.
     */
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
            const pronounSet = pronounString.split('/');
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

    /**
     * Starts moving the player to the next destination in their move queue.
     * @param {boolean} isRunning - Whether the player is running.
     * @param {string} destination - The destination the user supplied.
     */
    queueMovement(isRunning, destination) {
        const currentRoom = this.location;
        let adjacent = false;
        /** @type {Exit} */
        let exit = null;
        let exitMessage = "";
        /** @type {Room} */
        let desiredRoom = null;
        /** @type {Exit} */
        let entrance = null;
        let entranceMessage = "";
        const appendString = this.createMoveAppendString();

        // If the player has the free movement role, they can move to any room they please.
        if (this.member.roles.resolve(this.getGame().guildContext.freeMovementRole)) {
            adjacent = true;
            desiredRoom = this.getGame().entityFinder.getRoom(destination);
            exitMessage = `${this.displayName} suddenly disappears${appendString}`;
            entranceMessage = `${this.displayName} suddenly appears${appendString}`;
        }
        // Otherwise, check that the desired room is adjacent to the current room.
        else {
            exit = this.getGame().entityFinder.getExit(currentRoom, destination);
            if (!exit) {
                for (const targetExit of currentRoom.exitCollection.values()) {
                    if (targetExit.dest.id === destination.replace(/\'/g, "").replace(/ /g, "-").toLowerCase()) {
                        exit = targetExit;
                        break;
                    }
                }
            }
            if (exit) {
                adjacent = true;
                exitMessage = `${this.displayName} exits into ${exit.name}${appendString}`;
                desiredRoom = exit.dest;
                entrance = this.getGame().entityFinder.getExit(desiredRoom, exit.link);
                if (entrance)
                    entranceMessage = `${this.displayName} enters from ${entrance.name}${appendString}`;
            }
        }
        if (!adjacent) {
            this.moveQueue.length = 0;
            return this.notify(`There is no exit "${destination}" that you can currently move to. Please try the name of an exit in the room you're in or the name of the room you want to go to.`, false);
        }

        if (desiredRoom) {
            if (exit)
                this.move(isRunning, currentRoom, desiredRoom, exit, entrance, exitMessage, entranceMessage);
            else {
                currentRoom.removePlayer(this, exit, exitMessage);
                desiredRoom.addPlayer(this, entrance, entranceMessage, true);

                // Post log message.
                const time = new Date().toLocaleTimeString();
                messageHandler.addLogMessage(this.getGame(), `${time} - ${this.name} moved to ${desiredRoom.channel}`);
            }
        }
        else {
            this.moveQueue.length = 0;
            return this.notify(`There is no exit "${destination}" that you can currently move to. Please try the name of an exit in the room you're in or the name of the room you want to go to.`, false);
        }
    }

    /**
     * Moves the player to the desired room.
     * @param {boolean} isRunning - Whether the player is running.
     * @param {Room} currentRoom - The room the player is currently in.
     * @param {Room} desiredRoom - The room the player will be moved to.
     * @param {Exit} exit - The exit the player will leave their current room through.
     * @param {Exit} entrance - The exit the player will enter the desired room from.
     * @param {string} exitMessage - The message that will be sent in their current room when they exit.
     * @param {string} entranceMessage - The message that will be sent in their desired room when they enter.
     */
    move(isRunning, currentRoom, desiredRoom, exit, entrance, exitMessage, entranceMessage) {
        const time = this.calculateMoveTime(exit, isRunning);
        this.remainingTime = time;
        this.isMoving = true;
        const verb = isRunning ? "running" : "walking";
        if (time > 1000) new Narration(this.getGame(), this, this.location, `${this.displayName} starts ${verb} toward ${exit.name}.`).send();
        /** @type {Pos} */
        const startingPos = { x: this.pos.x, y: this.pos.y, z: this.pos.z };

        let player = this;
        this.moveTimer = setInterval(function () {
            const settings = player.getGame().settings;
            let subtractedTime = 100;
            if (this.game.heated) subtractedTime = settings.heatedSlowdownRate * subtractedTime;
            if (time >= subtractedTime) player.remainingTime -= subtractedTime;
            // Get the current coordinates based on what percentage of the duration has passed.
            const elapsedTime = time - player.remainingTime;
            const timeRatio = elapsedTime / time;
            let x = startingPos.x + Math.round(timeRatio * (exit.pos.x - startingPos.x));
            let y = startingPos.y + Math.round(timeRatio * (exit.pos.y - startingPos.y));
            let z = startingPos.z + Math.round(timeRatio * (exit.pos.z - startingPos.z));
            // Calculate the distance the player has traveled in this time.
            let distance = Math.sqrt(Math.pow(x - player.pos.x, 2) + Math.pow(z - player.pos.z, 2)) / settings.pixelsPerMeter;
            let rise = (y - player.pos.y) / settings.pixelsPerMeter;
            // Calculate the amount of stamina the player has lost traveling this distance.
            const staminaUseMultiplier = isRunning ? 3 : 1;
            let lostStamina;
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
            if (!player.hasBehaviorAttribute('no stamina decrease')) player.stamina = player.stamina + lostStamina;
            // If player reaches half of their stamina, give them a warning.
            // Be sure to check player.#reachedHalfStamina so that this message is only sent once.
            if (player.stamina <= player.maxStamina / 2 && !player.#reachedHalfStamina) {
                player.#reachedHalfStamina = true;
                player.notify(`You're starting to get tired! You might want to stop moving and rest soon.`);
            }
            // If player runs out of stamina, stop them in their tracks.
            if (player.stamina <= 0) {
                clearInterval(player.moveTimer);
                player.stamina = 0;
                player.inflict("weary", true, true, true);
            }
            if (player.remainingTime <= 0 && player.stamina !== 0) {
                clearInterval(player.moveTimer);
                player.isMoving = false;
                const exitPuzzle = player.getGame().entityFinder.getPuzzle(exit.name, player.location.id, "restricted exit", true);
                const exitPuzzlePassable = exitPuzzle && exitPuzzle.solutions.includes(player.name);
                if (exit.unlocked || exitPuzzlePassable) {
                    if (exitPuzzlePassable)
                        exitPuzzle.solve(player, "", player.name, true);
                    currentRoom.removePlayer(player, exit, exitMessage);
                    desiredRoom.addPlayer(player, entrance, entranceMessage, true);

                    // Post log message.
                    const time = new Date().toLocaleTimeString();
                    const verb = isRunning ? "ran" : "moved";
                    messageHandler.addLogMessage(player.getGame(), `${time} - ${player.name} ${verb} to ${desiredRoom.channel}`);

                    player.moveQueue.splice(0, 1);
                    if (player.moveQueue.length > 0)
                        player.queueMovement(isRunning, player.moveQueue[0].trim());
                }
                else {
                    new Narration(player.getGame(), player, player.location, `${player.displayName} stops moving.`).send();
                    player.pos.x = exit.pos.x;
                    player.pos.y = exit.pos.y;
                    player.pos.z = exit.pos.z;
                    player.notify(`${exit.name} is locked.`);
                    player.moveQueue.length = 0;
                }
            }
        }, 100);
    }

    /**
     * Calculates the time it takes to move the player to the desired exit.
     * @param {Exit} exit
     * @param {boolean} isRunning
     * @returns {number} The number of milliseconds it will take to move to the desired exit.
     */
    calculateMoveTime(exit, isRunning) {
        let distance = Math.sqrt(Math.pow(exit.pos.x - this.pos.x, 2) + Math.pow(exit.pos.z - this.pos.z, 2));
        distance = distance / this.getGame().settings.pixelsPerMeter;
        // The formula to calculate the rate is a quadratic function.
        // The equation is Rate = 0.0183x^2 + 0.005x + 0.916, where x is the player's speed stat multiplied by 2 or 1, depending on if the player is running or not.
        const speedMultiplier = isRunning ? 2 : 1;
        let rate = 0.0183 * Math.pow(speedMultiplier * this.speed, 2) + 0.005 * speedMultiplier * this.speed + 0.916;
        // Slow down the player relative to how much weight they're carrying.
        // The equation is Slowdown = 15/x, where x is the number of kilograms a player is carrying, and 1/4 <= Slowdown <= 1.
        const slowdown = Math.min(Math.max(15.0 / this.carryWeight, 0.25), 1.0);
        rate = rate * slowdown;
        // Slope should affect the rate.
        const rise = (exit.pos.y - this.pos.y) / this.getGame().settings.pixelsPerMeter;
        let time = 0;
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
            if (distance < rate) distance = 0;
            time = distance / rate * 1000;
        }
        if (time < 0) time = 0;
        return time;
    }

    /**
     * Resets the player's stamina to its maximum value.
     */
    regenerateStamina() {
        if (this.stamina < this.maxStamina) {
            // Recover 1/20th of the player's max stamina per cycle, times the heatedSlowdownRate if applicable.
            let staminaAmount = this.maxStamina / 20;
            if (this.getGame().heated) staminaAmount *= this.getGame().settings.heatedSlowdownRate;
            const newStamina = this.stamina + staminaAmount;
            // Make sure not to exceed the max stamina for this player.
            if (newStamina > this.maxStamina)
                this.stamina = this.maxStamina;
            else
                this.stamina = newStamina;
        }
    }

    /**
     * Creates a string of non-discreet inventory items in the player's hands.
     * @returns {string}
     */
    createMoveAppendString() {
        /** @type {string[]} */
        let nonDiscreetItems = [];
        const rightHand = this.inventoryCollection.get("RIGHT HAND");
        if (rightHand && rightHand.equippedItem !== null && !rightHand.equippedItem.prefab.discreet)
            nonDiscreetItems.push(rightHand.equippedItem.singleContainingPhrase);
        const leftHand = this.inventoryCollection.get("LEFT HAND");
        if (leftHand && leftHand.equippedItem !== null && !leftHand.equippedItem.prefab.discreet)
            nonDiscreetItems.push(leftHand.equippedItem.singleContainingPhrase);

        let appendString = "";
        if (nonDiscreetItems.length === 0)
            appendString = ".";
        else if (nonDiscreetItems.length === 1)
            appendString = ` carrying ${nonDiscreetItems[0]}.`;
        else if (nonDiscreetItems.length === 2)
            appendString = ` carrying ${nonDiscreetItems[0]} and ${nonDiscreetItems[1]}.`;

        return appendString;
    }

    /**
     * Stops the player, if they're moving.
     */
    stopMoving() {
        if (this.moveTimer !== null)
            clearInterval(this.moveTimer);
        this.isMoving = false;
        this.remainingTime = 0;
        this.moveQueue.length = 0;
    }

    /**
     * Inflicts the player with a status effect.
     * @param {string | Status} statusId - The ID of the status to inflict, or the status object itself.
     * @param {boolean} [notify=true] - Whether or not to send the player the status's inflictedDescription. Defaults to true.
     * @param {boolean} [doCures=true] - Whether or not the status's cures should actually be cured. Defaults to true.
     * @param {boolean} [narrate=true] - Whether or not to send any narrations caused by the status being inflicted. Defaults to true.
     * @param {InventoryItem} [item] - The inventory item that caused the status to be inflicted, if applicable.
     * @param {import('luxon').Duration} [duration] - A custom duration that overrides the status's default duration.
     * @returns {string} A message indicating whether the status was successfully inflicted, or if not, why it wasn't.
     */
    inflict(statusId, notify = true, doCures = true, narrate = true, item, duration = null) {
        /** @type {Status} */
        let status = null;
        if (statusId instanceof Status) status = statusId;
        else {
            status = this.getGame().entityFinder.getStatusEffect(statusId);
            if (status === undefined) return `Couldn't find status effect "${statusId}".`;
        }

        for (let i = 0; i < status.overriders.length; i++) {
            if (this.statusCollection.has(status.overriders[i].id))
                return `Couldn't inflict status effect "${statusId}" because ${this.name} is already ${status.overriders[i].id}.`;
        }

        if (statusId instanceof Status) statusId = status.id;
        if (this.statusCollection.has(statusId)) {
            if (status.duplicatedStatus !== null) {
                this.cure(statusId, false, false, false);
                this.inflict(status.duplicatedStatus.id, true, false, true);
                return `Status was duplicated, so inflicted ${status.duplicatedStatus.id} instead.`;
            }
            else return "Specified player already has that status effect.";
        }

        if (status.cures.length > 0 && doCures) {
            for (let i = 0; i < status.cures.length; i++)
                this.cure(status.cures[i].id, false, false, false);
        }

        // Apply the effects of any attributes that require immediate action.
        if (status.id === "heated")
            this.getGame().heated = true;
        if (status.behaviorAttributes.includes("no channel")) {
            this.location.leaveChannel(this);
            this.removeFromWhispers(`${this.displayName} can no longer whisper because ${this.originalPronouns.sbj} ` + (this.originalPronouns.plural ? `are` : `is`) + ` ${status.id}.`);
        }
        if (status.behaviorAttributes.includes("no hearing")) this.removeFromWhispers(`${this.displayName} can no longer hear.`);
        if (status.behaviorAttributes.includes("hidden")) {
            if (narrate) new Narration(this.getGame(), this, this.location, `${this.displayName} hides in the ${this.hidingSpot}.`).send();
            this.location.occupantsString = this.location.generateOccupantsString(this.location.occupants.filter(occupant => !occupant.hasBehaviorAttribute("hidden") && occupant.name !== this.name));
        }
        if (status.behaviorAttributes.includes("concealed")) {
            const maskName = item ? item.singleContainingPhrase : "a MASK";
            this.displayName = `An individual wearing ${maskName}`;
            this.displayIcon = "https://cdn.discordapp.com/attachments/697623260736651335/911381958553128960/questionmark.png";
            this.setPronouns(this.pronouns, "neutral");
            this.location.occupantsString = this.location.generateOccupantsString(this.location.occupants.filter(occupant => !occupant.hasBehaviorAttribute("hidden")));
        }
        if (status.behaviorAttributes.includes("disable all") || status.behaviorAttributes.includes("disable move") || status.behaviorAttributes.includes("disable run"))
            this.stopMoving();

        // Announce when a player falls asleep or unconscious.
        if (status.id === "asleep" && narrate) new Narration(this.getGame(), this, this.location, `${this.displayName} falls asleep.`).send();
        else if (status.id === "blacked out" && narrate) new Narration(this.getGame(), this, this.location, `${this.displayName} blacks out.`).send();
        else if (status.behaviorAttributes.includes("unconscious") && narrate) new Narration(this.getGame(), this, this.location, `${this.displayName} goes unconscious.`).send();

        status = new Status(status.id, status.duration, status.fatal, status.visible, status.overridersStrings, status.curesStrings, status.nextStageId, status.duplicatedStatusId, status.curedConditionId, status.statModifiers, status.behaviorAttributes, status.inflictedDescription, status.curedDescription, status.row, this.getGame());

        // Apply the duration, if applicable.
        if (status.duration) {
            if (duration !== null) status.remaining = duration;
            else status.remaining = status.duration;

            let player = this;
            status.timer = new Timer(1000, { start: true, loop: true }, function () {
                let subtractedTime = 1000;
                if (player.getGame().heated) subtractedTime = player.getGame().settings.heatedSlowdownRate * subtractedTime;
                status.remaining = status.remaining.minus(subtractedTime);
                player.statusDisplays = player.#generateStatusDisplays(true, true);

                if (status.remaining.as('milliseconds') <= 0) {
                    if (status.nextStage) {
                        player.cure(status.id, false, false, true);
                        const response = player.inflict(status.nextStage.id, true, false, true);
                        if (response.startsWith(`Couldn't inflict status effect`))
                            player.sendDescription(status.curedDescription, status);
                    }
                    else {
                        if (status.fatal) {
                            status.timer.stop();
                            const action = new Action(player.getGame(), ActionType.Die, undefined, player, player.location, true);
                            action.performDie();
                        }
                        else {
                            player.cure(status.id, true, true, true);
                        }
                    }
                }
            });
        }

        this.statusCollection.set(status.id, status);
        this.recalculateStats();

        // Inform player what happened.
        if (notify)
            this.sendDescription(status.inflictedDescription, status);

        this.statusDisplays = this.#generateStatusDisplays(true, true);

        // Post log message.
        const time = new Date().toLocaleTimeString();
        messageHandler.addLogMessage(this.getGame(), `${time} - ${this.name} became ${status.id} in ${this.location.channel}`);

        return "Status successfully added.";
    }

    /**
     * Removes a status effect from the player.
     * @param {string} statusId
     * @param {boolean} [notify=true] - Whether or not to send the player the status's curedDescription. Defaults to true.
     * @param {boolean} [doCuredCondition=true] - Whether or not to turn the status into its curedCondition. Defaults to true.
     * @param {boolean} [narrate=true] - Whether or not to send any narrations caused by the status being cured. Defaults to true.
     * @param {InventoryItem} [item] - The inventory item that caused the status to be cured, if applicable.
     * @returns {string} A message indicating whether the status was successfully cured, or if not, why it wasn't.
     */
    cure(statusId, notify = true, doCuredCondition = true, narrate = true, item) {
        /** @type {Status} */
        let status = this.statusCollection.get(statusId.toLowerCase());
        if (status === undefined) return "Specified player doesn't have that status effect.";

        if (status.behaviorAttributes.includes("no channel") && this.getBehaviorAttributeStatusEffects("no channel").length - 1 === 0)
            this.location.joinChannel(this);
        if (status.behaviorAttributes.includes("hidden")) {
            if (narrate) new Narration(this.getGame(), this, this.location, `${this.displayName} comes out of the ${this.hidingSpot}.`).send();
            this.removeFromWhispers(`${this.displayName} comes out of the ${this.hidingSpot}.`);
            this.location.occupantsString = this.location.generateOccupantsString(this.location.occupants.filter(occupant => !occupant.hasBehaviorAttribute("hidden") || occupant.name === this.name));
            this.hidingSpot = "";
        }
        if (status.behaviorAttributes.includes("concealed")) {
            this.displayName = this.name;
            if (this.isNPC) this.displayIcon = this.id;
            else this.displayIcon = null;
            const maskName = item ? item.singleContainingPhrase : "a MASK";
            if (narrate) new Narration(this.getGame(), this, this.location, `The ${maskName} comes off, revealing the figure to be ${this.displayName}.`).send();
            this.setPronouns(this.pronouns, this.pronounString);
            this.location.occupantsString = this.location.generateOccupantsString(this.location.occupants.filter(occupant => !occupant.hasBehaviorAttribute("hidden")));
        }

        // Announce when a player awakens.
        if (status.id === "asleep" && narrate) new Narration(this.getGame(), this, this.location, `${this.displayName} wakes up.`).send();
        else if (status.id === "blacked out" && narrate) new Narration(this.getGame(), this, this.location, `${this.displayName} wakes up.`).send();
        else if (status.behaviorAttributes.includes("unconscious") && narrate) new Narration(this.getGame(), this, this.location, `${this.displayName} regains consciousness.`).send();

        let returnMessage = "Successfully removed status effect.";
        if (status.curedCondition && doCuredCondition) {
            this.inflict(status.curedCondition.id, false, false, true);
            returnMessage += ` Player is now ${status.curedCondition.id}.`;
        }

        // Inform player what happened.
        if (notify) {
            this.sendDescription(status.curedDescription, status);
            // If the player is waking up, send them the description of the room they wake up in.
            if (status.id === "asleep")
                this.sendDescription(this.location.description, this.location);
        }

        // Post log message.
        const time = new Date().toLocaleTimeString();
        messageHandler.addLogMessage(this.getGame(), `${time} - ${this.name} has been cured of ${status.id} in ${this.location.channel}`);

        // Stop the timer.
        if (status.timer !== null)
            status.timer.stop();
        this.recalculateStats();

        this.statusDisplays = this.#generateStatusDisplays(true, true);

        if (status.id === "heated") {
            const heatedPlayers = this.getGame().entityFinder.getLivingPlayers(null, null, null, null, "heated");
            if (heatedPlayers.length = 0) this.getGame().heated = false;
        }

        return returnMessage;
    }

    /**
     * Creates a list of the player's status effects.
     * @param {boolean} includeHidden - Whether or not to include status effects that aren't visible.
     * @param {boolean} includeDurations - Whether or not to display the remaining time before the status effect expires.
     * @returns {StatusDisplay[]}
     */
    #generateStatusDisplays(includeHidden, includeDurations) {
        /** @type {StatusDisplay[]} */
        let statusDisplays = [];
        this.statusCollection.forEach(status => {
            if (status.visible || includeHidden) {
                const statusId = status.id;
                let timeString;
                if (includeDurations && status.remaining !== null) {
                    const format = Math.floor(status.remaining.as('days')) !== 0 ? 'd hh:mm:ss' : 'hh:mm:ss';
                    timeString = status.remaining.toFormat(format);
                }
                statusDisplays.push({ id: statusId, timeRemaining: timeString });
            }
        });
        return statusDisplays;
    }

    /**
     * Creates a list of the player's status effects.
     * @param {boolean} includeHidden - Whether or not to include status effects that aren't visible.
     * @param {boolean} includeDurations - Whether or not to display the remaining time before the status effect expires.
     * @returns {string}
     */
    getStatusList(includeHidden, includeDurations) {
        const statusDisplays = this.#generateStatusDisplays(includeHidden, includeDurations);
        /** @type {string[]} */
        let statusStrings = [];
        statusDisplays.forEach(statusDisplay => {
            let statusString = statusDisplay.id;
            if (statusDisplay.timeRemaining) statusString += ` (${statusDisplay.timeRemaining})`;
            statusStrings.push(statusString);
        });
        return statusStrings.join(", ");
    }

    /**
     * Returns true if the player has a status with the specified ID.
     * @param {string} statusId - The ID of the status to look for. 
     */
    hasStatus(statusId) {
        for (const status of this.statusCollection.values())
            if (status.id === statusId) return true;
        return false;
    }

    /**
     * Returns true if the player has a status with the specified behavior attribute.
     * @param {string} behaviorAttribute - The name of the behavior attribute.
     * @returns {boolean}
     */
    hasBehaviorAttribute(behaviorAttribute) {
        for (const status of this.statusCollection.values())
            if (status.behaviorAttributes.includes(behaviorAttribute)) return true;
        return false;
    }

    /**
     * Returns true if the player has a status with the specified behavior attribute.
     * Deprecated. Use hasBehaviorAttribute instead.
     * @deprecated
     * @param {string} attribute - The name of the behavior attribute.
     * @returns {boolean}
     */
    hasAttribute(attribute) {
        let hasAttribute = false;
        for (let i = 0; i < this.status.length; i++) {
            if (this.status[i].behaviorAttributes.includes(attribute)) {
                hasAttribute = true;
                break;
            }
        }
        return hasAttribute;
    }

    /**
     * Returns list of status effects the player has with the specified behavior attribute.
     * @param {string} behaviorAttribute - The name of the behavior attribute.
     * @returns {Status[]}
     */
    getBehaviorAttributeStatusEffects(behaviorAttribute) {
        /** @type {Status[]} */
        let statusEffects = [];
        for (const status of this.statusCollection.values()) {
            if (status.behaviorAttributes.includes(behaviorAttribute))
                statusEffects.push(status);
        }
        return statusEffects;
    }

    /**
     * Returns list of status effects the player has with the specified behavior attribute.
     * Deprecated. Use getBehaviorAttributeStatusEffects instead.
     * @deprecated
     * @param {string} attribute - The name of the behavior attribute.
     * @returns {Status[]}
     */
    getAttributeStatusEffects(attribute) {
        /** @type {Status[]} */
        let statusEffects = [];
        for (let i = 0; i < this.status.length; i++) {
            if (this.status[i].behaviorAttributes.includes(attribute))
                statusEffects.push(this.status[i]);
        }
        return statusEffects;
    }

    /**
     * Calculates the player's stats based on their current status effects.
     */
    recalculateStats() {
        const strength = this.defaultStrength;
        const perception = this.defaultPerception;
        const dexterity = this.defaultDexterity;
        const speed = this.defaultSpeed;
        const stamina = this.defaultStamina;

        /** @type {StatModifier[]} */
        let strModifiers = [];
        /** @type {StatModifier[]} */
        let perModifiers = [];
        /** @type {StatModifier[]} */
        let dexModifiers = [];
        /** @type {StatModifier[]} */
        let spdModifiers = [];
        /** @type {StatModifier[]} */
        let staModifiers = [];

        for (const status of this.statusCollection.values()) {
            for (const modifier of status.statModifiers) {
                if (modifier.modifiesSelf) {
                    switch (modifier.stat) {
                        case "str":
                            strModifiers.push(modifier);
                            break;
                        case "per":
                            perModifiers.push(modifier);
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
        this.perception = this.recalculateStat(perception, perModifiers);
        this.intelligence = this.perception;
        this.dexterity = this.recalculateStat(dexterity, dexModifiers);
        this.speed = this.recalculateStat(speed, spdModifiers);
        const staminaRatio = this.stamina / this.maxStamina;
        this.maxStamina = this.recalculateStat(stamina, staModifiers);
        this.stamina = staminaRatio * this.maxStamina;
    }

    /**
     * Calculates stat after applying stat modifiers.
     * @param {number} stat - The current stat value.
     * @param {StatModifier[]} modifiers - The modifiers to apply.
     * @returns {number}
     */
    recalculateStat(stat, modifiers) {
        let assignModifiers = modifiers.filter(modifier => modifier.assignValue === true).sort((a, b) => a.value - b.value);
        if (assignModifiers.length !== 0) return assignModifiers[0].value;

        for (let i = 0; i < modifiers.length; i++)
            stat += modifiers[i].value;
        if (stat < 1) stat = 1;
        if (stat > 10) stat = 10;
        return stat;
    }

    /**
     * Calculates dice roll modifier based on the specified stat value.
     * @param {number} stat - The stat value.
     * @returns {number}
     */
    getStatModifier(stat) {
        const statMax = 10;
        let modifier = Math.floor(Math.floor((stat - statMax / 3) / 2) + (this.getGame().settings.diceMax - this.getGame().settings.diceMin) / this.getGame().settings.diceMax);
        return modifier;
    }

    /**
     * Calculates the player's maximum carry weight in kilograms.
     * @returns {number}
     */
    getMaxCarryWeight() {
        return Math.floor(1.783 * Math.pow(this.strength, 2) - 2 * this.strength + 22);
    }

    /**
     * Uses the player's inventory item.
     * @param {InventoryItem} item - The inventory item to use.
     * @param {Player} [target] - The player the inventory item is to be used on. Defaults to the player using it.
     */
    use(item, target = this) {
        for (let effect of item.prefab.effects)
            target.inflict(effect.id, true, true, true, item);
        for (let cure of item.prefab.cures)
            target.cure(cure.id, true, true, true, item);
        if (!isNaN(item.uses))
            item.decreaseUses();
    }

    /**
     * Takes an item and puts it in the player's inventory.
     * @param {RoomItem} item - The item to take.
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to put the item in.
     * @param {Puzzle|Fixture|RoomItem|Room} container - The item's current container.
     * @param {InventorySlot} inventorySlot - The {@link InventorySlot|inventory slot} the item is currently in.
     */
    take(item, handEquipmentSlot, container, inventorySlot) {
        // Reduce quantity if the quantity is finite.
        if (!isNaN(item.quantity))
            item.quantity--;

        // Update the container's description.
        if (container instanceof Puzzle || container instanceof Fixture || container instanceof RoomItem)
            container.removeItemFromDescription(item, inventorySlot ? inventorySlot.id : "");
        if (container instanceof RoomItem)
            container.removeItem(item, inventorySlot.id, 1);

        // Put the item in the player's hand.
        const createdItem = itemManager.putItemInHand(item, this, handEquipmentSlot);
        this.carryWeight += createdItem.weight;

        // Add the new item to the player's hands item list.
        if (!createdItem.prefab.discreet)
            this.addItemToDescription(createdItem, "hands");
    }

    /**
     * Steals an inventory item from another player.
     * @param {InventoryItem} item - The inventory item to steal.
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to put the inventory item in.
     * @param {Player} victim - The player to steal from.
     * @param {InventoryItem} container - An inventory item belonging to the victim that the player will attempt to steal from.
     * @param {InventorySlot<InventoryItem>} inventorySlot - The {@link InventorySlot|inventory slot} that the player will attempt to steal from.
     */
    steal(item, handEquipmentSlot, victim, container, inventorySlot) {
        // Remove the item from its container.
        itemManager.removeStashedItem(item, container, inventorySlot, victim.inventoryCollection.get(item.equipmentSlot));
        // Put the item in the player's hand.
        const createdItem = itemManager.putItemInHand(item, this, handEquipmentSlot);
        victim.carryWeight -= createdItem.weight;
        this.carryWeight += createdItem.weight;

        if (!createdItem.prefab.discreet)
            this.addItemToDescription(createdItem, "hands");
    }

    /**
     * Drops an inventory item and puts it in the specified container in the room.
     * @param {InventoryItem} item - The inventory item to drop.
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param {Puzzle|Fixture|RoomItem} container - The container to put the item in.
     * @param {InventorySlot} inventorySlot - The {@link InventorySlot|inventory slot} to put the item in.
     */
    drop(item, handEquipmentSlot, container, inventorySlot) {
        // Unequip the item from the player's hand.
        handEquipmentSlot.unequipItem(item);

        // Convert the InventoryItem to a RoomItem.
        const inventorySlotId = inventorySlot ? inventorySlot.id : "";
        let createdItem = itemManager.convertInventoryItem(item, this, container, inventorySlotId, 1);
        createdItem.container = container;
        createdItem.slot = inventorySlotId;

        // Update the container's description.
        container.addItemToDescription(item, inventorySlotId);
        if (container instanceof RoomItem)
            container.insertItem(createdItem, inventorySlot.id);

        // Create a list of all the child items.
        /** @type {RoomItem[]} */
        let items = [];
        items.push(createdItem);
        itemManager.getChildItems(items, createdItem);
        // Now that the item has been converted, we can update the quantities of child items.
        itemManager.setChildItemQuantitiesZero(item);
        item.quantity = 0;
        // Insert the new items into the game's list of room items.
        itemManager.insertRoomItems(this.location, items);
        this.carryWeight -= item.weight;
        
        // Remove the item from the player's hands item list.
        if (!item.prefab.discreet)
            this.removeItemFromDescription(item, "hands");
    }

    /**
     * Gives an inventory item to another player.
     * @param {InventoryItem} item - The inventory item to give.
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param {Player} recipient - The player to give the inventory item to.
     * @param {EquipmentSlot} recipientHandEquipmentSlot - The hand equipment slot of the recipient to put the item in.
     */
    give(item, handEquipmentSlot, recipient, recipientHandEquipmentSlot) {
        // Unequip the item from the player's hand.
        handEquipmentSlot.unequipItem(item);

        // Put the item in the recipient's hand.
        const createdItem = itemManager.putItemInHand(item, recipient, recipientHandEquipmentSlot);
        this.carryWeight -= createdItem.weight;
        recipient.carryWeight += createdItem.weight;

        if (!createdItem.prefab.discreet) {
            // Remove the item from the player's hands item list.
            this.removeItemFromDescription(createdItem, "hands");
            // Add the item to the recipient's hands item list.
            recipient.addItemToDescription(createdItem, "hands");
        }
    }

    /**
     * Moves an inventory item from the player's hand into a container in their inventory.
     * @param {InventoryItem} item - The inventory item to stash. 
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     * @param {InventoryItem} container - The container to stash the inventory item in.
     * @param {InventorySlot} inventorySlot - The {@link InventorySlot|inventory slot} to stash the inventory item in.
     */
    stash(item, handEquipmentSlot, container, inventorySlot) {
        // Unequip the item from the player's hand.
        handEquipmentSlot.unequipItem(item);

        // Copy the inventory item to the given container.
        const equipmentSlot = this.inventoryCollection.get(container.equipmentSlot);
        let createdItem = itemManager.copyInventoryItem(item, this, equipmentSlot.id, 1);
        createdItem.containerName = `${container.identifier}/${inventorySlot.id}`;
        createdItem.container = container;
        createdItem.slot = inventorySlot.id;

        // Update container.
        container.insertItem(createdItem, inventorySlot.id);
        container.addItemToDescription(createdItem, inventorySlot.id);

        // Create a list of all the child items.
        /** @type {InventoryItem[]} */
        let items = [];
        items.push(createdItem);
        itemManager.getChildItems(items, createdItem);
        // Now that the item has been converted, we can update the quantities of child items.
        itemManager.setChildItemQuantitiesZero(item);
        // Insert the new inventory items into the game's list of inventory items.
        itemManager.insertInventoryItems(this, items, equipmentSlot);

        // Remove the item from the player's hands item list.
        if (!item.prefab.discreet)
            this.removeItemFromDescription(item, "hands");
    }

    /**
     * Moves an inventory item from a container in the player's inventory to the player's hand.
     * @param {InventoryItem} item - The inventory item to unstash. 
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to put the inventory item in.
     * @param {InventoryItem} container - The inventory item's current container.
     * @param {InventorySlot} inventorySlot - The {@link InventorySlot|inventory slot} the inventory item is currently in.
     */
    unstash(item, handEquipmentSlot, container, inventorySlot) {
        // Remove the inventory item from its container.
        itemManager.removeStashedItem(item, container, inventorySlot, this.inventoryCollection.get(item.equipmentSlot));
        // Put the item in the player's hand.
        itemManager.putItemInHand(item, this, handEquipmentSlot);

        // Add the new item to the player's hands item list.
        if (!item.prefab.discreet)
            this.addItemToDescription(item, "hands");
    }

    /**
     * Moves an inventory item from the player's hand to one of their {@link EquipmentSlot|equipment slots}.
     * @param {InventoryItem} item - The inventory item to equip.
     * @param {EquipmentSlot} equipmentSlot - The equipment slot to equip the inventory item to. 
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot that the inventory item is currently in.
     */
    equip(item, equipmentSlot, handEquipmentSlot) {
        // Unequip the item from the player's hand.
        handEquipmentSlot.unequipItem(item);

        // Copy the inventory item to the new equipment slot.
        let createdItem = itemManager.copyInventoryItem(item, this, equipmentSlot.id, 1);
        createdItem.row = equipmentSlot.row;

        // Equip the item to the player's equipment slot.
        equipmentSlot.equipItem(createdItem);
        // Create a list of all the child items.
        /** @type {InventoryItem[]} */
        let items = [];
        itemManager.getChildItems(items, createdItem);
        // Update the quantities of child items.
        itemManager.setChildItemQuantitiesZero(item);
        item.quantity = 0;
        // Insert the newly created item in the game's list of inventory items.
        itemManager.insertInventoryItems(this, items, equipmentSlot);

        // Update the player's description.
        if (!item.prefab.discreet)
            this.removeItemFromDescription(item, "hands");
        this.#coverEquippedItems(createdItem);

        // Execute equipped commands.
        parseAndExecuteBotCommands(createdItem.prefab.equippedCommands, this.getGame(), createdItem, this);
    }

    /**
     * Equips an inventory item to any of the player's {@link EquipmentSlot|equipment slots}.
     * This should only be used for newly created inventory items.
     * @param {InventoryItem} item - The inventory item to equip.
     * @param {EquipmentSlot} equipmentSlot - The equipment slot to equip the inventory item to. 
     * @param {boolean} [notify=true] - Whether or not to notify the player that they equipped the inventory item. Defaults to true.
     */
    directEquip(item, equipmentSlot, notify = true) {
        item.row = equipmentSlot.row;
        equipmentSlot.equipItem(item);

        if (item.equipmentSlot === "RIGHT HAND" || item.equipmentSlot === "LEFT HAND") {
            if (notify) this.notify(`You take ${item.singleContainingPhrase}.`);
            if (!item.prefab.discreet && notify) {
                new Narration(this.getGame(), this, this.location, `${this.displayName} takes ${item.singleContainingPhrase}.`).send();
                // Add the new item to the player's hands item list.
                this.addItemToDescription(item, "hands");
            }
        }
        else {
            if (notify) {
                this.notify(`You equip the ${item.name}.`);
                new Narration(this.getGame(), this, this.location, `${this.displayName} puts on ${item.singleContainingPhrase}.`).send();
            }
            this.#coverEquippedItems(item);

            // Execute equipped commands.
            parseAndExecuteBotCommands(item.prefab.equippedCommands, this.getGame(), item, this);
        }
    }

    /**
     * Removes equipped items that the given item covers from the player's description.
     * @param {InventoryItem} item - The equipped item that covers other items.
     */
    #coverEquippedItems(item) {
        for (const coveredEquipmentSlotId of item.prefab.coveredEquipmentSlots) {
            const coveredEquipmentSlot = this.inventoryCollection.get(coveredEquipmentSlotId);
            if (coveredEquipmentSlot && coveredEquipmentSlot.equippedItem !== null) {
                // Preserve quantity.
                const quantity = coveredEquipmentSlot.equippedItem.quantity;
                coveredEquipmentSlot.equippedItem.quantity = 0;
                this.removeItemFromDescription(coveredEquipmentSlot.equippedItem, "equipment");
                coveredEquipmentSlot.equippedItem.quantity = quantity;
            }
        }

        // Check to make sure that this item isn't covered by something else the player has equipped.
        let isCovered = false;
        this.inventoryCollection.forEach(equipmentSlot => {
            if (equipmentSlot.equippedItem !== null && equipmentSlot.id !== "RIGHT HAND" && equipmentSlot.id !== "LEFT HAND") {
                for (const coveredEquipmentSlotId of equipmentSlot.equippedItem.prefab.coveredEquipmentSlots) {
                    if (coveredEquipmentSlotId === item.equipmentSlot) {
                        isCovered = true;
                        break;
                    }
                }
            }
        });
        // If it's not covered, add mention of this item to the player's equipment item list.
        if (!isCovered)
            this.addItemToDescription(item, "equipment");
    }

    /**
     * Moves an inventory item from a player's {@link EquipmentSlot|equipment slot} to their hand.
     * @param {InventoryItem} item - The inventory item to unequip.
     * @param {EquipmentSlot} equipmentSlot - The equipment slot the inventory item is currently equipped to. 
     * @param {EquipmentSlot} handEquipmentSlot - The hand equipment slot to put the inventory item in.
     */
    unequip(item, equipmentSlot, handEquipmentSlot) {
        equipmentSlot.unequipItem(item);

        // Put the item in the player's hand.
        let createdItem = itemManager.putItemInHand(item, this, handEquipmentSlot);
        item.quantity = 0;
        
        // Update the player's description.
        if (!createdItem.prefab.discreet)
            this.addItemToDescription(createdItem, "hands");
        this.#uncoverEquippedItems(createdItem);

        // Execute unequipped commands.
        parseAndExecuteBotCommands(createdItem.prefab.unequippedCommands, this.getGame(), createdItem, this);
    }

    /**
     * Unequips an inventory item from a player's {@link EquipmentSlot|equipment slot} without moving it to their hand.
     * This should only be used for inventory items that are about to be destroyed.
     * @param {InventoryItem} item - The inventory item to unequip.
     */
    directUnequip(item) {
        const equipmentSlot = this.inventoryCollection.get(item.equipmentSlot);
        equipmentSlot.unequipItem(item);

        if (item.equipmentSlot === "RIGHT HAND" || item.equipmentSlot === "LEFT HAND") {
            // Remove the item from the player's hands item list.
            if (!item.prefab.discreet)
                this.removeItemFromDescription(item, "hands");
        }
        else {
            this.notify(`You unequip the ${item.name}.`);
            new Narration(this.getGame(), this, this.location, `${this.displayName} takes off ${this.pronouns.dpos} ${item.name}.`).send();
            // Remove mention of this item from the player's equipment item list.
            this.removeItemFromDescription(item, "equipment");
            this.#uncoverEquippedItems(item);

            // Execute unequipped commands.
            parseAndExecuteBotCommands(item.prefab.unequippedCommands, this.getGame(), item, this);
        }
    }

    /**
     * Adds any equipped items that were previously covered by the newly unequipped item back to the player's description.
     * @param {InventoryItem} item - The now unequipped item that covered other items.
     */
    #uncoverEquippedItems(item) {
        this.removeItemFromDescription(item, "equipment");
        // Find any items that were covered by this item and add them to the equipment item list.
        for (const coveredEquipmentSlotId of item.prefab.coveredEquipmentSlots) {
            const coveredEquipmentSlot = this.inventoryCollection.get(coveredEquipmentSlotId);
            if (coveredEquipmentSlot && coveredEquipmentSlot.equippedItem !== null) {
                // Before adding this item to the equipment item slot, make sure it isn't covered by something else.
                const coveringItems = this.getGame().inventoryItems.filter(item =>
                    item.player.name === this.name &&
                    item.prefab !== null &&
                    item.equipmentSlot !== "RIGHT HAND" &&
                    item.equipmentSlot !== "LEFT HAND" &&
                    item.containerName === "" &&
                    item.container === null &&
                    item.prefab.coveredEquipmentSlots.includes(coveredEquipmentSlotId)
                );
                if (coveringItems.length === 0) this.addItemToDescription(coveredEquipmentSlot.equippedItem, "equipment");
                break;
            }
        }
    }

    /**
     * Displays the player's inventory.
     * @param {string} possessive - A string indicating whose inventory this is. Either "Your" or `${player.name}'s`.
     * @param {boolean} useID - Whether or not to use the identifier or prefab IDs of the player's inventory items. If this is false, the inventory item's name will be used instead.
     * @returns {string} A string representation of the player's inventory.
     */
    viewInventory(possessive, useID) {
        let itemString = `__${possessive} inventory:__\n`;
        this.inventoryCollection.forEach(equipmentSlot => {
            itemString += `${equipmentSlot.id}: `;
            const equippedItem = equipmentSlot.equippedItem;
            if (equippedItem === null) itemString += `[ ]\n`;
            else {
                itemString += `[${useID ? equippedItem.identifier ? equippedItem.identifier : equippedItem.prefab.id : equippedItem.name}]\n`;
                /** 
                 * Generates a display of an inventory item's children.
                 * @param {string} itemString - A string representation of the inventory item's name.
                 * @param {InventoryItem} item - The inventory item whose child items are being listed.
                 */
                let listChildItems = function (itemString, item) {
                    // If item is capable of holding other items, show what items it has inside.
                    item.inventoryCollection.forEach(inventorySlot => {
                        /** @type {number[]} */
                        let parentItemIndexes = [];
                        itemString += `    ${inventorySlot.id}: `;
                        if (inventorySlot.items.length === 0) itemString += `[ ]`;
                        else {
                            inventorySlot.items.forEach((inventoryItem, i) => {
                                const childItem = inventoryItem;
                                if (childItem.quantity === 1) itemString += `[${useID ? childItem.identifier ? childItem.identifier : childItem.prefab.id : childItem.name}] `;
                                else if (useID) itemString += `[${childItem.quantity} ${childItem.identifier ? childItem.identifier : childItem.prefab.id}] `;
                                else {
                                    if (childItem.pluralName) itemString += `[${childItem.quantity} ${childItem.pluralName}] `;
                                    else itemString += `[${childItem.quantity} ${childItem.name}] `;
                                }
                                if (childItem.inventoryCollection.size !== 0) parentItemIndexes.push(i);
                            });
                            for (let i = 0; i < parentItemIndexes.length; i++) {
                                itemString += `\n`;
                                itemString = listChildItems(itemString, inventorySlot.items[parentItemIndexes[i]]);
                            }
                        }
                        if (itemString[itemString.length - 1] !== '\n') itemString += '\n';
                    });
                    return itemString;
                };
                itemString = listChildItems(itemString, equippedItem);
            }
        });
        return itemString.replace(/\n{2,}/g, '\n');
    }

    /**
     * Crafts two ingredients into one or two products according to a recipe.
     * @param {InventoryItem} item1 - The first ingredient.
     * @param {InventoryItem} item2 - The second ingredient.
     * @param {Recipe} recipe - The recipe that describes how these ingredients are crafted.
     * @returns {CraftingResult} The resulting product(s).
     */
    craft(item1, item2, recipe) {
        let product1 = recipe.products[0];
        let product2 = recipe.products[1];
        // First, check if either of the ingredients are also products.
        // If they are, simply decrease their uses.
        // If their uses would become 0, change the product to its next stage, if it has one.
        /** @type {number} */
        let item1Uses = null;
        /** @type {number} */
        let item2Uses = null;
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

        if (!item1.prefab.discreet) this.removeItemFromDescription(item1, "hands");
        if (!item2.prefab.discreet) this.removeItemFromDescription(item2, "hands");
        itemManager.replaceInventoryItem(item1, product1);
        itemManager.replaceInventoryItem(item2, product2);
        if (item1Uses !== null)
            item1.uses = item1Uses;
        if (item2Uses !== null)
            item2.uses = item2Uses;

        this.sendDescription(recipe.completedDescription, recipe);
        // Decide if this should be narrated or not.
        if (product1 && !product1.discreet || product2 && !product2.discreet) {
            let productPhrase = "";
            let product1Phrase = "";
            let product2Phrase = "";
            if (product1 && !product1.discreet) {
                product1Phrase = product1.singleContainingPhrase;
                this.addItemToDescription(item1, "hands");
            }
            if (product2 && !product2.discreet) {
                product2Phrase = product2.singleContainingPhrase;
                this.addItemToDescription(item2, "hands");
            }
            if (product1Phrase !== "" && product2Phrase !== "") productPhrase = `${product1Phrase} and ${product2Phrase}`;
            else if (product1Phrase !== "") productPhrase = product1Phrase;
            else if (product2Phrase !== "") productPhrase = product2Phrase;

            if (productPhrase !== "") new Narration(this.getGame(), this, this.location, `${this.displayName} crafts ${productPhrase}.`).send();
        }

        return { product1: product1 ? item1 : null, product2: product2 ? item2 : null };
    }

    /**
     * Reverses a crafting recipe to convert a single product into two ingredients.
     * @param {InventoryItem} item - The product to uncraft.
     * @param {Recipe} recipe - The recipe that describes how this product is crafted.
     * @returns {UncraftingResult} The resulting ingredients.
     */
    uncraft(item, recipe) {
        // If only one ingredient is discreet, the first ingredient should be the discreet one.
        // This will result in more natural sounding narrations.
        const oneDiscreet = !recipe.ingredients[0].discreet && recipe.ingredients[1].discreet || recipe.ingredients[0].discreet && !recipe.ingredients[1].discreet;
        let ingredient1 = oneDiscreet && recipe.ingredients[0].discreet ? recipe.ingredients[0] : recipe.ingredients[1];
        let ingredient2 = oneDiscreet && recipe.ingredients[0].discreet ? recipe.ingredients[1] : recipe.ingredients[0];

        const originalItemPhrase = item.singleContainingPhrase;
        const itemDiscreet = item.prefab.discreet;

        if (!itemDiscreet) this.removeItemFromDescription(item, "hands");
        const rightHand = this.inventoryCollection.get("RIGHT HAND");
        const leftHand = this.inventoryCollection.get("LEFT HAND");
        const ingredient1Instance = itemManager.replaceInventoryItem(item, ingredient1);
        const ingredient2Instance = itemManager.instantiateInventoryItem(
            ingredient2,
            this,
            rightHand.equippedItem === null ? "RIGHT HAND" : "LEFT HAND",
            null,
            "",
            1,
            new Map(),
            false
        );

        this.sendDescription(recipe.uncraftedDescription, recipe);
        if (!itemDiscreet || !ingredient1.discreet || !ingredient2.discreet) {
            let itemPhrase = item.singleContainingPhrase;
            let ingredientPhrase = "";
            let ingredient1Phrase = "";
            let ingredient2Phrase = "";
            let verb = "removes";
            let preposition = "from";
            if (!ingredient1.discreet) {
                if (ingredient1.singleContainingPhrase !== originalItemPhrase || ingredient1.singleContainingPhrase !== itemPhrase)
                    ingredient1Phrase = ingredient1.singleContainingPhrase;
                this.addItemToDescription(ingredient1Instance, "hands");
            }
            if (!ingredient2.discreet) {
                if (ingredient2.singleContainingPhrase !== originalItemPhrase || ingredient2.singleContainingPhrase !== itemPhrase)
                    ingredient2Phrase = ingredient2.singleContainingPhrase;
                this.addItemToDescription(ingredient2Instance, "hands");
            }
            if (ingredient1Phrase !== "" && ingredient2Phrase !== "") {
                itemPhrase = originalItemPhrase;
                ingredientPhrase = `${ingredient1Phrase} and ${ingredient2Phrase}`;
                verb = "separates";
                preposition = "into";
            }
            else if (ingredient1Phrase !== "") ingredientPhrase = ingredient1Phrase;
            else if (ingredient2Phrase !== "") ingredientPhrase = ingredient2Phrase;

            if (ingredientPhrase !== "") {
                ingredientPhrase = ` ${preposition} ${ingredientPhrase}`;
                new Narration(this.getGame(), this, this.location, `${this.displayName} ${verb} ${itemPhrase}${ingredientPhrase}.`).send();
            }
        }

        return { ingredient1: ingredient1Instance ? ingredient1Instance : null, ingredient2: ingredient2Instance ? ingredient2Instance : null };
    }

    /**
     * Returns the player's inventory item whose prefab ID matches the given ID, if it exists.
     * @param {string} id - The prefab ID to search for.
     * @returns {InventoryItem}
     */
    #findItem(id) {
        return this.getGame().inventoryItems.find(item =>
            item.player.name === this.name &&
            item.prefab !== null &&
            item.quantity > 0 &&
            item.prefab.id === id
        );
    }

    /**
     * Returns true if the player has an inventory item with the given prefab ID.
     * @param {string} id - The prefab ID to search for. 
     * @returns {boolean}
     */
    hasItem(id) {
        return !!this.#findItem(id);
    }

    /**
     * Attempts to solve a puzzle.
     * @param {Puzzle} puzzle - The puzzle to attempt.
     * @param {RoomItem|InventoryItem} item - The item instance required to attempt the puzzle.
     * @param {string} password - The password the player entered to attempt the puzzle.
     * @param {string} command - The command alias that was used to attempt the puzzle.
     * @param {string} input - The combined arguments of the command.
     * @param {UserMessage} [message] - The message that triggered the puzzle attempt.
     * @param {Player} [targetPlayer] - The player who will be treated as the initiating player in subsequent bot command executions called by the puzzle's solved commands, if applicable.
     * @returns {string|void} A message to show to the player indicating why their attempt failed.
     */
    attemptPuzzle(puzzle, item, password, command, input, message, targetPlayer) {
        const puzzleName = puzzle.parentFixture ? puzzle.parentFixture.name : puzzle.name;
        // Make sure all the requirements are met.
        let allRequirementsMet = true;
        let requiredItems = [];
        for (const requirement of puzzle.requirements) {
            if (requirement instanceof Puzzle && !requirement.solved ||
                requirement instanceof Event && !requirement.ongoing
            ) {
                allRequirementsMet = false;
                break;
            }
            else if (requirement instanceof Flag) {
                if (requirement.valueScript !== "") {
                    const value = requirement.evaluate();
                    requirement.setValue(value, true, this);
                }
                if (requirement.value !== true) {
                    allRequirementsMet = false;
                    break;
                }
            }
            else if (requirement instanceof Prefab) {
                if (item !== null && item.prefab.id !== requirement.id) {
                    allRequirementsMet = false;
                    break;
                }
                else if (item === null) {
                    const requiredItem = this.#findItem(requirement.id);
                    if (!requiredItem) {
                        allRequirementsMet = false;
                        break;
                    }
                    else if (!requiredItems.includes(requiredItem))
                        requiredItems.push(requiredItem);
                }
            }
        }
        if (allRequirementsMet && !puzzle.accessible && puzzle.requirements.length !== 0)
            puzzle.setAccessible();
        else if (!allRequirementsMet && puzzle.accessible)
            puzzle.setInaccessible();
        if (puzzle.accessible || (puzzle.type === "weight" || puzzle.type === "container") && (command === "take" || command === "drop")) {
            if (puzzle.requiresMod && !puzzle.solved) return "you need moderator assistance to do that.";
            if (puzzle.remainingAttempts === 0) {
                this.sendDescription(puzzle.noMoreAttemptsDescription, puzzle);
                new Narration(this.getGame(), this, this.location, `${this.displayName} attempts and fails to use the ${puzzleName}.`).send();

                return;
            }

            // Make sure all of the requirements are met before proceeding.
            let hasRequiredItem = false;
            let requiredItemName = "";
            let requirementsMet = false;
            const regex = /((Inventory)?Item|Prefab):/g;
            if (regex.test(puzzle.solutions.join(',')) && puzzle.type !== "container") {
                for (let i = 0; i < puzzle.solutions.length; i++) {
                    const solution = puzzle.solutions[i];
                    if (solution.startsWith("Item:") || solution.startsWith("InventoryItem:") || solution.startsWith("Prefab:")) {
                        if (item !== null && item.prefab.id === solution.substring(solution.indexOf(':') + 1).trim()) {
                            hasRequiredItem = true;
                            requiredItemName = solution;
                            break;
                        }
                        else if (item === null) {
                            const requiredItem = this.#findItem(solution.substring(solution.indexOf(':') + 1).trim());
                            if (requiredItem) {
                                hasRequiredItem = true;
                                requiredItemName = solution;
                                if (!requiredItems.includes(requiredItem))
                                    requiredItems.push(requiredItem);
                                break;
                            }
                        }
                        if (hasRequiredItem) break;
                    }
                }
            }
            else hasRequiredItem = true;

            if (puzzle.solved || hasRequiredItem || puzzle.type === "media"
                || (puzzle.type === "weight" || puzzle.type === "container") && (command === "take" || command === "drop"))
                requirementsMet = true;

            // Puzzle is solvable.
            if (requirementsMet) {
                if (puzzle.type === "password") {
                    if (puzzle.solved) puzzle.alreadySolved(this, `${this.displayName} uses the ${puzzleName}.`);
                    else {
                        if (password === "") return "you need to enter a password.";
                        else if (puzzle.solutions.includes(password)) puzzle.solve(this, `${this.displayName} uses the ${puzzleName}.`, password, true, requiredItems);
                        else puzzle.fail(this, `${this.displayName} uses the ${puzzleName}.`);
                    }
                }
                else if (puzzle.type === "interact" || puzzle.type === "matrix") {
                    if (puzzle.solved) puzzle.alreadySolved(this, `${this.displayName} uses the ${puzzleName}.`);
                    else puzzle.solve(this, `${this.displayName} uses the ${puzzleName}.`, requiredItemName, true, requiredItems);
                }
                else if (puzzle.type === "toggle") {
                    if (puzzle.solved && hasRequiredItem) {
                        let message = null;
                        if (puzzle.alreadySolvedDescription) message = parseDescription(puzzle.alreadySolvedDescription, puzzle, this);
                        puzzle.unsolve(this, `${this.displayName} uses the ${puzzleName}.`, message, true);
                    }
                    else if (puzzle.solved) puzzle.requirementsNotMet(this, `${this.displayName} attempts to use the ${puzzleName}, but struggles.`, command, input, message);
                    else puzzle.solve(this, `${this.displayName} uses the ${puzzleName}.`, requiredItemName, true, requiredItems);
                }
                else if (puzzle.type === "combination lock") {
                    // The lock is currently unlocked.
                    if (puzzle.solved) {
                        if (command === "unlock") return `${puzzleName} is already unlocked.`;
                        if (command !== "lock" && (password === "" || puzzle.solutions.includes(password)))
                            puzzle.alreadySolved(this, `${this.displayName} opens the ${puzzleName}.`);
                        // If the player enters something that isn't the solution, lock it.
                        else puzzle.unsolve(this, `${this.displayName} locks the ${puzzleName}.`, `You lock the ${puzzleName}.`, true);
                    }
                    // The lock is locked.
                    else {
                        if (command === "lock") return `${puzzleName} is already locked.`;
                        if (password === "") return "you need to enter a combination.";
                        else if (puzzle.solutions.includes(password)) puzzle.solve(this, `${this.displayName} unlocks the ${puzzleName}.`, password, true, requiredItems);
                        else puzzle.fail(this, `${this.displayName} attempts and fails to unlock the ${puzzleName}.`);
                    }
                }
                else if (puzzle.type === "key lock") {
                    // The lock is currently unlocked.
                    if (puzzle.solved) {
                        if (command === "unlock") return `${puzzleName} is already unlocked.`;
                        if (command === "lock" && hasRequiredItem) puzzle.unsolve(this, `${this.displayName} locks the ${puzzleName}.`, `You lock the ${puzzleName}.`, true);
                        else if (command === "lock") puzzle.requirementsNotMet(this, `${this.displayName} attempts and fails to lock the ${puzzleName}.`, command, input, message);
                        else puzzle.alreadySolved(this, `${this.displayName} opens the ${puzzleName}.`);
                    }
                    // The lock is locked.
                    else {
                        if (command === "lock") return `${puzzleName} is already locked.`;
                        puzzle.solve(this, `${this.displayName} unlocks the ${puzzleName}.`, requiredItemName, true, requiredItems);
                    }
                }
                else if (puzzle.type === "probability") {
                    if (puzzle.solved) puzzle.alreadySolved(this, `${this.displayName} uses the ${puzzleName}.`);
                    else {
                        const outcome = puzzle.solutions[Math.floor(Math.random() * puzzle.solutions.length)];
                        puzzle.solve(this, `${this.displayName} uses the ${puzzleName}.`, outcome, true, requiredItems);
                    }
                }
                else if (puzzle.type.endsWith("probability")) {
                    if (puzzle.solved) puzzle.alreadySolved(this, `${this.displayName} uses the ${puzzleName}.`);
                    else {
                        let stat = "";
                        const statName = Player.abbreviateStatName(puzzle.type.substring(0, puzzle.type.indexOf(" probability")));
                        if (statName === "str") stat = "str";
                        else if (statName === "per") stat = "per";
                        else if (statName === "dex") stat = "dex";
                        else if (statName === "spd") stat = "spd";
                        else if (statName === "sta") stat = "sta";

                        const dieRoll = new Die(this.getGame(), stat, this);
                        // Get the ratio of the result as part of the maximum roll, each relative to the minimum roll.
                        const ratio = (dieRoll.result - dieRoll.min) / (dieRoll.max - dieRoll.min);
                        // Clamp the result so that it can be used to choose an item in the array of solutions.
                        const clampedRatio = Math.min(Math.max(ratio, 0), 0.999);
                        const outcome = puzzle.solutions[Math.floor(clampedRatio * puzzle.solutions.length)];
                        puzzle.solve(this, `${this.displayName} uses the ${puzzleName}.`, outcome, true, requiredItems);
                    }
                }
                else if (puzzle.type === "channels") {
                    if (puzzle.solved) {
                        if (password === "") puzzle.unsolve(this, `${this.displayName} turns off the ${puzzleName}.`, `You turn off the ${puzzleName}.`, true);
                        else if (puzzle.solutions.includes(password)) puzzle.solve(this, `${this.displayName} changes the channel on the ${puzzleName}.`, password, true, requiredItems);
                        else puzzle.fail(this, `${this.displayName} attempts and fails to change the channel on the ${puzzleName}.`);
                    }
                    else {
                        if (!puzzle.solutions.includes(password)) password = puzzle.outcome ? puzzle.outcome : "";
                        puzzle.solve(this, `${this.displayName} turns on the ${puzzleName}.`, password, true, requiredItems);
                    }
                }
                else if (puzzle.type === "weight") {
                    if (puzzle.solved) {
                        if (!puzzle.solutions.includes(password)) puzzle.unsolve(this, "", null, true);
                    }
                    else {
                        if (puzzle.solutions.includes(password)) puzzle.solve(this, "", password, true, requiredItems);
                        else puzzle.fail(this, "");
                    }
                }
                else if (puzzle.type === "container") {
                    if (puzzle.solved) {
                        puzzle.unsolve(this, "", null, true);
                    }
                    const containedItems = password.split(',');
                    /** @param {string} solution */
                    let itemsMatch = function (solution) {
                        let requiredItems = solution.split('+');
                        if (requiredItems.length !== containedItems.length) return false;
                        for (let i = 0; i < requiredItems.length; i++)
                            requiredItems[i] = requiredItems[i].substring(requiredItems[i].indexOf(':') + 1).trim();
                        requiredItems.sort(function (a, b) {
                            if (a < b) return -1;
                            if (a > b) return 1;
                            return 0;
                        });
                        for (let i = 0; i < containedItems.length; i++)
                            if (containedItems[i] !== requiredItems[i]) return false;
                        return true;
                    };
                    let outcome = "";
                    for (let i = 0; i < puzzle.solutions.length; i++) {
                        if (itemsMatch(puzzle.solutions[i])) {
                            outcome = puzzle.solutions[i];
                            break;
                        }
                    }
                    if (outcome !== "") puzzle.solve(this, "", outcome, true, requiredItems);
                    else puzzle.fail(this, "");
                }
                else if (puzzle.type === "switch") {
                    if (puzzle.outcome === password) puzzle.alreadySolved(this, `${this.displayName} uses the ${puzzleName}, but nothing happens.`);
                    else if (puzzle.solutions.includes(password)) puzzle.solve(this, `${this.displayName} sets the ${puzzleName} to ${password}.`, password, true, requiredItems);
                    else puzzle.fail(this, `${this.displayName} attempts to set the ${puzzleName}, but struggles.`);
                }
                else if (puzzle.type === "option") {
                    if (puzzle.solved && password === "") puzzle.unsolve(this, `${this.displayName} resets the ${puzzleName}.`, `You clear the selection for the ${puzzleName}.`, true);
                    if (puzzle.outcome === password) puzzle.alreadySolved(this, `${this.displayName} sets the ${puzzleName}, but nothing changes.`);
                    else if (puzzle.solutions.includes(password)) puzzle.solve(this, `${this.displayName} sets the ${puzzleName} to ${password}.`, password, true, requiredItems);
                    else puzzle.fail(this, `${this.displayName} attempts to set the ${puzzleName}, but struggles.`);
                }
                else if (puzzle.type === "media") {
                    if (puzzle.solved && item === null) {
                        let message = null;
                        if (puzzle.alreadySolvedDescription) message = parseDescription(puzzle.alreadySolvedDescription, puzzle, this);
                        puzzle.unsolve(this, `${this.displayName} presses eject on the ${puzzleName}.`, message, true);
                    }
                    else if (puzzle.solved && item !== null)
                        return `you cannot insert ${item.singleContainingPhrase} into the ${puzzleName} as something is already inside it. Eject it first by sending \`.use ${puzzleName}\`.`;
                    else if (!puzzle.solved && item !== null) {
                        hasRequiredItem = false;
                        let solution = "";
                        for (let i = 0; i < puzzle.solutions.length; i++) {
                            if ((puzzle.solutions[i].startsWith("Item:") || puzzle.solutions[i].startsWith("InventoryItem:") || puzzle.solutions[i].startsWith("Prefab:")) &&
                                item.prefab.id === puzzle.solutions[i].substring(puzzle.solutions[i].indexOf(':') + 1).trim()) {
                                hasRequiredItem = true;
                                solution = puzzle.solutions[i];
                                break;
                            }
                        }
                        if (hasRequiredItem) puzzle.solve(this, `${this.displayName} inserts ` + (item.prefab.discreet ? "an item" : item.singleContainingPhrase) + ` into the ${puzzleName}.`, solution, true, requiredItems);
                        else puzzle.fail(this, `${this.displayName} attempts to insert ` + (item.prefab.discreet ? "an item" : item.singleContainingPhrase) + ` into the ${puzzleName}, but it doesn't fit.`);
                    }
                    else puzzle.requirementsNotMet(this, `${this.displayName} attempts to use the ${puzzleName}, but struggles.`, command, input, message);
                }
                else if (puzzle.type === "player") {
                    if (puzzle.solved) puzzle.alreadySolved(this, `${this.displayName} uses the ${puzzleName}.`);
                    else {
                        if (puzzle.solutions.includes(this.name)) puzzle.solve(this, `${this.displayName} uses the ${puzzleName}.`, this.name, true, requiredItems);
                        else puzzle.fail(this, `${this.displayName} uses the ${puzzleName}.`);
                    }
                }
                else if (puzzle.type === "room player") {
                    let solution = "";
                    if (targetPlayer) {
                        for (let i = 0; i < puzzle.solutions.length; i++) {
                            if (puzzle.solutions[i].toLowerCase() === targetPlayer.displayName.toLowerCase()) {
                                solution = puzzle.solutions[i];
                                break;
                            }
                        }
                    }
                    if (puzzle.solved) puzzle.alreadySolved(this, `${this.displayName} uses the ${puzzleName}.`);
                    else if (solution !== "") puzzle.solve(this, `${this.displayName} uses the ${puzzleName}.`, solution, true, requiredItems, targetPlayer);
                    else puzzle.fail(this, `${this.displayName} attempts to use the ${puzzleName}, but struggles.`);
                }
            }
            // The player is missing an item needed to solve the puzzle.
            else return puzzle.requirementsNotMet(this, `${this.displayName} attempts to use the ${puzzleName}, but struggles.`, command, input, message);
        }
        // The puzzle isn't accessible.
        else return puzzle.requirementsNotMet(this, `${this.displayName} uses the ${puzzleName}.`, command, input, message);
    }

    /**
     * Kills the player.
     */
    die() {
        this.location.removePlayer(this, undefined, undefined, `${this.displayName} dies.`);
        // Update various data.
        this.alive = false;
        this.location = null;
        this.hidingSpot = "";
        this.statusDisplays.length = 0;
        this.stopMoving();
        for (const status of this.statusCollection.values()) {
            if (status.timer !== null)
                status.timer.stop();
        }
        this.statusCollection.clear();
        // Move player to dead list.
        this.getGame().deadPlayersCollection.set(this.name, this);
        // Then remove them from living list.
        this.getGame().livingPlayersCollection.delete(this.name);
    }

    /**
     * Removes the player from all whispers they're in.
     * @param {string} narration - The text of the narration to send in the whisper channel when the player is removed.
     */
    removeFromWhispers(narration) {
        /** @type {number[]} */
        let deleteWhisperIndexes = [];
        for (let i = 0; i < this.getGame().whispers.length; i++) {
            for (let j = 0; j < this.getGame().whispers[i].players.length; j++) {
                if (this.getGame().whispers[i].players[j].name === this.name) {
                    // Remove player from the whisper.
                    const deleteWhisper = this.getGame().whispers[i].removePlayer(j, narration);
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
            this.getGame().whispers[index].delete(index);
        }
    }

    /**
     * Parses a description and sends it to the player.
     * @param {string} description - The description to parse and send.
     * @param {GameEntity} container - The game entity the description belongs to.
     */
    sendDescription(description, container) {
        if (description) {
            if (!this.hasBehaviorAttribute("unconscious") && (container && container instanceof Room)) {
                let defaultDropFixtureString = "";
                const defaultDropFixture = this.getGame().entityFinder.getFixture(this.getGame().settings.defaultDropFixture, container.id);
                if (defaultDropFixture)
                    defaultDropFixtureString = parseDescription(defaultDropFixture.description, defaultDropFixture, this);
                messageHandler.addRoomDescription(this, container, parseDescription(description, container, this), defaultDropFixtureString);
            }
            else if (!this.hasBehaviorAttribute("unconscious") || (container && container instanceof Status))
                messageHandler.addDirectNarration(this, parseDescription(description, container, this));
        }
    }

    /**
     * Sends a direct message to the player. Sends nothing if the player is unconscious or an NPC.
     * @param {string} messageText - The content of the message to send.
     * @param {boolean} [addSpectate=true] - Whether or not to mirror this message in the player's spectateChannel. Defaults to true.
     */
    notify(messageText, addSpectate = true) {
        if (!this.hasBehaviorAttribute("unconscious") && !this.isNPC)
            messageHandler.addDirectNarration(this, messageText, addSpectate);
    }

    /**
     * Sets the player as online and initiates a timer that will mark them as offline after 15 minutes of inactivity.
     */
    setOnline() {
        this.online = true;
        // Clear the existing timeout.
        if (this.onlineInterval)
            clearTimeout(this.onlineInterval);
        // Set the player as offline after 15 minutes of inactivity.
        let player = this;
        this.onlineInterval = setTimeout(
            () => player.setOffline(),
            15 * 60000
        );
    }

    /**
     * Sets the player as offline.
     */
    setOffline() {
        this.online = false;
        if (this.onlineInterval)
            clearTimeout(this.onlineInterval);
    }

    /** @returns {string} */
    descriptionCell() {
        return this.getGame().constants.playerSheetDescriptionColumn + this.row;
    }

    /**
     * Converts the name of a stat to its abbreviated form in all lowercase.
     * @param {string} statName 
     */
    static abbreviateStatName(statName) {
        statName = statName.toLowerCase().trim();
        if (statName === "strength")
            return "str";
        else if (statName === "perception" || statName === "intelligence" || statName === "int")
            return "per";
        else if (statName === "dexterity")
            return "dex";
        else if (statName === "speed")
            return "spd";
        else if (statName === "stamina")
            return "sta";
        else return statName;
    }
}
