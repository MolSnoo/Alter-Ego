// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Dialog from "../Data/Dialog.ts";
import type Fixture from "../Data/Fixture.ts";
import type Game from "../Data/Game.ts";
import type Player from "../Data/Player.ts";
import type Exit from "../Data/Exit.ts";
import type ItemInstance from "../Data/ItemInstance.ts";
import type Puzzle from "../Data/Puzzle.ts";
import type Recipe from "../Data/Recipe.ts";
import type Room from "../Data/Room.ts";
import { capitalizeFirstLetter, endsWithPunctuation, generateListString, generatePlayerListString } from "../Modules/helpers.ts";
import { Collection } from "discord.js";

/**
 * A set of functions to generate notification messages to send to players.
 */
export default class GameNotificationGenerator {
    /**
     * The game this belongs to.
     */
    readonly #game: Game;

    /**
     * @param game - The game this belongs to.
     */
    constructor(game: Game) {
        this.#game = game;
    }

    /**
     * Generates a notification indicating the player cannot speak because they have a status effect with the `no speech` behavior attribute.
     * @param statusId - The ID of the status effect that made the player unable to speak.
     */
    generatePlayerNoSpeechNotification(statusId: string) {
        return `You are **${statusId}**, so you cannot speak.`;
    }

    /**
     * Generates a notification indicating that a player heard spoken dialog.
     * @param dialog - The dialog that was spoken.
     * @param player - The player referred to in this notification.
     */
    generateHearDialogNotification(dialog: Dialog, player: Player) {
        const playerAndSpeakerAreHidingTogether = dialog.speaker.isHiddenWith(player);
        const playerCanSeeSpeaker = player.canSee() && (!dialog.speaker.isHidden() || playerAndSpeakerAreHidingTogether);

        let speakerString = "";
        if (!dialog.isOOCMessage && player.knows(dialog.speakerRecognitionName) && !dialog.isMimicking(player))
            speakerString = dialog.speakerDisplayNameIsDifferent && playerCanSeeSpeaker ? `${dialog.speaker.displayName}, with ${dialog.speakerVoiceString} you recognize as ${dialog.speakerRecognitionName}'s,` : `${dialog.speakerRecognitionName}`;
        else if (player.knows(dialog.speakerRecognitionName) && !dialog.isMimicking(player) && !dialog.speakerDisplayNameIsDifferent && !playerCanSeeSpeaker)
            speakerString = `${dialog.speakerRecognitionName}`;
        else if (!playerCanSeeSpeaker)
            speakerString = dialog.isMimicking(player) ? `someone in the room` : `someone in the room with ${dialog.speakerVoiceString}`;
        else
            speakerString = `${dialog.speakerDisplayName}`;
        const verb = dialog.isShouted ? `shouts` : `says`;
        const punctuation = dialog.isMimicking(player) && !dialog.isOOCMessage ? ` in your voice!` : endsWithPunctuation(dialog.unformattedContent) ? `` : `.`;
        return `${capitalizeFirstLetter(speakerString)} ${verb} "${dialog.unformattedContent}"${punctuation}`;
    }

    /**
     * Generates a notification indicating that a player heard whispered dialog.
     * @param dialog - The dialog that was whispered.
     * @param player - The player referred to in this notification.
     */
    generateHearWhisperNotification(dialog: Dialog, player: Player) {
        const associatedEntity = dialog.whisper?.associatedEntity;
        const entityPhrase = associatedEntity ? ` ${associatedEntity.getPreposition()} ${associatedEntity.getContainingPhrase()}` : ``;
        let speakerString = "";
        if (!dialog.isOOCMessage && player.knows(dialog.speakerRecognitionName))
            speakerString = player.canSee() ? `${dialog.speaker.displayName}, with ${dialog.speakerVoiceString} you recognize as ${dialog.speakerRecognitionName}'s,` : `${dialog.speakerRecognitionName}`;
        else if (player.knows(dialog.speakerRecognitionName) && !dialog.isMimicking(player) && !dialog.speakerDisplayNameIsDifferent && !player.canSee())
            speakerString = `${dialog.speakerRecognitionName}`;
        else if (!player.canSee())
            speakerString = dialog.isMimicking(player) ? `someone${entityPhrase}` : `someone${entityPhrase} with ${dialog.speakerVoiceString}`;
        else
            speakerString = `${dialog.speakerDisplayName}`;
        const contentAffix = entityPhrase !== `` && !speakerString.includes(entityPhrase) ? `${entityPhrase}` : ``;
        const punctuation = dialog.isMimicking(player) && !dialog.isOOCMessage ? `${contentAffix} in your voice!` : contentAffix === `` && endsWithPunctuation(dialog.unformattedContent) ? `` : `${contentAffix}.`;
        return `${capitalizeFirstLetter(speakerString)} whispers "${dialog.unformattedContent}"${punctuation}`;
    }

    /**
     * Generates a notification indicating that a player with the `acute hearing` behavior attribute overheard whispered dialog.
     * @param dialog - The dialog that was overheard.
     * @param player - The player referred to in this notification.
     */
    generateAcuteHearingPlayerOverhearWhisperNotification(dialog: Dialog, player: Player) {
        const playerCanSeeSpeaker = player.canSee() && !dialog.speaker.isHidden();
        let speakerString = "";
        if (player.knows(dialog.speakerRecognitionName) && !dialog.isMimicking(player))
            speakerString = dialog.speakerDisplayNameIsDifferent && playerCanSeeSpeaker ? `${dialog.speaker.displayName}, with ${dialog.speakerVoiceString} you recognize as ${dialog.speakerRecognitionName}'s,` : `${dialog.speakerRecognitionName}`;
        else if (!playerCanSeeSpeaker)
            speakerString = dialog.isMimicking(player) ? `someone in the room` : `someone in the room with ${dialog.speakerVoiceString}`;
        else
            speakerString = `${dialog.speakerDisplayName}`;
        const recipientString = playerCanSeeSpeaker ? ` to ${dialog.whisper.generatePlayerListStringExcluding(dialog.speaker)}` : ``;
        const punctuation = dialog.isMimicking(player) ? ` in your voice!` : recipientString === `` && endsWithPunctuation(dialog.unformattedContent) ? `` : `.`;
        return `You overhear ${speakerString} whisper "${dialog.unformattedContent}"${recipientString}${punctuation}`;
    }

    /**
     * Generates a notification indicating that a player heard dialog from a neighboring room.
     * @param dialog - The dialog that was spoken.
     * @param player - The player referred to in this notification. Optional.
     */
    generateHearNeighboringRoomDialogNotification(dialog: Dialog, player?: Player) {
        let speakerString = "";
        let locator = "";
        if (player && player.knows(dialog.speakerRecognitionName) && !dialog.isMimicking(player)) {
            speakerString = `${dialog.speakerRecognitionName}`;
            locator = ` in a nearby room`;
        }
        else
            speakerString = player && dialog.isMimicking(player) ? `someone in a nearby room` : `someone in a nearby room with ${dialog.speakerVoiceString}`;
        const verb = dialog.isShouted ? `shouts` : `says`;
        const punctuation = player && dialog.isMimicking(player) ? ` in your voice!` : locator === `` && endsWithPunctuation(dialog.unformattedContent) ? `` : `.`;
        return `${capitalizeFirstLetter(speakerString)} ${verb} "${dialog.unformattedContent}"${locator}${punctuation}`;
    }

    /**
     * Generates a notification indicating that a player heard dialog from a room that neighbors a room with the `audio surveilled` tag.
     * @param roomDisplayName - The displayed name of the audio surveilled room that neighbors the room the dialog was spoken in.
     * @param dialog - The dialog that was spoken.
     * @param player - The player referred to in this notification. Optional.
     */
    generateHearAudioSurveilledNeighboringRoomDialogNotification(roomDisplayName: string, dialog: Dialog, player?: Player) {
        return `\`[${roomDisplayName}]\` ${capitalizeFirstLetter(this.generateHearNeighboringRoomDialogNotification(dialog, player))}`;
    }

