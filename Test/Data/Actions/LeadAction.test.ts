// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Exit from "../../../Data/Exit.ts";
import Game from "../../../Data/Game.ts";
import Party from "../../../Data/Party.ts";
import Player from "../../../Data/Player.ts";
import type Room from "../../../Data/Room.ts";
import type Status from "../../../Data/Status.ts";
import DisbandPartyAction from "../../../Data/Actions/DisbandPartyAction.ts";
import FollowAction from "../../../Data/Actions/FollowAction.ts";
import LeadAction from "../../../Data/Actions/LeadAction.ts";
import QueueMoveAction from "../../../Data/Actions/QueueMoveAction.ts";
import StartMoveAction from "../../../Data/Actions/StartMoveAction.ts";
import StopAction from "../../../Data/Actions/StopAction.ts";
import GameEntityManager from "../../../Classes/GameEntityManager.ts";
import GameMovementHandler from "../../../Classes/GameMovementHandler.ts";
import { sendQueuedMessages } from "../../../Modules/messageHandler.ts";
import { WhisperType } from "../../../Modules/enums.ts";
import type { Message } from "discord.js";
import type { Mock } from "vitest";

describe('LeadAction test', () => {
    /**
     * Location: lobby
     *
     * Position: center of room ({ x: 2500, y: 100, z: 3080 })
     *
     * Speed: 10
     */
    let astrid: Player;
    /**
     * Location: lobby
     *
     * Position: HALL 3 ({ x: 2238, y: 100, z: 3138 })
     *
     * Speed: 5
     */
    let asuka: Player;
    /**
     * Location: lobby
     *
     * Position: MAIN ENTRANCE ({ x: 2500, y: 100, z: 3175 })
     *
     * Speed: 1
     */
    let nero: Player;
    /**
     * Inflicts spd+4, getting Astrid to the speed we need her at.
     */
    let fast: Status;
    /**
     * Changes Astrid's display name.
     */
    let concealed: Status;
    /**
     * The concealed display name to set for Astrid.
     */
    let concealedDisplayName: string;
    /**
     * Inflicts spd+1, getting Asuka to the speed we need her at.
     */
    let cheerful: Status;
    /**
     * Inflicts spd-4, getting Nero to the speed we need him at.
     */
    let crutches: Status;
    /**
     * The room all the players are in.
     */
    let lobby: Room;
    /**
     * Position: { x: 2500, y: 100, z: 3175 }
     */
    let mainEntrance: Exit;
    /**
     * Position: { x: 2238, y: 100, z: 3138 }
     */
    let hall3: Exit;
    let lobbyFirstNarrationMessage: Message<boolean>;
    let lobbyLastNarrationMessage: Message<boolean>;
    let astridFirstNotificationMessage: Message<boolean>;
    let astridLastNotificationMessage: Message<boolean>;
    let asukaFirstNotificationMessage: Message<boolean>;
    let asukaLastNotificationMessage: Message<boolean>;
    let neroFirstNotificationMessage: Message<boolean>;
    let neroLastNotificationMessage: Message<boolean>;
    const clearMessages = () => {
        lobby.channel.messages.cache.clear();
        astrid.notificationChannel.messages.cache.clear();
        asuka.notificationChannel.messages.cache.clear();
        nero.notificationChannel.messages.cache.clear();
    };

    const sendMessages = async () => {
        await sendQueuedMessages(testGame);
        lobbyFirstNarrationMessage = lobby.channel.messages.cache.first();
        lobbyLastNarrationMessage = lobby.channel.messages.cache.last();
        astridFirstNotificationMessage = astrid.notificationChannel.messages.cache.first();
        astridLastNotificationMessage = astrid.notificationChannel.messages.cache.last();
        asukaFirstNotificationMessage = asuka.notificationChannel.messages.cache.first();
        asukaLastNotificationMessage = asuka.notificationChannel.messages.cache.last();
        neroFirstNotificationMessage = nero.notificationChannel.messages.cache.first();
        neroLastNotificationMessage = nero.notificationChannel.messages.cache.last();
    }

    beforeAll(async () => {
        if (!testGame.inProgress) await testGame.entityLoader.loadAll();
        astrid = testGame.entityFinder.getLivingPlayer("Astrid");
        asuka = testGame.entityFinder.getLivingPlayer("Asuka");
        nero = testGame.entityFinder.getLivingPlayer("Nero");
        fast = testGame.entityFinder.getStatusEffect("fast");
        concealed = testGame.entityFinder.getStatusEffect("concealed");
        cheerful = testGame.entityFinder.getStatusEffect("cheerful");
        crutches = testGame.entityFinder.getStatusEffect("crutches");
        lobby = testGame.entityFinder.getRoom("lobby");
        mainEntrance = testGame.entityFinder.getExit(lobby, "MAIN ENTRANCE");
        hall3 = testGame.entityFinder.getExit(lobby, "HALL 3");
        astrid.inflict(fast);
        astrid.inflict(concealed);
        concealedDisplayName = "an individual wearing a MASK";
        astrid.setPronouns(astrid.pronouns, "neutral");
        astrid.displayName = concealedDisplayName;
        asuka.inflict(cheerful);
        nero.inflict(crutches);
        asuka.setPos(hall3.pos);
        nero.setPos(mainEntrance.pos);
    });

    beforeEach(() => {
        vi.clearAllTimers();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    afterAll(() => {
        astrid.cure(fast);
        astrid.cure(concealed);
        astrid.displayName = "Astrid";
        astrid.setPronouns(astrid.pronouns, astrid.pronounString);
        asuka.cure(cheerful);
        nero.cure(crutches);
    });

    test('Setup is correct', () => {
        expect(astrid.speed).toBe(10);
        expect(asuka.speed).toBe(5);
        expect(nero.speed).toBe(1);
        expect(astrid.location.id).toBe("lobby");
        expect(asuka.location.id).toBe("lobby");
        expect(nero.location.id).toBe("lobby");
        expect(astrid.pos).toStrictEqual({ x: 2500, y: 100, z: 3080 });
        expect(asuka.pos).toStrictEqual({ x: 2238, y: 100, z: 3138 });
        expect(nero.pos).toStrictEqual({ x: 2500, y: 100, z: 3175 });
    });

    describe('LeadAction.performLead tests', () => {
        let createPartySpy: Mock<typeof GameEntityManager.prototype.createParty>;
        let createWhisperSpy: Mock<typeof GameEntityManager.prototype.createWhisper>;
        let addFollowersSpy: Mock<typeof Party.prototype.addFollowers>;
        let deleteWhisperSpy: Mock<typeof Party.prototype.deleteWhisper>;
        let doAfterDelaySpy: Mock<typeof Player.prototype.doAfterDelay>;
        let queueMoveSpy: Mock<typeof QueueMoveAction.prototype.performQueueMove>;
        let performStartMoveSpy: Mock<typeof StartMoveAction.prototype.performStartMove>;
        let calculateMoveTimeSpy: Mock<typeof GameMovementHandler.prototype.calculateMoveTime>;
        let movePlayersSpy: Mock<typeof GameMovementHandler.prototype.movePlayers>;

        beforeEach(() => {
            createPartySpy = vi.spyOn(GameEntityManager.prototype, 'createParty');
            createWhisperSpy = vi.spyOn(GameEntityManager.prototype, 'createWhisper');
            addFollowersSpy = vi.spyOn(Party.prototype, 'addFollowers');
            deleteWhisperSpy = vi.spyOn(Party.prototype, 'deleteWhisper');
            doAfterDelaySpy = vi.spyOn(Player.prototype, 'doAfterDelay');
            queueMoveSpy = vi.spyOn(QueueMoveAction.prototype, 'performQueueMove');
            performStartMoveSpy = vi.spyOn(StartMoveAction.prototype, 'performStartMove');
            calculateMoveTimeSpy = vi.spyOn(GameMovementHandler.prototype, 'calculateMoveTime');
            movePlayersSpy = vi.spyOn(GameMovementHandler.prototype, 'movePlayers');
            const doSendProgressIndicatorMock = vi.spyOn(GameMovementHandler.prototype as any, 'doSendProgressIndicator');
            doSendProgressIndicatorMock.mockImplementation(() => false);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        describe('party is retained between tests', () => {
            beforeAll(async () => {
                const followAction1 = new FollowAction(testGame, undefined, asuka, asuka.location, false);
                await followAction1.performFollow(astrid);
                const followAction2 = new FollowAction(testGame, undefined, nero, nero.location, false);
                await followAction2.performFollow(astrid);
            });

            beforeEach(async () => {
                await sendMessages();
                clearMessages();
            });

            afterEach(async () => {
                await sendMessages();
                clearMessages();
            });

            afterAll(async () => {
                const disbandPartyAction = new DisbandPartyAction(testGame, undefined, astrid, astrid.location, false);
                await disbandPartyAction.performDisbandParty(true);
                const stopAction = new StopAction(testGame, undefined, astrid, astrid.location, false);
                await stopAction.performStop(false, undefined, true, new Set([astrid, asuka, nero]));
            });

            test('stationary player leads stationary player', async () => {
                const action = new LeadAction(testGame, undefined, astrid, astrid.location, false);
                await action.performLead([asuka]);
                expect(astrid.ledPlayers).toHaveLength(1);
                expect(astrid.ledPlayers[0]).toStrictEqual(asuka);
                expect(astrid.getLedPlayer("Asuka")).toStrictEqual(asuka);
                expect(astrid.isLeading(asuka)).toBe(true);
                expect(createPartySpy).toHaveBeenCalledOnce();
                expect(astrid.party).not.toBeNull();
                expect(asuka.party).not.toBeNull();
                expect(astrid.party).toStrictEqual(asuka.party);
                expect(astrid.party.leader).toStrictEqual(astrid);
                expect(astrid.party.hasLeader(astrid)).toBe(true);
                expect(astrid.party.hasLeader(asuka)).toBe(false);
                expect(astrid.party.followers).toHaveSize(1);
                expect(astrid.party.followers.has("Astrid")).toBe(false);
                expect(astrid.party.followers.has("Asuka")).toBe(true);
                expect(astrid.party.hasFollower(astrid)).toBe(false);
                expect(astrid.party.hasFollower(asuka)).toBe(true);
                expect(astrid.party.members).toHaveSize(2);
                expect(astrid.party.members.has("Astrid")).toBe(true);
                expect(astrid.party.members.has("Asuka")).toBe(true);
                expect(astrid.party.hasMember(astrid)).toBe(true);
                expect(astrid.party.hasMember(asuka)).toBe(true);
                expect(astrid.party.getMemberDisplayName(astrid)).toBe(concealedDisplayName);
                expect(astrid.party.getMemberDisplayName(asuka)).toBe(asuka.name);
                expect(astrid.party.whisper).not.toBeNull();
                expect(astrid.party.whisper.type).toEqual(WhisperType.PARTY);
                expect(astrid.party.whisper.associatedEntity).not.toBeNull();
                expect(astrid.party.whisper.associatedEntity).toBeInstanceOf(Party);
                expect(astrid.party.whisper.associatedEntity).toStrictEqual(astrid.party);
                expect(astrid.party.id).toBe("party-an-individual-wearing-a-mask-asuka");
                expect(astrid.party.id).toBe(astrid.party.whisper.id);
                expect(astrid.party.whisper.players).toHaveSize(2);
                expect(astrid.party.whisper.players.has("Astrid")).toBe(true);
                expect(astrid.party.whisper.players.has("Asuka")).toBe(true);
                expect(astrid.viewParty(false)).toBe(`You are the leader of a party.\n\nAsuka is traveling together with you.`);
                expect(asuka.viewParty(false)).toBe(`You are in a party led by ${concealedDisplayName}.`);
                expect(nero.viewParty(false)).toBe(`You are not in a party. However, you are following ${concealedDisplayName}.`);
                expect(astrid.viewParty(true)).toBe(`Astrid is the leader of a party.\n\nAsuka is traveling together with her.`);
                expect(asuka.viewParty(true)).toBe(`Asuka is in a party led by Astrid.`);
                expect(nero.viewParty(true)).toBe(`Nero is not in a party. However, he is following Astrid.`);

                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(1);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
                expect(nero.notificationChannel.messages.cache).toHaveSize(0);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK begins leading Asuka, who starts approaching them.`);
                expect(astridFirstNotificationMessage.content).toBe(`You begin leading Asuka. She starts approaching you.`);
                expect(asukaFirstNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you. You start approaching them.`);

                // Verify that upon party formation, followers move toward their leader until their positions are synchronized.
                expect(astrid.party.positionsSynchronized).toBe(false);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(true);
                expect(nero.isMoving).toBe(false);
                expect(movePlayersSpy).toHaveBeenCalledOnce();
                expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
                expect(doAfterDelaySpy).toHaveBeenCalledOnce();
                const asukaTravelTime = calculateMoveTimeSpy.mock.results[0].value + (2 * Game.tick);
                await vi.advanceTimersByTimeAsync(asukaTravelTime);
                expect(astrid.party.positionsSynchronized).toBe(true);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(false);
                expect(asuka.positionMatches(astrid)).toBe(true);
                expect(nero.positionMatches(astrid)).toBe(false);

                clearMessages();
                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(1);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
                expect(nero.notificationChannel.messages.cache).toHaveSize(0);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# Asuka finishes approaching an individual wearing a MASK, and waits with them.`);
                expect(astridLastNotificationMessage.content).toBe(`Everyone in your party is all together now, and ready to go.`);
                expect(asukaFirstNotificationMessage.content).toBe(`> -# You finish approaching an individual wearing a MASK, and wait with them.`);
            });

            test('stationary player leads stationary player she was already leading', async () => {
                const action = new LeadAction(testGame, undefined, astrid, astrid.location, false);
                await action.performLead([asuka]);
                expect(astrid.ledPlayers).toHaveLength(1);
                expect(astrid.ledPlayers[0]).toStrictEqual(asuka);
                expect(astrid.getLedPlayer("Asuka")).toStrictEqual(asuka);
                expect(astrid.isLeading(asuka)).toBe(true);
                expect(createPartySpy).not.toHaveBeenCalled();
                expect(deleteWhisperSpy).not.toHaveBeenCalled();
                expect(createWhisperSpy).not.toHaveBeenCalled();
                expect(astrid.party).not.toBeNull();
                expect(asuka.party).not.toBeNull();
                expect(astrid.party).toStrictEqual(asuka.party);
                expect(astrid.party.id).toBe("party-an-individual-wearing-a-mask-asuka");
                expect(astrid.party.id).toBe(astrid.party.whisper.id);
                expect(astrid.party.leader).toStrictEqual(astrid);
                expect(astrid.party.followers).toHaveSize(1);
                expect(astrid.party.followers.has("Astrid")).toBe(false);
                expect(astrid.party.followers.has("Asuka")).toBe(true);
                expect(astrid.party.members).toHaveSize(2);
                expect(astrid.party.members.has("Astrid")).toBe(true);
                expect(astrid.party.members.has("Asuka")).toBe(true);
                expect(astrid.viewParty(false)).toBe(`You are the leader of a party.\n\nAsuka is traveling together with you.`);
                expect(asuka.viewParty(false)).toBe(`You are in a party led by ${concealedDisplayName}.`);
                expect(nero.viewParty(false)).toBe(`You are not in a party. However, you are following ${concealedDisplayName}.`);
                expect(astrid.viewParty(true)).toBe(`Astrid is the leader of a party.\n\nAsuka is traveling together with her.`);
                expect(asuka.viewParty(true)).toBe(`Asuka is in a party led by Astrid.`);
                expect(nero.viewParty(true)).toBe(`Nero is not in a party. However, he is following Astrid.`);

                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(1);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
                expect(nero.notificationChannel.messages.cache).toHaveSize(0);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK begins leading Asuka.`);
                expect(astridFirstNotificationMessage.content).toBe(`You begin leading Asuka. You're both together, and ready to go.`);
                expect(asukaFirstNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you.`);

                // Positions should already be synchronized from the previous test.
                expect(astrid.party.positionsSynchronized).toBe(true);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(false);
                expect(movePlayersSpy).not.toHaveBeenCalled();
                expect(calculateMoveTimeSpy).not.toHaveBeenCalled();
                expect(doAfterDelaySpy).not.toHaveBeenCalled();
                expect(asuka.positionMatches(astrid)).toBe(true);
                expect(nero.positionMatches(astrid)).toBe(false);

                await vi.advanceTimersByTimeAsync(10000);
                clearMessages();
                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(0);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(0);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
                expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            });

            test('stationary player leads another stationary player while already in a party', async () => {
                nero.setPronouns(nero.pronouns, "neutral");
                const action = new LeadAction(testGame, undefined, astrid, astrid.location, false);
                await action.performLead([nero]);
                expect(astrid.ledPlayers).toHaveLength(2);
                expect(astrid.ledPlayers[0]).toStrictEqual(asuka);
                expect(astrid.ledPlayers[1]).toStrictEqual(nero);
                expect(astrid.getLedPlayer("Asuka")).toStrictEqual(asuka);
                expect(astrid.getLedPlayer("Nero")).toStrictEqual(nero);
                expect(astrid.isLeading(asuka)).toBe(true);
                expect(astrid.isLeading(nero)).toBe(true);
                expect(createPartySpy).not.toHaveBeenCalled();
                expect(addFollowersSpy).toHaveBeenCalledOnce();
                expect(addFollowersSpy).toBeInvokedWith([nero]);
                expect(deleteWhisperSpy).toHaveBeenCalledOnce();
                expect(createWhisperSpy).toHaveBeenCalledOnce();
                expect(astrid.party.whisper).not.toBeNull();
                expect(astrid.party.whisper.type).toEqual(WhisperType.PARTY);
                expect(astrid.party.whisper.associatedEntity).not.toBeNull();
                expect(astrid.party.whisper.associatedEntity).toBeInstanceOf(Party);
                expect(astrid.party.whisper.associatedEntity).toStrictEqual(astrid.party);
                expect(astrid.party.id).toBe("party-an-individual-wearing-a-mask-asuka-nero");
                expect(astrid.party.id).toBe(astrid.party.whisper.id);
                expect(astrid.party.whisper.players).toHaveSize(3);
                expect(astrid.party.whisper.players.has("Astrid")).toBe(true);
                expect(astrid.party.whisper.players.has("Asuka")).toBe(true);
                expect(astrid.party.whisper.players.has("Nero")).toBe(true);
                expect(astrid.viewParty(false)).toBe(`You are the leader of a party.\n\nAsuka and Nero are traveling together with you.`);
                expect(asuka.viewParty(false)).toBe(`You are in a party led by ${concealedDisplayName}.\n\nNero is also traveling with you.`);
                expect(nero.viewParty(false)).toBe(`You are in a party led by ${concealedDisplayName}.\n\nAsuka is also traveling with you.`);
                expect(astrid.viewParty(true)).toBe(`Astrid is the leader of a party.\n\nAsuka and Nero are traveling together with her.`);
                expect(asuka.viewParty(true)).toBe(`Asuka is in a party led by Astrid.\n\nNero is also traveling with it.`);
                expect(nero.viewParty(true)).toBe(`Nero is in a party led by Astrid.\n\nAsuka is also traveling with him.`);

                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(1);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
                expect(nero.notificationChannel.messages.cache).toHaveSize(1);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK begins leading Nero, who starts approaching them.`);
                expect(astridFirstNotificationMessage.content).toBe(`You begin leading Nero. They start approaching you.`);
                expect(neroFirstNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you. You start approaching them.`);

                // Asuka's position should already be synchronized with Astrid's. Only Nero needs to start moving.
                expect(astrid.party.positionsSynchronized).toBe(false);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(true);
                expect(movePlayersSpy).toHaveBeenCalledOnce();
                expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
                expect(doAfterDelaySpy).toHaveBeenCalledOnce();
                const neroTravelTime = calculateMoveTimeSpy.mock.results[0].value + (2 * Game.tick);
                await vi.advanceTimersByTimeAsync(neroTravelTime);
                expect(astrid.party.positionsSynchronized).toBe(true);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(false);
                expect(asuka.positionMatches(astrid)).toBe(true);
                expect(nero.positionMatches(astrid)).toBe(true);

                clearMessages();
                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(1);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
                expect(nero.notificationChannel.messages.cache).toHaveSize(1);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# Nero finishes approaching an individual wearing a MASK, and waits with them.`);
                expect(astridLastNotificationMessage.content).toBe(`Everyone in your party is all together now, and ready to go.`);
                expect(neroFirstNotificationMessage.content).toBe(`> -# You finish approaching an individual wearing a MASK, and wait with them.`);
                nero.setPronouns(nero.pronouns, nero.pronounString);
            });
        });

        describe('leader is moving and party is reset after each test', () => {
            beforeEach(async () => {
                asuka.setPos(hall3.pos);
                nero.setPos(mainEntrance.pos);
                const followAction1 = new FollowAction(testGame, undefined, asuka, asuka.location, false);
                await followAction1.performFollow(astrid);
                const followAction2 = new FollowAction(testGame, undefined, nero, nero.location, false);
                await followAction2.performFollow(astrid);
                const queueMoveAction = new QueueMoveAction(testGame, undefined, astrid, astrid.location, false);
                const destination = "HALL 5";
                astrid.moveQueue = [destination];
                await queueMoveAction.performQueueMove(false, destination);
                await sendMessages();
                clearMessages();
            });

            afterEach(async () => {
                for (const player of [astrid, asuka, nero]) {
                    player.stopMoving();
                    player.location.removePlayer(player);
                    lobby.addPlayer(player);
                    player.restoreStamina();
                }
                const disbandPartyAction = new DisbandPartyAction(testGame, undefined, astrid, astrid.location, false);
                await disbandPartyAction.performDisbandParty(true);
                await sendMessages();
                clearMessages();
            });

            afterAll(() => {
                for (const player of [astrid, asuka, nero]) {
                    const stopAction = new StopAction(testGame, undefined, player, player.location, false);
                    stopAction.performStop(false, undefined, true);
                }
            });

            test('moving player leads one moving player and all players stop', async () => {
                // Ensure Astrid is the only player to have started moving at this point.
                expect(doAfterDelaySpy).toHaveBeenCalledTimes(2);
                expect(queueMoveSpy).toHaveBeenCalledOnce();
                expect(performStartMoveSpy).toHaveBeenCalledOnce();
                expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(3);
                expect(movePlayersSpy).toHaveBeenCalledOnce();
                vi.clearAllMocks();

                await vi.advanceTimersByTimeAsync(1000);

                // Player.doAfterDelay should not have been called again.
                expect(doAfterDelaySpy).not.toHaveBeenCalled();
                expect(queueMoveSpy).toHaveBeenCalledTimes(2);
                expect(performStartMoveSpy).toHaveBeenCalledTimes(2);
                expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(2);
                expect(movePlayersSpy).toHaveBeenCalledTimes(2);
                vi.clearAllMocks();
                expect(astrid.isMoving).toBe(true);
                expect(asuka.isMoving).toBe(true);
                expect(nero.isMoving).toBe(true);
                await sendMessages();

                const action = new LeadAction(testGame, undefined, astrid, astrid.location, false);
                await action.performLead([asuka]);
                expect(astrid.ledPlayers).toHaveLength(1);
                expect(astrid.ledPlayers[0]).toStrictEqual(asuka);
                expect(createPartySpy).toHaveBeenCalledOnce();
                expect(astrid.party).not.toBeNull();
                expect(asuka.party).not.toBeNull();
                expect(astrid.party).toStrictEqual(asuka.party);

                clearMessages();
                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(3);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(3);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
                expect(nero.notificationChannel.messages.cache).toHaveSize(1);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK stops moving.`);
                expect(lobby.channel.messages.cache.at(1).content).toBe(`> -# Asuka and Nero stop moving.`);
                expect(lobby.channel.messages.cache.at(2).content).toBe(`> -# An individual wearing a MASK begins leading Asuka, who starts approaching them.`);
                expect(astridFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(asukaFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(neroFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(astridLastNotificationMessage.content).toBe(`You begin leading Asuka. She starts approaching you.`);
                expect(asukaLastNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you. You start approaching them.`);

                // Verify that upon party formation, followers move toward their leader until their positions are synchronized.
                expect(astrid.party.positionsSynchronized).toBe(false);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(true);
                expect(nero.isMoving).toBe(false);
                expect(movePlayersSpy).toHaveBeenCalledOnce();
                expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
                expect(doAfterDelaySpy).toHaveBeenCalledOnce();
                const asukaTravelTime = calculateMoveTimeSpy.mock.results[0].value + (2 * Game.tick);
                await vi.advanceTimersByTimeAsync(asukaTravelTime);
                expect(astrid.party.positionsSynchronized).toBe(true);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(false);
                expect(asuka.positionMatches(astrid)).toBe(true);
                expect(nero.positionMatches(astrid)).toBe(false);

                clearMessages();
                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(1);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
                expect(nero.notificationChannel.messages.cache).toHaveSize(0);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# Asuka finishes approaching an individual wearing a MASK, and waits with them.`);
                expect(astridLastNotificationMessage.content).toBe(`Everyone in your party is all together now, and ready to go.`);
                expect(asukaFirstNotificationMessage.content).toBe(`> -# You finish approaching an individual wearing a MASK, and wait with them.`);
            });

            test('moving player leads two moving players and all players stop', async () => {
                // Ensure Astrid is the only player to have started moving at this point.
                expect(doAfterDelaySpy).toHaveBeenCalledTimes(2);
                expect(queueMoveSpy).toHaveBeenCalledOnce();
                expect(performStartMoveSpy).toHaveBeenCalledOnce();
                expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(3);
                expect(movePlayersSpy).toHaveBeenCalledOnce();
                vi.clearAllMocks();

                await vi.advanceTimersByTimeAsync(1000);

                // Player.doAfterDelay should not have been called again.
                expect(doAfterDelaySpy).not.toHaveBeenCalled();
                expect(queueMoveSpy).toHaveBeenCalledTimes(2);
                expect(performStartMoveSpy).toHaveBeenCalledTimes(2);
                expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(2);
                expect(movePlayersSpy).toHaveBeenCalledTimes(2);
                vi.clearAllMocks();
                expect(astrid.isMoving).toBe(true);
                expect(asuka.isMoving).toBe(true);
                expect(nero.isMoving).toBe(true);
                await sendMessages();

                const action = new LeadAction(testGame, undefined, astrid, astrid.location, false);
                await action.performLead([asuka, nero]);
                expect(astrid.ledPlayers).toHaveLength(2);
                expect(astrid.ledPlayers[0]).toStrictEqual(asuka);
                expect(astrid.ledPlayers[1]).toStrictEqual(nero);
                expect(createPartySpy).toHaveBeenCalledOnce();
                expect(astrid.party).not.toBeNull();
                expect(asuka.party).not.toBeNull();
                expect(astrid.party).toStrictEqual(asuka.party);
                expect(astrid.party).toStrictEqual(nero.party);

                clearMessages();
                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(3);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(3);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
                expect(nero.notificationChannel.messages.cache).toHaveSize(2);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK stops moving.`);
                expect(lobby.channel.messages.cache.at(1).content).toBe(`> -# Asuka and Nero stop moving.`);
                expect(lobby.channel.messages.cache.at(2).content).toBe(`> -# An individual wearing a MASK begins leading Asuka and Nero, who start approaching them.`);
                expect(astridFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(asukaFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(neroFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(astridLastNotificationMessage.content).toBe(`You begin leading Asuka and Nero. They start approaching you.`);
                expect(asukaLastNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you and Nero. You start approaching them.`);
                expect(neroLastNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you and Asuka. You start approaching them.`);

                // Verify that upon party formation, followers move toward their leader until their positions are synchronized.
                expect(astrid.party.positionsSynchronized).toBe(false);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(true);
                expect(nero.isMoving).toBe(true);
                expect(movePlayersSpy).toHaveBeenCalledTimes(2);
                expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(2);
                expect(doAfterDelaySpy).toHaveBeenCalledOnce();
                const asukaTravelTime = calculateMoveTimeSpy.mock.results[0].value + (2 * Game.tick);
                const neroTravelTime = calculateMoveTimeSpy.mock.results[1].value + (2 * Game.tick);
                const maxTravelTime = Math.max(asukaTravelTime, neroTravelTime);
                await vi.advanceTimersByTimeAsync(maxTravelTime);
                expect(astrid.party.positionsSynchronized).toBe(true);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(false);
                expect(asuka.positionMatches(astrid)).toBe(true);
                expect(nero.positionMatches(astrid)).toBe(true);

                clearMessages();
                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(2);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(3);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
                expect(nero.notificationChannel.messages.cache).toHaveSize(1);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# Nero finishes approaching an individual wearing a MASK, and waits with them.`);
                expect(lobbyLastNarrationMessage.content).toBe(`> -# Asuka finishes approaching an individual wearing a MASK, and waits with them.`);
                expect(astridLastNotificationMessage.content).toBe(`Everyone in your party is all together now, and ready to go.`);
                expect(asukaFirstNotificationMessage.content).toBe(`> -# You finish approaching an individual wearing a MASK, and wait with them.`);
                expect(neroFirstNotificationMessage.content).toBe(`> -# You finish approaching an individual wearing a MASK, and wait with them.`);
            });

            test('moving player leads two moving players with one unable to synchronize positions', async () => {
                // Ensure Astrid is the only player to have started moving at this point.
                expect(doAfterDelaySpy).toHaveBeenCalledTimes(2);
                expect(queueMoveSpy).toHaveBeenCalledOnce();
                expect(performStartMoveSpy).toHaveBeenCalledOnce();
                expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(3);
                expect(movePlayersSpy).toHaveBeenCalledOnce();
                vi.clearAllMocks();

                await vi.advanceTimersByTimeAsync(1000);

                // Player.doAfterDelay should not have been called again.
                expect(doAfterDelaySpy).not.toHaveBeenCalled();
                expect(queueMoveSpy).toHaveBeenCalledTimes(2);
                expect(performStartMoveSpy).toHaveBeenCalledTimes(2);
                expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(2);
                expect(movePlayersSpy).toHaveBeenCalledTimes(2);
                vi.clearAllMocks();
                expect(astrid.isMoving).toBe(true);
                expect(asuka.isMoving).toBe(true);
                expect(nero.isMoving).toBe(true);
                await sendMessages();

                const action = new LeadAction(testGame, undefined, astrid, astrid.location, false);
                await action.performLead([asuka, nero]);
                expect(astrid.ledPlayers).toHaveLength(2);
                expect(astrid.ledPlayers[0]).toStrictEqual(asuka);
                expect(astrid.ledPlayers[1]).toStrictEqual(nero);
                expect(createPartySpy).toHaveBeenCalledOnce();
                expect(astrid.party).not.toBeNull();
                expect(asuka.party).not.toBeNull();
                expect(astrid.party).toStrictEqual(asuka.party);
                expect(astrid.party).toStrictEqual(nero.party);

                clearMessages();
                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(3);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(3);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
                expect(nero.notificationChannel.messages.cache).toHaveSize(2);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK stops moving.`);
                expect(lobby.channel.messages.cache.at(1).content).toBe(`> -# Asuka and Nero stop moving.`);
                expect(lobby.channel.messages.cache.at(2).content).toBe(`> -# An individual wearing a MASK begins leading Asuka and Nero, who start approaching them.`);
                expect(astridFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(asukaFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(neroFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(astridLastNotificationMessage.content).toBe(`You begin leading Asuka and Nero. They start approaching you.`);
                expect(asukaLastNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you and Nero. You start approaching them.`);
                expect(neroLastNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you and Asuka. You start approaching them.`);

                // Verify that upon party formation, followers move toward their leader.
                expect(astrid.party.positionsSynchronized).toBe(false);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(true);
                expect(nero.isMoving).toBe(true);
                expect(movePlayersSpy).toHaveBeenCalledTimes(2);
                expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(2);
                expect(doAfterDelaySpy).toHaveBeenCalledOnce();
                // Make Asuka unable to move.
                asuka.stamina = 0.01;
                // Here, we only need to advance the time by nero's travel time, which is shorter than Asuka's.
                // This is because Asuka will have been removed from the party by the movement handler, mid-movement,
                // so when Nero reaches Astrid, the party members' positions will be considered synchronized.
                const neroTravelTime = calculateMoveTimeSpy.mock.results[1].value + (2 * Game.tick);
                await vi.advanceTimersByTimeAsync(neroTravelTime);
                expect(astrid.party.positionsSynchronized).toBe(true);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(false);
                expect(asuka.positionMatches(astrid)).toBe(false);
                expect(nero.positionMatches(astrid)).toBe(true);
                expect(astrid.party.hasMember(asuka)).toBe(false);
                expect(astrid.party.hasMember(nero)).toBe(true);

                clearMessages();
                await sendMessages();
                const whisperChannel = astrid.party.whisper.channel;
                expect(whisperChannel.messages.cache).toHaveSize(1);
                expect(whisperChannel.messages.cache.last().content).toBe(`Asuka can't seem to keep up with an individual wearing a MASK.`);
                expect(lobby.channel.messages.cache).toHaveSize(3);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(4);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
                expect(nero.notificationChannel.messages.cache).toHaveSize(1);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# Asuka's breathing is getting heavy. It seems like she's starting to get tired.`);
                expect(lobby.channel.messages.cache.at(1).content).toBe(`> -# Asuka stops moving. She seems weary.`);
                expect(lobbyLastNarrationMessage.content).toBe(`> -# Nero finishes approaching an individual wearing a MASK, and waits with them.`);
                expect(astridLastNotificationMessage.content).toBe(`Everyone in your party is all together now, and ready to go.`);
                expect(asukaFirstNotificationMessage.content).toBe(`Your breathing is getting heavy. You might want to stop moving and rest soon.`);
                expect(asukaLastNotificationMessage.content).toBe(`After to moving to this room, you have become **weary**. You need to take a short break before moving to another room.`);
                expect(neroFirstNotificationMessage.content).toBe(`> -# You finish approaching an individual wearing a MASK, and wait with them.`);
            });

            test('moving player leads one moving player who takes less than a second to synchronize', async () => {
                // Ensure Astrid is the only player to have started moving at this point.
                expect(doAfterDelaySpy).toHaveBeenCalledTimes(2);
                expect(queueMoveSpy).toHaveBeenCalledOnce();
                expect(performStartMoveSpy).toHaveBeenCalledOnce();
                expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(3);
                expect(movePlayersSpy).toHaveBeenCalledOnce();
                vi.clearAllMocks();

                await vi.advanceTimersByTimeAsync(1000);

                // Player.doAfterDelay should not have been called again.
                expect(doAfterDelaySpy).not.toHaveBeenCalled();
                expect(queueMoveSpy).toHaveBeenCalledTimes(2);
                expect(performStartMoveSpy).toHaveBeenCalledTimes(2);
                expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(2);
                expect(movePlayersSpy).toHaveBeenCalledTimes(2);
                vi.clearAllMocks();
                expect(astrid.isMoving).toBe(true);
                expect(asuka.isMoving).toBe(true);
                expect(nero.isMoving).toBe(true);
                await sendMessages();

                calculateMoveTimeSpy.mockReturnValueOnce(100);
                const action = new LeadAction(testGame, undefined, astrid, astrid.location, false);
                await action.performLead([nero]);
                expect(astrid.ledPlayers).toHaveLength(1);
                expect(astrid.ledPlayers[0]).toStrictEqual(nero);
                expect(createPartySpy).toHaveBeenCalledOnce();
                expect(astrid.party).not.toBeNull();
                expect(nero.party).not.toBeNull();
                expect(astrid.party).toStrictEqual(nero.party);

                clearMessages();
                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(3);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(3);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
                expect(nero.notificationChannel.messages.cache).toHaveSize(2);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK stops moving.`);
                expect(lobby.channel.messages.cache.at(1).content).toBe(`> -# Asuka and Nero stop moving.`);
                expect(lobby.channel.messages.cache.at(2).content).toBe(`> -# An individual wearing a MASK begins leading Nero.`);
                expect(astridFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(asukaFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(neroFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(astridLastNotificationMessage.content).toBe(`You begin leading Nero. You're both together, and ready to go.`);
                expect(neroLastNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you.`);

                // Verify that upon party formation, followers move toward their leader until their positions are synchronized.
                expect(astrid.party.positionsSynchronized).toBe(false);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(true);
                expect(movePlayersSpy).toHaveBeenCalledOnce();
                expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
                expect(doAfterDelaySpy).toHaveBeenCalledOnce();
                const neroTravelTime = calculateMoveTimeSpy.mock.results[0].value + (2 * Game.tick);
                expect(neroTravelTime).toBeLessThanOrEqual(1000);
                await vi.advanceTimersByTimeAsync(neroTravelTime);
                expect(astrid.party.positionsSynchronized).toBe(true);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(false);
                expect(asuka.positionMatches(astrid)).toBe(false);
                expect(nero.positionMatches(astrid)).toBe(true);

                clearMessages();
                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(0);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(0);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
                expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            });
        });
    });
});
