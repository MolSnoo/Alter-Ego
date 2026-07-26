// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Description from "../Data/Description.ts";
import Fixture from "../Data/Fixture.ts";
import InventoryItem from "../Data/InventoryItem.ts";
import Narration from "../Data/Narration.ts";
import Notification from "../Data/Notification.ts";
import Room from "../Data/Room.ts";
import RoomItem from "../Data/RoomItem.ts";
import DieAction from "../Data/Actions/DieAction.ts";
import NarrateAction from "../Data/Actions/NarrateAction.ts";
import { MessageDisplayType } from "../Modules/enums.ts";
import { parseDescription } from "../Modules/parser.ts";
import { capitalizeFirstLetter, generateListString, generatePlayerListString, round } from "../Modules/helpers.ts";
import { Collection } from "discord.js";
import type Interactable from "./Interactables/Interactable.ts";
import type Action from "../Data/Action.ts";
import type Dialog from "../Data/Dialog.ts";
import type Exit from "../Data/Exit.js";
import type Game from "../Data/Game.ts";
import type Gesture from "../Data/Gesture.ts";
import type Player from "../Data/Player.ts";
import type Puzzle from "../Data/Puzzle.ts";
import type Recipe from "../Data/Recipe.ts";
import type Event from "../Data/Event.ts";
import type HidingSpot from "../Data/HidingSpot.ts";
import type InventorySlot from "../Data/InventorySlot.ts";
import type ItemInstance from "../Data/ItemInstance.ts";
import type Status from "../Data/Status.ts";
import type Whisper from "../Data/Whisper.ts";
import type { Attachment, Embed } from "discord.js";

/**
 * A set of functions to send narrations.
 */
