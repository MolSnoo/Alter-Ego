/** @typedef {import("discord.js").Guild} Guild */
/** @typedef {import("discord.js").Role} Role */
/** @typedef {import("discord.js").TextChannel} TextChannel */

/**
 * @class GuildContext
 * @classdesc Represents the guild in which a Game is occurring and all of the parts of a Guild needed by the bot.
 */
export default class GuildContext {
	/**
	 * The guild in which the game is taking place.
	 * @type {Guild}
	 */
	guild;
	/**
	 * The channel where the bot will accept commands from a moderator.
	 * @type {TextChannel}
	 */
	commandChannel;
	/**
	 * The channel where the bot logs all notable occurrences in the game.
	 * @type {TextChannel}
	 */
	logChannel;
	/**
	 * The channel where announcements from the player with the freeMovementRole will be mirrored in all players' spectate channels.
	 * @type {TextChannel}
	 */
	announcementChannel;
	/**
	 * The channel where startgame and endgame announcements are posted when debug mode is enabled.
	 * @type {TextChannel}
	 */
	testingChannel;
	/**
	 * The channel where startgame and endgame announcements are posted when debug mode is disabled.
	 */
	generalChannel;
	/**
	 * An array of IDs for room channel parent categories.
	 * @type {string[]}
	 */
	roomCategories;
	/**
	 * The ID of the category channel that houses whisper channels.
	 * @type {string}
	 */
	whisperCategoryId;
	/**
	 * The ID of the category channel that houses spectate channels.
	 * @type {string}
	 */
	spectateCategoryId;
	/**
	 * The tester role. Members with this role can use eligible commands when debug mode is enabled.
	 * @type {Role}
	 */
	testerRole;
	/**
	 * The eligible role. Members with this role can use eligible commands when debug mode is disabled.
	 * @type {Role}
	 */
	eligibleRole;
	/**
	 * The player role. Members with this role can use player commands.
	 * @type {Role}
	 */
	playerRole;
	/**
	 * A role that can be added to someone with the player role to allow them to move to any room, regardless of if it's adjacent to their current room.
	 * @type {Role}
	 */
	freeMovementRole;
	/**
	 * The moderator role. Members with this role can use moderator commands.
	 * @type {Role}
	 */
	moderatorRole;
	/**
	 * The dead role. This is given to dead players after a moderator uses the reveal command on them.
	 * @type {Role}
	 */
	deadRole;
	/**
	 * The spectator role. This is given to all players when the endgame command is used.
	 * @type {Role}
	 */
	spectatorRole;

	/**
	 * @constructor
	 * @param {Guild} guild - The guild in which the game is taking place.
	 * @param {TextChannel} commandChannel - The channel where the bot logs all notable occurrences in the game.
	 * @param {TextChannel} logChannel - The channel where announcements from the player with the freeMovementRole will be mirrored in all players' spectate channels.
	 * @param {TextChannel} announcementChannel - The channel where announcements from the player with the freeMovementRole will be mirrored in all players' spectate channels.
	 * @param {TextChannel} testingChannel - The channel where startgame and endgame announcements are posted when debug mode is enabled.
	 * @param {TextChannel} generalChannel - The channel where startgame and endgame announcements are posted when debug mode is disabled.
	 * @param {string[]} roomCategories - An array of IDs for room channel parent categories.
	 * @param {string} whisperCategoryId - The ID of the category channel that houses whisper channels.
	 * @param {string} spectateCategoryId - The ID of the category channel that houses spectate channels. 
	 * @param {Role} testerRole - The tester role. Members with this role can use eligible commands when debug mode is enabled.
	 * @param {Role} eligibleRole - The eligible role. Members with this role can use eligible commands when debug mode is disabled.
	 * @param {Role} playerRole - The player role. Members with this role can use player commands.
	 * @param {Role} freeMovementRole - A role that can be added to someone with the player role to allow them to move to any room, regardless of if it's adjacent to their current room.
	 * @param {Role} moderatorRole - The moderator role. Members with this role can use moderator commands.
	 * @param {Role} deadRole - The dead role. This is given to dead players after a moderator uses the reveal command on them.
	 * @param {Role} spectatorRole - The spectator role. This is given to all players when the endgame command is used.
	 */
	constructor(
			guild,
			commandChannel,
			logChannel,
			announcementChannel,
			testingChannel,
			generalChannel,
			roomCategories,
			whisperCategoryId,
			spectateCategoryId,
			testerRole,
			eligibleRole,
			playerRole,
			freeMovementRole,
			moderatorRole,
			deadRole,
			spectatorRole
		) {
		this.guild = guild;
		this.commandChannel = commandChannel;
		this.logChannel = logChannel;
		this.announcementChannel = announcementChannel;
		this.testingChannel = testingChannel;
		this.generalChannel = generalChannel;
		
		for (let i = 0; i < roomCategories.length; i++)
			roomCategories[i] = roomCategories[i].trim();
		this.roomCategories = roomCategories;
		this.whisperCategoryId = whisperCategoryId;
		this.spectateCategoryId = spectateCategoryId;
		
		this.testerRole = testerRole;
		this.eligibleRole = eligibleRole;
  		this.playerRole = playerRole;
		this.freeMovementRole = freeMovementRole;
		this.moderatorRole = moderatorRole;
		this.deadRole = deadRole;
		this.spectatorRole = spectatorRole;
	}
}
