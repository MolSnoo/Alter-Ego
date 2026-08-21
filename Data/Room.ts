import { Collection, type TextChannel } from "discord.js";
import { generatePlayerListString, sortPlayersByDisplayName } from "../Modules/helpers.ts";
import { itemIdentifierMatches } from "../Modules/matchers.ts";
import Description from "./Description.ts";
import type Exit from "./Exit.ts";
import type Game from "./Game.ts";
import GameEntity from "./GameEntity.ts";
import Player from "./Player.ts";
import type RoomItem from "./RoomItem.ts";

export type RoomField = "id"|"displayName"|"tags"|"iconURL"|"exits"|"description";

/**
 * Represents a room in the game.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/room.html
 */
export default class Room extends GameEntity implements PersistentGameEntity<RoomField> {
    /**
     * The unique ID of the room.
     */
    readonly id: string;
    /**
     * The name of the room.
     *
     * @deprecated Use 'id' instead.
     */
    readonly name: string;
    /**
     * The name of the room for display purposes. Can contain uppercase letters and special characters. Not to be used for identification.
     */
    readonly displayName: string;
    /**
     * The channel associated with the room.
     */
    readonly channel: TextChannel;
    /**
     * The tags associated with the room.
     *
     * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/room.html#tags
     */
    tags: Set<string>;
    /**
     * The URL of the icon associated with the room.
     */
    iconURL: string;
    /**
     * The exits of the room.
     *
     * @deprecated Use `exits` instead.
     */
    exit: Exit[];
    /**
     * A collection of all exits in the room. The key is the exit's name.
     */
    exits: Collection<string, Exit>;
    /**
     * The default description of the room for when a player enters from the first listed exit or inspects the room.
     */
    readonly description: Description;
    /**
     * An array of all players currently in the room.
     */
    occupants: Player[];
    /**
     * A list of all players currently in the room, listed by their displayNames in alphabetical order.
     * Players with the `hidden` behavior attribute are omitted.
     */
    occupantsString: string;

    /**
     * @param id - The unique ID of the room.
     * @param displayName - The name of the room for display purposes. Can contain uppercase letters and special characters.
     * @param channel - The channel associated with the room.
     * @param tags - The tags associated with the room. {@link https://msvblank.github.io/Alter-Ego/reference/data_structures/room.html#tags}
     * @param iconURL - The URL of the icon associated with the room.
     * @param exits - The exits of the room.
     * @param description - The default description of the room for when a player enters from the first listed exit or inspects the room.
     * @param row - The row number of the room in the sheet.
     * @param game - The game this belongs to.
     */
    constructor(id: string, displayName: string, channel: TextChannel, tags: Set<string>, iconURL: string, exits: Collection<string, Exit>, description: string, row: number, game: Game) {
        super(game, row);
        this.id = id;
        this.displayName = displayName;
        this.name = this.id;
        this.channel = channel;
        this.tags = tags;
        this.iconURL = iconURL;
        this.exit = [];
        this.exits = exits;
        this.description = new Description(description, this, game);
        this.occupants = [];
        this.occupantsString = "";
    }

    /**
     * Adds a player to the room.
     *
     * @param player - The player to add to the room.
     * @param entrance - The exit they're entering from, if applicable.
     */
    addPlayer(player: Player, entrance?: Exit): void {
        player.setLocation(this);
        // Set the player's position.
        if (entrance) {
            player.pos.x = entrance.pos.x;
            player.pos.y = entrance.pos.y;
            player.pos.z = entrance.pos.z;
        }
        // If no entrance is given, try to calculate the center of the room by averaging the coordinates of all exits.
        else {
            let coordSum: Pos = { x: 0, y: 0, z: 0 };
            this.exits.forEach(exit => {
                coordSum.x += exit.pos.x;
                coordSum.y += exit.pos.y;
                coordSum.z += exit.pos.z;
            });
            let pos: Pos = { x: 0, y: 0, z: 0 };
            pos.x = Math.floor(coordSum.x / this.exits.size);
            pos.y = Math.floor(coordSum.y / this.exits.size);
            pos.z = Math.floor(coordSum.z / this.exits.size);
            player.pos = pos;
        }

        if (!player.hasBehaviorAttribute("no channel"))
            this.joinChannel(player);

        this.occupants.push(player);
        this.setOccupantsString();
    }

    /**
     * Removes a player from the room.
     *
     * @param player - The player to remove from the room.
     */
    removePlayer(player: Player): void {
        this.leaveChannel(player);
        this.occupants.splice(this.occupants.indexOf(player), 1);
        this.setOccupantsString();
    }

    /**
     * Gets the ID of the channel associated with this room.
     */
    getChannelId(): string {
        return this.channel.id;
    }

    /**
     * Gets a list of the room's occupants excluding the given player, sorted alphabetically by display name.
     *
     * @param player - The player to exclude.
     * @param list - A custom list of players. By default, this is the list of the room's occupants with hidden players and the given player excluded.
     */
    getOccupantsExcluding(player: Player, list: Player[] = this.occupants.filter(occupant => !occupant.isHidden() && occupant.name !== player.name)): Player[] {
        sortPlayersByDisplayName(list);
        return list;
    }

    /**
     * Generates a string representing the occupants of the room, sorted alphabetically by display name.
     *
     * @param list - A custom list of players. By default, this is the list of the room's occupants with hidden players excluded.
     */
    generateOccupantsString(list: Player[] = this.occupants.filter(occupant => !occupant.isHidden())): string {
        return generatePlayerListString(list);
    }