    /**
     * Generates a notification indicating that a player heard dialog from a room with the `audio surveilled` tag.
     * @param roomDisplayName - The displayed name of the audio surveilled room the dialog was spoken in.
     * @param dialog - The dialog that was spoken.
     * @param player - The player referred to in this notification. Optional.
     */
    generateHearAudioSurveilledRoomDialogNotification(roomDisplayName: string, dialog: Dialog, player?: Player) {
        const roomIsVisible = player && player.location.isVideoMonitoring() && dialog.locationIsVideoSurveilled;
        const playerCanSeeSpeaker = player && player.canSee() && roomIsVisible && !dialog.speaker.isHidden();
        let speakerString = "";
        if (player && player.knows(dialog.speakerRecognitionName) && !dialog.isMimicking(player))
            speakerString = playerCanSeeSpeaker && dialog.speakerDisplayNameIsDifferent ? `${dialog.speaker.displayName}, with ${dialog.speakerVoiceString} you recognize as ${dialog.speakerRecognitionName}'s,` : `${dialog.speakerRecognitionName}`;
        else if (player && !playerCanSeeSpeaker || !roomIsVisible)
            speakerString = player && dialog.isMimicking(player) ? `someone` : `someone with ${dialog.speakerVoiceString}`;
        else
            speakerString = `${dialog.speakerDisplayName}`;
        const verb = dialog.isShouted ? `shouts` : `says`;
        const punctuation = player && dialog.isMimicking(player) ? ` in your voice!` : endsWithPunctuation(dialog.unformattedContent) ? `` : `.`;
        return `\`[${roomDisplayName}]\` ${capitalizeFirstLetter(speakerString)} ${verb} "${dialog.unformattedContent}"${punctuation}`;
    }

    /**
     * Generates a notification indicating that a player heard dialog through a player with the `receiver` behavior attribute.
     * @param dialog - The dialog that was spoken.
     * @param receiver - The player with the `receiver` behavior attribute.
     * @param receiverItemName - The name of the inventory item that gave the player the `receiver` behavior attribute. Defaults to "receiver".
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person. Defaults to false.
     * @param playerCanSeeReceiver - Whether or not the player being referred to can see the receiver player. Defaults to true.
     */
    generateHearReceiverDialogNotification(dialog: Dialog, receiver: Player, receiverItemName: string = "receiver", player?: Player, secondPerson: boolean = false, playerCanSeeReceiver: boolean = true) {
        const receiverOwnerName = secondPerson ? `your` : playerCanSeeReceiver ? `${receiver.displayName}'s` : `a`;
        if (!secondPerson && !playerCanSeeReceiver) receiverItemName = "receiver";
        let speakerString = "";
        let receiverString = "";
        if (player && player.knows(dialog.speakerRecognitionName) && !dialog.isMimicking(player)) {
            speakerString = `${dialog.speakerRecognitionName}`;
            receiverString = ` through ${receiverOwnerName} ${receiverItemName}`;
        }
        else
            speakerString = player && dialog.isMimicking(player) ? `someone speaking through ${receiverOwnerName} ${receiverItemName}` : `${dialog.speakerVoiceString} coming from ${receiverOwnerName} ${receiverItemName}`;
        const verb = dialog.isShouted ? `shouts` : `says`;
        const punctuation = player && dialog.isMimicking(player) ? ` in your voice!` : receiverString === `` && endsWithPunctuation(dialog.unformattedContent) ? `` : `.`;
        return `${capitalizeFirstLetter(speakerString)} ${verb} "\`${dialog.unformattedContent}\`"${receiverString}${punctuation}`;
    }

    /**
     * Generates a notification indicating that a player heard dialog from a room with the `audio surveilled` tag that was transmitted to one of its occupants with the `receiver` behavior attribute.
     * @param roomDisplayName - The displayed name of the audio surveilled room with a `receiver` player.
     * @param dialog - The dialog that was spoken.
     * @param receiver - The player with the `receiver` behavior attribute.
     * @param receiverItemName - The name of the inventory item that gave the player the `receiver` behavior attribute. Defaults to "receiver".
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param playerCanSeeReceiver - Whether or not the player being referred to can see the receiver player. Defaults to true.
     */
    generateHearAudioSurveilledReceiverDialogNotification(roomDisplayName: string, dialog: Dialog, receiver: Player, receiverItemName: string = "receiver", player?: Player, secondPerson: boolean = false, playerCanSeeReceiver: boolean = true) {
        return `\`[${roomDisplayName}]\` ${capitalizeFirstLetter(this.generateHearReceiverDialogNotification(dialog, receiver, receiverItemName, player, secondPerson, playerCanSeeReceiver))}`;
    }

    /**
     * Generates a whisper action notification.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param playerListString - A list of the other players in the whisper.
     */
    generateWhisperNotification(player: Player, secondPerson: boolean, playerListString: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `begin` : `begins`;
        const whisperPhrase = playerListString ? ` to ${playerListString}` : ``;
        return `${subject} ${verb} whispering${whisperPhrase}.`;
    }

    /**
     * Generates a text action notification.
     * @param messageText - The text content of the text message.
     * @param senderName - The name of the sender.
     * @param recipientName - The name of the recipient, if needed.
     */
    generateTextNotification(messageText: string, senderName: string, recipientName?: string) {
        if (messageText.length > 1900) messageText = messageText.substring(0, 1897) + "...";
        const recipientDisplay = recipientName ? ` -> ${recipientName}` : ``;
        return `\`[ ${senderName}${recipientDisplay} ]\` ${messageText}`;
    }

    /**
     * Generates a notification indicating the player started moving toward an exit.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param isRunning - Whether or not the player is running.
     * @param exitPhrase - The phrase of the exit the player is moving toward.
     */
    generateStartMoveNotification(player: Player, secondPerson: boolean, isRunning: boolean, exitPhrase: string) {
        const party = player.party;
        const isFollower = !!player.followedPlayer;
        const prefix = isFollower ? `following ${player.followedPlayerDisplayName}, ` : ``;
        const subject = secondPerson ? `you` : player.displayName;
        const verb = secondPerson ? `start` : `starts`;
        const action = isRunning ? `running` : `walking`;
        let followersString = ``;
        if (party && isFollower) {
            const otherFollowers = party.generatePlayerListString(party.followers.filter(follower => follower.name !== player.name));
            if (otherFollowers) followersString = ` with ${otherFollowers}`;
        }
        else if (party)
            followersString = ` with ${party.generatePlayerListString(party.followers)}`;
        let carryString = ``;
        if (followersString && !secondPerson) {
            const members = player.party ? player.party.members.values().toArray() : [];
            const memberCarryStrings: string[] = [];
            let onlyLeaderHasCarryString = true;
            members.forEach(member => {
                const memberCarryString = member.createMoveAppendString("carries");
                if (memberCarryString) {
                    if (member.name !== player.name) onlyLeaderHasCarryString = false;
                    const memberDisplayName = player.party?.getMemberDisplayName(member) ?? member.displayName;
                    memberCarryStrings.push(`${memberDisplayName}${memberCarryString}`);
                }
            });
            if (memberCarryStrings.length === 1 && onlyLeaderHasCarryString)
                carryString = ` while${player.createMoveAppendString()}`;
            else if (memberCarryStrings.length > 0) carryString = `. ${capitalizeFirstLetter(memberCarryStrings.join("; "))}`;
        }
        else if (followersString) {
            const memberCarryString = player.createMoveAppendString();
            if (memberCarryString) carryString = ` while${memberCarryString}`;
        }
        else carryString = player.createMoveAppendString();
        return `${capitalizeFirstLetter(`${prefix}${subject}`)} ${verb} ${action} toward ${exitPhrase}${followersString}${carryString}.`;
    }

    /**
     * Generates a notification indicating the player has depleted half of their stamina while moving.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     */
    generateHalfStaminaNotification(player: Player, secondPerson: boolean) {
        const subject = secondPerson ? `Your breathing` : `${capitalizeFirstLetter(player.displayName)}'s breathing`;
        const sentence2 = secondPerson ? `You might want to stop moving and rest soon.` : `It seems like ${player.pronouns.sbj}${player.pronouns.plural ? `'re` : `'s`} starting to get tired.`;
        return `${subject} is getting heavy. ${sentence2}`;
    }

    /**
     * Generates a notification indicating the player has become weary.
     * @param player - The player referred to in this notification.
     */
    generateWearyNotification(player: Player) {
        return `${capitalizeFirstLetter(player.displayName)} stops moving. ${player.pronouns.Sbj} ${player.pronouns.plural ? `seem` : `seems`} weary.`;
    }

    /**
     * Generates a notification indicating the player has stopped moving.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param allPlayers - All players stopping with the player being addressed, including the player being addressed.
     */
    generateStopNotification(player: Player, secondPerson: boolean, allPlayers: Set<Player>) {
        let [playerDisplayName, _, otherDisplayNames] = this.getPlayerDisplayNames(player, allPlayers);
        let playerDisplayNames: string[] = [];
        if (secondPerson) {
            playerDisplayNames.push(`you`);
            if (allPlayers.values().every(otherPlayer => otherPlayer.party?.hasMember(player) && otherPlayer.party?.positionsSynchronized))
                playerDisplayNames = playerDisplayNames.concat(otherDisplayNames);
        }
        else {
            playerDisplayNames = [playerDisplayName].concat(otherDisplayNames);
            playerDisplayNames.sort((a, b) => a.localeCompare(b));
        }
        const subject = generateListString(playerDisplayNames);
        const verb = secondPerson || otherDisplayNames.length > 0 ? `stop` : `stops`;
        return `${capitalizeFirstLetter(subject)} ${verb} moving.`;
    }

