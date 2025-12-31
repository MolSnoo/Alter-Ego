import GameEntity from "./GameEntity.js";
import Whisper from "./Whisper.js";
import { generatePlayerListString } from "../Modules/helpers.js";

/** @typedef {import("./Fixture.js").default} Fixture */
/** @typedef {import("./Game.js").default} Game */
/** @typedef {import("./Player.js").default} Player */

export default class HidingSpot extends GameEntity {
	/**
	 * The fixture this belongs to.
	 * @readonly
	 * @type {Fixture}
	 */
	#fixture;
	/**
	 * Whole number indicating how many players can hide in this hiding spot.
	 * @type {number}
	 */
	capacity;
	/**
	 * A list of players currently hidden in this hiding spot.
	 * @type {Player[]}
	 */
	occupants;
	/**
	 * The whisper currently associated with this hiding spot. If no one is hidden in this hiding spot, this is null.
	 * @type {Whisper}
	 */
	whisper;

	/**
	 * @constructor
	 * @param {Fixture} fixture - The fixture this belongs to.
	 * @param {number} capacity - Whole number indicating how many players can hide in this hiding spot.
	 * @param {number} row - The row number of the fixture in the sheet.
	 * @param {Game} game - The game this belongs to. 
	 */
	constructor(fixture, capacity, row, game) {
		super(game, row);
		this.#fixture = fixture;
		this.name = this.#fixture.name;
		this.capacity = capacity;
		this.occupants = [];
		this.whisper = null;
	}

	/**
	 * Adds a player to the hiding spot.
	 * @param {Player} player - The player to add to the hiding spot.
	 */
	async addPlayer(player) {
		if (!player.hasBehaviorAttribute("no sight")) this.deleteWhisper();
		this.occupants.push(player);
		player.hidingSpot = this.name;
		const whisper = new Whisper(this.getGame(), this.occupants, this.getLocation().id, this.getLocation());
		await whisper.init();
		this.getGame().whispers.push(whisper);
		this.whisper = whisper;
	}

	/**
	 * Removes a player from the hiding spot.
	 * @param {Player} player - The player to remove from the hiding spot. 
	 */
	removePlayer(player) {
		this.occupants.splice(this.occupants.indexOf(player), 1);
		const whisperNarration = this.getGame().notificationGenerator.generateUnhideNotification(player, false, this.getContainingPhrase());
		player.removeFromWhispers(whisperNarration);
		player.hidingSpot = "";
	}

	/**
	 * Removes all occupants from the whisper and sets it to null.
	 */
	deleteWhisper() {
		for (const occupant of this.occupants)
			occupant.removeFromWhispers("");
		this.whisper = null;
	}

	/**
	 * Gets the fixture this belongs to.
	 */
	getFixture() {
		return this.#fixture;
	}

	/**
     * Gets the fixture's name preceded by "the".
     */
    getContainingPhrase() {
        return `the ${this.name}`;
    }

	/**
	 * Gets the room this hiding spot is in.
	 */
	getLocation() {
		return this.#fixture.location;
	}

	/**
	 * Generates a string representing the occupants of the hiding spot.
	 * @param {boolean} [viewerHasNoSightBehaviorAttribute] - Whether or not to return a vague list indicating the quantity of occupants. Defaults to `false`.
	 */
	generateOccupantsString(viewerHasNoSightBehaviorAttribute = false) {
		if (viewerHasNoSightBehaviorAttribute) return this.occupants.length > 1 ? `${String(this.occupants.length)} people` : `someone`;
		return generatePlayerListString(this.occupants);
	}
}