export default class GameNarrationHandler {
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
     * Creates a new dialog-type narrate action and sends the narration.
     * @param type - The type of narration to send.
     * @param narrateAction - The narrate action to send.
     * @param narrationText - The text of the narration.
     * @param narrator - The player or guild member who wrote the narration.
     */
    sendNarrateAction(type: MessageDisplayType, narrateAction: NarrateAction, narrationText: string, narrator?: User) {
        const narration = new Narration(this.#game, type, narrateAction, narrateAction.player, narrateAction.location, narrationText, narrateAction.whisper, narrateAction.message, narrator);
        narrateAction.performNarrate(narration);
    }

    /**
     * Sends the narration. Available only to methods of GameNarrationHandler. Assigns the original action to the narration instead of a narrate action.
     * @param type - The type of narration to send.
     * @param action - The action being narrated.
     * @param player - The player whose action is being narrated.
     * @param narrationText - The text of the narration.
     * @param location - The location in which the narration is occurring. Defaults to the player's location.
     * @param whisper - The whisper in which the narration is occurring, if applicable.
     * @param narrator - The player or guild member who wrote the narration. Optional.
     */
    #sendNarration(type: MessageDisplayType, action: Action, player: Player, narrationText: string, location: Room = player.location, whisper?: Whisper, narrator?: User) {
        if (narrationText === "") return;
        const narration = new Narration(this.#game, type, action, player, location, capitalizeFirstLetter(narrationText), whisper, action.message, narrator);
        const narrateAction = new NarrateAction(this.#game, action.message, player, location, action.forced, whisper);
        narrateAction.performNarrate(narration);
    }

    /**
     * Sends a notification.
     * @param player - The player the notification is intended for.
     * @param action - The action associated with this notification.
     * @param notificationText - The text content for the narration.
     * @param messageDisplayType - The display type of the message to send for this notification. Defaults to PLAIN_TEXT.
     * @param mirrorInSpectateChannel - Whether or not to mirror the notification in the player's spectate channel. Defaults to true.
     * @param attachments - The attachments to send. Optional.
     * @param interactables - An array of interactables to send in the message. Optional.
     * @param embeds - An array of embeds to send in the message. Optional.
     * @param force - If true, the message will be sent even if the player is unconscious. Defaults to false.
     */
    sendNotification(player: Player, action: Action, notificationText: string, messageDisplayType: MessageDisplayType = MessageDisplayType.PLAIN_TEXT, mirrorInSpectateChannel: boolean = true, attachments: Collection<string, Attachment> = new Collection(), interactables: Interactable[] = [], embeds: Embed[] = [], force = false) {
        const notification = new Notification(this.#game, player, action, notificationText, messageDisplayType, mirrorInSpectateChannel, attachments, interactables, embeds);
        player.notify(notification, force);
    }

    /**
     * Narrates a say action in the specified room.
     * Does not send any notifications.
     * @param action - The action being narrated.
     * @param dialog - The dialog that was spoken.
     * @param location - The room to narrate the action in.
     * @param narrationText - The text of the narration to send.
     */
    narrateSay(action: Action, dialog: Dialog, location: Room, narrationText: string) {
        this.#sendNarration(MessageDisplayType.PLAIN_TEXT, action, dialog.speaker, narrationText, location);
    }

    /**
     * Narrates a whisper action.
     * @param action - The action that initiated this narration.
     * @param whisper - The whisper that was created.
     * @param player - The player performing the whisper action.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateWhisper(action: Action, whisper: Whisper, player: Player, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.MINOR;
        const playerListString = whisper.generatePlayerListStringExcluding(player);
        const notification = this.#game.notificationGenerator.generateWhisperNotification(player, true, playerListString);
        const narration = this.#game.notificationGenerator.generateWhisperNotification(player, false, playerListString);
        this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrations a gesture action.
     * @param action - The action that initiated this narration.
     * @param gesture - The gesture being narrated.
     * @param player - The player performing the gesture action.
     */
    narrateGesture(action: Action, gesture: Gesture, player: Player) {
        const messageType = gesture.narration.messageDisplayType ?? MessageDisplayType.PLAYER;
        const narration = parseDescription(gesture.narration, gesture, player);
        this.#sendNarration(messageType, action, player, narration, player.location, undefined, player);
    }

    /**
     * Narrates a start move action.
     * @param action - The action that initiated this narration.
     * @param isRunning - Whether or not the player is running.
     * @param exit - The exit the player is moving toward.
     * @param player - The player performing the start move action.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateStartMove(action: Action, isRunning: boolean, exit: Exit, player: Player, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.MINOR;
        const exitPhrase = exit.getNamePhrase();
        const notification = this.#game.notificationGenerator.generateStartMoveNotification(player, true, isRunning, exitPhrase);
        const narration = this.#game.notificationGenerator.generateStartMoveNotification(player, false, isRunning, exitPhrase);
        this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        if (player.party && player.party.hasLeader(player)) {
            for (const follower of player.party.followers.values()) {
                const followerNotification = this.#game.notificationGenerator.generateStartMoveNotification(follower, true, isRunning, exitPhrase);
                this.sendNotification(follower, action, followerNotification, messageType);
            }
        }
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates the player depleting half of their stamina.
     * @param action - The action that initiated this narration.
     * @param player - The player who has depleted half of their stamina.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateReachedHalfStamina(action: Action, player: Player, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.MINOR;
        const notification = this.#game.notificationGenerator.generateHalfStaminaNotification(player, true);
        const narration = this.#game.notificationGenerator.generateHalfStaminaNotification(player, false);
        this.sendNotification(player, action, notification, MessageDisplayType.WARNING, undefined, undefined, interactables);
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates the player becoming weary.
     * @param action - The action that initiated this narration.
     * @param player - The player who became weary.
     */
    narrateWeary(action: Action, player: Player) {
        const messageType = MessageDisplayType.MINOR;
        const wearyStatus = this.#game.entityFinder.getStatusEffect("weary");
        const narration = this.#game.notificationGenerator.generateWearyNotification(player);
        const wearyDescription = wearyStatus.inflictedDescription.parseFor(player, wearyStatus);
        player.sendDescription(wearyDescription, wearyStatus, wearyStatus.inflictedDescription.messageDisplayType ?? MessageDisplayType.ALERT);
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates one or more players exiting a room.
     * @param action - The action that initiated this narration.
     * @param player - The player performing the exit action.
     * @param exitingPlayers - The set of all players who exited together.
     * @param currentRoom - The room the players are currently in.
     * @param exit - The exit the players will leave their current room through.
     * @param movingFreely - Whether or not the players are performing free movement.
     */
    narrateExit(action: Action, player: Player, exitingPlayers: Set<Player>, currentRoom: Room, exit: Exit, movingFreely: boolean) {
        const messageType = MessageDisplayType.STANDARD;
        const exitPhrase = exit?.getNamePhrase();
        const [subject, otherPlayerList, carryString] = this.#game.notificationGenerator.generateCollectiveMovePlayerStrings(player, false, exitingPlayers);
        const narration = movingFreely
            ? this.#game.notificationGenerator.generateSuddenExitNotification(false, subject, currentRoom.displayName, otherPlayerList, carryString)
            : this.#game.notificationGenerator.generateExitNotification(false, subject, exitPhrase, otherPlayerList, carryString);
        for (const exitingPlayer of exitingPlayers) {
            const [subject, otherPlayerList, carryString] = this.#game.notificationGenerator.generateCollectiveMovePlayerStrings(exitingPlayer, true, exitingPlayers);
            const notification = movingFreely
                ? this.#game.notificationGenerator.generateSuddenExitNotification(true, subject, currentRoom.displayName, otherPlayerList, carryString)
                : this.#game.notificationGenerator.generateExitNotification(true, subject, exitPhrase, otherPlayerList, carryString);
            this.sendNotification(exitingPlayer, action, notification, MessageDisplayType.MINOR);
        }
        this.#sendNarration(messageType, action, player, narration, currentRoom);
    }

    /**
     * Narrates one or more players entering a room.
     * @param action - The action that initiated this narration.
     * @param player - The player performing the enter action.
     * @param enteringPlayers - The set of all players who entered together.
     * @param destinationRoom  The room the players are moving to.
     * @param entrance - The exit the players will enter the destination room from.
     * @param movingFreely - Whether or not the players are performing free movement.
     */
    narrateEnter(action: Action, player: Player, enteringPlayers: Set<Player>, destinationRoom: Room, entrance: Exit, movingFreely: boolean) {
        const messageType = MessageDisplayType.STANDARD;
        const entrancePhrase = entrance?.getNamePhrase();
        const [subject, otherPlayerList, carryString] = this.#game.notificationGenerator.generateCollectiveMovePlayerStrings(player, false, enteringPlayers);
        const narration = movingFreely
            ? this.#game.notificationGenerator.generateSuddenEnterNotification(false, subject, destinationRoom.displayName, otherPlayerList, carryString)
            : this.#game.notificationGenerator.generateEnterNotification(false, subject, entrancePhrase, otherPlayerList, carryString);
        this.#sendNarration(messageType, action, player, narration, destinationRoom);
        for (const enteringPlayer of enteringPlayers) {
            if (!enteringPlayer.canSee()) {
                const notification = this.#game.notificationGenerator.generateNoSightEnterNotification();
                this.sendNotification(enteringPlayer, action, notification, messageType);
            }
            else {
                const description = entrance ? entrance.description : destinationRoom.description;
                description.parseAndSendTo(enteringPlayer, destinationRoom);
            }
        }
    }

    /**
     * Narrates a stop action.
     * @param action - The action that initiated this narration.
     * @param player - The player performing the stop action.
     * @param stoppingPlayers - The set of all players who stopped together.
     * @param exitLocked - Whether or not the action was initiated because the destination exit was locked.
     * @param exit - The exit the player tried to move to, if applicable.
     * @param stopFollowing - Whether or not the player stopped following someone. Defaults to false.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateStop(action: Action, player: Player, stoppingPlayers: Set<Player>, exitLocked: boolean, exit?: Exit, stopFollowing = false, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.MINOR;
        const narration = exitLocked ? this.#game.notificationGenerator.generateExitLockedNotification(player, false, stoppingPlayers, exit.getDoorPhrase())
            : player.followedPlayer && stopFollowing ? this.#game.notificationGenerator.generateStopFollowingNotification(player, false, stoppingPlayers, player.followedPlayerDisplayName)
                : this.#game.notificationGenerator.generateStopNotification(player, false, stoppingPlayers);
        for (const stoppingPlayer of stoppingPlayers) {
            const notification = exitLocked ? this.#game.notificationGenerator.generateExitLockedNotification(stoppingPlayer, true, stoppingPlayers, exit.getDoorPhrase())
                : stoppingPlayer.followedPlayer && stopFollowing ? this.#game.notificationGenerator.generateStopFollowingNotification(stoppingPlayer, true, stoppingPlayers, stoppingPlayer.followedPlayerDisplayName)
                    : this.#game.notificationGenerator.generateStopNotification(stoppingPlayer, true, stoppingPlayers);
            this.sendNotification(stoppingPlayer, action, notification, exitLocked ? MessageDisplayType.WARNING : messageType, undefined, undefined, interactables);
            if (stoppingPlayer.followedPlayer && stopFollowing && !stoppingPlayers.has(stoppingPlayer.followedPlayer)) {
                const followedPlayerNotification = this.#game.notificationGenerator.generateStopFollowingNotification(stoppingPlayer, false, stoppingPlayers, "you");
                this.sendNotification(stoppingPlayer.followedPlayer, action, followedPlayerNotification, MessageDisplayType.STANDARD);
            }
        }
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates a follow action.
     * @param action - The action that initiated this narration.
     * @param player - The player performing the follow action.
     * @param target - The player being followed.
     * @param followerInteractables - An array of interactables to send to the follower alongside their notification. Optional.
     * @param leaderInteractables - An array of interactables to send to the followed player alongside their notification. Optional.
     */
    narrateFollow(action: Action, player: Player, target: Player, followerInteractables: Interactable[] = [], leaderInteractables: Interactable[] = []) {
        const messageType = MessageDisplayType.MINOR;
        const playerNotification = this.#game.notificationGenerator.generateFollowNotification(player, true, target.displayName);
        const targetNotification = this.#game.notificationGenerator.generateBeingFollowedNotification(player.displayName);
        const narration = this.#game.notificationGenerator.generateFollowNotification(player, false, target.displayName);
        this.sendNotification(player, action, playerNotification, MessageDisplayType.STANDARD, true, undefined, followerInteractables);
        this.sendNotification(target, action, targetNotification, MessageDisplayType.WARNING, true, undefined, leaderInteractables);
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates that a player has lost track of the player they were following.
     * @param action - The action that initiated this narration.
     * @param player - The player who performed the follow action.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateLostFollowedPlayer(action: Action, player: Player, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        const notification = this.#game.notificationGenerator.generateLostFollowedPlayerNotification(player.followedPlayerDisplayName);
        this.sendNotification(player, action, notification, messageType, true, undefined, interactables);
    }

    /**
     * Narrates a lead action.
     * @param action - The action that initiated this narration.
     * @param leader - The player performing the lead action.
     * @param ledPlayers - The players being led.
     * @param partySynchronized - Whether or not the party members' positions are all synchronized.
     * @param leaderInteractables - An array of interactables to send to the leader alongside their notification. Optional.
     * @param followerInteractables - A map of arrays of interactables, where the key for each entry is the name of the player to send them to. Optional.
     */
    narrateLead(action: Action, leader: Player, ledPlayers: Player[], partySynchronized: boolean, leaderInteractables: Interactable[] = [], followerInteractables: Map<string, Interactable[]> = new Map()) {
        const messageType = MessageDisplayType.MINOR;
        const partyHasOtherFollowers = leader.party ? leader.party.followers.size !== ledPlayers.length : false;
        const leaderNotification = this.#game.notificationGenerator.generateLeadNotification(leader, true, ledPlayers, partySynchronized, partyHasOtherFollowers);
        this.sendNotification(leader, action, leaderNotification, MessageDisplayType.STANDARD, undefined, undefined, leaderInteractables);
        for (const ledPlayer of ledPlayers) {
            const tailoredFollowers = ["you"].concat(ledPlayers.filter(player => player.name !== ledPlayer.name).map(player => player.displayName));
            const tailoredFollowerListString = generateListString(tailoredFollowers);
            const ledPlayerSynchronized = partySynchronized || ledPlayer.positionMatches(leader);
            const ledPlayerNotification = this.#game.notificationGenerator.generateBeingLedNotification(leader, tailoredFollowerListString, ledPlayerSynchronized);
            const interactables = followerInteractables.get(ledPlayer.name) ?? [];
            this.sendNotification(ledPlayer, action, ledPlayerNotification, MessageDisplayType.STANDARD, undefined, undefined, interactables);
        }
        const narration = this.#game.notificationGenerator.generateLeadNotification(leader, false, ledPlayers, partySynchronized, partyHasOtherFollowers);
        this.#sendNarration(messageType, action, leader, narration);
    }

    /**
     * Narrates that a player has finished approaching their party leader.
     * @param action - The action that initiated this narration.
     * @param player - The player who finished approaching their leader.
     * @param leader - The leader of the party who was being approached.
     */
    narrateFinishApproaching(action: Action, player: Player, leader: Player) {
        const messageType = MessageDisplayType.MINOR;
        const notification = this.#game.notificationGenerator.generateFinishApproachingNotification(player, true, leader);
        const narration = this.#game.notificationGenerator.generateFinishApproachingNotification(player, false, leader);
        this.sendNotification(player, action, notification, messageType);
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates that the players in the leader's party all have their positions synchronized.
     * @param action - The action that initiated this narration.
     * @param player - The leader of the party.
     */
    narratePartyReady(action: Action, player: Player) {
        const messageType = MessageDisplayType.STANDARD;
        const notification = this.#game.notificationGenerator.generatePartyReadyNotification();
        this.sendNotification(player, action, notification, messageType);
    }

    /**
     * Narrates a dismiss action.
     * @param action - The action that initiated this narration.
     * @param leader - The player who was leading.
     * @param removedLedPlayers - The players who are no longer being led.
     * @param leaderInteractables - An array of interactables to send to the leader alongside their notification. Optional.
     * @param followerInteractables - A map of arrays of interactables, where the key for each entry is the name of the player to send them to. Optional.
     */
    narrateDismiss(action: Action, leader: Player, removedLedPlayers: Player[], leaderInteractables: Interactable[] = [], followerInteractables: Map<string, Interactable[]> = new Map()) {
        const messageType = MessageDisplayType.MINOR;
        const followerListString = generatePlayerListString(removedLedPlayers);
        const leaderNotification = this.#game.notificationGenerator.generateDismissNotification(leader, true, followerListString);
        this.sendNotification(leader, action, leaderNotification, MessageDisplayType.STANDARD, undefined, undefined, leaderInteractables);
        for (const removedLedPlayer of removedLedPlayers) {
            const tailoredFollowers = removedLedPlayers.filter(player => player.name !== removedLedPlayer.name).map(player => player.displayName).concat("you");
            const tailoredFollowerListString = generateListString(tailoredFollowers);
            const removedLedPlayerNotification = this.#game.notificationGenerator.generateNoLongerBeingLedNotification(leader.displayName, tailoredFollowerListString);
            const interactables = followerInteractables.get(removedLedPlayer.name) ?? [];
            this.sendNotification(removedLedPlayer, action, removedLedPlayerNotification, MessageDisplayType.STANDARD, undefined, undefined, interactables);
        }
        const narration = this.#game.notificationGenerator.generateDismissNotification(leader, false, followerListString);
        this.#sendNarration(messageType, action, leader, narration);
    }

    /**
     * Narrates a disband party action.
     * @param action - The action that initiated this narration.
     * @param leader - The player who was leading.
     * @param followers - The players who were following.
     * @param stopFollowing - Whether or not the players stopped following the leader as a result of the party being disbanded. Defaults to false.
     * @param customNarration - A custom narration to send instead of the default narration. Optional.
     * @param customLeaderNotification - A custom notification to send to the leader instead of the default notification. Optional.
     * @param customFollowerNotification - A custom notification to send to the followers instead of the default notification. Optional.
     * @param leaderInteractables - An array of interactables to send to the leader alongside their notification. Optional.
     * @param followerInteractables - A map of arrays of interactables, where the key for each entry is the name of the player to send them to. Optional.
     */
    narrateDisbandParty(action: Action, leader: Player, followers: Player[], stopFollowing: boolean = false, customNarration?: string, customLeaderNotification?: string, customFollowerNotification?: string, leaderInteractables: Interactable[] = [], followerInteractables: Map<string, Interactable[]> = new Map()) {
        const narrationMessageType = action instanceof DieAction ? MessageDisplayType.ALERT : MessageDisplayType.MINOR;
        const notificationMessageType = action instanceof DieAction ? MessageDisplayType.ALERT : MessageDisplayType.STANDARD;
        const followerListString = generatePlayerListString(followers);
        let leaderNotification = customLeaderNotification;
        let narration = customNarration;
        if (leaderNotification === undefined)
            leaderNotification = this.#game.notificationGenerator.generateDisbandPartyNotification(leader, true, stopFollowing, followerListString);
        if (leaderNotification) this.sendNotification(leader, action, leaderNotification, notificationMessageType, undefined, undefined, leaderInteractables);

        let followerNotification = customFollowerNotification;
        if (followerNotification === undefined)
            followerNotification = this.#game.notificationGenerator.generatePartyDisbandedNotification(leader, stopFollowing);
        if (followerNotification) {
            for (const follower of followers) {
                const interactables = followerInteractables.get(follower.name) ?? [];
                this.sendNotification(follower, action, followerNotification, notificationMessageType, undefined, undefined, interactables);
            }
        }
        if (narration === undefined)
            narration = this.#game.notificationGenerator.generateDisbandPartyNotification(leader, false, stopFollowing, followerListString);
        this.#sendNarration(narrationMessageType, action, leader, narration);
    }

    /**
     * Narrates an inspect action.
     * @param action - The action that initiated this narration.
     * @param target - The target to inspect.
     * @param player - The player performing the inspect action.
     */
    narrateInspect(action: Action, target: Inspectable, player: Player) {
        let notification = "";
        let narration = "";
        let notificationMessageType: MessageDisplayType = MessageDisplayType.MINOR;
        let narrationMessageType: MessageDisplayType = MessageDisplayType.MINOR;
        if (target instanceof Room) {
            notification = this.#game.notificationGenerator.generateInspectRoomNotification(player, true);
            narration = this.#game.notificationGenerator.generateInspectRoomNotification(player, false);
        }
        else if (target instanceof Fixture) {
            notification = this.#game.notificationGenerator.generateInspectFixtureNotification(player, true, target.getContainingPhrase());
            narration = this.#game.notificationGenerator.generateInspectFixtureNotification(player, false, target.getContainingPhrase());
            // If there are any players hidden in the fixture, notify them that they were found, and notify the player who found them.
            // However, don't notify anyone if the player is inspecting the fixture that they're hiding in.
            // Also ensure that the fixture isn't locked.
            if (target instanceof Fixture && target.hidingSpot && !player.isHidden() && player.hidingSpot !== target.name
            &&  (target.childPuzzle === null || !target.childPuzzle.type.endsWith("lock") || target.childPuzzle.solved)) {
                for (const occupant of target.hidingSpot.occupants) {
                    const notification = this.#game.notificationGenerator.generateHiddenPlayerFoundNotification(occupant.canSee() ? player.displayName : "someone");
                    this.sendNotification(occupant, action, notification, MessageDisplayType.WARNING);
                }
                const hiddenPlayersList = target.hidingSpot.generateOccupantsString(!player.canSee());
                if (hiddenPlayersList) {
                    notification += `\n${this.#game.notificationGenerator.generateFoundHiddenPlayersNotification(hiddenPlayersList, target.hidingSpot.getContainingPhrase())}`;
                    notificationMessageType = MessageDisplayType.STANDARD;
                }
            }
        }
        else if (target instanceof RoomItem) {
            const preposition = target.getContainerPreposition();
            const containerPhrase = target.getContainerPhrase();
            notification = this.#game.notificationGenerator.generateInspectRoomItemNotification(player, true, target.singleContainingPhrase, preposition, containerPhrase);
            if (!target.prefab.discreet) {
                narration = this.#game.notificationGenerator.generateInspectRoomItemNotification(player, false, target.singleContainingPhrase, preposition, containerPhrase);
                narrationMessageType = MessageDisplayType.STANDARD;
            }
        }
        else if (target instanceof InventoryItem && target.player.name === player.name) {
            if (target.container === null) {
                // The inventory item is equipped.
                notification = this.#game.notificationGenerator.generateInspectPlayersOwnEquippedInventoryItemNotification(player, true, target.name);
                if (!target.prefab.discreet && (target.equipmentSlot === "RIGHT HAND" || target.equipmentSlot === "LEFT HAND" || !target.isCoveredByEquippedItem()))
                    narration = this.#game.notificationGenerator.generateInspectPlayersOwnEquippedInventoryItemNotification(player, false, target.name);
            }
            else {
                // The inventory item is stashed.
                notification = this.#game.notificationGenerator.generateInspectPlayersOwnStashedInventoryItemNotification(player, true, target.singleContainingPhrase);
                if (!target.prefab.discreet)
                    narration = this.#game.notificationGenerator.generateInspectPlayersOwnStashedInventoryItemNotification(player, false, target.singleContainingPhrase);
            }
            if (!target.prefab.discreet)
                narrationMessageType = MessageDisplayType.STANDARD;
        }
        else if (target instanceof InventoryItem && target.player.name !== player.name)
            notification = this.#game.notificationGenerator.generateInspectOtherPlayersInventoryItemNotification(player, true, target.player, target.name);
        if (notification !== "") this.sendNotification(player, action, notification, notificationMessageType);
        if (narration !== "") this.#sendNarration(narrationMessageType, action, player, narration);
    }

    /**
     * Narrates a knock action.
     * @param action - The action that initiated this narration.
     * @param exit - The exit to knock on.
     * @param player - The player performing the knock action.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateKnock(action: Action, exit: Exit, player: Player, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        const doorPhrase = exit.getDoorPhrase();
        const notification = this.#game.notificationGenerator.generateKnockNotification(player, true, doorPhrase);
        const roomNarration = this.#game.notificationGenerator.generateKnockNotification(player, false, doorPhrase);
        this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        this.#sendNarration(messageType, action, player, roomNarration);
        const destination = exit.dest;
        if (destination.id === player.location.id) return;
        const hearingPlayers = destination.occupants.filter(occupant => occupant.canHear());
        const destinationNarration = this.#game.notificationGenerator.generateKnockDestinationNotification(destination.exits.get(exit.link).getDoorPhrase());
        // If the number of hearing players is the same as the number of occupants in the room, send the message to the room.
        if (hearingPlayers.length !== 0 && hearingPlayers.length === destination.occupants.length)
            this.#sendNarration(messageType, action, player, destinationNarration, destination);
        else {
            for (const hearingPlayer of hearingPlayers)
                this.sendNotification(hearingPlayer, action, destinationNarration, messageType);
        }
    }

    /**
     * Narrates a hide action.
     * @param action - The action that initiated this narration.
     * @param hidingSpot - The hiding spot the player is hiding in.
     * @param player - The player performing the hide action.
     * @param hidingPlayers - A set of all players who are hiding, including the player performing the action.
     * @param hidingPlayerInteractables - A map of arrays of interactables, where the key for each entry is the name of the player to send them to. Optional.
     */
    narrateHide(action: Action, hidingSpot: HidingSpot, player: Player, hidingPlayers: Set<Player>, hidingPlayerInteractables: Map<string, Interactable[]> = new Map()) {
        const messageType = MessageDisplayType.STANDARD;
        const hidingSpotPhrase = hidingSpot.getContainingPhrase();
        const hidingSpotFull = hidingSpot.occupants.length + hidingPlayers.size > hidingSpot.capacity && !action.forced;
        const narration = hidingSpotFull
            ? this.#game.notificationGenerator.generateHidingSpotFullNotification(player, hidingPlayers, false, hidingSpotPhrase)
            : this.#game.notificationGenerator.generateHideNotification(player, hidingPlayers, false, hidingSpotPhrase);
        for (const hidingPlayer of hidingPlayers) {
            let playerNotification = "";
            const hiddenPlayersList = hidingSpot.generateOccupantsString(!hidingPlayer.canSee());
            if (hidingSpotFull)
                playerNotification = this.#game.notificationGenerator.generateHidingSpotFullNotification(hidingPlayer, hidingPlayers, true, hidingSpotPhrase, hiddenPlayersList);
            else {
                if (hidingSpot.occupants.length > 0)
                    playerNotification = this.#game.notificationGenerator.generateHidingSpotOccupiedNotification(hidingSpotPhrase, hiddenPlayersList, hidingPlayer, hidingPlayers);
                else playerNotification = this.#game.notificationGenerator.generateHideNotification(hidingPlayer, hidingPlayers, true, hidingSpotPhrase);
            }
            const interactables = hidingPlayerInteractables.get(hidingPlayer.name) ?? [];
            this.sendNotification(hidingPlayer, action, playerNotification, messageType, undefined, undefined, interactables);
        }
        for (const occupant of hidingSpot.occupants) {
            const occupantNotification = hidingSpotFull
                ? this.#game.notificationGenerator.generateFoundInFullHidingSpotNotification(occupant, player, hidingPlayers)
                : this.#game.notificationGenerator.generateFoundInOccupiedHidingSpotNotification(occupant, player, hidingPlayers);
            this.sendNotification(occupant, action, occupantNotification, messageType);
        }
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates an emerge action.
     * @param action - The action that initiated this narration.
     * @param hidingSpot - The hiding spot the player is coming out from.
     * @param player - The player performing the emerge action.
     * @param emergingPlayers - A set of all players who are emerging, including the player performing the action.
     * @param emergingPlayerInteractables - A map of arrays of interactables, where the key for each entry is the name of the player to send them to. Optional.
     */
    narrateEmerge(action: Action, hidingSpot: HidingSpot, player: Player, emergingPlayers: Set<Player>, emergingPlayerInteractables: Map<string, Interactable[]> = new Map()) {
        const messageType = MessageDisplayType.STANDARD;
        const hidingSpotPhrase = hidingSpot ? hidingSpot.getContainingPhrase() : "hiding";
        const narration = this.#game.notificationGenerator.generateEmergeNotification(player, emergingPlayers, false, hidingSpotPhrase);
        for (const emergingPlayer of emergingPlayers) {
            const notification = this.#game.notificationGenerator.generateEmergeNotification(emergingPlayer, emergingPlayers, true, hidingSpotPhrase);
            const interactables = emergingPlayerInteractables.get(emergingPlayer.name) ?? [];
            this.sendNotification(emergingPlayer, action, notification, messageType, undefined, undefined, interactables);
        }
        if (hidingSpot) {
            // Send a notification to players who can't see the whisper channel.
            for (const occupant of hidingSpot.occupants) {
                if (emergingPlayers.has(occupant)) continue;
                // If the only reason this player has the `no channel` behavior attribute is because they're hidden, skip over them.
                if (occupant.getBehaviorAttributeStatusEffects("no channel").length === 1) continue;
                const occupantNotification = this.#game.notificationGenerator.generateEmergeFromOccupiedHidingSpotNotification(occupant, player, emergingPlayers, hidingSpotPhrase);
                this.sendNotification(occupant, action, occupantNotification, messageType);
            }
        }
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates an inflict action.
     * @param action - The action that initiated this narration.
     * @param status - The status being inflicted.
     * @param player - The player performing the inflict action.
     */
    narrateInflict(action: Action, status: Status, player: Player) {
        let narration = "";
        let messageType: MessageDisplayType = MessageDisplayType.STANDARD;
        if (status.id === "asleep") narration = this.#game.notificationGenerator.generateFallAsleepNotification(player.displayName);
        else if (status.id === "blacked out") {
            narration = this.#game.notificationGenerator.generateBlackOutNotification(player.displayName);
            messageType = MessageDisplayType.ALERT;
        }
        else if (status.behaviorAttributes.has("unconscious")) {
            narration = this.#game.notificationGenerator.generateUnconsciousNotification(player.displayName);
            messageType = MessageDisplayType.ALERT;
        }
        if (narration) this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates a cure action.
     * @param action - The action that initiated this narration.
     * @param status - The status being cured.
     * @param player - The player performing the cure action.
     * @param item - The inventory item that caused the status to be cured, if applicable.
     */
    narrateCure(action: Action, status: Status, player: Player, item?: InventoryItem) {
        let narration = "";
        let messageType: MessageDisplayType = MessageDisplayType.STANDARD;
        if (status.behaviorAttributes.has("concealed")) {
            const maskName = item ? item.name : "MASK";
            narration = this.#game.notificationGenerator.generateConcealedCuredNotification(maskName, player.displayName);
            messageType = MessageDisplayType.WARNING;
        }
        else if (status.behaviorAttributes.has("unconscious")) {
            if (status.id === "asleep" || status.id === "blacked out") narration = this.#game.notificationGenerator.generateWakeUpNotification(player.displayName);
            else {
                narration = this.#game.notificationGenerator.generateRegainConsciousnessNotification(player.displayName);
                messageType = MessageDisplayType.WARNING;
            }
        }
        if (narration) this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates a use action.
     * @param action - The action that initiated this narration.
     * @param item - The inventory item to use.
     * @param player - The player performing the use action.
     * @param target - The target player of the use action.
     * @param customNarration - The custom text of the narration. Optional.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateUse(action: Action, item: InventoryItem, player: Player, target: Player, customNarration?: string, interactables: Interactable[] = []) {
        let notification = customNarration;
        let narration = customNarration;
        const messageType = customNarration ? MessageDisplayType.WARNING : MessageDisplayType.STANDARD;
        if (!customNarration) {
            const targetDisplayName = target.name !== player.name ? target.displayName : ``;
            notification = this.#game.notificationGenerator.generateUseNotification(player, true, item.singleContainingPhrase, item.prefab.secondPersonVerb, targetDisplayName);
            narration = this.#game.notificationGenerator.generateUseNotification(player, false, item.singleContainingPhrase, item.prefab.thirdPersonVerb, targetDisplayName);
        }
        this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates a take action.
     * @param action - The action that initiated this narration.
     * @param item - The item the player is attempting to take.
     * @param player - The player performing the take action.
     * @param notify - Whether or not to notify the player that they failed to take the item. Defaults to true.
     */
    narrateFailedTake(action: Action, item: RoomItem, player: Player, notify: boolean = true) {
        const messageType = MessageDisplayType.STANDARD;
        const containerPhrase = item.getContainerPhrase();
        let notification: string;
        let narration: string;
        if (item.weight > player.maxCarryWeight) {
            notification = this.#game.notificationGenerator.generateTakeTooHeavyNotification(player, true, item.singleContainingPhrase, containerPhrase);
            narration = this.#game.notificationGenerator.generateTakeTooHeavyNotification(player, false, item.singleContainingPhrase, containerPhrase);
        }
        else if (player.carryWeight + item.weight > player.maxCarryWeight) {
            notification = this.#game.notificationGenerator.generateTakeTooMuchWeightNotification(player, true, item.singleContainingPhrase, containerPhrase);
            narration = this.#game.notificationGenerator.generateTakeTooMuchWeightNotification(player, false, item.singleContainingPhrase, containerPhrase);
        }
        if (notification && notify) this.sendNotification(player, action, notification, messageType);
        if (!item.prefab.discreet)
            this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates a take action.
     * @param action - The action that initiated this narration.
     * @param item - The item that was taken.
     * @param container - The container the item was taken from.
     * @param player - The player performing the take action.
     * @param notify - Whether or not to notify the player that they took the item. Defaults to true.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateTake(action: Action, item: InventoryItem, container: RoomItemContainer, player: Player, notify: boolean = true, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        const containerPhrase = container.getContainingPhrase();
        const notification = this.#game.notificationGenerator.generateTakeNotification(player, true, item.singleContainingPhrase, containerPhrase);
        const narration = this.#game.notificationGenerator.generateTakeNotification(player, false, item.singleContainingPhrase, containerPhrase);
        if (notify) this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        if (!item.prefab.discreet)
            this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates a steal action.
     * @param action - The action that initiated this narration.
     * @param item - The item being stolen.
     * @param thief - The player performing the steal action.
     * @param victim - The player being stolen from.
     * @param container - The container the item was stolen from.
     * @param inventorySlot - The inventory slot the item was stolen from.
     * @param notifyVictim - Whether or not to notify the victim who was stolen from.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateSteal(action: Action, item: InventoryItem, thief: Player, victim: Player, container: InventoryItem, inventorySlot: InventorySlot<InventoryItem>, notifyVictim: boolean, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        const slotPhrase = container.getSlotPhrase(inventorySlot);
        const thiefNotification = this.#game.notificationGenerator.generateSuccessfulStealNotification(thief, true, item.singleContainingPhrase, slotPhrase, container.name, victim, notifyVictim);
        this.sendNotification(thief, action, thiefNotification, messageType, undefined, undefined, interactables);
        if (notifyVictim) {
            const victimNotification = this.#game.notificationGenerator.generateSuccessfulStolenFromNotification(thief.displayName, slotPhrase, item.singleContainingPhrase, container.name);
            this.sendNotification(victim, action, victimNotification, messageType);
        }
        if (!item.prefab.discreet) {
            const narration = this.#game.notificationGenerator.generateSuccessfulStealNotification(thief, false, item.singleContainingPhrase, slotPhrase, container.name, victim, notifyVictim);
            this.#sendNarration(MessageDisplayType.ALERT, action, thief, narration);
        }
    }

    /**
     * Narrates a drop action.
     * @param action - The action that initiated this narration.
     * @param item - The item to drop.
     * @param container - The container to drop the item into.
     * @param player - The player performing the take action.
     * @param notify - Whether or not to notify the player that they dropped the item. Defaults to true.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateDrop(action: Action, item: InventoryItem, container: RoomItemContainer, player: Player, notify: boolean = true, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        const preposition = container.getPreposition();
        const containerPhrase = container.getContainingPhrase();
        const notification = this.#game.notificationGenerator.generateDropNotification(player, true, item.singleContainingPhrase, preposition, containerPhrase);
        if (notify) this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        if (!item.prefab.discreet) {
            const narration = this.#game.notificationGenerator.generateDropNotification(player, false, item.singleContainingPhrase, preposition, containerPhrase)
            this.#sendNarration(messageType, action, player, narration);
        }
    }

    /**
     * Narrates a give action.
     * @param action - The action that initiated this narration.
     * @param item - The item to give.
     * @param player - The player performing the give action.
     * @param recipient - The player receiving the item.
     * @param interactables - An array of interactables to send to the recipient alongside their notification. Optional.
     */
    narrateGive(action: Action, item: InventoryItem, player: Player, recipient: Player, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        let playerNotification = this.#game.notificationGenerator.generateGiveNotification(player, true, item.singleContainingPhrase, recipient.displayName);
        let recipientNotification = this.#game.notificationGenerator.generateReceiveNotification(item.singleContainingPhrase, player.displayName);
        let narration = this.#game.notificationGenerator.generateGiveNotification(player, false, item.singleContainingPhrase, recipient.displayName);
        if (item.weight > recipient.maxCarryWeight) {
            playerNotification = this.#game.notificationGenerator.generateGiveTooHeavyNotification(player, true, item.singleContainingPhrase, recipient);
            recipientNotification = this.#game.notificationGenerator.generateReceiveTooHeavyNotification(item.singleContainingPhrase, player.displayName);
            narration = this.#game.notificationGenerator.generateGiveTooHeavyNotification(player, false, item.singleContainingPhrase, recipient)
        }
        else if (round(recipient.carryWeight + item.weight) > recipient.maxCarryWeight) {
            playerNotification = this.#game.notificationGenerator.generateGiveTooMuchWeightNotification(player, true, item.singleContainingPhrase, recipient);
            recipientNotification = this.#game.notificationGenerator.generateReceiveTooMuchWeightNotification(item.singleContainingPhrase, player.displayName);
            narration = this.#game.notificationGenerator.generateGiveTooMuchWeightNotification(player, false, item.singleContainingPhrase, recipient);
        }
        this.sendNotification(player, action, playerNotification, messageType);
        this.sendNotification(recipient, action, recipientNotification, messageType, undefined, undefined, interactables);
        if (!item.prefab.discreet)
            this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates a stash action.
     * @param action - The action that initiated this narration.
     * @param item - The item being stashed.
     * @param container - The container to stash the item in.
     * @param inventorySlot - The inventory slot to stash the item in.
     * @param player - The player performing the stash action.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateStash(action: Action, item: InventoryItem, container: InventoryItem, inventorySlot: InventorySlot<InventoryItem>, player: Player, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        const preposition = container.getPreposition();
        const slotPhrase = container.getSlotPhrase(inventorySlot);
        const notification = this.#game.notificationGenerator.generateStashNotification(player, true, item.singleContainingPhrase, preposition, slotPhrase, container.name);
        this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        if (!item.prefab.discreet) {
            const narration = this.#game.notificationGenerator.generateStashNotification(player, false, item.singleContainingPhrase, preposition, slotPhrase, container.name)
            this.#sendNarration(messageType, action, player, narration);
        }
    }

    /**
     * Narrates an unstash action.
     * @param action - The action that initiated this narration.
     * @param item - The item being unstashed.
     * @param container - The container to unstash the item from.
     * @param inventorySlot - The inventory slot to unstash the item from.
     * @param player - The player performing the unstash action.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateUnstash(action: Action, item: InventoryItem, container: InventoryItem, inventorySlot: InventorySlot<InventoryItem>, player: Player, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        const slotPhrase = container.getSlotPhrase(inventorySlot);
        const notification = this.#game.notificationGenerator.generateUnstashNotification(player, true, item.singleContainingPhrase, slotPhrase, container.name);
        this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        if (!item.prefab.discreet) {
            const narration = this.#game.notificationGenerator.generateUnstashNotification(player, false, item.singleContainingPhrase, slotPhrase, container.name);
            this.#sendNarration(messageType, action, player, narration);
        }
    }

    /**
     * Narrates an equip action.
     * @param action - The action that initiated this narration.
     * @param item - The item being equipped.
     * @param player - The player performing the equip action.
     * @param notify - Whether or not to notify the player that they equipped the item. Defaults to true.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateEquip(action: Action, item: InventoryItem, player: Player, notify: boolean = true, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        if (notify) {
            const notification = this.#game.notificationGenerator.generateEquipNotification(player, true, item.singleContainingPhrase);
            this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        }
        const narration = this.#game.notificationGenerator.generateEquipNotification(player, false, item.singleContainingPhrase);
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates an unequip action.
     * @param action - The action that initiated this narration.
     * @param item - The item being unequipped.
     * @param player - The player performing the unequip action.
     * @param notify - Whether or not to notify the player that they unequipped the item. Defaults to true.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateUnequip(action: Action, item: InventoryItem, player: Player, notify: boolean = true, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        if (notify) {
            const notification = this.#game.notificationGenerator.generateUnequipNotification(player, true, item.name);
            this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        }
        const narration = this.#game.notificationGenerator.generateUnequipNotification(player, false, item.name);
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates a dress action.
     * @param action - The action that initiated this narration.
     * @param items - The items the player is putting on.
     * @param container - The container the player is dressing from.
     * @param player - The player performing the dress action.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateDress(action: Action, items: InventoryItem[], container: RoomItemContainer, player: Player, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        const itemPhrases = items.map(item => item.singleContainingPhrase);
        const itemList = generateListString(itemPhrases);
        const notification = this.#game.notificationGenerator.generateDressNotification(player, true, container.name, itemList);
        const narration = this.#game.notificationGenerator.generateDressNotification(player, false, container.name, itemList);
        this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates an undress action.
     * @param action - The action that initiated this narration.
     * @param items - The items the player is taking off.
     * @param container - The container the player is undressing into.
     * @param player - The player performing the undress action.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateUndress(action: Action, items: InventoryItem[], container: RoomItemContainer, player: Player, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        const preposition = container.getPreposition();
        const containerPhrase = container.getContainingPhrase();
        const itemPhrases = items.map(item => item.singleContainingPhrase);
        const itemList = generateListString(itemPhrases);
        const notification = this.#game.notificationGenerator.generateUndressNotification(player, true, preposition, containerPhrase, itemList);
        const narration = this.#game.notificationGenerator.generateUndressNotification(player, false, preposition, containerPhrase, itemList);
        this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates an instantiate action when the item is an inventory item equipped to a player's equipment slot.
     * @param action - The action that initiated this narration.
     * @param item - The item that is being instantiated.
     * @param player - The player the inventory item is being equipped to.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateInstantiateEquippedInventoryItem(action: Action, item: InventoryItem, player: Player, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        let notification = "";
        let narration = "";
        if (item.equipmentSlot === "RIGHT HAND" || item.equipmentSlot === "LEFT HAND") {
            notification = this.#game.notificationGenerator.generateTakeNotification(player, true, item.singleContainingPhrase);
            if (!item.prefab.discreet) narration = this.#game.notificationGenerator.generateTakeNotification(player, false, item.singleContainingPhrase);
        }
        else {
            notification = this.#game.notificationGenerator.generateEquipNotification(player, true, item.singleContainingPhrase);
            narration = this.#game.notificationGenerator.generateEquipNotification(player, false, item.singleContainingPhrase);
        }
        this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        if (narration) this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates a destroy action when the item is an inventory item equipped to a player's equipment slot.
     * @param action - The action that initiated this narration.
     * @param item - The item that is being destroyed.
     * @param player - The player the inventory item belongs to.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateDestroyEquippedInventoryItem(action: Action, item: InventoryItem, player: Player, interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        let notification = "";
        let narration = "";
        if (item.equipmentSlot === "RIGHT HAND" || item.equipmentSlot === "LEFT HAND") {
            notification = this.#game.notificationGenerator.generateDropNotification(player, true, item.singleContainingPhrase);
            if (!item.prefab.discreet) narration = this.#game.notificationGenerator.generateDropNotification(player, false, item.singleContainingPhrase);
        }
        else {
            notification = this.#game.notificationGenerator.generateUnequipNotification(player, true, item.name);
            narration = this.#game.notificationGenerator.generateUnequipNotification(player, false, item.name);
        }
        this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        if (narration) this.#sendNarration(messageType, action, player, narration);
    }

    /**
     * Narrates a craft action.
     * @param action - The action that initiated this narration.
     * @param craftingResult - The result of the craft action.
     * @param player - The player performing the craft action.
     */
    narrateCraft(action: Action, craftingResult: CraftingResult, player: Player) {
        const messageType = MessageDisplayType.STANDARD;
        if (craftingResult.product1 && !craftingResult.product1.prefab.discreet || craftingResult.product2 && !craftingResult.product2.prefab.discreet) {
            const narration = this.#game.notificationGenerator.generateCraftNotification(player, false, craftingResult);
            this.#sendNarration(messageType, action, player, narration);
        }
    }

    /**
     * Narrates an uncraft action.
     * @param action - The action that initiated this narration.
     * @param recipe - The recipe used to uncraft the item.
     * @param originalItemDiscreet - Whether or not the original item was discreet.
     * @param originalItemSingleContainingPhrase - The single containing phrase of the original item.
     * @param item - The item being uncrafted.
     * @param uncraftingResult - The result of the uncraft action.
     * @param player - The player performing the uncraft action.
     */
    narrateUncraft(action: Action, recipe: Recipe, originalItemDiscreet: boolean, originalItemSingleContainingPhrase: string, item: InventoryItem, uncraftingResult: UncraftingResult, player: Player) {
        const messageType = MessageDisplayType.STANDARD;
        if (!originalItemDiscreet || !recipe.ingredients[0].prefab.discreet || !recipe.ingredients[1].prefab.discreet) {
            const originalItemPhrase = originalItemSingleContainingPhrase;
            const itemPhrase = item.singleContainingPhrase;
            const narration = this.#game.notificationGenerator.generateUncraftNotification(player, false, recipe, originalItemPhrase, itemPhrase, uncraftingResult);
            this.#sendNarration(messageType, action, player, narration);
        }
    }

    /**
     * Narrates an activate action.
     * @param action - The action that initiated this narration.
     * @param fixture - The fixture being activated.
     * @param player - The player performing the activate action.
     * @param recipeInitiatedDescriptionSent - Whether or not an initiated description for a recipe has already been sent. Defaults to false.
     * @param customNarration - The custom text of the narration. Optional.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateActivate(action: Action, fixture: Fixture, player?: Player, recipeInitiatedDescriptionSent: boolean = false, customNarration: string = "", interactables: Interactable[] = []) {
        let messageType: MessageDisplayType = MessageDisplayType.STANDARD;
        const fixturePhrase = fixture.getContainingPhrase();
        let notification = customNarration;
        let narration = customNarration;
        if (player && !customNarration) {
            notification = this.#game.notificationGenerator.generateActivateNotification(fixturePhrase, player, true);
            narration = this.#game.notificationGenerator.generateActivateNotification(fixturePhrase, player, false);
            if (recipeInitiatedDescriptionSent) messageType = MessageDisplayType.MINOR;
        }
        else if (!customNarration) narration = this.#game.notificationGenerator.generateActivateNotification(fixturePhrase);
        if (player && notification) this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        this.#sendNarration(MessageDisplayType.STANDARD, action, player, narration, fixture.location);
    }

    /**
     * Narrates a deactivate action.
     * @param action - The action that initiated this narration.
     * @param fixture - The fixture being deactivated.
     * @param player - The player performing the deactivate action.
     * @param customNarration - The custom text of the narration. Optional.
     * @param interactables - An array of interactables to send to the player alongside their notification. Optional.
     */
    narrateDeactivate(action: Action, fixture: Fixture, player?: Player, customNarration: string = "", interactables: Interactable[] = []) {
        const messageType = MessageDisplayType.STANDARD;
        const fixturePhrase = fixture.getContainingPhrase();
        let notification = customNarration;
        let narration = customNarration;
        if (player && !customNarration) {
            notification = this.#game.notificationGenerator.generateDeactivateNotification(fixturePhrase, player, true);
            narration = this.#game.notificationGenerator.generateDeactivateNotification(fixturePhrase, player, false);
        }
        else if (!customNarration) narration = this.#game.notificationGenerator.generateDeactivateNotification(fixturePhrase);
        if (player && notification) this.sendNotification(player, action, notification, messageType, undefined, undefined, interactables);
        this.#sendNarration(messageType, action, player, narration, fixture.location);
    }

    /**
     * Narrates an attempt action.
     * @param action - The action that initiated this narration.
     * @param puzzle - The puzzle being attempted.
     * @param player - The player performing the action.
     * @param description - The description to send to the player.
     * @param narration - The narration to send. If none is supplied, uses the default puzzle interact notification.
     */
    narrateAttempt(action: Action, puzzle: Puzzle, player: Player, description: Description, narration: string = this.#game.notificationGenerator.generateAttemptPuzzleDefaultNotification(player.displayName, puzzle.getContainingPhrase())) {
        if (description.text !== "" && description.text.includes("<desc>")) description.parseAndSendTo(player, puzzle);
        if (narration !== "") this.#sendNarration(MessageDisplayType.MINOR, action, player, narration);
    }

    /**
     * Narrates a solve action.
     * @param action - The action that initiated this narration.
     * @param puzzle - The puzzle being attempted.
     * @param outcome - The outcome the puzzle was solved with.
     * @param player - The player performing the action. Optional.
     * @param item - The item that was used to solve the puzzle. Optional.
     * @param customNarration - The custom text of the narration. Optional.
     */
    narrateSolve(action: Action, puzzle: Puzzle, outcome: string, player?: Player, item?: ItemInstance, customNarration: string = "") {
        const messageType = MessageDisplayType.STANDARD;
        let narration = customNarration;
        if (player && !customNarration)
            narration = this.#game.notificationGenerator.generateSolvePuzzleNotification(player, false, puzzle, outcome, item);
        if (player) {
            if (puzzle.correctDescription.text !== "") puzzle.correctDescription.parseAndSendTo(player, puzzle);
            else {
                const notification = this.#game.notificationGenerator.generateSolvePuzzleNotification(player, true, puzzle, outcome, item);
                if (notification !== "") this.sendNotification(player, action, notification, messageType);
            }
        }
        if (narration !== "") this.#sendNarration(messageType, action, player, narration, puzzle.location);
    }

    /**
     * Narrates an unsolve action.
     * @param action - The action that initiated this narration.
     * @param puzzle - The puzzle being attempted.
     * @param player - The player performing the action. Optional.
     * @param customNarration - The custom text of the narration. Optional.
     */
    narrateUnsolve(action: Action, puzzle: Puzzle, player?: Player, customNarration: string = "") {
        const messageType = MessageDisplayType.STANDARD;
        let narration = customNarration;
        if (player && !customNarration)
            narration = this.#game.notificationGenerator.generateUnsolvePuzzleNotification(player, false, puzzle);
        if (player) {
            if (puzzle.unsolvedDescription.text !== "") puzzle.unsolvedDescription.parseAndSendTo(player, puzzle);
            else {
                const notification = this.#game.notificationGenerator.generateUnsolvePuzzleNotification(player, true, puzzle);
                if (notification !== "") this.sendNotification(player, action, notification, messageType);
            }
        }
        if (narration !== "") this.#sendNarration(messageType, action, player, narration, puzzle.location);
    }

    /**
     * Narrates a die action.
     * @param action - The action that initiated this narration.
     * @param player - The player performing the die action.
     * @param customNarration - The custom text of the narration. Optional.
     */
    narrateDie(action: Action, player: Player, customNarration?: string) {
        const messageType = MessageDisplayType.ALERT;
        const notification = this.#game.notificationGenerator.generateDieNotification(player, true);
        this.sendNotification(player, action, notification, messageType);
        if (!player.isHidden()) {
            if (customNarration) this.#sendNarration(messageType, action, player, customNarration);
            else {
                const narration = this.#game.notificationGenerator.generateDieNotification(player, false);
                this.#sendNarration(messageType, action, player, narration);
            }
        }
    }

    /**
     * Narrates an unlock event.
     * @param action - The action that initiated this narration.
     * @param room - The room the exit is in.
     * @param exit - The exit being unlocked.
     */
    narrateUnlock(action: Action, room: Room, exit: Exit) {
        const narration = this.#game.notificationGenerator.generateUnlockNotification(exit);
        this.#sendNarration(MessageDisplayType.STANDARD, action, undefined, narration, room);
    }

    /**
     * Narrates a lock event.
     * @param action - The action that initiated this narration.
     * @param room - The room the exit is in.
     * @param exit - The exit being locked.
     */
    narrateLock(action: Action, room: Room, exit: Exit) {
        const narration = this.#game.notificationGenerator.generateLockNotification(exit);
        this.#sendNarration(MessageDisplayType.STANDARD, action, undefined, narration, room);
    }

    /**
     * Narrates a trigger action.
     * @param action - The action that initiated this narration.
     * @param event - The event being triggered.
     */
    narrateTrigger(action: Action, event: Event) {
        // Send the triggered narration to all rooms with occupants.
        if (event.triggeredNarration.text !== "") {
            const messageType = event.triggeredNarration.messageDisplayType ?? MessageDisplayType.STANDARD;
            const narrationText = parseDescription(event.triggeredNarration, event, undefined);
            const rooms = this.#game.entityFinder.getRooms(null, event.roomTag, false);
            for (let room of rooms)
                this.#sendNarration(messageType, action, undefined, narrationText, room);
        }
    }

    /**
     * Narrates an event being ended.
     * @param action - The action that initiated this narration.
     * @param event - The event being ended.
     */
    narrateEnd(action: Action, event: Event) {
        // Send the ended narration to all rooms with occupants.
        if (event.endedNarration.text !== "") {
            const messageType = event.endedNarration.messageDisplayType ?? MessageDisplayType.STANDARD;
            const narrationText = parseDescription(event.endedNarration, event, undefined);
            const rooms = this.#game.entityFinder.getRooms(null, event.roomTag, false);
            for (let room of rooms)
                this.#sendNarration(messageType, action, undefined, narrationText, room);
        }
    }

    /**
     * Narrates a player leaving a whisper.
     * @param action - The action that initiated this narration.
     * @param player - The player performing the action.
     * @param whisper - The whisper the player is leaving.
     * @param customNarration - The custom text of the narration.
     */
    narrateLeaveWhisper(action: Action, player: Player, whisper: Whisper, customNarration: string) {
        const messageType = action instanceof DieAction ? MessageDisplayType.ALERT : MessageDisplayType.STANDARD;
        this.#sendNarration(messageType, action, player, customNarration, whisper.location, whisper);
    }
}
