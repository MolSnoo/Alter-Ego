import Room from "../Data/Room.ts";
import Whisper from "../Data/Whisper.ts";
import Moderator from "../Data/Moderator.ts";
import { ChannelType } from "discord.js";
import type Event from "../Data/Event.ts";
import type Fixture from "../Data/Fixture.ts";
import type Flag from "../Data/Flag.ts";
import type Game from "../Data/Game.ts";
import type Player from "../Data/Player.ts";
import type Prefab from "../Data/Prefab.ts";
import type Puzzle from "../Data/Puzzle.ts";
import type Status from "../Data/Status.ts";
import type { GuildMember, TextChannel } from "discord.js";

/**
 * A set of functions to manage game entities.
 */
export default abstract class GameEntityManager {
	/**
	 * The game this belongs to.
	 */
	readonly game: Game;

	/**
	 * @param game - The game this belongs to.
	 */
	protected constructor(game: Game) {
		this.game = game;
	}

	/**
	 * Clears all game data from memory.
	 */
	protected clearGame(): void {
		this.clearRooms();
		this.clearFixtures();
		this.clearPrefabs();
		this.clearRecipes();
		this.clearRoomItems();
		this.clearPuzzles();
		this.clearEvents();
		this.clearStatusEffects();
		this.clearPlayers();
		this.clearInventoryItems();
		this.clearGestures();
		this.clearFlags();
	}

	/**
	 * Clears all room data from memory.
	 */
	protected clearRooms(): void {
		this.game.rooms.clear();
	}

	/**
	 * Clears all fixture data from memory.
	 */
	protected clearFixtures(): void {
		this.game.fixtures.forEach(fixture => {
			if (fixture.recipeInterval !== null)
				fixture.recipeInterval.stop();
			if (fixture.process.timer !== null)
				fixture.process.timer.stop();
			if (fixture.hidingSpot !== null) {
				fixture.hidingSpot.occupants.length = 0;
				fixture.hidingSpot.deleteWhisper();
			}
		});
		this.game.fixtures.length = 0;
	}

	/**
	 * Clears all prefab data from memory.
	 */
	protected clearPrefabs(): void {
		this.game.prefabs.clear();
	}

	/**
	 * Clears all recipe data from memory.
	 */
	protected clearRecipes(): void {
		this.game.recipes.length = 0;
	}

	/**
	 * Clears all room item data from memory.
	 */
	protected clearRoomItems(): void {
		this.game.roomItems.length = 0;
	}

	/**
	 * Clears all puzzle data from memory.
	 */
	protected clearPuzzles(): void {
		this.game.puzzles.length = 0;
	}

	/**
	 * Clears all event data from memory.
	 */
	protected clearEvents(): void {
		this.game.events.forEach(event => {
			if (event.timer !== null)
				event.timer.stop();
			if (event.effectsTimer !== null)
				event.effectsTimer.stop();
		});
		this.game.events.clear();
	}

	/**
	 * Clears all status effect data from memory.
	 */
	protected clearStatusEffects(): void {
		this.game.statusEffects.clear();
	}

	/**
	 * Clears all player data from memory.
	 */
	protected clearPlayers(): void {
		this.game.players.forEach(player => {
			player.status.values().forEach(status => {
				if (status.timer !== null)
					status.timer.stop();
			});
			player.stopMoving();
			player.setOffline();
		});
		this.game.rooms.forEach(room => {
			room.occupants.length = 0;
		});
		this.game.players.clear();
		this.game.livingPlayers.clear();
		this.game.deadPlayers.clear();
	}

	/**
	 * Clears all inventory item data from memory.
	 */
	protected clearInventoryItems(): void {
		this.game.inventoryItems.length = 0;
	}

	/**
	 * Clears all gesture data from memory.
	 */
	protected clearGestures(): void {
		this.game.gestures.clear();
	}

	/**
	 * Clears all flag data from memory.
	 */
	protected clearFlags(): void {
		this.game.flags.clear();
	}