    /**
     * Generates a notification indicating the player began following someone.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param targetDisplayName - The display name of the player being followed.
     */
    generateFollowNotification(player: Player, secondPerson: boolean, targetDisplayName: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `begin following` : `begins following`;
        return `${subject} ${verb} ${targetDisplayName}.`;
    }

    /**
     * Generates a notification indicating the player is being followed.
     * @param followerDisplayName - The display name of the player following the player being addressed.
     */
    generateBeingFollowedNotification(followerDisplayName: string) {
        return `${capitalizeFirstLetter(followerDisplayName)} is following you.`;
    }

    /**
     * Generates a notification indicating the player has stopped following the given target.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param allPlayers - All players stopping with the player being addressed, including the player being addressed.
     * @param targetDisplayName - The display name of the player that they were following.
     */
    generateStopFollowingNotification(player: Player, secondPerson: boolean, allPlayers: Set<Player>, targetDisplayName: string) {
        let [playerDisplayName, playerDisplayNames, otherDisplayNames] = this.getPlayerDisplayNames(player, allPlayers);
        const subject = secondPerson ? `you` : generateListString([playerDisplayName].concat(otherDisplayNames));
        const verb = secondPerson ? `stop` : otherDisplayNames.length > 0 ? `stop` : `stops`;
        return `${capitalizeFirstLetter(subject)} ${verb} following ${targetDisplayName}.`;
    }

    /**
     * Generates a notification indicating the player has lost track of the player they were following.
     * @param targetDisplayName - The display name of the player that they were following.
     */
    generateLostFollowedPlayerNotification(targetDisplayName: string) {
        return `You can't find ${targetDisplayName} here.`;
    }

    /**
     * Generates a notification indicating the player has begun leading other players.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param followers - The players being led.
     * @param partySynchronized - Whether or not the party members' positions are all synchronized.
     * @param partyHasOtherFollowers - Whether or not the party has other followers aside from the ones being added.
     */
    generateLeadNotification(player: Player, secondPerson: boolean, followers: Player[], partySynchronized: boolean, partyHasOtherFollowers: boolean) {
        const subject1 = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb1 = secondPerson ? `begin leading` : `begins leading`;
        const followerListString = generatePlayerListString(followers);
        let addendum = "";
        if (partySynchronized && secondPerson) {
            const opening = partyHasOtherFollowers
                ? `Everyone in your party is all`
                : followers.length > 1
                    ? `You're all`
                    : `You're both`;
            addendum = `. ${opening} together, and ready to go`;
        }
        else if (!partySynchronized) {
            const punctuation = secondPerson ? `.` : `,`;
            const subject2 = secondPerson && followers.length === 1
                ? followers[0].pronouns.Sbj
                : secondPerson && followers.length > 1
                    ? `They`
                    : `who`;
            const pluralizeVerb = followers.length > 1 || secondPerson && followers.length === 1 && followers[0].pronouns.plural;
            const verb2 = pluralizeVerb ? `start` : `starts`;
            const object = secondPerson ? `you` : player.pronouns.obj;
            addendum = `${punctuation} ${subject2} ${verb2} approaching ${object}`;
        }
        return `${subject1} ${verb1} ${followerListString}${addendum}.`;
    }

    /**
     * Generates a notification indicating the player is being led.
     * @param leader - The player leading the player being addressed.
     * @param followerListString - A list of the players being led by the same leader.
     * @param ledPlayerSynchronized - Whether or not the position of the player being addressed matches the leader's position.
     */
    generateBeingLedNotification(leader: Player, followerListString: string, ledPlayerSynchronized: boolean) {
        const addendum = ledPlayerSynchronized ? `` : ` You start approaching ${leader.pronouns.obj}.`;
        return `${capitalizeFirstLetter(leader.displayName)} is now leading ${followerListString}.${addendum}`;
    }

