/** @typedef {import("../Data/Dialog.js").default} Dialog */
/** @typedef {import("../Data/Game.js").default} Game */
/** @typedef {import("../Data/Player.js").default} Player */
/** @typedef {import("../Data/Exit.js").default} Exit */
/** @typedef {import("../Data/ItemInstance.js").default} ItemInstance */
/** @typedef {import("../Data/Puzzle.js").default} Puzzle */
/** @typedef {import("../Data/Recipe.js").default} Recipe */

/**
 * @class GameNotificationGenerator
 * @classdesc A set of functions to generate notification messages to send to players.
 */
export default class GameNotificationGenerator {
	/**
	 * The game this belongs to.
	 * @readonly
	 * @type {Game}
	 */
	#game;

	/**
	 * @constructor
	 * @param {Game} game - The game this belongs to.
	 */
	constructor(game) {
		this.#game = game;
	}

	/**
	 * Generates a notification indicating the player cannot speak because they have a status effect with the `no speech` behavior attribute.
	 * @param {string} statusId - The ID of the status effect that made the player unable to speak.
	 */
	generatePlayerNoSpeechNotification(statusId) {
		return `You are ${statusId}, so you cannot speak.`;
	}

	/**
	 * Generates a notification indicating that a player heard spoken dialog.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 */
	generateHearDialogNotification(player, dialog) {
		const playerIsBeingMimicked = dialog.speakerRecognitionName === player.name;
		const playerRecognizesSpeaker = player.hasBehaviorAttribute(`knows ${dialog.speakerRecognitionName}`);
		const playerCanSee = !player.hasBehaviorAttribute("no sight");
		const playerAndSpeakerAreHidingTogether = dialog.speaker.hasBehaviorAttribute("hidden") && player.hasBehaviorAttribute("hidden") && dialog.speaker.hidingSpot === player.hidingSpot;
		const playerCanSeeSpeaker = playerCanSee && (!dialog.speaker.hasBehaviorAttribute(`hidden`) || playerAndSpeakerAreHidingTogether);
		
		let speakerString = "";
		if (playerRecognizesSpeaker && !playerIsBeingMimicked)
			speakerString = playerCanSeeSpeaker ? `${dialog.speaker.displayName}, with ${dialog.speakerVoiceString} you recognize as ${dialog.speakerRecognitionName}'s,` : `${dialog.speakerRecognitionName}`;
		else if (!playerCanSeeSpeaker)
			speakerString = playerIsBeingMimicked ? `someone in the room` : `someone in the room with ${dialog.speakerVoiceString}`;
		else
			speakerString = `${dialog.speakerDisplayName}`;
		const verb = dialog.isShouted ? `shouts` : `says`;
		const punctuation = playerIsBeingMimicked ? ` in your voice!` : `.`;
		return `${speakerString} ${verb} "${dialog.content}"${punctuation}`;
	}

	/**
	 * Generates a notification indicating that a player heard whispered dialog.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {Dialog} dialog - The dialog that was whispered.
	 */
	generateHearWhisperNotification(player, dialog) {
		const playerIsBeingMimicked = dialog.speakerRecognitionName === player.name;
		const playerRecognizesSpeaker = player.hasBehaviorAttribute(`knows ${dialog.speakerRecognitionName}`);
		const playerCanSee = !player.hasBehaviorAttribute("no sight");

		let speakerString = "";
		if (playerRecognizesSpeaker)
			speakerString = playerCanSee ? `${dialog.speaker.displayName}, with ${dialog.speakerVoiceString} you recognize as ${dialog.speakerRecognitionName}'s,` : `${dialog.speakerRecognitionName}`;
		else if (!playerCanSee)
			speakerString = playerIsBeingMimicked ? `someone` : `someone with ${dialog.speakerVoiceString}`;
		else
			speakerString = `${dialog.speakerDisplayName}`;
		const punctuation = playerIsBeingMimicked ? ` in your voice!` : `.`;
		return `${speakerString} whispers "${dialog.content}"${punctuation}`;
	}

	/**
	 * Generates a notification indicating that a player with the `acute hearing` behavior attribute overheard whispered dialog.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {Dialog} dialog - The dialog that was overheard.
	 */
	generateAcuteHearingPlayerOverhearWhisperNotification(player, dialog) {
		const playerIsBeingMimicked = dialog.speakerRecognitionName === player.name;
		const playerRecognizesSpeaker = player.hasBehaviorAttribute(`knows ${dialog.speakerRecognitionName}`);
		const playerCanSee = !player.hasBehaviorAttribute("no sight");
		const playerCanSeeSpeaker = playerCanSee && !dialog.speaker.hasBehaviorAttribute(`hidden`);

		let speakerString = "";
		if (playerRecognizesSpeaker && !playerIsBeingMimicked)
			speakerString = playerCanSeeSpeaker ? `${dialog.speaker.displayName}, with ${dialog.speakerVoiceString} you recognize as ${dialog.speakerRecognitionName}'s,` : `${dialog.speakerRecognitionName}`;
		else if (!playerCanSeeSpeaker)
			speakerString = playerIsBeingMimicked ? `someone in the room` : `someone in the room with ${dialog.speakerVoiceString}`;
		else
			speakerString = `${dialog.speakerDisplayName}`;
		const punctuation = playerIsBeingMimicked ? ` in your voice!` : `.`;
		return `You overhear ${speakerString} whisper "${dialog.content}"${punctuation}`;
	}

