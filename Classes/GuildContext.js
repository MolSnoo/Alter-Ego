import { Guild, Role, TextChannel } from "discord.js";

/**
 * @class GuildContext
 * @classdesc Represents the guild in which a Game is occurring and all of the parts of a Guild needed by the bot.
 * @constructor
 * @param {Guild} guild 
 * @param {TextChannel} commandChannel 
 * @param {TextChannel} logChannel 
 * @param {TextChannel} announcementChannel 
 * @param {TextChannel} testingChannel 
 * @param {TextChannel} generalChannel 
 * @param {Array<string>} roomCategories 
 * @param {string} whisperCategory 
 * @param {string} spectateCategory 
 * @param {Role} testerRole 
 * @param {Role} eligibleRole 
 * @param {Role} playerRole 
 * @param {Role} freeMovementRole 
 * @param {Role} moderatorRole 
 * @param {Role} deadRole 
 * @param {Role} spectatorRole 
 */
export default class GuildContext {
	/**
	 * @param {Guild} guild 
	 * @param {TextChannel} commandChannel 
	 * @param {TextChannel} logChannel 
	 * @param {TextChannel} announcementChannel 
	 * @param {TextChannel} testingChannel 
	 * @param {TextChannel} generalChannel 
	 * @param {Array<string>} roomCategories 
	 * @param {string} whisperCategory 
	 * @param {string} spectateCategory 
	 * @param {Role} testerRole 
	 * @param {Role} eligibleRole 
	 * @param {Role} playerRole 
	 * @param {Role} freeMovementRole 
	 * @param {Role} moderatorRole 
	 * @param {Role} deadRole 
	 * @param {Role} spectatorRole 
	 */
	constructor(
			guild,
			commandChannel,
			logChannel,
			announcementChannel,
			testingChannel,
			generalChannel,
			roomCategories,
			whisperCategory,
			spectateCategory,
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
		
		this.roomCategories = roomCategories;
		this.whisperCategory = whisperCategory;
		this.spectateCategory = spectateCategory;
		
		this.testerRole = testerRole;
		this.eligibleRole = eligibleRole;
  		this.playerRole = playerRole;
		this.freeMovementRole = freeMovementRole;
		this.moderatorRole = moderatorRole;
		this.deadRole = deadRole;
		this.spectatorRole = spectatorRole;
	}
}