	/**
	 * Updates references to a given room throughout the game.
	 * @param room - The room to reference.
	 */
	protected updateRoomReferences(room: Room): void {
		this.game.livingPlayers.forEach(player => {
			if (Room.generateValidId(player.locationDisplayName) === room.id)
				room.addPlayer(player);
		});
		this.game.fixtures.forEach(fixture => {
			if (Room.generateValidId(fixture.locationDisplayName) === room.id)
				fixture.setLocation(room);
		});
		this.game.roomItems.forEach(roomItem => {
			if (Room.generateValidId(roomItem.locationDisplayName) === room.id)
				roomItem.setLocation(room);
		});
		this.game.puzzles.forEach(puzzle => {
			if (Room.generateValidId(puzzle.locationDisplayName) === room.id)
				puzzle.setLocation(room);
		});
		this.game.whispers.forEach(whisper => {
			if (whisper.locationId === room.id)
				whisper.setLocation(room);
		});
	}

	/**
	 * Updates references to a given fixture throughout the game.
	 * @param fixture - The fixture to reference.
	 */
	protected updateFixtureReferences(fixture: Fixture): void {
		this.game.roomItems.forEach(roomItem => {
			if (roomItem.location?.id === fixture.location?.id && roomItem.containerType === "Fixture" && roomItem.containerName === fixture.name)
				roomItem.setContainer(fixture);
		});
		this.game.puzzles.forEach(puzzle => {
			if (puzzle.location?.id === fixture.location?.id && puzzle.parentFixtureName !== "" && puzzle.parentFixtureName === fixture.name)
				puzzle.setParentFixture(fixture);
		});
	}

	/**
	 * Updates references to a given prefab throughout the game.
	 * @param prefab - The prefab to reference.
	 */
	protected updatePrefabReferences(prefab: Prefab): void {
		this.game.roomItems.forEach(roomItem => {
			if (roomItem.prefabId === prefab.id) {
				roomItem.setPrefab(prefab);
                roomItem.setNames();
            }
		});
		this.game.inventoryItems.forEach(inventoryItem => {
			if (inventoryItem.prefabId !== "" && inventoryItem.prefabId === prefab.id) {
				inventoryItem.setPrefab(prefab);
                inventoryItem.setNames();
            }
		});
		this.game.puzzles.forEach(puzzle => {
			puzzle.requirementsStrings.forEach((requirementsString, i) => {
				if (requirementsString.type === "Prefab" && requirementsString.entityId === prefab.id)
					puzzle.requirements[i] = prefab;
			});
		});
	}

	/**
	 * Updates references to a given puzzle throughout the game.
	 * @param puzzle - The puzzle to reference.
	 */
	protected updatePuzzleReferences(puzzle: Puzzle): void {
		this.game.fixtures.forEach(fixture => {
			if (fixture.location?.id === puzzle.location?.id && fixture.childPuzzleName !== "" && fixture.childPuzzleName === puzzle.name)
				fixture.setChildPuzzle(puzzle);
		});
		this.game.roomItems.forEach(roomItem => {
			if (roomItem.location?.id === puzzle.location?.id && roomItem.containerType === "Puzzle" && roomItem.containerName === puzzle.name)
				roomItem.setContainer(puzzle);
		});
	}

	/**
	 * Updates references to a given event throughout the game.
	 * @param event
	 */
	protected updateEventReferences(event: Event): void {
		this.game.puzzles.forEach(puzzle => {
			puzzle.requirementsStrings.forEach((requirementsString, i) => {
				if (requirementsString.type === "Event" && requirementsString.entityId === event.id)
					puzzle.requirements[i] = event;
			});
		});
	}