	/**
	 * Generates a notification indicating that a player heard dialog from a neighboring room.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 */
	generateHearNeighboringRoomDialogNotification(player, dialog) {
		const playerIsBeingMimicked = dialog.speakerRecognitionName === player.name;
		const playerRecognizesSpeaker = player.hasBehaviorAttribute(`knows ${dialog.speakerRecognitionName}`);
		
		let speakerString = "";
		let locator = "";
		if (playerRecognizesSpeaker && !playerIsBeingMimicked) {
			speakerString = `${dialog.speakerRecognitionName}`;
			locator = ` in a nearby room`;
		}
		else
			speakerString = playerIsBeingMimicked ? `someone in a nearby room` : `${dialog.speakerVoiceString} in a nearby room`;
		const verb = dialog.isShouted ? `shouts` : `says`;
		const punctuation = playerIsBeingMimicked ? ` in your voice!` : `.`;
		return `${speakerString} ${verb} "${dialog.content}"${locator}${punctuation}`;
	}

	/**
	 * Generates a notification indicating that a player heard dialog from a room that neighbors a room with the `audio surveilled` tag.
	 * @param {string} roomDisplayName - The displayed name of the audio surveilled room that neighbors the room the dialog was spoken in.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 */
	generateHearAudioSurveilledNeighboringRoomDialogNotification(roomDisplayName, player, dialog) {
		return `\`[${roomDisplayName}]\` ${this.generateHearNeighboringRoomDialogNotification(player, dialog)}`;
	}

	/**
	 * Generates a notification indicating that a player heard dialog from a room with the `audio surveilled` tag.
	 * @param {string} roomDisplayName - The displayed name of the audio surveilled room the dialog was spoken in.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 */
	generateHearAudioSurveilledRoomDialogNotification(roomDisplayName, player, dialog) {
		const playerIsBeingMimicked = dialog.speakerRecognitionName === player.name;
		const playerRecognizesSpeaker = player.hasBehaviorAttribute(`knows ${dialog.speakerRecognitionName}`);
		const playerCanSee = !player.hasBehaviorAttribute("no sight");
		const playerCanSeeSpeaker = playerCanSee && player.location.tags.includes("video monitoring") && dialog.location.tags.includes("video surveilled") && !dialog.speaker.hasBehaviorAttribute("hidden");

		let speakerString = "";
		if (playerRecognizesSpeaker && !playerIsBeingMimicked)
			speakerString = playerCanSeeSpeaker ? `${dialog.speaker.displayName}, with ${dialog.speakerVoiceString} you recognize as ${dialog.speakerRecognitionName}'s,` : `${dialog.speakerRecognitionName}`;
		else if (!playerCanSeeSpeaker)
			speakerString = playerIsBeingMimicked ? `someone in the room` : `someone in the room with ${dialog.speakerVoiceString}`;
		else
			speakerString = `${dialog.speakerDisplayName}`;
		const verb = dialog.isShouted ? `shouts` : `says`;
		const punctuation = playerIsBeingMimicked ? ` in your voice!` : `.`;
		return `\`[${roomDisplayName}]\` ${speakerString} ${verb} "${dialog.content}"${punctuation}`;
	}

	/**
	 * Generates a notification indicating that a player heard dialog through a player with the `receiver` behavior attribute. 
	 * @param {Player} player - The player referred to in this notification.
	 * @param {Dialog} dialog - The dialog that was spoken.
	 * @param {string} [receiverName] - The name of the inventory item that gave the player the `receiver` behavior attribute. Defaults to "receiver".
	 * @param {boolean} [receiverBelongsToPlayer] - Whether or not the receiver inventory item belongs to the player being notified.
	 */
	generateHearReceiverDialogNotification(player, dialog, receiverName = "receiver", receiverBelongsToPlayer) {
		const receiverOwnerName = receiverBelongsToPlayer ? `your` : `${player.displayName}'s`;
		const playerIsBeingMimicked = dialog.speakerRecognitionName === player.name;
		const playerRecognizesSpeaker = player.hasBehaviorAttribute(`knows ${dialog.speakerRecognitionName}`);

		let speakerString = "";
		let receiverString = "";
		if (playerRecognizesSpeaker && !playerIsBeingMimicked) {
			speakerString = `${dialog.speakerRecognitionName}`;
			receiverString = ` through ${receiverOwnerName} ${receiverName}`;
		}
		else
			speakerString = playerIsBeingMimicked ? `someone speaking through ${receiverOwnerName} ${receiverName}` : `${dialog.speakerVoiceString} coming from ${receiverOwnerName} ${receiverName}`;
		const verb = dialog.isShouted ? `shouts` : `says`;
		const punctuation = playerIsBeingMimicked ? ` in your voice!` : `.`;
		return `${speakerString} ${verb} "\`${dialog.content}\`"${receiverString}${punctuation}`;
	}