    /**
     * Generates a string representing the occupants of the room excluding the given player, sorted alphabetically by display name.
     *
     * @param player - The player to exclude.
     * @param list - A custom list of players. By default, this is the list of the room's occupants with hidden players and the given player excluded.
     */
    generateOccupantsStringExcluding(player: Player, list: Player[] = this.occupants.filter(occupant => !occupant.isHidden() && occupant.name !== player.name)): string {
        return generatePlayerListString(list);
    }

    /**
     * Sets the room's occupants string to the given string. By default, sets it to the room's occupants, sorted alphabetically by display name with hidden players excluded.
     */
    setOccupantsString(occupantsString = this.generateOccupantsString()): void {
        this.occupantsString = occupantsString;
    }

    /**
     * Gives player permission to view the room's channel.
     */
    joinChannel(player: Player): void {
        if (!player.isNPC) this.channel.permissionOverwrites.create(player.member, { ViewChannel: true });
    }

    /**
     * Removes player's permission to view the room's channel.
     */
    leaveChannel(player: Player): void {
        if (!player.isNPC) this.channel.permissionOverwrites.create(player.member, { ViewChannel: null });
    }

    /**
     * Gets the exit with the given name.
     *
     * @param name - The name of the exit to get.
     */
    getExit(name: string): Exit {
        return this.getGame().entityFinder.getExit(this, name);
    }

    /**
     * Returns the URL to use for the room in the room description display component.
     */
    getIconURL(): string {
        return this.iconURL !== "" ? this.iconURL
            : this.getGame().settings.defaultRoomIconURL !== "" ? this.getGame().settings.defaultRoomIconURL
                : this.getGame().guildContext.guild.iconURL();
    }

    /**
     * Returns true if the room has the given tag.
     */
    hasTag(tag: string): boolean {
        return this.tags.has(tag);
    }

    /**
     * Returns true if the room has the `audio surveilled` tag.
     */
    isAudioSurveilled(): boolean {
        return this.hasTag("audio surveilled");
    }

    /**
     * Returns false if the room has the `video surveilled` tag.
     */
    isVideoSurveilled(): boolean {
        return this.hasTag("video surveilled");
    }

    /**
     * Returns true if the room has the `audio monitoring` tag.
     */
    isAudioMonitoring(): boolean {
        return this.hasTag("audio monitoring");
    }

    /**
     * Returns false if the room has the `video monitoring` tag.
     */
    isVideoMonitoring(): boolean {
        return this.hasTag("video monitoring");
    }

    /**
     * Returns the display name to use for the room in rooms with the `audio monitoring` or `video monitoring` tag.
     *
     * @param monitoringRoomCanBeSeen - Whether or not the room that's monitoring this one can be seen.
     */
    getSurveilledDisplayName(monitoringRoomCanBeSeen: boolean): string {
        return this.hasTag("secret")
            ? this.isVideoSurveilled() && monitoringRoomCanBeSeen
                ? "Surveillance feed" : "Intercom"
            : this.displayName;
    }

    /** Gets the entity's location. */
    getLocation(): Room {
        return this;
    }

    /**
     * Returns a custom ID for this room.
     */
    getInspectActionDirectiveArgs(): [string, Room] {
        return ["R", this];
    }

    /**
     * Returns the args for the Find ActionDirective to get all entities of the given type in this room.
     * @param entityType - The type of entity to find.
     */
    getFindActionDirectiveArgs(entityType: "Fixtures" | "RoomItems" | "Puzzles"): [string] {
        return [`${entityType} at ${this.displayName}`];
    }

    /**
     * Gets all of the items in this room.
     */
    getContainedItems(): RoomItem[] {
        return this.getGame().entityFinder.getRoomItems(undefined, this.id);
    }

    /**
	 * Returns true if this room contains no items.
	 */
	containsNoItems(): boolean {
		return this.getContainedItems().length === 0;
	}

    /**
     * Returns true if this room contains an item with the given identifier or prefab ID.
     * @param identifier - The identifier or prefab ID to search for.
     */
    containsItem(identifier: string): boolean {
        const containedItems = this.getContainedItems();
        for (const item of containedItems) {
            if (itemIdentifierMatches(item, identifier, true)) return true;
        }
        return false;
    }

    /**
     * Returns the item contained inside of this room with the given identifier or prefab ID.
     * If no such item exists, returns undefined. 
     * @param identifier - The identifier or prefab ID to search for.
     */
    getContainedItem(identifier: string): RoomItem {
        return this.getGame().entityFinder.getRoomItem(identifier, this.id);
    }

    descriptionCell(): string {
        return this.getGame().constants.roomSheetDescriptionColumn + this.row;
    }

    getEntityID(): string {
        return this.displayName;
    }

    getLabel(field: RoomField): string {
        switch (field) {
            case "id": return "Room ID";
            case "displayName": return "Room Display Name";
            case "tags": return "Room Tags";
            case "iconURL": return "Icon URL";
            case "exits": return "Exits";
            case "description": return "Description";
        }
    }

    getValue(field: RoomField): string {
        switch (field) {
            case "id": return this.id;
            case "displayName": return this.displayName;
            case "tags": return Array.from(this.tags).join(", ");
            case "iconURL": return this.iconURL;
            case "exits": return this.exits.map(exit => `${exit.name} on row ${exit.row}`).join(", ");
            case "description": return this.description.text;
        }
    }

    getViewField(field: RoomField): ViewField {
        return { label: this.getLabel(field), value: this.getValue(field) };
    }

    override getEntityType(): "Room" {
        return "Room";
    }

    /**
     * Convert a room name to a valid Discord channel name which can be used as a Room's ID.
     *
     * @param name - A string, preferably the name of a room.
     */
    static generateValidId(name: string): string {
        return name?.toLowerCase().replace(/[+=/<>\[\]!@#$%^&*()'":;,?`~\\|{}]/g, '').trim().replace(/ /g, '-');
    }
}
