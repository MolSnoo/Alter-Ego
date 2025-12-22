import Exit from "../Data/Exit.js";
import Fixture from "../Data/Fixture.js";
import Game from "../Data/Game.js";
import Gesture from "../Data/Gesture.js";
import InventoryItem from "../Data/InventoryItem.js";
import Narration from "../Data/Narration.js";
import Player from "../Data/Player.js";
import Room from "../Data/Room.js";
import RoomItem from "../Data/RoomItem.js";
import { parseDescription } from "../Modules/parser.js";

/**
 * @class GameNarrationHandler
 * @classdesc A set of functions to send narrations.
 */
export default class GameNarrationHandler {
	/**
	 * The game this belongs to.
	 * @readonly
	 * @type {Game}
	 */
	game;

	/**
	 * @constructor
	 * @param {Game} game - The game this belongs to.
	 */
	constructor(game) {
		this.game = game;
	}

	/**
	 * Narrations a gesture action.
	 * @param {Gesture} gesture - The gesture being narrated.
	 * @param {Player} player - The player performing the gesture action.
	 */
	narrateGesture(gesture, player) {
		const narration = parseDescription(gesture.narration, gesture, player);
		new Narration(this.game, player, player.location, narration).send();
	}

	/**
	 * Narrates a stop action.
	 * @param {Player} player - The player performing the stop action.
	 */
	narrateStop(player) {
		const narration = `${player.displayName} stops moving.`;
		new Narration(this.game, player, player.location, narration).send();
	}

	/**
	 * Narrates an inspect action.
	 * @param {Room|Fixture|RoomItem|InventoryItem|Player} target - The target to inspect.
	 * @param {Player} player - The player performing the inspect action.
	 */
	narrateInspect(target, player) {
		let narration = "";
		if (target instanceof Room)
			narration = `${player.displayName} begins looking around the room.`;
		else if (target instanceof Fixture)
			narration = `${player.displayName} begins inspecting the ${target.name}.`;
		else if (target instanceof RoomItem && !target.prefab.discreet) {
			const preposition = target.getContainerPreposition();
			const containerPhrase = target.getContainerPhrase();
			narration = `${player.displayName} begins inspecting ${target.singleContainingPhrase} ${preposition} ${containerPhrase}.`;
		}
		else if (target instanceof InventoryItem && !target.prefab.discreet && target.player.name === player.name)
			narration = `${player.displayName} takes out ${target.singleContainingPhrase} and begins inspecting it.`;
		if (narration !== "")
			new Narration(this.game, player, player.location, narration).send();
	}

	/**
	 * Narrates a knock action.
	 * @param {Exit} exit - The exit to knock on.
	 * @param {Player} player - The player performing the knock action.
	 */
	narrateKnock(exit, player) {
		const roomNarration = `${player.displayName} knocks on ${exit.getNamePhrase()}.`;
		new Narration(this.game, player, player.location, roomNarration).send();
		const destination = exit.dest;
		if (destination.id === player.location.id) return;
		const hearingPlayers = destination.occupants.filter(occupant => !occupant.hasBehaviorAttribute("no hearing"));
		const destinationNarration = `There is a knock on ${destination.exitCollection.get(exit.link).getNamePhrase()}.`;
		// If the number of hearing players is the same as the number of occupants in the room, send the message to the room.
		if (hearingPlayers.length !== 0 && hearingPlayers.length === destination.occupants.length)
			new Narration(this.game, player, destination, destinationNarration).send();
		else {
			for (const hearingPlayer of hearingPlayers)
				hearingPlayer.notify(destinationNarration);
		}
	}
}