	/**
	 * Generates a whisper action notification.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} playerListString - A list of the other players in the whisper.
	 */
	generateWhisperNotification(player, secondPerson, playerListString) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `begin` : `begins`;
		const whisperPhrase = playerListString ? ` to ${playerListString}` : ``;
		return `${subject} ${verb} whispering${whisperPhrase}.`;
	}

	/**
	 * Generates a text action notification.
	 * @param {string} messageText - The text content of the text message.
	 * @param {string} senderName - The name of the sender.
	 * @param {string} [recipientName] - The name of the recipient, if needed.
	 */
	generateTextNotification(messageText, senderName, recipientName) {
		if (messageText.length > 1900) messageText = messageText.substring(0, 1897) + "...";
		const recipientDisplay = recipientName ? ` -> ${recipientName}` : ``;
		return `\`[ ${senderName}${recipientDisplay} ]\` ${messageText}`;
	}

	/**
	 * Generates a notification indicating the player started moving toward an exit.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {boolean} isRunning - Whether or not the player is running.
	 * @param {string} exitName - The name of the exit the player is moving toward.
	 */
	generateStartMoveNotification(player, secondPerson, isRunning, exitName) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `start` : `starts`;
		const action = isRunning ? `running` : `walking`;
		return `${subject} ${verb} ${action} toward ${exitName}.`;
	}

	/**
	 * Generates a notification indicating the player has depleted half of their stamina while moving.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 */
	generateHalfStaminaNotification(player, secondPerson) {
		const subject = secondPerson ? `Your breathing` : `${player.displayName}'s breathing`;
		const sentence2 = secondPerson ? `You might want to stop moving and rest soon.` : `It seems like ${player.pronouns.sbj}${player.pronouns.plural ? `'re` : `'s`} starting to get tired.`;
		return `${subject} is starting to get heavy. ${sentence2}`;
	}

	/**
	 * Generates a notification indicating the player has become weary.
	 * @param {Player} player - The player referred to in this notification.
	 */
	generateWearyNotification(player) {
		return `${player.displayName} stops moving. ${player.pronouns.Sbj} ${player.pronouns.plural ? `seem` : `seems`} weary.`;
	}

	/**
	 * Generates a notification indicating the player has stopped moving.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 */
	generateStopNotification(player, secondPerson) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `stop` : `stops`;
		return `${subject} ${verb} moving.`;
	}

	/**
	 * Generates a notification indicating the player cannot move to an exit because it is locked.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} exitPhrase - The phrase of the locked exit.
	 */
	generateExitLockedNotification(player, secondPerson, exitPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `try` : `tries`;
		return `${subject} ${verb} to open ${exitPhrase}, but it seems to be locked.`;
	}

	/**
	 * Generates a notification indicating the player exited a room.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} exitName - The name of the exit the player exited through.
	 * @param {string} appendString - A string describing any non-discreet inventory items the player is carrying.
	 */
	generateExitNotification(player, secondPerson, exitName, appendString) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `exit` : `exits`;
		const exitPhrase = exitName ? ` into ${exitName}` : ``;
		return `${subject} ${verb}${exitPhrase}${appendString}.`;
	}

	/**
	 * Generates a notification indicating the player with the free movement role exited a room.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} roomName - The display name of the room the player exited.
	 * @param {string} appendString - A string describing any non-discreet inventory items the player is carrying.
	 */
	generateSuddenExitNotification(player, secondPerson, roomName, appendString) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `exit ${roomName}` : `suddenly disappears`;
		const punctuation = secondPerson ? `.` : `!`;
		return `${subject} ${verb}${appendString}${punctuation}`;
	}

	/**
	 * Generates a notification indicating the player entered a room.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} entranceName - The name of the exit the player entered through.
	 * @param {string} appendString - A string describing any non-discreet inventory items the player is carrying.
	 */
	generateEnterNotification(player, secondPerson, entranceName, appendString) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `enter` : `enters`;
		const exitPhrase = entranceName ? ` from ${entranceName}` : ``;
		return `${subject} ${verb}${exitPhrase}${appendString}.`;
	}

	/**
	 * Generates a notification indicating the player with the free movement role entered a room.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} roomName - The display name of the room the player entered.
	 * @param {string} appendString - A string describing any non-discreet inventory items the player is carrying.
	 */
	generateSuddenEnterNotification(player, secondPerson, roomName, appendString) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `enter ${roomName}` : `suddenly appears`;
		const punctuation = secondPerson ? `.` : `!`;
		return `${subject} ${verb}${appendString}${punctuation}`;
	}

	/**
	 * Generates a notification indicating the player with the `no sight` behavior attribute entered a room.
	 */
	generateNoSightEnterNotification() {
		return `Fumbling against the wall, you make your way to the next room over.`;
	}

	/**
	 * Generates a notification indicating the player inspected the room.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 */
	generateInspectRoomNotification(player, secondPerson) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `begin` : `begins`;
		return `${subject} ${verb} looking around the room.`;
	}

	/**
	 * Generates a notification indicating the player inspected a fixture.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} fixturePhrase - The phrase of the fixture.
	 */
	generateInspectFixtureNotification(player, secondPerson, fixturePhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `begin` : `begins`;
		return `${subject} ${verb} inspecting ${fixturePhrase}.`;
	}

	/**
	 * Generates a notification indicating the player inspected a room item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} preposition - The preposition of the container.
	 * @param {string} containerPhrase - The phrase of the container.
	 */
	generateInspectRoomItemNotification(player, secondPerson, itemPhrase, preposition, containerPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `begin` : `begins`;
		return `${subject} ${verb} inspecting ${itemPhrase} ${preposition} ${containerPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player inspected an inventory item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 */
	generateInspectInventoryItemNotification(player, secondPerson, itemPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb1 = secondPerson ? `take out` : `takes out`;
		const verb2 = secondPerson ? `begin` : `begins`;
		return `${subject} ${verb1} ${itemPhrase} and ${verb2} inspecting it.`;
	}

	/**
	 * Generates a notification indicating a hidden player was found in their hiding spot.
	 * @param {string} playerDisplayName - The display name of the player who found them.
	 */
	generateHiddenPlayerFoundNotification(playerDisplayName) {
		return `You've been found by ${playerDisplayName}!`;
	}

	/**
	 * Generates a notification indicating the player found players hidden in a fixture.
	 * @param {string} hiddenPlayersList - A list of hidden players.
	 * @param {string} hidingSpotPhrase - The phrase of the hiding spot the players are hiding in.
	 */
	generateFoundHiddenPlayersNotification(hiddenPlayersList, hidingSpotPhrase) {
		return `You find ${hiddenPlayersList} hiding in ${hidingSpotPhrase}!`;
	}
	
	/**
	 * Generates a notification indicating the player knocked on an exit.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} exitPhrase - The phrase of the exit.
	 */
	generateKnockNotification(player, secondPerson, exitPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `knock` : `knocks`;
		return `${subject} ${verb} on ${exitPhrase}.`;
	}

	/**
	 * Generates a notification indicating there was a knock originating from the other side of an exit.
	 * @param {string} exitPhrase - The phrase of the exit.
	 */
	generateKnockDestinationNotification(exitPhrase) {
		return `There's a knock on ${exitPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player can't hide in the hiding spot because it's already full.
	 * @param {string} hidingSpotPhrase - The phrase of the hiding spot the players are hiding in.
	 * @param {string} hiddenPlayersList - A list of hidden players.
	 */
	generateHidingSpotFullNotification(hidingSpotPhrase, hiddenPlayersList) {
		return `You attempt to hide in the ${hidingSpotPhrase}, but you find ${hiddenPlayersList} already there! There doesn't seem to be enough room for you.`;
	}

	/**
	 * Generates a notification indicating the player found other players while attempting to hide.
	 * @param {string} hidingSpotPhrase - The phrase of the hiding spot the players are hiding in.
	 * @param {string} hiddenPlayersList - A list of hidden players.
	 */
	generateHidingSpotOccupiedNotification(hidingSpotPhrase, hiddenPlayersList) {
		return `When you hide in the ${hidingSpotPhrase}, you find ${hiddenPlayersList} already there!`;
	}

	/**
	 * Generates a notification indicating someone found the player while hiding.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {Player} findingPlayer - The player that hid, who found the player in the process.
	 */
	generateFoundInOccupiedHidingSpotNotification(player, findingPlayer) {
		const foundNotification = player.hasBehaviorAttribute("no sight") ? `Someone finds you` : `You're found by ${findingPlayer.displayName}`;
		const findingPlayerSbj = player.hasBehaviorAttribute("no sight") ? `They` : findingPlayer.pronouns.Sbj;
		const verb = player.hasBehaviorAttribute("no sight") || findingPlayer.pronouns.plural ? `hide` : `hides`;
		return `${foundNotification}! ${findingPlayerSbj} ${verb} with you.`;
	}

	/**
	 * Generates a notification indicating someone found the player while attempting to hide, but they couldn't hide because the hiding spot was full.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {Player} findingPlayer - The player attempting to hide, who found the player in the process.
	 */
	generateFoundInFullHidingSpotNotification(player, findingPlayer) {
		const foundNotification = player.hasBehaviorAttribute("no sight") ? `Someone finds you` : `You're found by ${findingPlayer.displayName}`;
		const findingPlayerSbj = player.hasBehaviorAttribute("no sight") ? `They` : findingPlayer.pronouns.Sbj;
		const verb = player.hasBehaviorAttribute("no sight") || findingPlayer.pronouns.plural ? `try` : `tries`;
		return `${foundNotification}! ${findingPlayerSbj} ${verb} to hide with you, but there isn't enough room.`;
	}

	/**
	 * Generates a notification indicating the player can no longer whisper
	 * because they were inflicted with a status effect with the `no channel` behavior attribute.
	 * @param {Player} player - The player referred to in this notification. 
	 * @param {string} statusId - The ID of the status effect that made the player unable to whisper.
	 */
	generateNoChannelLeaveWhisperNotification(player, statusId) {
		return `${player.displayName} can no longer whisper because ${player.originalPronouns.sbj} ${player.originalPronouns.plural ? `are` : `is`} ${statusId}.`;
	}

	/**
	 * Generates a notification indicating the player can no longer whisper
	 * because they were inflicted with a status effect with the `no hearing` behavior attribute.
	 * @param {string} playerDisplayName - The display name of the player.
	 */
	generateNoHearingLeaveWhisperNotification(playerDisplayName) {
		return `${playerDisplayName} can no longer hear.`;
	}

	/**
	 * Generates a notification indicating the player can no longer whisper because they left the room.
	 * @param {string} playerDisplayName - The display name of the player.
	 */
	generateExitLeaveWhisperNotification(playerDisplayName) {
		return `${playerDisplayName} leaves the room.`;
	}

	/**
	 * Generates a notification indicating the player was inflicted with a status effect with the ID `asleep`.
	 * @param {string} playerDisplayName - The display name of the player.
	 */
	generateFallAsleepNotification(playerDisplayName) {
		return `${playerDisplayName} falls asleep.`;
	}

	/**
	 * Generates a notification indicating the player was inflicted with a status effect with the ID `blacked out`.
	 * @param {string} playerDisplayName - The display name of the player.
	 */
	generateBlackOutNotification(playerDisplayName) {
		return `${playerDisplayName} blacks out.`;
	}

	/**
	 * Generates a notification indicating the player was inflicted with a status effect with the `unconscious` behavior attribute.
	 * @param {string} playerDisplayName - The display name of the player.
	 */
	generateUnconsciousNotification(playerDisplayName) {
		return `${playerDisplayName} goes unconscious.`;
	}

	/**
	 * Generates a notification indicating the player took off their mask.
	 * @param {string} maskName - The name of the inventory item the player took off. 
	 * @param {string} playerDisplayName - The display name of the player.
	 */
	generateConcealedCuredNotification(maskName, playerDisplayName) {
		return `The ${maskName} comes off, revealing the individual to be ${playerDisplayName}.`;
	}

	/**
	 * Generates a notification indicating the player woke up.
	 * @param {string} playerDisplayName - The display name of the player.
	 */
	generateWakeUpNotification(playerDisplayName) {
		return `${playerDisplayName} wakes up.`;
	}

	/**
	 * Generates a notification indicating the player was cured of a status effect with the `unconscious` behavior attribute.
	 * @param {string} playerDisplayName - The display name of the player.
	 */
	generateRegainConsciousnessNotification(playerDisplayName) {
		return `${playerDisplayName} regains consciousness.`;
	}

	/**
	 * Generates a notification indicating the player hid in a fixture.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} hidingSpotPhrase - The phrase of the hiding spot the player is hiding in.
	 */
	generateHideNotification(player, secondPerson, hidingSpotPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `hide` : `hides`;
		return `${subject} ${verb} in ${hidingSpotPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player came out of a hiding spot.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} hidingSpotPhrase - The phrase of the hiding spot the player is coming out from.
	 */
	generateUnhideNotification(player, secondPerson, hidingSpotPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `come out` : `comes out`;
		return `${subject} ${verb} of ${hidingSpotPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player took an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} [containerPhrase] - The entire phrase of the container. Optional.
	 */
	generateTakeNotification(player, secondPerson, itemPhrase, containerPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `take` : `takes`;
		const containerAppendString = containerPhrase ? ` from ${containerPhrase}` : ``;
		return `${subject} ${verb} ${itemPhrase}${containerAppendString}.`;
	}

	/**
	 * Generates a string notification indicating the player couldn't take an item because it is too heavy.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} containerPhrase - The entire phrase of the container.
	 */
	generateTakeTooHeavyNotification(player, secondPerson, itemPhrase, containerPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `try` : `tries`;
		const obj = secondPerson ? `you` : player.pronouns.obj;
		return `${subject} ${verb} to take ${itemPhrase} from ${containerPhrase}, but it is too heavy for ${obj} to lift.`;
	}

	/**
	 * Generates a string notification indicating the player couldn't take an item because they are carrying too much weight.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} containerPhrase - The entire phrase of the container.
	 */
	generateTakeTooMuchWeightNotification(player, secondPerson, itemPhrase, containerPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `try` : `tries`;
		const sbj = secondPerson ? `you` : player.pronouns.sbj;
		const contraction = secondPerson || player.pronouns.plural ? `'re` : `'s`;
		return `${subject} ${verb} to take ${itemPhrase} from ${containerPhrase}, but ${sbj}${contraction} carrying too much weight.`;
	}

	/**
	 * Generates a notification indicating the player tried to steal from an empty inventory slot.
	 * @param {string} slotPhrase - A phrase to refer to the slot the player tried to steal from.
	 * @param {string} containerName - The name of the container the player tried to steal from.
	 * @param {string} victimDisplayName - The display name of the victim the player tried to steal from.
	 */
	generateStoleFromEmptyInventorySlotNotification(slotPhrase, containerName, victimDisplayName) {
		return `You try to steal from ${slotPhrase}${victimDisplayName}'s ${containerName}, but it's empty.`;
	}

	/**
	 * Generates a notification indicating the player successfully stole an item from someone.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} slotPhrase - A phrase to refer to the slot the item was stolen from.
	 * @param {string} containerName - The name of the container the item was stolen from.
	 * @param {Player} victim - The victim who was stolen from.
	 * @param {boolean} victimAware - Whether or not the victim noticed that they were stolen from.
	 */
	generateSuccessfulStealNotification(player, secondPerson, itemPhrase, slotPhrase, containerName, victim, victimAware) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `steal` : `steals`;
		const successDisplay = secondPerson ? `.`
			: victimAware ? `, but ${victim.pronouns.sbj} ${victim.pronouns.plural ? `seem` : `seems`} to notice.`
			: ` without ${victim.pronouns.obj} noticing!`;
		return `${subject} ${verb} ${itemPhrase} from ${slotPhrase}${victim.displayName}'s ${containerName}${successDisplay}`;
	}

	/**
	 * Generates a notification indicating the player failed to steal an item from someone.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} slotPhrase - A phrase to refer to the slot the item they attempted to steal.
	 * @param {string} containerName - The name of the container they attempted to steal from.
	 * @param {Player} victim - The victim who they attempted to steal from.
	 */
	generateFailedStealNotification(itemPhrase, slotPhrase, containerName, victim) {
		return `You try to steal ${itemPhrase} from ${slotPhrase}${victim.displayName}'s ${containerName}, but ${victim.pronouns.sbj} ${victim.pronouns.plural ? `notice` : `notices`} before you can.`;
	}

	/**
	 * Generates a notification indicating the player was stolen from.
	 * @param {string} thiefDisplayName - The display name of the thief who stole the item.
	 * @param {string} slotPhrase - A phrase to refer to the slot the item was stolen from.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} containerName - The name of the container the item was stolen from.
	 */
	generateSuccessfulStolenFromNotification(thiefDisplayName, slotPhrase, itemPhrase, containerName) {
		return `${thiefDisplayName} steals ${itemPhrase} from ${slotPhrase}your ${containerName}!`;
	}

	/**
	 * Generates a notification indicating someone attempted to steal an item from the player.
	 * @param {string} thiefDisplayName - The display name of the thief who stole the item.
	 * @param {string} slotPhrase - A phrase to refer to the slot the item was stolen from.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} containerName - The name of the container the item was stolen from.
	 */
	generateFailedStolenFromNotification(thiefDisplayName, slotPhrase, itemPhrase, containerName) {
		return `${thiefDisplayName} attempts to steal ${itemPhrase} from ${slotPhrase}your${containerName}, but you notice in time!`;
	}

	/**
	 * Generates a notification indicating the player dropped an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} [preposition] - The preposition of the container.
	 * @param {string} [containerPhrase] - The entire phrase of the container. Optional.
	 */
	generateDropNotification(player, secondPerson, itemPhrase, preposition, containerPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		let verb = secondPerson ? `discard` : `discards`;
		if (containerPhrase) verb = secondPerson ? `put` : `puts`;
		const containerAppendString = containerPhrase ? ` ${preposition} ${containerPhrase}` : ``;
		return `${subject} ${verb} ${itemPhrase} ${preposition} ${containerPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player gave an item to someone.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} recipientDisplayName - The display name of the recipient.
	 */
	generateGiveNotification(player, secondPerson, itemPhrase, recipientDisplayName) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `give` : `gives`;
		return `${subject} ${verb} ${itemPhrase} to ${recipientDisplayName}.`;
	}

	/**
	 * Generates a notification indicating the player couldn't give an item to someone because it is too heavy.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {Player} recipient - The recipient of the item.
	 */
	generateGiveTooHeavyNotification(player, secondPerson, itemPhrase, recipient) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `try` : `tries`;
		return `${subject} ${verb} to give ${recipient.displayName} ${itemPhrase}, but it is too heavy for ${recipient.pronouns.obj} to lift.`;
	}

	/**
	 * Generates a notification indicating the player couldn't give an item to someone because they are carrying too much weight.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {Player} recipient - The recipient of the item.
	 */
	generateGiveTooMuchWeightNotification(player, secondPerson, itemPhrase, recipient) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `try` : `tries`;
		const contraction = secondPerson || player.pronouns.plural ? `'re` : `'s`;
		return `${subject} ${verb} to give ${recipient.displayName} ${itemPhrase}, but ${recipient.pronouns.sbj}${contraction} carrying too much weight.`;
	}

	/**
	 * Generates a notification indicating the player received an item from someone.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} giverDisplayName - The display name of the giver.
	 */
	generateReceiveNotification(itemPhrase, giverDisplayName) {
		return `${giverDisplayName} gives you ${itemPhrase}!`;
	}

	/**
	 * Generates a notification indicating the player couldn't receive an item from someone because it is too heavy.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} giverDisplayName - The display name of the player giving them the item.
	 */
	generateReceiveTooHeavyNotification(itemPhrase, giverDisplayName) {
		return `${giverDisplayName} tries to give you ${itemPhrase}, but it is too heavy for you to lift.`;
	}

	/**
	 * Generates a notification indicating the player couldn't receive an item to someone because they are carrying too much weight.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} giverDisplayName - The display name of the player giving them the item.
	 */
	generateReceiveTooMuchWeightNotification(itemPhrase, giverDisplayName) {
		return `${giverDisplayName} tries to give you ${itemPhrase}, but you're carrying too much weight.`;
	}

	/**
	 * Generates a notification indicating the player stashed an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} preposition - The preposition of the container.
	 * @param {string} slotPhrase - A phrase to refer to the slot the item is being stashed in.
	 * @param {string} containerName - The name of the container the item is being stashed in.
	 */
	generateStashNotification(player, secondPerson, itemPhrase, preposition, slotPhrase, containerName) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `stash` : `stashes`;
		const dpos = secondPerson ? `your` : player.pronouns.dpos;
		return `${subject} ${verb} ${itemPhrase} ${preposition} ${slotPhrase}${dpos} ${containerName}.`;
	}

	/**
	 * Generates a notification indicating the player unstashed an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 * @param {string} slotPhrase - A phrase to refer to the slot the item is being unstashed from.
	 * @param {string} containerName - The name of the container the item is being unstashed from.
	 */
	generateUnstashNotification(player, secondPerson, itemPhrase, slotPhrase, containerName) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `take` : `takes`;
		const dpos = secondPerson ? `your` : player.pronouns.dpos;
		return `${subject} ${verb} ${itemPhrase} out of ${slotPhrase}${dpos} ${containerName}.`;
	}

	/**
	 * Generates a notification indicating the player equipped an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemPhrase - The single containing phrase of the item.
	 */
	generateEquipNotification(player, secondPerson, itemPhrase) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `put on` : `puts on`;
		return `${subject} ${verb} ${itemPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player unequipped an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} itemName - The name of the item.
	 */
	generateUnequipNotification(player, secondPerson, itemName) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `take off` : `takes off`;
		const dpos = secondPerson ? `your` : player.pronouns.dpos;
		return `${subject} ${verb} ${dpos} ${itemName}.`;
	}

	/**
	 * Generates a notification indicating the player dressed.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} containerName - The name of the container the player is dressing from.
	 * @param {string} itemList - A list of items the player put on.
	 */
	generateDressNotification(player, secondPerson, containerName, itemList) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `dress` : `dresses`;
		return `${subject} ${verb} from the ${containerName}, putting on ${itemList}.`;
	}

	/**
	 * Generates a notification indicating the player undressed.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {string} preposition - The preposition of the container.
	 * @param {string} containerPhrase - The entire phrase of the container the player is undressing into.
	 * @param {string} itemList - A list of items the player took off.
	 */
	generateUndressNotification(player, secondPerson, preposition, containerPhrase, itemList) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `undress` : `undresses`;
		return `${subject} ${verb}, putting ${itemList} ${preposition} ${containerPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player crafted an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {CraftingResult} craftingResult - The result of the craft action.
	 */
	generateCraftNotification(player, secondPerson, craftingResult) {
		const subject = secondPerson ? `You` : player.displayName;
		const verb = secondPerson ? `craft` : `crafts`;
		let productPhrase = "";
		let product1Phrase = "";
		let product2Phrase = "";
		if (craftingResult.product1 && !craftingResult.product1.prefab.discreet)
			product1Phrase = craftingResult.product1.singleContainingPhrase;
		if (craftingResult.product2 && !craftingResult.product2.prefab.discreet)
			product2Phrase = craftingResult.product2.singleContainingPhrase;
		if (product1Phrase !== "" && product2Phrase !== "") productPhrase = `${product1Phrase} and ${product2Phrase}`;
		else if (product1Phrase !== "") productPhrase = product1Phrase;
		else if (product2Phrase !== "") productPhrase = product2Phrase;
		else productPhrase = "nothing";
		return `${subject} ${verb} ${productPhrase}.`;
	}

	/**
	 * Generates a notification indicating the player uncrafted an item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {Recipe} recipe - The recipe used to uncraft the item.
	 * @param {string} originalItemPhrase - The original single containing phrase of the item.
	 * @param {string} itemPhrase - The single containing phrase of the item, which may have changed from its original value.
	 * @param {UncraftingResult} uncraftingResult - The result of the uncraft action.
	 */
	generateUncraftNotification(player, secondPerson, recipe, originalItemPhrase, itemPhrase, uncraftingResult) {
		const subject = secondPerson ? `You` : player.displayName;
		// If only one ingredient is discreet, the first ingredient should be the discreet one.
        // This will result in more natural sounding notifications.
		const oneDiscreet = !recipe.ingredients[0].discreet && recipe.ingredients[1].discreet || recipe.ingredients[0].discreet && !recipe.ingredients[1].discreet;
        let ingredient1 = oneDiscreet && recipe.ingredients[0].discreet ? recipe.ingredients[0] : recipe.ingredients[1];
        let ingredient2 = oneDiscreet && recipe.ingredients[0].discreet ? recipe.ingredients[1] : recipe.ingredients[0];
		let ingredientPhrase = "";
		let ingredient1Phrase = "";
		let ingredient2Phrase = "";
		let verb = "removes";
		let preposition = "from";
		if (!uncraftingResult.ingredient1.prefab.discreet) {
			if (uncraftingResult.ingredient1.singleContainingPhrase !== originalItemPhrase || uncraftingResult.ingredient1.singleContainingPhrase !== itemPhrase)
				ingredient1Phrase = ingredient1.singleContainingPhrase;
		}
		if (!uncraftingResult.ingredient2.prefab.discreet) {
			if (ingredient2.singleContainingPhrase !== originalItemPhrase || uncraftingResult.ingredient2.singleContainingPhrase !== itemPhrase)
				ingredient2Phrase = uncraftingResult.ingredient2.singleContainingPhrase;
		}
		if (ingredient1Phrase !== "" && ingredient2Phrase !== "") {
			itemPhrase = originalItemPhrase;
			ingredientPhrase = `${ingredient1Phrase} and ${ingredient2Phrase}`;
			verb = "separates";
			preposition = "into";
		}
		else if (ingredient1Phrase !== "") ingredientPhrase = ingredient1Phrase;
		else if (ingredient2Phrase !== "") ingredientPhrase = ingredient2Phrase;
		if (ingredientPhrase !== "") ingredientPhrase = ` ${preposition} ${ingredientPhrase}`;
		return `${subject} ${verb} ${itemPhrase}${ingredientPhrase}.`;
	}

	/**
	 * Generates a notification indicating that the fixture was activated.
	 * @param {string} fixturePhrase - The phrase of the fixture.
	 * @param {Player} [player] - The player referred to in this notification, if applicable.
	 * @param {boolean} [secondPerson] - Whether or not the player should be referred to in second person, if applicable.
	 */
	generateActivateNotification(fixturePhrase, player, secondPerson) {
		if (player) {
			const subject = secondPerson ? `You` : player.displayName;
			const verb = secondPerson ? `turn on` : `turns on`;
			return `${subject} ${verb} ${fixturePhrase}.`;
		}
		else return `${fixturePhrase} turns on.`;
	}

	/**
	 * Generates a notification indicating that the fixture was deactivated.
	 * @param {string} fixturePhrase - The phrase of the fixture.
	 * @param {Player} [player] - The player referred to in this notification, if applicable.
	 * @param {boolean} [secondPerson] - Whether or not the player should be referred to in second person, if applicable.
	 */
	generateDeactivateNotification(fixturePhrase, player, secondPerson) {
		if (player) {
			const subject = secondPerson ? `You` : player.displayName;
			const verb = secondPerson ? `turn off` : `turns off`;
			return `${subject} ${verb} ${fixturePhrase}.`;
		}
		else return `${fixturePhrase} turns off.`;
	}

	/**
	 * Generates the default notification indicating that a puzzle was attempted.
	 * @param {string} playerDisplayName - The display name of the player.
	 * @param {string} puzzlePhrase - The containing phrase of the puzzle.
	 */
	generateAttemptPuzzleDefaultNotification(playerDisplayName, puzzlePhrase) {
		return `${playerDisplayName} uses ${puzzlePhrase}.`;
	}

	/**
	 * Generates a notification indicating the player attempted a puzzle with no remaining attempts.
	 * @param {string} playerDisplayName - The display name of the player.
	 * @param {string} puzzlePhrase - The containing phrase of the puzzle.
	 */
	generateAttemptPuzzleWithNoRemainingAttemptsNotification(playerDisplayName, puzzlePhrase) {
		return `${playerDisplayName} attempts and fails to use ${puzzlePhrase}.`;
	}

	/**
	 * Generates a notification indicating the player attempted a puzzle that takes an item as a solution without the required item.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {Puzzle} puzzle - The puzzle that was attempted.
	 */
	generateAttemptPuzzleWithoutItemSolutionNotification(player, secondPerson, puzzle) {
		if (puzzle.type === "weight" || puzzle.type === "container") return "";
		const subject = secondPerson ? `You` : player.displayName;
		let predicate = secondPerson ? `attempt to use` : `attempts to use`;
		const puzzlePhrase = puzzle.getContainingPhrase();
		let appendString = secondPerson ? `, but struggle` : `, but struggles`;
		if (puzzle.type === "key lock") {
			const verb = puzzle.solved ? `lock` : `unlock`;
			predicate = secondPerson ? `attempt and fail to ${verb}` : `attempts and fails to ${verb}`;
			appendString = ``;
		}
		return `${subject} ${predicate} ${puzzlePhrase}${appendString}.`;
	}

	/**
	 * Generates a notification indicating the player solved a puzzle. Generates the notification automatically based on the puzzle's type.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {Puzzle} puzzle - The puzzle that was solved.
	 * @param {string} outcome - The puzzle's outcome. 
	 * @param {ItemInstance} [item] - The item the puzzle was solved with, if applicable.
	 */
	generateSolvePuzzleNotification(player, secondPerson, puzzle, outcome, item) {
		if (puzzle.type === "weight" || puzzle.type === "container") return "";
		const subject = secondPerson ? `You` : player.displayName;
		let verb = secondPerson ? `use` : `uses`;
		const puzzlePhrase = puzzle.getContainingPhrase();
		let appendString = ``;
		if (puzzle.type === "combination lock" || puzzle.type === "key lock")
			verb = secondPerson ? `unlock` : `unlocks`;
		else if (puzzle.type === "switch" || puzzle.type === "option") {
			verb = secondPerson ? `set` : `sets`;
			appendString = ` to ${outcome}`;
		}
		else if (puzzle.type === "media") {
			const itemPhrase = item.prefab.discreet ? `an item into` : `${item.singleContainingPhrase} into`;
			verb = secondPerson ? `insert ${itemPhrase}` : `inserts ${itemPhrase}`;
		}
		else if (puzzle.type === "channels") {
			if (puzzle.solved)
				verb = secondPerson ? `change the channel to ${outcome} on` : `changes the channel to ${outcome} on`;
			else
				verb = secondPerson ? `turn on` : `turns on`;
		}
		return `${subject} ${verb} ${puzzlePhrase}${appendString}.`;
	}

	/**
	 * Generates a notification indicating the player unsolved a puzzle. Chooses the notification automatically based on the puzzle's type.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {Puzzle} puzzle - The puzzle that was unsolved.
	 */
	generateUnsolvePuzzleNotification(player, secondPerson, puzzle) {
		if (puzzle.type === "weight" || puzzle.type === "container") return "";
		const subject = secondPerson ? `You` : player.displayName;
		let verb = secondPerson ? `use` : `uses`;
		const puzzlePhrase = puzzle.getContainingPhrase();
		if (puzzle.type === "toggle" && puzzle.alreadySolvedDescription !== "")
			return puzzle.alreadySolvedDescription;
		else if (puzzle.type === "combination lock" || puzzle.type === "key lock")
			verb = secondPerson ? `lock` : `locks`;
		else if (puzzle.type === "option")
			verb = secondPerson ? `clear the selection for` : `resets`;
		else if (puzzle.type === "media") {
			if (puzzle.alreadySolvedDescription !== "") return puzzle.alreadySolvedDescription;
			verb = secondPerson ? `press eject on` : `presses eject on`;
		}
		else if (puzzle.type === "channels")
			verb = secondPerson ? `turn off` : `turns off`;
		return `${subject} ${verb} ${puzzlePhrase}.`;
	}

	/**
	 * Generates a notification indicating the player attempted a puzzle that was already solved. Generates the notification automatically based on the puzzle's type.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {Puzzle} puzzle - The puzzle that was attempted.
	 */
	generateAttemptAlreadySolvedPuzzleNotification(player, secondPerson, puzzle) {
		if (puzzle.type === "weight" || puzzle.type === "container") return "";
		const subject = secondPerson ? `You` : player.displayName;
		let verb = secondPerson ? `use` : `uses`;
		const puzzlePhrase = puzzle.getContainingPhrase();
		let appendString = ``;
		if (puzzle.type === "combination lock" || puzzle.type === "key lock")
			verb = secondPerson ? `open` : `opens`;
		else if (puzzle.type === "switch")
			appendString = `, but nothing happens`;
		else if (puzzle.type === "option") {
			verb = secondPerson ? `set` : `sets`;
			appendString = `, but nothing changes`
		}
		return `${subject} ${verb} ${puzzlePhrase}${appendString}.`;
	}

	/**
	 * Generates a notification indicating the player attempted and failed to solve a puzzle. Chooses the notification automatically based on the puzzle's type.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 * @param {Puzzle} puzzle - The puzzle that was attempted.
	 * @param {ItemInstance} [item] - The item the puzzle was attempted with, if applicable.
	 */
	generateAttemptAndFailPuzzleNotification(player, secondPerson, puzzle, item) {
		if (puzzle.type === "weight" || puzzle.type === "container") return "";
		const subject = secondPerson ? `You` : player.displayName;
		let verb = secondPerson ? `use` : `uses`;
		const puzzlePhrase = puzzle.getContainingPhrase();
		let appendString = ``;
		if (puzzle.type === "combination lock")
			verb = secondPerson ? `attempt and fail to unlock` : `attempts and fails to unlock`;
		else if (puzzle.type === "channels")
			verb = secondPerson ? `attempt and fail to change the channel on` : `attempts and fails to change the channel on`;
		else if (puzzle.type === "switch" || puzzle.type === "option") {
			verb = secondPerson ? `attempt to set` : `attempts to set`;
			appendString = secondPerson ? `, but struggle` : `, but struggles`;
		}
		else if (puzzle.type === "media") {
			const itemPhrase = item.prefab.discreet ? `an item into` : `${item.singleContainingPhrase} into`;
			verb = secondPerson ? `attempt to insert ${itemPhrase}` : `attempts to insert ${itemPhrase}`;
			appendString = `, but it doesn't fit`;
		}
		else if (puzzle.type === "room player") {
			verb = secondPerson ? `attempt to use` : `attempts to use`;
			appendString = secondPerson ? `, but struggle` : `, but struggles`;
		}
		return `${subject} ${verb} ${puzzlePhrase}${appendString}.`;
	}

	/**
	 * Generates a notification indicating the player has died.
	 * @param {Player} player - The player referred to in this notification.
	 * @param {boolean} secondPerson - Whether or not the player should be referred to in second person.
	 */
	generateDieNotification(player, secondPerson) {
		const message = secondPerson
			? `You have died. When your body is discovered, you will be given the ${this.#game.guildContext.deadRole.name} role. Until then, your death must remain a secret to the server and to other players.`
			: `${player.displayName} dies.`;
		return message;
	}

	/**
	 * Generates a notification indicating an exit was unlocked.
	 * @param {Exit} exit - The exit that was unlocked.
	 */
	generateUnlockNotification(exit) {
		return `${exit.name} unlocks.`;
	}

	/**
	 * Generates a notification indicating an exit was locked.
	 * @param {Exit} exit - The exit that was locked.
	 */
	generateLockNotification(exit) {
		return `${exit.name} locks.`;
	}
}