    /**
     * Generates a notification that the player is finished approaching their leader.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param leader - The leader of the party, who the player being addressed was approaching.
     */
    generateFinishApproachingNotification(player: Player, secondPerson: boolean, leader: Player) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb1 = secondPerson ? `finish` : `finishes`;
        const verb2 = secondPerson ? `wait` : `waits`;
        return `${subject} ${verb1} approaching ${leader.displayName}, and ${verb2} with ${leader.pronouns.obj}.`;
    }

    /**
     * Generates a notification indicating that the players in the leader's party all have their positions synchronized.
     */
    generatePartyReadyNotification() {
        return `Everyone in your party is all together now, and ready to go.`;
    }

    /**
     * Generates a notification indicating the given players couldn't keep up with the party
     * because they stopped moving during position synchronization, and have been removed.
     * @param ledPlayersString - A list of the players who couldn't keep up.
     * @param leaderDisplayName - The display name of the party leader.
     */
    generateLedPlayerCouldNotSynchronizeNotification(ledPlayersString: string, leaderDisplayName: string) {
        return `${ledPlayersString} can't seem to keep up with ${leaderDisplayName}.`;
    }

    /**
     * Generates a notification indicating that the player has stopped leading the given followers.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param followerListString - A list of the players that they have stopped leading.
     */
    generateDismissNotification(player: Player, secondPerson: boolean, followerListString: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `stop leading` : `stops leading`;
        return `${subject} ${verb} ${followerListString}.`;
    }

    /**
     * Generates a notification indicating that the player is no longer being led.
     * @param leaderDisplayName - The display name of the player that was leading the player being addressed.
     * @param followerListString - A list of the players that were being led by the same leader as the player being addressed.
     */
    generateNoLongerBeingLedNotification(leaderDisplayName: string, followerListString: string) {
        return `${capitalizeFirstLetter(leaderDisplayName)} stops leading ${followerListString}.`;
    }

    /**
     * Generates a notification indicating that the player has disbanded their party.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param stopFollowing - Whether or not the followers stopped following the leader as a result of the party being disbanded.
     * @param followerListString - A list of the followers that were in the disbanded party.
     */
    generateDisbandPartyNotification(player: Player, secondPerson: boolean, stopFollowing: boolean, followerListString: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb1 = secondPerson ? `disband` : `disbands`;
        const dpos = secondPerson ? `your` : `${player.pronouns.dpos}`;
        const verb2 = followerListString.includes(" and ") ? `are` : `is`;
        const obj = secondPerson ? `you` : `${player.pronouns.obj}`;
        const addendum = stopFollowing ? `` : `, but ${followerListString} ${verb2} still following ${obj}`;
        return `${subject} ${verb1} ${dpos} party${addendum}.`;
    }

    /**
     * Generates a notification indicating that the player's party has been disbanded by their leader.
     * @param leader - The leader that disbanded the party of the player being addressed.
     * @param stopFollowing - Whether or not the followers stopped following the leader as a result of the party being disbanded.
     */
    generatePartyDisbandedNotification(leader: Player, stopFollowing: boolean) {
        const addendum = stopFollowing ? `. You are no longer following ${leader.pronouns.obj}` : `, but you are still following ${leader.pronouns.obj}`;
        return `${capitalizeFirstLetter(leader.displayName)} has disbanded your party${addendum}.`;
    }

    /**
     * Generates a notification indicating that the player's party has been disbanded because their leader has a status effect.
     * @param leader - The leader that disbanded the party of the player being addressed.
     * @param statusId - The ID of the status effect that caused the party to be disbanded.
     * @param stopFollowing - Whether or not the followers stopped following the leader as a result of the party being disbanded.
     */
    generatePartyDisbandedByStatusNotification(leader: Player, statusId: string, stopFollowing: boolean) {
        const addendum = stopFollowing ? `. You are no longer following ${leader.pronouns.obj}` : `, but you are still following ${leader.pronouns.obj}`;
        return `Your party has been disbanded because ${leader.party.getMemberDisplayName(leader)} is ${statusId}${addendum}.`;
    }

    /**
     * Generates a notification indicating the player cannot move to an exit because it is locked.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param allPlayers - All players stopping with the player being addressed, including the player being addressed.
     * @param doorPhrase - The door phrase of the locked exit.
     */
    generateExitLockedNotification(player: Player, secondPerson: boolean, allPlayers: Set<Player>, doorPhrase: string) {
        const actingPlayer = !player.party || player.party.hasLeader(player) ? player : player.party.leader;
        const addressPlayerInSecondPerson = secondPerson && actingPlayer.name === player.name;
        const subject = addressPlayerInSecondPerson ? `you` : player.party?.getMemberDisplayName(actingPlayer) ?? actingPlayer.displayName;
        const verb = addressPlayerInSecondPerson ? `try` : `tries`;
        let [_, playerDisplayNames, otherDisplayNames] = this.getPlayerDisplayNames(actingPlayer, allPlayers);
        let listedDisplayNames: string[] = [];
        if (allPlayers.size > 1 && secondPerson) {
            if (!addressPlayerInSecondPerson) listedDisplayNames.push(`you`);
            if (allPlayers.values().every(otherPlayer => otherPlayer.party?.hasMember(player) && otherPlayer.party?.positionsSynchronized)) {
                otherDisplayNames = [...playerDisplayNames]
                    .filter(([other]) => other.name !== player.name && other.name !== actingPlayer.name)
                    .map(([_, displayName]) => displayName);
                listedDisplayNames = listedDisplayNames.concat(otherDisplayNames);
            }
        }
        else if (allPlayers.size > 1) {
            listedDisplayNames = otherDisplayNames;
            listedDisplayNames.sort((a, b) => a.localeCompare(b));
        }
        let appendString = ``;
        if (listedDisplayNames.length > 0) {
            const subject = generateListString(listedDisplayNames);
            const verb = subject === `you` || listedDisplayNames.length > 1 ? `stop` : `stops`;
            const obj = addressPlayerInSecondPerson ? `you` : actingPlayer.pronouns.obj;
            appendString = ` ${capitalizeFirstLetter(subject)} ${verb} behind ${obj}.`;
        }
        return `${capitalizeFirstLetter(subject)} ${verb} to open ${doorPhrase}, but it seems to be locked.${appendString}`;
    }

    /**
     * Gets the display name of the given player, the display names of all players as a collection, and an array of player display names excluding the given player.
     * @param player - The player being referred to in a notification.
     * @param allPlayers - All players moving with the player being addressed, including the player being addressed.
     * @returns [playerDisplayName, playerDisplayNames, otherDisplayNames]
     */
    private getPlayerDisplayNames(player: Player, allPlayers: Set<Player>): [string, Collection<Player, string>, string[]] {
        const party = player.party;
        const playerDisplayName = party?.getMemberDisplayName(player) ?? player.displayName;
        const playerDisplayNames: Collection<Player, string> = new Collection();
        allPlayers.forEach(player => playerDisplayNames.set(player, party?.getMemberDisplayName(player) ?? player.displayName));
        playerDisplayNames.sort((a, b) => a.localeCompare(b));
        const otherDisplayNames = [...playerDisplayNames].filter(([other]) => other.name !== player.name).map(([_, displayName]) => displayName);
        return [playerDisplayName, playerDisplayNames, otherDisplayNames];
    }

    /**
     * Generates an array of three strings to use in movement-related notifications.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param allPlayers - All players moving with the player being addressed, including the player being addressed.
     * @returns [subject, otherPlayerList (may be blank), carryString (may be blank)]
     */
    generateCollectiveMovePlayerStrings(player: Player, secondPerson: boolean, allPlayers: Set<Player>): [string, string, string] {
        let subject = ``;
        let otherPlayerList = ``;
        let carryString = ``;
        const [playerDisplayName, playerDisplayNames, otherDisplayNames] = this.getPlayerDisplayNames(player, allPlayers);
        if (secondPerson) {
            subject = `you`;
            otherPlayerList = generateListString(otherDisplayNames);
            if (otherPlayerList) {
                const appendString = player.createMoveAppendString();
                if (appendString) carryString = ` while${appendString}`;
            }
            else carryString = player.createMoveAppendString();
        }
        else {
            const listedPlayers = [playerDisplayName].concat(otherDisplayNames);
            subject = generateListString(listedPlayers);
            const playerCarryStrings: string[] = [];
            if (listedPlayers.length > 1) {
                for (const [player, displayName] of playerDisplayNames) {
                    const playerCarryString = player.createMoveAppendString("carries");
                    if (playerCarryString) playerCarryStrings.push(`${displayName}${playerCarryString}`);
                }
                if (playerCarryStrings.length > 0) carryString = `. ${capitalizeFirstLetter(playerCarryStrings.join("; "))}`;
            }
            else carryString = player.createMoveAppendString();
        }
        return [subject, otherPlayerList, carryString];
    }

    /**
     * Generates a notification indicating the players exited a room.
     * @param secondPerson - Whether or not the player being addressed should be referred to in second person.
     * @param subject - The subject of the notification. This should be obtained from {@link generateCollectiveMovePlayerStrings}.
     * @param exitPhrase - The phrase of the exit the player exited through.
     * @param otherPlayerList - A list of other players exiting with the player being addressed. This should be obtained from {@link generateCollectiveMovePlayerStrings}.
     * @param carryString - A string describing any non-discreet inventory items the player is carrying. This should be obtained from {@link generateCollectiveMovePlayerStrings}.
     */
    generateExitNotification(secondPerson: boolean, subject: string, exitPhrase: string, otherPlayerList: string, carryString: string) {
        const verb = secondPerson || subject.includes(" and ") ? `exit` : `exits`;
        const destinationPhrase = exitPhrase ? ` into ${exitPhrase}` : ``;
        const otherPlayersPhrase = otherPlayerList ? ` with ${otherPlayerList}` : ``;
        return `${capitalizeFirstLetter(subject)} ${verb}${destinationPhrase}${otherPlayersPhrase}${carryString}.`;
    }

    /**
     * Generates a notification indicating players with the free movement role exited a room.
     * @param secondPerson - Whether or not the player being addressed should be referred to in second person.
     * @param subject - The subject of the notification. This should be obtained from {@link generateCollectiveMovePlayerStrings}.
     * @param roomName - The display name of the room the players exited.
     * @param otherPlayerList - A list of other players exiting with the player being addressed. This should be obtained from {@link generateCollectiveMovePlayerStrings}.
     * @param carryString - A string describing any non-discreet inventory items the player is carrying. This should be obtained from {@link generateCollectiveMovePlayerStrings}.
     */
    generateSuddenExitNotification(secondPerson: boolean, subject: string, roomName: string, otherPlayerList: string, carryString: string) {
        const verb = secondPerson ? `exit ${roomName}` : subject.includes(" and ") ? `suddenly disappear` : `suddenly disappears`;
        const otherPlayersPhrase = otherPlayerList ? ` with ${otherPlayerList}` : ``;
        const punctuation = secondPerson ? `.` : `!`;
        return `${capitalizeFirstLetter(subject)} ${verb}${otherPlayersPhrase}${carryString}${punctuation}`;
    }

    /**
     * Generates a notification indicating the players entered a room.
     * @param secondPerson - Whether or not the player being addressed should be referred to in second person.
     * @param subject - The subject of the notification. This should be obtained from {@link generateCollectiveMovePlayerStrings}.
     * @param entrancePhrase - The phrase of the exit the player entered through.
     * @param otherPlayerList - A list of other players entering with the player being addressed. This should be obtained from {@link generateCollectiveMovePlayerStrings}.
     * @param carryString - A string describing any non-discreet inventory items the player is carrying. This should be obtained from {@link generateCollectiveMovePlayerStrings}.
     */
    generateEnterNotification(secondPerson: boolean, subject: string, entrancePhrase: string, otherPlayerList: string, carryString: string) {
        const verb = secondPerson || subject.includes(" and ") ? `enter` : `enters`;
        const exitPhrase = entrancePhrase ? ` from ${entrancePhrase}` : ``;
        const otherPlayersPhrase = otherPlayerList ? ` with ${otherPlayerList}` : ``;
        return `${capitalizeFirstLetter(subject)} ${verb}${exitPhrase}${otherPlayersPhrase}${carryString}.`;
    }

    /**
     * Generates a notification indicating players with the free movement role entered a room.
     * @param secondPerson - Whether or not the player being addressed should be referred to in second person.
     * @param subject - The subject of the notification. This should be obtained from {@link generateCollectiveMovePlayerStrings}.
     * @param roomName - The display name of the room the players exited.
     * @param otherPlayerList - A list of other players exiting with the player being addressed. This should be obtained from {@link generateCollectiveMovePlayerStrings}.
     * @param carryString - A string describing any non-discreet inventory items the player is carrying. This should be obtained from {@link generateCollectiveMovePlayerStrings}.
     */
    generateSuddenEnterNotification(secondPerson: boolean, subject: string, roomName: string, otherPlayerList: string, carryString: string) {
        const verb = secondPerson ? `enter ${roomName}` : subject.includes(" and ") ? `suddenly appear` : `suddenly appears`;
        const otherPlayersPhrase = otherPlayerList ? ` with ${otherPlayerList}` : ``;
        const punctuation = secondPerson ? `.` : `!`;
        return `${capitalizeFirstLetter(subject)} ${verb}${otherPlayersPhrase}${carryString}${punctuation}`;
    }

    /**
     * Generates a notification indicating the player with the `no sight` behavior attribute entered a room.
     */
    generateNoSightEnterNotification() {
        return `Fumbling against the wall, you make your way to the next room over.`;
    }

    /**
     * Generates a notification containing a list of occupants in the room. If any of the occupants are sleeping, includes them separately.
     * @param player - The player referred to in this notification.
     * @param room - The room whose occupants are to be listed.
     */
    generateRoomOccupantsNotification(player: Player, room: Room) {
        let occupantsList = room.generateOccupantsStringExcluding(player);
        const maxLength = 1000;
        let verb1 = `see`;
        if (occupantsList === "") {
            verb1 = `don't see`;
            occupantsList = `anyone`;
        }
        else if (occupantsList.length > maxLength) occupantsList = `a lot of people`;
        const sleepingOccupants = room.occupants.filter(occupant => !occupant.isConscious() && !occupant.isHidden() && occupant.name !== player.name);
        let sleepingOccupantsString = ``;
        if (sleepingOccupants.length > 0) {
            const verb2 = sleepingOccupants.length === 1 ? `is` : `are`;
            const occupantsList = room.generateOccupantsString(sleepingOccupants);
            sleepingOccupantsString = `\n${occupantsList} ${verb2} asleep.`;
        }
        return `You ${verb1} ${occupantsList} here.${sleepingOccupantsString}`;
    }

    /**
     * Generates a notification about the default drop fixture.
     * @param parsedFixtureDescription - The default drop fixture's parsed description.
     * @param fixture - The default drop fixture in a room.
     * @param defaultDropFixture - The game's default drop fixture.
     */
    generateDefaultDropFixtureNotification(parsedFixtureDescription: string, fixture: Fixture, defaultDropFixture: string) {
        const preposition = fixture ? fixture.getPreposition() : `about`;
        const fixturePhrase = fixture ? fixture.getContainingPhrase() : `the ${defaultDropFixture.toLocaleLowerCase()}`;
        if (parsedFixtureDescription === "")
            parsedFixtureDescription = `There's nothing of note ${preposition} ${fixturePhrase}.`;
        return parsedFixtureDescription;
    }

    /**
     * Generates a notification indicating the player inspected the room.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     */
    generateInspectRoomNotification(player: Player, secondPerson: boolean) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `look` : `looks`;
        const dpos = secondPerson ? `your` : `${player.pronouns.dpos}`;
        return `${subject} ${verb} around, taking in ${dpos} surroundings.`;
    }

    /**
     * Generates a notification indicating the player inspected a fixture.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param fixturePhrase - The phrase of the fixture.
     */
    generateInspectFixtureNotification(player: Player, secondPerson: boolean, fixturePhrase: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `inspect` : `begins inspecting`;
        return `${subject} ${verb} ${fixturePhrase}.`;
    }

    /**
     * Generates a notification indicating the player inspected a room item.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     * @param preposition - The preposition of the container.
     * @param containerPhrase - The phrase of the container.
     */
    generateInspectRoomItemNotification(player: Player, secondPerson: boolean, itemPhrase: string, preposition: string, containerPhrase: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `inspect` : `begins inspecting`;
        return `${subject} ${verb} ${itemPhrase} ${preposition} ${containerPhrase}.`;
    }

    /**
     * Generates a notification indicating the player inspected an inventory item that they have stashed.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     */
    generateInspectPlayersOwnStashedInventoryItemNotification(player: Player, secondPerson: boolean, itemPhrase: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb1 = secondPerson ? `take out` : `takes out`;
        const verb2 = secondPerson ? `inspect` : `begins inspecting`;
        return `${subject} ${verb1} ${itemPhrase} and ${verb2} it.`;
    }

    /**
     * Generates a notification indicating the player inspected an inventory item that they have equipped.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemName - The name of the item.
     */
    generateInspectPlayersOwnEquippedInventoryItemNotification(player: Player, secondPerson: boolean, itemName: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `inspect` : `begins inspecting`;
        const dpos = secondPerson ? `your` : `${player.pronouns.dpos}`;
        return `${subject} ${verb} ${dpos} ${itemName}.`;
    }

    /**
     * Generates a notification indicating the player inspected an inventory item that belongs to another player.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param otherPlayer - The player the inventory item belongs to.
     * @param itemPhrase - The single containing phrase of the item.
     */
    generateInspectOtherPlayersInventoryItemNotification(player: Player, secondPerson: boolean, otherPlayer: Player, itemPhrase: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `inspect` : `begins inspecting`;
        return `${subject} ${verb} ${otherPlayer.displayName}'s ${itemPhrase}.`;
    }

    /**
     * Generates a notification indicating a hidden player was found in their hiding spot.
     * @param playerDisplayName - The display name of the player who found them.
     */
    generateHiddenPlayerFoundNotification(playerDisplayName: string) {
        return `You've been found by ${playerDisplayName}!`;
    }

    /**
     * Generates a notification indicating the player found players hidden in a fixture.
     * @param hiddenPlayersList - A list of hidden players.
     * @param hidingSpotPhrase - The phrase of the hiding spot the players are hiding in.
     */
    generateFoundHiddenPlayersNotification(hiddenPlayersList: string, hidingSpotPhrase: string) {
        return `You find ${hiddenPlayersList} hiding in ${hidingSpotPhrase}!`;
    }

    /**
     * Generates a notification indicating the player knocked on an exit.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param doorPhrase - The door phrase of the exit.
     */
    generateKnockNotification(player: Player, secondPerson: boolean, doorPhrase: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `knock` : `knocks`;
        return `${subject} ${verb} on ${doorPhrase}.`;
    }

    /**
     * Generates a notification indicating there was a knock originating from the other side of an exit.
     * @param doorPhrase - The door phrase of the exit.
     */
    generateKnockDestinationNotification(doorPhrase: string) {
        return `There's a knock on ${doorPhrase}.`;
    }

    /**
     * Generates a notification indicating the player can't hide in the hiding spot because it's already full.
     * @param player - The player referred to in this notification.
     * @param allPlayers - The set of all players who are hiding together, including the player being addressed.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param hidingSpotPhrase - The phrase of the hiding spot the players are hiding in.
     * @param hiddenPlayersList - A list of hidden players. Only necessary if secondPerson is true.
     */
    generateHidingSpotFullNotification(player: Player, allPlayers: Set<Player>, secondPerson: boolean, hidingSpotPhrase: string, hiddenPlayersList?: string) {
        let subject = secondPerson ? `you` : player.displayName;
        let verb = secondPerson ? `attempt` : `attempts`;
        let object = secondPerson ? `you` : player.pronouns.obj;
        if (allPlayers.size > 1) {
            const [_, __, otherDisplayNames] = this.getPlayerDisplayNames(player, allPlayers);
            const playerDisplayNames = [subject].concat(otherDisplayNames);
            const playerList = generateListString(playerDisplayNames);
            if (secondPerson) object = playerList;
            else {
                subject = playerList;
                verb = `attempt`;
                object = `them`;
            }
        }
        let hiddenPlayersString = secondPerson && hiddenPlayersList !== `` ? `you find ${hiddenPlayersList} already there! There` : `there`;
        return `${capitalizeFirstLetter(subject)} ${verb} to hide in ${hidingSpotPhrase}, but ${hiddenPlayersString} doesn't seem to be enough room for ${object}.`;
    }

    /**
     * Generates a notification indicating the player found other players while attempting to hide.
     * @param hidingSpotPhrase - The phrase of the hiding spot the players are hiding in.
     * @param hiddenPlayersList - A list of hidden players.
     * @param player - The player referred to in this notification.
     * @param allPlayers - The set of all players who are hiding together, including the player being addressed.
     */
    generateHidingSpotOccupiedNotification(hidingSpotPhrase: string, hiddenPlayersList: string, player: Player, allPlayers: Set<Player>) {
        let subject = `you`;
        if (allPlayers.size > 1) {
            const [_, __, otherDisplayNames] = this.getPlayerDisplayNames(player, allPlayers);
            const playerDisplayNames = [`you`].concat(otherDisplayNames);
            subject = generateListString(playerDisplayNames);
        }
        return `When ${subject} hide in ${hidingSpotPhrase}, you find ${hiddenPlayersList} already there!`;
    }

    /**
     * Generates a notification indicating someone found the player while hiding.
     * @param player - The player referred to in this notification.
     * @param findingPlayer - The player that hid, who found the player in the process.
     * @param allPlayers - The set of all players who are hiding together.
     */
    generateFoundInOccupiedHidingSpotNotification(player: Player, findingPlayer: Player, allPlayers: Set<Player>) {
        const [playerDisplayName, _, otherDisplayNames] = this.getPlayerDisplayNames(findingPlayer, allPlayers);
        const findingPlayersList = generateListString([playerDisplayName].concat(otherDisplayNames));
        const foundNotification = player.canSee()
            ? `You're found by ${findingPlayersList}`
            : allPlayers.size > 1
                ? `Several people find you`
                : `Someone finds you`;
        const findingPlayerSbj = allPlayers.size === 1 && player.canSee() ? findingPlayer.pronouns.Sbj : `They`;
        const verb = allPlayers.size === 1 && player.canSee() && !findingPlayer.pronouns.plural ? `hides` : `hide`;
        return `${foundNotification}! ${findingPlayerSbj} ${verb} with you.`;
    }

    /**
     * Generates a notification indicating someone found the player while attempting to hide, but they couldn't hide because the hiding spot was full.
     * @param player - The player referred to in this notification.
     * @param findingPlayer - The player attempting to hide, who found the player in the process.
     * @param allPlayers - The set of all players who are hiding together.
     */
    generateFoundInFullHidingSpotNotification(player: Player, findingPlayer: Player, allPlayers: Set<Player>) {
        const [playerDisplayName, _, otherDisplayNames] = this.getPlayerDisplayNames(findingPlayer, allPlayers);
        const findingPlayersList = generateListString([playerDisplayName].concat(otherDisplayNames));
        const foundNotification = player.canSee()
            ? `You're found by ${findingPlayersList}`
            : allPlayers.size > 1
                ? `Several people find you`
                : `Someone finds you`;
        const findingPlayerSbj = allPlayers.size === 1 && player.canSee() ? findingPlayer.pronouns.Sbj : `They`;
        const verb = allPlayers.size === 1 && player.canSee() && !findingPlayer.pronouns.plural ? `tries` : `try`;
        return `${foundNotification}! ${findingPlayerSbj} ${verb} to hide with you, but there isn't enough room.`;
    }

    /**
     * Generates a notification indicating that a player emerged from a hiding spot that remains occupied.
     * @param player - The player referred to in this notification.
     * @param emergingPlayer - The player who emerged from hiding.
     * @param allPlayers - The set of all players who emerged from hiding, including the emerging player.
     * @param hidingSpotPhrase - The phrase of the hiding spot the player is coming out from.
     */
    generateEmergeFromOccupiedHidingSpotNotification(player: Player, emergingPlayer: Player, allPlayers: Set<Player>, hidingSpotPhrase: string) {
        const [playerDisplayName, _, otherDisplayNames] = this.getPlayerDisplayNames(emergingPlayer, allPlayers);
        const findingPlayersList = generateListString([playerDisplayName].concat(otherDisplayNames));
        const subject = player.canSee()
            ? `${findingPlayersList}`
            : allPlayers.size > 1
                ? `Several people`
                : `Someone`;
        const verb = allPlayers.size === 1 ? `comes out` : `come out`;
        return `${capitalizeFirstLetter(subject)} ${verb} of ${hidingSpotPhrase}.`;
    }

    /**
     * Generates a notification indicating the player can no longer whisper
     * because they were inflicted with a status effect with the `no channel` behavior attribute.
     * @param player - The player referred to in this notification.
     * @param statusId - The ID of the status effect that made the player unable to whisper.
     */
    generateNoChannelLeaveWhisperNotification(player: Player, statusId: string) {
        return `${capitalizeFirstLetter(player.displayName)} can no longer whisper because ${player.originalPronouns.sbj} ${player.originalPronouns.plural ? `are` : `is`} ${statusId}.`;
    }

    /**
     * Generates a notification indicating the player can no longer whisper
     * because they were inflicted with a status effect with the `no hearing` behavior attribute.
     * @param playerDisplayName - The display name of the player.
     */
    generateNoHearingLeaveWhisperNotification(playerDisplayName: string) {
        return `${capitalizeFirstLetter(playerDisplayName)} can no longer hear.`;
    }

    /**
     * Generates a notification indicating the player can no longer whisper because they left the room.
     * @param playerDisplayName - The display name of the player.
     */
    generateExitLeaveWhisperNotification(playerDisplayName: string) {
        return `${capitalizeFirstLetter(playerDisplayName)} leaves the room.`;
    }

    /**
     * Generates a notification indicating the player was inflicted with a status effect with the ID `asleep`.
     * @param playerDisplayName - The display name of the player.
     */
    generateFallAsleepNotification(playerDisplayName: string) {
        return `${capitalizeFirstLetter(playerDisplayName)} falls asleep.`;
    }

    /**
     * Generates a notification indicating the player was inflicted with a status effect with the ID `blacked out`.
     * @param playerDisplayName - The display name of the player.
     */
    generateBlackOutNotification(playerDisplayName: string) {
        return `${capitalizeFirstLetter(playerDisplayName)} blacks out.`;
    }

    /**
     * Generates a notification indicating the player was inflicted with a status effect with the `unconscious` behavior attribute.
     * @param playerDisplayName - The display name of the player.
     */
    generateUnconsciousNotification(playerDisplayName: string) {
        return `${capitalizeFirstLetter(playerDisplayName)} goes unconscious.`;
    }

    /**
     * Generates a notification indicating the player took off their mask.
     * @param maskName - The name of the inventory item the player took off.
     * @param playerDisplayName - The display name of the player.
     */
    generateConcealedCuredNotification(maskName: string, playerDisplayName: string) {
        return `The ${maskName} comes off, revealing the individual to be ${playerDisplayName}.`;
    }

    /**
     * Generates a notification indicating the player woke up.
     * @param playerDisplayName - The display name of the player.
     */
    generateWakeUpNotification(playerDisplayName: string) {
        return `${capitalizeFirstLetter(playerDisplayName)} wakes up.`;
    }

    /**
     * Generates a notification indicating the player was cured of a status effect with the `unconscious` behavior attribute.
     * @param playerDisplayName - The display name of the player.
     */
    generateRegainConsciousnessNotification(playerDisplayName: string) {
        return `${capitalizeFirstLetter(playerDisplayName)} regains consciousness.`;
    }

    /**
     * Generates a notification indicating the player hid in a fixture.
     * @param player - The player referred to in this notification.
     * @param allPlayers - The set of all players who are hiding together, including the player being addressed.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param hidingSpotPhrase - The phrase of the hiding spot the player is hiding in.
     */
    generateHideNotification(player: Player, allPlayers: Set<Player>, secondPerson: boolean, hidingSpotPhrase: string) {
        let subject = secondPerson ? `you` : player.displayName;
        if (allPlayers.size > 1) {
            const [_, __, otherDisplayNames] = this.getPlayerDisplayNames(player, allPlayers);
            const playerDisplayNames = [subject].concat(otherDisplayNames);
            subject = generateListString(playerDisplayNames);
        }
        const verb = subject === `you` || allPlayers.size > 1 ? `hide` : `hides`;
        return `${capitalizeFirstLetter(subject)} ${verb} in ${hidingSpotPhrase}.`;
    }

    /**
     * Generates a notification indicating the player came out of a hiding spot.
     * @param player - The player referred to in this notification.
     * @param allPlayers - The set of all players who are emerging together, including the player being addressed.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param hidingSpotPhrase - The phrase of the hiding spot the player is coming out from.
     */
    generateEmergeNotification(player: Player, allPlayers: Set<Player>, secondPerson: boolean, hidingSpotPhrase: string) {
        let subject = secondPerson ? `you` : player.displayName;
        if (allPlayers.size > 1) {
            const [_, __, otherDisplayNames] = this.getPlayerDisplayNames(player, allPlayers);
            const playerDisplayNames = [subject].concat(otherDisplayNames);
            subject = generateListString(playerDisplayNames);
        }
        const verb = subject === `you` || allPlayers.size > 1 ? `come out` : `comes out`;
        return `${capitalizeFirstLetter(subject)} ${verb} of ${hidingSpotPhrase}.`;
    }

    /**
     * Generates a notification indicating the player used an item.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     * @param useVerb - The prefab's use verb. Optional.
     * @param targetDisplayName - The display name of the target player of the use action.
     */
    generateUseNotification(player: Player, secondPerson: boolean, itemPhrase: string, useVerb?: string, targetDisplayName?: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = useVerb ? useVerb : secondPerson ? `use` : `uses`;
        const targetPhrase = targetDisplayName ? ` on ${targetDisplayName}` : ``;
        return `${subject} ${verb} ${itemPhrase}${targetPhrase}.`;
    }

    /**
     * Generates a notification indicating the player took an item.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     * @param containerPhrase - The entire phrase of the container. Optional.
     */
    generateTakeNotification(player: Player, secondPerson: boolean, itemPhrase: string, containerPhrase?: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `take` : `takes`;
        const containerAppendString = containerPhrase ? ` from ${containerPhrase}` : ``;
        return `${subject} ${verb} ${itemPhrase}${containerAppendString}.`;
    }

    /**
     * Generates a string notification indicating the player couldn't take an item because it is too heavy.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     * @param containerPhrase - The entire phrase of the container.
     */
    generateTakeTooHeavyNotification(player: Player, secondPerson: boolean, itemPhrase: string, containerPhrase: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `try` : `tries`;
        const obj = secondPerson ? `you` : player.pronouns.obj;
        return `${subject} ${verb} to take ${itemPhrase} from ${containerPhrase}, but it is too heavy for ${obj} to lift.`;
    }

    /**
     * Generates a string notification indicating the player couldn't take an item because they are carrying too much weight.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     * @param containerPhrase - The entire phrase of the container.
     */
    generateTakeTooMuchWeightNotification(player: Player, secondPerson: boolean, itemPhrase: string, containerPhrase: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `try` : `tries`;
        const sbj = secondPerson ? `you` : player.pronouns.sbj;
        const contraction = secondPerson || player.pronouns.plural ? `'re` : `'s`;
        return `${subject} ${verb} to take ${itemPhrase} from ${containerPhrase}, but ${sbj}${contraction} carrying too much weight.`;
    }

    /**
     * Generates a notification indicating the player tried to steal from an empty inventory slot.
     * @param slotPhrase - A phrase to refer to the slot the player tried to steal from.
     * @param containerName - The name of the container the player tried to steal from.
     * @param victimDisplayName - The display name of the victim the player tried to steal from.
     */
    generateStoleFromEmptyInventorySlotNotification(slotPhrase: string, containerName: string, victimDisplayName: string) {
        return `You try to steal from ${slotPhrase}${victimDisplayName}'s ${containerName}, but it's empty.`;
    }

    /**
     * Generates a notification indicating the player successfully stole an item from someone.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     * @param slotPhrase - A phrase to refer to the slot the item was stolen from.
     * @param containerName - The name of the container the item was stolen from.
     * @param victim - The victim who was stolen from.
     * @param victimAware - Whether or not the victim noticed that they were stolen from.
     */
    generateSuccessfulStealNotification(player: Player, secondPerson: boolean, itemPhrase: string, slotPhrase: string, containerName: string, victim: Player, victimAware: boolean) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `steal` : `steals`;
        const successDisplay = secondPerson ? `.`
            : victimAware ? `, but ${victim.pronouns.sbj} ${victim.pronouns.plural ? `seem` : `seems`} to notice.`
                : ` without ${victim.pronouns.obj} noticing!`;
        return `${subject} ${verb} ${itemPhrase} from ${slotPhrase}${victim.displayName}'s ${containerName}${successDisplay}`;
    }

    /**
     * Generates a notification indicating the player failed to steal an item from someone.
     * @param itemPhrase - The single containing phrase of the item.
     * @param slotPhrase - A phrase to refer to the slot the item they attempted to steal.
     * @param containerName - The name of the container they attempted to steal from.
     * @param victim - The victim who they attempted to steal from.
     */
    generateFailedStealNotification(itemPhrase: string, slotPhrase: string, containerName: string, victim: Player) {
        return `You try to steal ${itemPhrase} from ${slotPhrase}${victim.displayName}'s ${containerName}, but ${victim.pronouns.sbj} ${victim.pronouns.plural ? `notice` : `notices`} before you can.`;
    }

    /**
     * Generates a notification indicating the player was stolen from.
     * @param thiefDisplayName - The display name of the thief who stole the item.
     * @param slotPhrase - A phrase to refer to the slot the item was stolen from.
     * @param itemPhrase - The single containing phrase of the item.
     * @param containerName - The name of the container the item was stolen from.
     */
    generateSuccessfulStolenFromNotification(thiefDisplayName: string, slotPhrase: string, itemPhrase: string, containerName: string) {
        return `${capitalizeFirstLetter(thiefDisplayName)} steals ${itemPhrase} from ${slotPhrase}your ${containerName}!`;
    }

    /**
     * Generates a notification indicating someone attempted to steal an item from the player.
     * @param thiefDisplayName - The display name of the thief who stole the item.
     * @param slotPhrase - A phrase to refer to the slot the item was stolen from.
     * @param itemPhrase - The single containing phrase of the item.
     * @param containerName - The name of the container the item was stolen from.
     */
    generateFailedStolenFromNotification(thiefDisplayName: string, slotPhrase: string, itemPhrase: string, containerName: string) {
        return `${capitalizeFirstLetter(thiefDisplayName)} attempts to steal ${itemPhrase} from ${slotPhrase}your${containerName}, but you notice in time!`;
    }

    /**
     * Generates a notification indicating the player dropped an item.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     * @param preposition - The preposition of the container.
     * @param containerPhrase - The entire phrase of the container. Optional.
     */
    generateDropNotification(player: Player, secondPerson: boolean, itemPhrase: string, preposition?: string, containerPhrase?: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        let verb = secondPerson ? `discard` : `discards`;
        if (containerPhrase) verb = secondPerson ? `put` : `puts`;
        const containerAppendString = containerPhrase ? ` ${preposition} ${containerPhrase}` : ``;
        return `${subject} ${verb} ${itemPhrase}${containerAppendString}.`;
    }

    /**
     * Generates a notification indicating the player gave an item to someone.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     * @param recipientDisplayName - The display name of the recipient.
     */
    generateGiveNotification(player: Player, secondPerson: boolean, itemPhrase: string, recipientDisplayName: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `give` : `gives`;
        return `${subject} ${verb} ${itemPhrase} to ${recipientDisplayName}.`;
    }

    /**
     * Generates a notification indicating the player couldn't give an item to someone because it is too heavy.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     * @param recipient - The recipient of the item.
     */
    generateGiveTooHeavyNotification(player: Player, secondPerson: boolean, itemPhrase: string, recipient: Player) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `try` : `tries`;
        return `${subject} ${verb} to give ${recipient.displayName} ${itemPhrase}, but it is too heavy for ${recipient.pronouns.obj} to lift.`;
    }

    /**
     * Generates a notification indicating the player couldn't give an item to someone because they are carrying too much weight.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     * @param recipient - The recipient of the item.
     */
    generateGiveTooMuchWeightNotification(player: Player, secondPerson: boolean, itemPhrase: string, recipient: Player) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `try` : `tries`;
        const contraction = secondPerson || player.pronouns.plural ? `'re` : `'s`;
        return `${subject} ${verb} to give ${recipient.displayName} ${itemPhrase}, but ${recipient.pronouns.sbj}${contraction} carrying too much weight.`;
    }

    /**
     * Generates a notification indicating the player received an item from someone.
     * @param itemPhrase - The single containing phrase of the item.
     * @param giverDisplayName - The display name of the giver.
     */
    generateReceiveNotification(itemPhrase: string, giverDisplayName: string) {
        return `${capitalizeFirstLetter(giverDisplayName)} gives you ${itemPhrase}!`;
    }

    /**
     * Generates a notification indicating the player couldn't receive an item from someone because it is too heavy.
     * @param itemPhrase - The single containing phrase of the item.
     * @param giverDisplayName - The display name of the player giving them the item.
     */
    generateReceiveTooHeavyNotification(itemPhrase: string, giverDisplayName: string) {
        return `${capitalizeFirstLetter(giverDisplayName)} tries to give you ${itemPhrase}, but it is too heavy for you to lift.`;
    }

    /**
     * Generates a notification indicating the player couldn't receive an item to someone because they are carrying too much weight.
     * @param itemPhrase - The single containing phrase of the item.
     * @param giverDisplayName - The display name of the player giving them the item.
     */
    generateReceiveTooMuchWeightNotification(itemPhrase: string, giverDisplayName: string) {
        return `${capitalizeFirstLetter(giverDisplayName)} tries to give you ${itemPhrase}, but you're carrying too much weight.`;
    }

    /**
     * Generates a notification indicating the player stashed an item.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     * @param preposition - The preposition of the container.
     * @param slotPhrase - A phrase to refer to the slot the item is being stashed in.
     * @param containerName - The name of the container the item is being stashed in.
     */
    generateStashNotification(player: Player, secondPerson: boolean, itemPhrase: string, preposition: string, slotPhrase: string, containerName: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `stash` : `stashes`;
        const dpos = secondPerson ? `your` : player.pronouns.dpos;
        return `${subject} ${verb} ${itemPhrase} ${preposition} ${slotPhrase}${dpos} ${containerName}.`;
    }

    /**
     * Generates a notification indicating the player unstashed an item.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     * @param slotPhrase - A phrase to refer to the slot the item is being unstashed from.
     * @param containerName - The name of the container the item is being unstashed from.
     */
    generateUnstashNotification(player: Player, secondPerson: boolean, itemPhrase: string, slotPhrase: string, containerName: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `take` : `takes`;
        const dpos = secondPerson ? `your` : player.pronouns.dpos;
        return `${subject} ${verb} ${itemPhrase} out of ${slotPhrase}${dpos} ${containerName}.`;
    }

    /**
     * Generates a notification indicating the player equipped an item.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemPhrase - The single containing phrase of the item.
     */
    generateEquipNotification(player: Player, secondPerson: boolean, itemPhrase: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `put on` : `puts on`;
        return `${subject} ${verb} ${itemPhrase}.`;
    }

    /**
     * Generates a notification indicating the player unequipped an item.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param itemName - The name of the item.
     */
    generateUnequipNotification(player: Player, secondPerson: boolean, itemName: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `take off` : `takes off`;
        const dpos = secondPerson ? `your` : player.pronouns.dpos;
        return `${subject} ${verb} ${dpos} ${itemName}.`;
    }

    /**
     * Generates a notification indicating the player dressed.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param containerName - The name of the container the player is dressing from.
     * @param itemList - A list of items the player put on.
     */
    generateDressNotification(player: Player, secondPerson: boolean, containerName: string, itemList: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `dress` : `dresses`;
        return `${subject} ${verb} from the ${containerName}, putting on ${itemList}.`;
    }

    /**
     * Generates a notification indicating the player undressed.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param preposition - The preposition of the container.
     * @param containerPhrase - The entire phrase of the container the player is undressing into.
     * @param itemList - A list of items the player took off.
     */
    generateUndressNotification(player: Player, secondPerson: boolean, preposition: string, containerPhrase: string, itemList: string) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        const verb = secondPerson ? `undress` : `undresses`;
        return `${subject} ${verb}, putting ${itemList} ${preposition} ${containerPhrase}.`;
    }

    /**
     * Generates a notification indicating the player crafted an item.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param craftingResult - The result of the craft action.
     */
    generateCraftNotification(player: Player, secondPerson: boolean, craftingResult: CraftingResult) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
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
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param recipe - The recipe used to uncraft the item.
     * @param originalItemPhrase - The original single containing phrase of the item.
     * @param itemPhrase - The single containing phrase of the item, which may have changed from its original value.
     * @param uncraftingResult - The result of the uncraft action.
     */
    generateUncraftNotification(player: Player, secondPerson: boolean, recipe: Recipe, originalItemPhrase: string, itemPhrase: string, uncraftingResult: UncraftingResult) {
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        // If only one ingredient is discreet, the first ingredient should be the discreet one.
        // This will result in more natural sounding notifications.
        const oneDiscreet = !uncraftingResult.ingredient1.prefab.discreet && uncraftingResult.ingredient2.prefab.discreet || uncraftingResult.ingredient1.prefab.discreet && !uncraftingResult.ingredient2.prefab.discreet;
        let ingredient1 = oneDiscreet && uncraftingResult.ingredient1.prefab.discreet ? uncraftingResult.ingredient1 : uncraftingResult.ingredient2;
        let ingredient2 = oneDiscreet && uncraftingResult.ingredient1.prefab.discreet ? uncraftingResult.ingredient2 : uncraftingResult.ingredient1;
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
     * @param fixturePhrase - The phrase of the fixture.
     * @param player - The player referred to in this notification, if applicable.
     * @param secondPerson - Whether or not the player should be referred to in second person, if applicable.
     */
    generateActivateNotification(fixturePhrase: string, player?: Player, secondPerson?: boolean) {
        if (player) {
            const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
            const verb = secondPerson ? `turn on` : `turns on`;
            return `${subject} ${verb} ${fixturePhrase}.`;
        }
        else return `${fixturePhrase} turns on.`;
    }

    /**
     * Generates a notification indicating that the fixture was deactivated.
     * @param fixturePhrase - The phrase of the fixture.
     * @param player - The player referred to in this notification, if applicable.
     * @param secondPerson - Whether or not the player should be referred to in second person, if applicable.
     */
    generateDeactivateNotification(fixturePhrase: string, player?: Player, secondPerson?: boolean) {
        if (player) {
            const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
            const verb = secondPerson ? `turn off` : `turns off`;
            return `${subject} ${verb} ${fixturePhrase}.`;
        }
        else return `${fixturePhrase} turns off.`;
    }

    /**
     * Generates the default notification indicating that a puzzle was attempted.
     * @param playerDisplayName - The display name of the player.
     * @param puzzlePhrase - The containing phrase of the puzzle.
     */
    generateAttemptPuzzleDefaultNotification(playerDisplayName: string, puzzlePhrase: string) {
        return `${capitalizeFirstLetter(playerDisplayName)} uses ${puzzlePhrase}.`;
    }

    /**
     * Generates a notification indicating the player attempted a puzzle with no remaining attempts.
     * @param playerDisplayName - The display name of the player.
     * @param puzzlePhrase - The containing phrase of the puzzle.
     */
    generateAttemptPuzzleWithNoRemainingAttemptsNotification(playerDisplayName: string, puzzlePhrase: string) {
        return `${capitalizeFirstLetter(playerDisplayName)} attempts and fails to use ${puzzlePhrase}.`;
    }

    /**
     * Generates a notification indicating the player attempted a puzzle that takes an item as a solution without the required item.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param puzzle - The puzzle that was attempted.
     */
    generateAttemptPuzzleWithoutItemSolutionNotification(player: Player, secondPerson: boolean, puzzle: Puzzle) {
        if (puzzle.isAlwaysAccessible()) return "";
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
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
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param puzzle - The puzzle that was solved.
     * @param outcome - The puzzle's outcome.
     * @param item - The item the puzzle was solved with, if applicable.
     */
    generateSolvePuzzleNotification(player: Player, secondPerson: boolean, puzzle: Puzzle, outcome: string, item?: ItemInstance) {
        if (puzzle.isAlwaysAccessible() || puzzle.type === "restricted exit" || puzzle.type === "exit" || puzzle.type === "voice") return "";
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
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
            if (outcome !== "")
                verb = secondPerson ? `change the channel to ${outcome} on` : `changes the channel to ${outcome} on`;
            else
                verb = secondPerson ? `turn on` : `turns on`;
        }
        return `${subject} ${verb} ${puzzlePhrase}${appendString}.`;
    }

    /**
     * Generates a notification indicating the player unsolved a puzzle. Chooses the notification automatically based on the puzzle's type.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param puzzle - The puzzle that was unsolved.
     */
    generateUnsolvePuzzleNotification(player: Player, secondPerson: boolean, puzzle: Puzzle) {
        if (puzzle.isAlwaysAccessible()) return "";
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
        let verb = secondPerson ? `use` : `uses`;
        const puzzlePhrase = puzzle.getContainingPhrase();
        if (puzzle.type === "combination lock" || puzzle.type === "key lock")
            verb = secondPerson ? `lock` : `locks`;
        else if (puzzle.type === "option")
            verb = secondPerson ? `clear the selection for` : `resets`;
        else if (puzzle.type === "media")
            verb = secondPerson ? `press eject on` : `presses eject on`;
        else if (puzzle.type === "channels")
            verb = secondPerson ? `turn off` : `turns off`;
        return `${subject} ${verb} ${puzzlePhrase}.`;
    }

    /**
     * Generates a notification indicating the player attempted a puzzle that was already solved. Generates the notification automatically based on the puzzle's type.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param puzzle - The puzzle that was attempted.
     */
    generateAttemptAlreadySolvedPuzzleNotification(player: Player, secondPerson: boolean, puzzle: Puzzle, item?: ItemInstance) {
        if (puzzle.isAlwaysAccessible()) return "";
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
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
        else if (puzzle.type === "media") {
            const itemPhrase = item.prefab.discreet ? `an item into` : `${item.singleContainingPhrase} into`;
            verb = secondPerson ? `attempt to insert ${itemPhrase}` : `attempts to insert ${itemPhrase}`;
            appendString = `, but something is already inside`;
        }
        return `${subject} ${verb} ${puzzlePhrase}${appendString}.`;
    }

    /**
     * Generates a notification indicating the player attempted and failed to solve a puzzle. Chooses the notification automatically based on the puzzle's type.
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     * @param puzzle - The puzzle that was attempted.
     * @param item - The item the puzzle was attempted with, if applicable.
     */
    generateAttemptAndFailPuzzleNotification(player: Player, secondPerson: boolean, puzzle: Puzzle, item?: ItemInstance) {
        if (puzzle.isAlwaysAccessible()) return "";
        const subject = secondPerson ? `You` : capitalizeFirstLetter(player.displayName);
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
     * @param player - The player referred to in this notification.
     * @param secondPerson - Whether or not the player should be referred to in second person.
     */
    generateDieNotification(player: Player, secondPerson: boolean) {
        const message = secondPerson
            ? `You have died. When your body is discovered, you will be given the ${this.#game.guildContext.deadRole.name} role. Until then, your death must remain a secret to the server and to other players.`
            : `${capitalizeFirstLetter(player.displayName)} dies.`;
        return message;
    }

    /**
     * Generates a notification indicating an exit was unlocked.
     * @param exit - The exit that was unlocked.
     */
    generateUnlockNotification(exit: Exit) {
        return `${capitalizeFirstLetter(exit.getDoorPhrase())} unlocks.`;
    }

    /**
     * Generates a notification indicating an exit was locked.
     * @param exit - The exit that was locked.
     */
    generateLockNotification(exit: Exit) {
        return `${capitalizeFirstLetter(exit.getDoorPhrase())} locks.`;
    }
}
