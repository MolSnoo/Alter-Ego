// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Exit from "../../../Data/Exit.ts";
import Party from "../../../Data/Party.ts";
import Player from "../../../Data/Player.ts";
import type Room from "../../../Data/Room.ts";
import type Status from "../../../Data/Status.ts";
import DisbandPartyAction from "../../../Data/Actions/DisbandPartyAction.ts";
import FollowAction from "../../../Data/Actions/FollowAction.ts";
import QueueMoveAction from "../../../Data/Actions/QueueMoveAction.ts";
import StartMoveAction from "../../../Data/Actions/StartMoveAction.ts";
import StopAction from "../../../Data/Actions/StopAction.ts";
import GameEntityManager from "../../../Classes/GameEntityManager.ts";
import GameMovementHandler from "../../../Classes/GameMovementHandler.ts";
import { sendQueuedMessages } from "../../../Modules/messageHandler.ts";
import { WhisperType } from "../../../Modules/enums.ts";
import type { Message } from "discord.js";
import type { Mock } from "vitest";
import FormPartyAction from "../../../Data/Actions/FormPartyAction.ts";

describe('FormPartyAction test', () => {
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
        let deletePartySpy: Mock<typeof GameEntityManager.prototype.deleteParty>;
        let createWhisperSpy: Mock<typeof GameEntityManager.prototype.createWhisper>;
        let addFollowersSpy: Mock<typeof Party.prototype.addFollowers>;
        let deleteWhisperSpy: Mock<typeof GameEntityManager.prototype.deleteWhisper>;
        let doAfterDelaySpy: Mock<typeof Player.prototype.doAfterDelay>;
        let queueMoveSpy: Mock<typeof QueueMoveAction.prototype.performQueueMove>;
        let performStartMoveSpy: Mock<typeof StartMoveAction.prototype.performStartMove>;
        let calculateMoveTimeSpy: Mock<typeof GameMovementHandler.prototype.calculateMoveTime>;
        let movePlayersSpy: Mock<typeof GameMovementHandler.prototype.movePlayers>;

        beforeEach(() => {
            createPartySpy = vi.spyOn(GameEntityManager.prototype, 'createParty');
            deletePartySpy = vi.spyOn(GameEntityManager.prototype, 'deleteParty');
            createWhisperSpy = vi.spyOn(GameEntityManager.prototype, 'createWhisper');
            addFollowersSpy = vi.spyOn(Party.prototype, 'addFollowers');
            deleteWhisperSpy = vi.spyOn(GameEntityManager.prototype, 'deleteWhisper');
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

        describe('all members are stationary', () => {
            beforeEach(async () => {
                asuka.setPos(hall3.pos);
                nero.setPos(mainEntrance.pos);
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

            afterAll(async () => {
                for (const player of [astrid, asuka, nero]) {
                    const stopAction = new StopAction(testGame, undefined, player, player.location, false);
                    stopAction.performStop(false, undefined, true);
                }
            });

            test('stationary player forms party with stationary player', async () => {
                const action = new FormPartyAction(testGame, undefined, astrid, astrid.location, false);
                await action.performFormParty(new Set([asuka]));
                expect(astrid.ledPlayers).toHaveLength(1);
                expect(astrid.ledPlayers[0]).toStrictEqual(asuka);
                expect(astrid.getLedPlayer("Asuka")).toStrictEqual(asuka);
                expect(astrid.isLeading(asuka)).toBe(true);
                expect(deletePartySpy).not.toHaveBeenCalled();
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
                expect(nero.viewParty(false)).toBe(`You are not in a party.`);
                expect(astrid.viewParty(true)).toBe(`Astrid is the leader of a party.\n\nAsuka is traveling together with her.`);
                expect(asuka.viewParty(true)).toBe(`Asuka is in a party led by Astrid.`);
                expect(nero.viewParty(true)).toBe(`Nero is not in a party.`);

                await sendMessages();
                expect(lobby.channel.messages.cache).toHaveSize(2);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
                expect(nero.notificationChannel.messages.cache).toHaveSize(0);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# Asuka begins following an individual wearing a MASK.`);
                expect(lobbyLastNarrationMessage.content).toBe(`> -# An individual wearing a MASK begins leading Asuka.`);
                expect(astridFirstNotificationMessage.content).toBe(`Asuka is following you.`);
                expect(astridLastNotificationMessage.content).toBe(`You begin leading Asuka. You're both together, and ready to go.`);
                expect(asukaFirstNotificationMessage.content).toBe(`You begin following an individual wearing a MASK.`);
                expect(asukaLastNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you.`);

                // Verify that upon party formation, all positions are synchronized.
                expect(movePlayersSpy).not.toHaveBeenCalled();
                expect(calculateMoveTimeSpy).not.toHaveBeenCalled();
                expect(doAfterDelaySpy).not.toHaveBeenCalled();
                expect(astrid.party.positionsSynchronized).toBe(true);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(false);
                expect(asuka.positionMatches(astrid)).toBe(true);
                expect(nero.positionMatches(astrid)).toBe(false);
            });

            test('stationary player forms party with stationary player who is already in her party', async () => {
                nero.setPronouns(nero.pronouns, "neutral");
                const action1 = new FormPartyAction(testGame, undefined, astrid, astrid.location, false);
                await action1.performFormParty(new Set([asuka]));
                await sendMessages();
                clearMessages();

                const action2 = new FormPartyAction(testGame, undefined, astrid, astrid.location, false);
                await action2.performFormParty(new Set([asuka, nero]));
                expect(astrid.ledPlayers).toHaveLength(2);
                expect(astrid.ledPlayers[0]).toStrictEqual(asuka);
                expect(astrid.ledPlayers[1]).toStrictEqual(nero);
                expect(astrid.getLedPlayer("Asuka")).toStrictEqual(asuka);
                expect(astrid.getLedPlayer("Nero")).toStrictEqual(nero);
                expect(astrid.isLeading(asuka)).toBe(true);
                expect(astrid.isLeading(nero)).toBe(true);
                expect(deletePartySpy).not.toHaveBeenCalled();
                expect(createPartySpy).toHaveBeenCalledOnce();
                expect(addFollowersSpy).toHaveBeenCalledOnce();
                expect(addFollowersSpy).toBeInvokedWith([nero]);
                expect(deleteWhisperSpy).toHaveBeenCalledOnce();
                expect(createWhisperSpy).toHaveBeenCalledTimes(2);
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
                expect(lobby.channel.messages.cache).toHaveSize(2);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
                expect(nero.notificationChannel.messages.cache).toHaveSize(2);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# Nero begins following an individual wearing a MASK.`);
                expect(lobbyLastNarrationMessage.content).toBe(`> -# An individual wearing a MASK begins leading Nero.`);
                expect(astridFirstNotificationMessage.content).toBe(`Nero is following you.`);
                expect(astridLastNotificationMessage.content).toBe(`You begin leading Nero. Everyone in your party is all together, and ready to go.`);
                expect(neroFirstNotificationMessage.content).toBe(`You begin following an individual wearing a MASK.`);
                expect(neroLastNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you.`);

                // All positions should be synchronized.
                expect(astrid.party.positionsSynchronized).toBe(true);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(false);
                expect(movePlayersSpy).not.toHaveBeenCalled();
                expect(calculateMoveTimeSpy).not.toHaveBeenCalled();
                expect(doAfterDelaySpy).not.toHaveBeenCalled();
                expect(asuka.positionMatches(astrid)).toBe(true);
                expect(nero.positionMatches(astrid)).toBe(true);
                nero.setPronouns(nero.pronouns, nero.pronounString);
            });

            test('stationary player forms party with stationary player who is in a different party', async () => {
                const action1 = new FormPartyAction(testGame, undefined, asuka, asuka.location, false);
                await action1.performFormParty(new Set([nero]));
                await sendMessages();
                clearMessages();
                vi.clearAllMocks();

                const action2 = new FormPartyAction(testGame, undefined, astrid, astrid.location, false);
                await action2.performFormParty(new Set([asuka, nero]));
                expect(astrid.ledPlayers).toHaveLength(2);
                expect(astrid.ledPlayers[0]).toStrictEqual(asuka);
                expect(astrid.ledPlayers[1]).toStrictEqual(nero);
                expect(astrid.getLedPlayer("Asuka")).toStrictEqual(asuka);
                expect(astrid.getLedPlayer("Nero")).toStrictEqual(nero);
                expect(astrid.isLeading(asuka)).toBe(true);
                expect(astrid.isLeading(nero)).toBe(true);
                expect(astrid.party).toStrictEqual(asuka.party);
                expect(astrid.party).toStrictEqual(nero.party);
                expect(deletePartySpy).toHaveBeenCalledOnce();
                expect(createPartySpy).toHaveBeenCalledOnce();
                expect(addFollowersSpy).not.toHaveBeenCalled();
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
                expect(lobby.channel.messages.cache).toHaveSize(3);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(3);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
                expect(nero.notificationChannel.messages.cache).toHaveSize(2);
                expect(lobbyFirstNarrationMessage.content).toBe(`> -# Asuka begins following an individual wearing a MASK.`);
                expect(lobby.channel.messages.cache.at(1).content).toBe(`> -# Nero begins following an individual wearing a MASK.`);
                expect(lobbyLastNarrationMessage.content).toBe(`> -# An individual wearing a MASK begins leading Asuka and Nero.`);
                expect(astridFirstNotificationMessage.content).toBe(`Asuka is following you.`);
                expect(astrid.notificationChannel.messages.cache.at(1).content).toBe(`Nero is following you.`);
                expect(astridLastNotificationMessage.content).toBe(`You begin leading Asuka and Nero. You're all together, and ready to go.`);
                expect(asukaFirstNotificationMessage.content).toBe(`You begin following an individual wearing a MASK.`);
                expect(asukaLastNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you and Nero.`);
                expect(neroFirstNotificationMessage.content).toBe(`You begin following an individual wearing a MASK.`);
                expect(neroLastNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you and Asuka.`);

                // All positions should be synchronized.
                expect(astrid.party.positionsSynchronized).toBe(true);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(false);
                expect(movePlayersSpy).not.toHaveBeenCalled();
                expect(calculateMoveTimeSpy).not.toHaveBeenCalled();
                expect(doAfterDelaySpy).not.toHaveBeenCalled();
                expect(asuka.positionMatches(astrid)).toBe(true);
                expect(nero.positionMatches(astrid)).toBe(true);
            });
        });

        describe('leader is moving and followers are already following', () => {
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

                const action = new FormPartyAction(testGame, undefined, astrid, astrid.location, false);
                await action.performFormParty(new Set([asuka]));
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
                expect(lobby.channel.messages.cache.at(2).content).toBe(`> -# An individual wearing a MASK begins leading Asuka.`);
                expect(astridFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(asukaFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(neroFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(astridLastNotificationMessage.content).toBe(`You begin leading Asuka. You're both together, and ready to go.`);
                expect(asukaLastNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you.`);

                // Verify that upon party formation, all positions are synchronized.
                expect(astrid.party.positionsSynchronized).toBe(true);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(false);
                expect(movePlayersSpy).not.toHaveBeenCalled();
                expect(calculateMoveTimeSpy).not.toHaveBeenCalled();
                expect(doAfterDelaySpy).not.toHaveBeenCalled();
                expect(asuka.positionMatches(astrid)).toBe(true);
                expect(nero.positionMatches(astrid)).toBe(false);
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

                const action = new FormPartyAction(testGame, undefined, astrid, astrid.location, false);
                await action.performFormParty(new Set([asuka, nero]));
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
                expect(lobby.channel.messages.cache.at(2).content).toBe(`> -# An individual wearing a MASK begins leading Asuka and Nero.`);
                expect(astridFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
                expect(asukaFirstNotificationMessage.content).toBe(`> -# You and Nero stop moving.`);
                expect(neroFirstNotificationMessage.content).toBe(`> -# You and Asuka stop moving.`);
                expect(astridLastNotificationMessage.content).toBe(`You begin leading Asuka and Nero. You're all together, and ready to go.`);
                expect(asukaLastNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you and Nero.`);
                expect(neroLastNotificationMessage.content).toBe(`An individual wearing a MASK is now leading you and Asuka.`);

                // Verify that upon party formation, all positions are synchronized.
                expect(astrid.party.positionsSynchronized).toBe(true);
                expect(astrid.isMoving).toBe(false);
                expect(asuka.isMoving).toBe(false);
                expect(nero.isMoving).toBe(false);
                expect(movePlayersSpy).not.toHaveBeenCalled();
                expect(calculateMoveTimeSpy).not.toHaveBeenCalled();
                expect(doAfterDelaySpy).not.toHaveBeenCalled();
                expect(asuka.positionMatches(astrid)).toBe(true);
                expect(nero.positionMatches(astrid)).toBe(true);
            });
        });
    });
});