	/**
	 * Updates references to a given status effect throughout the game.
	 * @param status
	 */
	protected updateStatusEffectReferences(status: Status): void {
		this.game.prefabs.forEach(prefab => {
			prefab.effectsStrings.forEach((effectsString, i) => {
				if (effectsString === status.id)
					prefab.effects[i] = status;
			});
			prefab.curesStrings.forEach((curesString, i) => {
				if (curesString === status.id)
					prefab.cures[i] = status;
			});
		});
		this.game.events.forEach(event => {
			event.effectsStrings.forEach((effectsString, i) => {
				if (effectsString === status.id)
					event.effects[i] = status;
			});
			event.refreshesStrings.forEach((refreshesString, i) => {
				if (refreshesString === status.id)
					event.refreshes[i] = status;
			});
		});
		this.game.gestures.forEach(gesture => {
			gesture.disabledStatusesStrings.forEach((disabledStatusString, i) => {
				if (disabledStatusString === status.id)
					gesture.disabledStatuses[i] = status;
			});
		});
	}

	/**
	 * Updates references to a given flag throughout the game.
	 * @param flag
	 */
	protected updateFlagReferences(flag: Flag): void {
		this.game.puzzles.forEach(puzzle => {
			puzzle.requirementsStrings.forEach((requirementsString, i) => {
				if (requirementsString.type === "Flag" && requirementsString.entityId === flag.id)
					puzzle.requirements[i] = flag;
			});
		});
	}

	/**
	 * Creates a new whisper and adds it to the game's collection of whispers.
	 * @param players - The players to add to the whisper.
	 * @param hidingSpotName - The name of the hiding spot the whisper belongs to. Optional.
	 * @returns The created whisper.
	 */
	async createWhisper(players: Player[], hidingSpotName?: string): Promise<Whisper> {
		const whisper = new Whisper(this.game, players, hidingSpotName);
		whisper.channel = await this.#createWhisperChannel(whisper);
		this.game.whispers.set(whisper.id, whisper);
		return whisper;
	}

	/**
	 * Updates a whisper's key in the game's collection of whispers and edits its channel name.
	 * @param whisper - The whisper to edit.
	 * @param newId - The whisper's new ID.
	 */
	updateWhisperId(whisper: Whisper, newId: string): void {
		const oldId = whisper.id;
		whisper.id = newId;
		this.game.whispers.set(whisper.id, whisper);
		this.game.whispers.delete(oldId);
		whisper.channelName = whisper.id.substring(0, 100);
		whisper.channel.edit({ name: whisper.channelName });
	}

	/**
	 * Deletes a whisper from the game.
	 * @param whisper - The whisper to delete.
	 */
	async deleteWhisper(whisper: Whisper): Promise<void> {
		if (this.game.settings.autoDeleteWhisperChannels) await whisper.channel.delete().catch();
		else await whisper.channel.edit({ name: `archived-${whisper.location.id}`, lockPermissions: true });
		whisper.players.clear();
		this.game.whispers.delete(whisper.id);
	}

	/**
	 * Creates a channel for a whisper.
	 * @param whisper
	 * @returns The created channel.
	 */
	async #createWhisperChannel(whisper: Whisper): Promise<TextChannel> {
		return new Promise(resolve => {
			this.game.guildContext.guild.channels.create({
				name: whisper.channelName,
				type: ChannelType.GuildText,
				parent: this.game.guildContext.whisperCategoryId
			}).then(channel => {
				whisper.players.forEach(player => {
					const noChannel = player.isNPC
						|| player.isHidden() && player.getBehaviorAttributeStatusEffects("no channel").length > 1
						|| !player.isHidden() && player.hasBehaviorAttribute("no channel")
						|| !player.canHear();
					if (!noChannel) {
						channel.permissionOverwrites.create(player.id, {
							ViewChannel: true,
							ReadMessageHistory: true
						});
					}
				});
				resolve(channel);
			}).catch();
		});
	}

    /**
     * Gets the moderator associated with the given member, or creates one if it doesn't already exist.
     * @param member
     */
    getOrCreateModerator(member: GuildMember): Moderator {
        if (this.game.moderators.has(member.id)) return this.game.moderators.get(member.id);
        const moderator = new Moderator(member.id, member, this.game);
        this.game.moderators.set(moderator.id, moderator);
        return moderator;
    }
}
