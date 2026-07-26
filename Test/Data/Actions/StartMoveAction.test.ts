// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Exit from "../../../Data/Exit.ts";
import Player from "../../../Data/Player.ts";
import type Room from "../../../Data/Room.ts";
import type Status from "../../../Data/Status.ts";
import DisbandPartyAction from "../../../Data/Actions/DisbandPartyAction.ts";
import DismissAction from "../../../Data/Actions/DismissAction.ts";
import FollowAction from "../../../Data/Actions/FollowAction.ts";
import LeadAction from "../../../Data/Actions/LeadAction.ts";
import MoveAction from "../../../Data/Actions/MoveAction.ts";
import StartMoveAction from "../../../Data/Actions/StartMoveAction.ts";
import QueueMoveAction from "../../../Data/Actions/QueueMoveAction.ts";
import StopAction from "../../../Data/Actions/StopAction.ts";
import GameEntityManager from "../../../Classes/GameEntityManager.ts";
import GameMovementHandler from "../../../Classes/GameMovementHandler.ts";
import GameNarrationHandler from "../../../Classes/GameNarrationHandler.ts";
import GameNotificationGenerator from "../../../Classes/GameNotificationGenerator.ts";
import { sendQueuedMessages } from "../../../Modules/messageHandler.ts";
import type { Mock } from "vitest";
import type { Message } from "discord.js";

describe('StartMoveAction test', () => {
    /**
     * Location: lobby
     *
     * Position: center of room ({ x: 2500, y: 100, z: 3080 })
     *
     * Speed: 10
     *
     * Stamina: 6
     *
     * Carry weight: 5
     */
    let astrid: Player;
    /**
     * Location: lobby
     *
     * Position: HALL 5 ({ x: 2763, y: 100, z: 3138 })
     *
     * Speed: 5
     *
     * Stamina: 3
     *
     * Carry weight: 6
     */
    let asuka: Player;
    /**
     * Location: lobby
     *
     * Position: MAIN ENTRANCE ({ x: 2500, y: 100, z: 3175 })
     *
     * Speed: 1
     *
     * Stamina: 1
     *
     * Carry weight: 4
     */
    let nero: Player;
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
    /**
     * Position: { x: 2763, y: 100, z: 3138 }
     */
    let hall5: Exit;
    /**
     * A long room where players can easily run out of stamina.
     */
    let meatballRoom: Room;
    /**
     * Position: { x: 425, y: 0, z: 3475 }
     */
    let meatballBeginning: Exit;
    /**
     * Position: { x: 425, y: 0, z: -7125 }
     */
    let meatballEnd: Exit;
    /**
     * A room with a restricted exit puzzle.
     */
    let cave9: Room;
    /**
     * Position: { x: 4812, y: 200, z: 450 }
     */
    let cave9Door: Exit;
    /**
     * The destination the main entrance leads to.
     */
    let courtyard: Room;
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
     * Prevents being inflicted with cold.
     */
    let bundledUp: Status;
    let lobbyFirstNarrationMessage: Message<boolean>;
    let lobbyLastNarrationMessage: Message<boolean>;
    let hall3NarrationMessage: Message<boolean>;
    let hall5NarrationMessage: Message<boolean>;
    let meatballNarrationMessage: Message<boolean>;
    let cave9NarrationMessage: Message<boolean>;
    let courtyardNarrationMessage: Message<boolean>;
    let astridFirstNotificationMessage: Message<boolean>;
    let astridLastNotificationMessage: Message<boolean>;
    let asukaFirstNotificationMessage: Message<boolean>;
    let asukaLastNotificationMessage: Message<boolean>;
    let neroFirstNotificationMessage: Message<boolean>;
    let neroLastNotificationMessage: Message<boolean>;
    let calculateMoveTimeSpy: Mock<typeof GameMovementHandler.prototype.calculateMoveTime>;
    let doAfterDelaySpy: Mock<typeof Player.prototype.doAfterDelay>;
    let narrateStartMoveSpy: Mock<typeof GameNarrationHandler.prototype.narrateStartMove>;
    let narrateReachedHalfStaminaSpy: Mock<typeof GameNarrationHandler.prototype.narrateReachedHalfStamina>;
    let queueMoveSpy: Mock<typeof QueueMoveAction.prototype.performQueueMove>;
    let movePlayersSpy: Mock<typeof GameMovementHandler.prototype.movePlayers>;
    let moveSpy: Mock<typeof MoveAction.prototype.performMove>;
    let deletePartySpy: Mock<typeof GameEntityManager.prototype.deleteParty>;
    const clearMessages = () => {
        lobby.channel.messages.cache.clear();
        hall3.dest.channel.messages.cache.clear();
        testGame.entityFinder.getRoom('locker-room').channel.messages.cache.clear();
        hall5.dest.channel.messages.cache.clear();
        meatballRoom.channel.messages.cache.clear();
        cave9.channel.messages.cache.clear();
        courtyard.channel.messages.cache.clear();
        astrid.notificationChannel.messages.cache.clear();
        asuka.notificationChannel.messages.cache.clear();
        nero.notificationChannel.messages.cache.clear();
    };

    const sendMessages = async () => {
        await sendQueuedMessages(testGame);
        lobbyFirstNarrationMessage = lobby.channel.messages.cache.first();
        lobbyLastNarrationMessage = lobby.channel.messages.cache.last();
        hall3NarrationMessage = hall3.dest.channel.messages.cache.first();
        hall5NarrationMessage = hall5.dest.channel.messages.cache.first();
        meatballNarrationMessage = meatballRoom.channel.messages.cache.first();
        cave9NarrationMessage = cave9.channel.messages.cache.first();
        courtyardNarrationMessage = courtyard.channel.messages.cache.first();
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
        lobby = testGame.entityFinder.getRoom("lobby");
        mainEntrance = testGame.entityFinder.getExit(astrid.location, "MAIN ENTRANCE");
        hall3 = testGame.entityFinder.getExit(astrid.location, "HALL 3");
        hall5 = testGame.entityFinder.getExit(astrid.location, "HALL 5");
        meatballRoom = testGame.entityFinder.getRoom("meatball-room");
        meatballBeginning = testGame.entityFinder.getExit(meatballRoom, "BEGINNING");
        meatballEnd = testGame.entityFinder.getExit(meatballRoom, "END");
        cave9 = testGame.entityFinder.getRoom("cave-9");
        cave9Door = testGame.entityFinder.getExit(cave9, "DOOR");
        courtyard = testGame.entityFinder.getRoom("courtyard");
        fast = testGame.entityFinder.getStatusEffect("fast");
        concealed = testGame.entityFinder.getStatusEffect("concealed");
        cheerful = testGame.entityFinder.getStatusEffect("cheerful");
        crutches = testGame.entityFinder.getStatusEffect("crutches");
        bundledUp = testGame.entityFinder.getStatusEffect("bundled up");
        astrid.inflict(fast);
        astrid.inflict(concealed);
        concealedDisplayName = "an individual wearing a MASK";
        astrid.setPronouns(astrid.pronouns, "neutral");
        astrid.displayName = concealedDisplayName;
        asuka.inflict(cheerful);
        nero.inflict(crutches);
        astrid.inflict(bundledUp);
        asuka.inflict(bundledUp);
        nero.inflict(bundledUp);
    });

    beforeEach(async () => {
        calculateMoveTimeSpy = vi.spyOn(GameMovementHandler.prototype, 'calculateMoveTime');
        doAfterDelaySpy = vi.spyOn(Player.prototype, 'doAfterDelay');
        narrateStartMoveSpy = vi.spyOn(GameNarrationHandler.prototype, 'narrateStartMove');
        narrateReachedHalfStaminaSpy = vi.spyOn(GameNarrationHandler.prototype, 'narrateReachedHalfStamina');
        deletePartySpy = vi.spyOn(GameEntityManager.prototype, 'deleteParty');
        queueMoveSpy = vi.spyOn(QueueMoveAction.prototype, 'performQueueMove');
        movePlayersSpy = vi.spyOn(GameMovementHandler.prototype, 'movePlayers');
        moveSpy = vi.spyOn(MoveAction.prototype, 'performMove');
        const doSendProgressIndicatorMock = vi.spyOn(GameMovementHandler.prototype as any, 'doSendProgressIndicator');
        doSendProgressIndicatorMock.mockImplementation(() => false);
        await sendMessages();
        clearMessages();
        vi.useFakeTimers();
        asuka.setPos(hall5.pos);
        nero.setPos(mainEntrance.pos);
    });

    afterEach(async () => {
        const action = new StopAction(testGame, undefined, astrid, astrid.location, false);
        await action.performStop(false, undefined, true, new Set([astrid, asuka, nero]));
        for (const player of [astrid, asuka, nero]) {
            player.location.removePlayer(player);
            lobby.addPlayer(player);
            player.restoreStamina();
        }
        await sendMessages();
        clearMessages();
        vi.restoreAllMocks();
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
        astrid.cure(bundledUp);
        asuka.cure(bundledUp);
        nero.cure(bundledUp);
    });

    test('Setup is correct', () => {
        expect(astrid.speed).toBe(10);
        expect(asuka.speed).toBe(5);
        expect(nero.speed).toBe(1);
        expect(astrid.stamina).toBe(6);
        expect(asuka.stamina).toBe(3);
        expect(nero.stamina).toBe(1);
        expect(astrid.location.id).toBe("lobby");
        expect(asuka.location.id).toBe("lobby");
        expect(nero.location.id).toBe("lobby");
        expect(astrid.pos).toStrictEqual({ x: 2500, y: 100, z: 3080 });
        expect(asuka.pos).toStrictEqual({ x: 2763, y: 100, z: 3138 });
        expect(nero.pos).toStrictEqual({ x: 2500, y: 100, z: 3175 });
    });

    describe('one player starts moving with no party', () => {
        test('player moves to the destination room (walking)', async () => {
            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, hall5);
            expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
            const calculatedTime = 3852.926;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(calculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).not.toHaveBeenCalled();
            expect(queueMoveSpy).not.toHaveBeenCalled();
            expect(astrid.remainingTime).toBeCloseTo(calculatedTime, 3);
            expect(astrid.isMoving).toBe(true);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).not.toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(10);

            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK starts walking toward HALL 5 carrying an APPLE and an unpeeled ORANGE.`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You start walking toward HALL 5 carrying an APPLE and an unpeeled ORANGE.`);

            /**
             * Fast forward halfway through the move to ensure that certain values have been updated.
             * We don't fast forward by exactly half of the full time because time only elapses in increments of Game.ticks,
             * which is 100ms. So, we fast forward by 1900ms, which is the closest we can get to half of the full time (which is 1926.463ms).
             * The timeRatio at this point should be about 0.493.
             */
            const elapsedTime = 1900;
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(astrid.remainingTime).toBeCloseTo(1952.926, 3);
            expect(elapsedTime / calculatedTime).toBeCloseTo(0.493, 3);
            expect(astrid.pos).toStrictEqual({ x: 2630, y: 100, z: 3109 });
            expect(astrid.stamina).toBeCloseTo(5.947, 3);
            expect(moveSpy).not.toHaveBeenCalled();

            /**
             * Fast forward to the end of the move.
             */
            await vi.advanceTimersByTimeAsync(2000);
            expect(astrid.remainingTime).toBeCloseTo(0, 3);
            expect(astrid.isMoving).toBe(false);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(0);
            expect(astrid.pos).toStrictEqual(hall5.pos);
            expect(astrid.stamina).toBeCloseTo(5.891, 3);
            expect(narrateReachedHalfStaminaSpy).not.toHaveBeenCalled();
            expect(astrid.hasStatus("weary")).toBe(false);
            expect(moveSpy).toBeInvokedWith(false, lobby, hall5.dest, hall5, hall5.getLinkedExit(), false, new Set([astrid]));

            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lobbyFirstNarrationMessage.content).toBe(`An individual wearing a MASK exits into HALL 5 carrying an APPLE and an unpeeled ORANGE.`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You exit into HALL 5 carrying an APPLE and an unpeeled ORANGE.`);
            expect(hall5NarrationMessage.content).toBe(`An individual wearing a MASK enters from the LOBBY carrying an APPLE and an unpeeled ORANGE.`);
        });

        test('player moves to the destination room (walking) (with next move in queue)', async () => {
            astrid.moveQueue = ["HALL 5", "LOVE SUITE"];
            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, hall5);
            expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
            const calculatedTime = 3852.926;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(calculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).not.toHaveBeenCalled();
            expect(queueMoveSpy).not.toHaveBeenCalled();
            expect(astrid.remainingTime).toBeCloseTo(calculatedTime, 3);
            expect(astrid.isMoving).toBe(true);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).not.toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(10);

            /**
             * Fast forward halfway through the move to ensure that certain values have been updated.
             * We don't fast forward by exactly half of the full time because time only elapses in increments of Game.ticks,
             * which is 100ms. So, we fast forward by 1900ms, which is the closest we can get to half of the full time (which is 1926.463ms).
             * The timeRatio at this point should be about 0.493.
             */
            const elapsedTime = 1900;
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(astrid.remainingTime).toBeCloseTo(1952.926, 3);
            expect(elapsedTime / calculatedTime).toBeCloseTo(0.493, 3);
            expect(astrid.pos).toStrictEqual({ x: 2630, y: 100, z: 3109 });
            expect(astrid.stamina).toBeCloseTo(5.947, 3);
            expect(moveSpy).not.toHaveBeenCalled();

            /**
             * Fast forward to the end of the move.
             */
            await vi.advanceTimersByTimeAsync(2000);
            expect(astrid.remainingTime).not.toBeCloseTo(0, 3);
            expect(astrid.isMoving).toBe(true);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).not.toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(10);
            expect(moveSpy).toBeInvokedWith(false, lobby, hall5.dest, hall5, hall5.getLinkedExit(), false, new Set([astrid]));
            expect(astrid.moveQueue).not.toHaveLength(0);
        });

        test('moving player runs out of stamina', async () => {
            nero.location.removePlayer(nero);
            meatballRoom.addPlayer(nero);
            nero.setPos(meatballBeginning.pos);
            nero.moveQueue = ["END", "NEXT ROOM"];
            const startMoveAction = new StartMoveAction(testGame, undefined, nero, nero.location, false);
            await startMoveAction.performStartMove(true, meatballEnd);
            expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
            const calculatedTime = 424339.472;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(calculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).not.toHaveBeenCalled();
            expect(queueMoveSpy).not.toHaveBeenCalled();
            expect(nero.remainingTime).toBeCloseTo(calculatedTime, 3);
            expect(nero.isMoving).toBe(true);
            expect(nero.isRunning).toBe(true);
            expect(nero.moveTimer).not.toBeNull();
            expect(nero.currentMovingSpeed).toEqual(1);

            await sendMessages();
            expect(meatballRoom.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(0);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(meatballNarrationMessage.content).toBe(`> -# Nero starts running toward the END.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# You start running toward the END.`);

            /**
             * Fast forward to when we might expect Nero to have depleted half of his stamina.
             * For the sake of simplicity, we'll go with 17 seconds.
             */
            const elapsedTime = 17000;
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(nero.remainingTime).toBeCloseTo(407339.472, 3);
            expect(nero.stamina).toBeCloseTo(0.490, 3);
            expect(narrateReachedHalfStaminaSpy).toHaveBeenCalledOnce();

            clearMessages();
            await sendMessages();
            expect(meatballRoom.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(0);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(meatballNarrationMessage.content).toBe(`> -# Nero's breathing is getting heavy. It seems like he's starting to get tired.`);
            expect(neroFirstNotificationMessage.content).toBe(`Your breathing is getting heavy. You might want to stop moving and rest soon.`);

            /**
             * Fast forward to when we expect Nero to have run out of stamina.
             */
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(nero.remainingTime).toBeCloseTo(0, 3);
            expect(nero.isMoving).toBe(false);
            expect(nero.isRunning).toBe(false);
            expect(nero.moveTimer).toBeNull();
            expect(nero.currentMovingSpeed).toEqual(0);
            expect(nero.pos).toStrictEqual({ x: 425, y: 0, z: 2641 });
            expect(nero.stamina).toBeCloseTo(0, 3);
            expect(nero.hasStatus("weary")).toBe(true);
            nero.cure(testGame.entityFinder.getStatusEffect("weary"));
            expect(nero.moveQueue).toHaveLength(0);
            clearMessages();
            await sendMessages();
            expect(meatballRoom.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(0);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(meatballNarrationMessage.content).toBe(`> -# Nero stops moving. He seems weary.`);
            expect(neroFirstNotificationMessage.content).toBe(`After to moving to this room, you have become **weary**. You need to take a short break before moving to another room.`);
        });

        test('no stamina decrease behavior attribute prevents stamina loss', async () => {
            const noStaminaDecrease = testGame.entityFinder.getStatusEffect("meatball stamina");
            astrid.inflict(noStaminaDecrease);
            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, hall5);
            expect(astrid.isMoving).toBe(true);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).not.toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(10);
            expect(astrid.hasBehaviorAttribute("no stamina decrease")).toBe(true);

            /**
             * Fast forward halfway through the move.
             */
            const elapsedTime = 1900;
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(astrid.stamina).toBeCloseTo(astrid.maxStamina, 3);
            expect(moveSpy).not.toHaveBeenCalled();

            /**
             * Fast forward to the end of the move.
             */
            await vi.advanceTimersByTimeAsync(2000);
            expect(astrid.remainingTime).toBeCloseTo(0, 3);
            expect(astrid.isMoving).toBe(false);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(0);
            expect(astrid.pos).toStrictEqual(hall5.pos);
            expect(astrid.stamina).toBeCloseTo(astrid.maxStamina, 3);
            expect(narrateReachedHalfStaminaSpy).not.toHaveBeenCalled();
            expect(astrid.hasStatus("weary")).toBe(false);
            astrid.cure(noStaminaDecrease);
        });

        test('exit is locked', async () => {
            hall5.lock();
            astrid.moveQueue = ["HALL 5", "LOVE SUITE"];
            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, hall5);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            await sendMessages();

            await vi.advanceTimersByTimeAsync(3900);
            expect(astrid.remainingTime).toBeCloseTo(0, 3);
            expect(astrid.isMoving).toBe(false);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(0);
            expect(astrid.pos).toStrictEqual(hall5.pos);
            expect(moveSpy).not.toHaveBeenCalled();
            expect(astrid.moveQueue).toHaveLength(0);

            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK tries to open HALL 5, but it seems to be locked.`);
            expect(astridFirstNotificationMessage.content).toBe(`You try to open HALL 5, but it seems to be locked.`);
            hall5.unlock();
        });

        test('exit has restricted exit puzzle that the player can pass', async () => {
            astrid.location.removePlayer(astrid);
            cave9.addPlayer(astrid);
            const cave9Puzzle = testGame.entityFinder.getPuzzle("DOOR", "cave-9", "restricted exit");
            cave9Puzzle.setAccessible();
            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, cave9Door);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            await sendMessages();

            await vi.advanceTimersByTimeAsync(2900);
            expect(astrid.remainingTime).toBeCloseTo(0, 3);
            expect(astrid.isMoving).toBe(false);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(0);
            expect(astrid.pos).toStrictEqual(cave9Door.pos);
            expect(moveSpy).toBeInvokedWith(false, cave9, cave9Door.dest, cave9Door, cave9Door.getLinkedExit(), false, new Set([astrid]));
            expect(astrid.moveQueue).toHaveLength(0);

            clearMessages();
            await sendMessages();
            expect(cave9.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(cave9NarrationMessage.content).toBe(`An individual wearing a MASK exits into the DOOR carrying an APPLE and an unpeeled ORANGE.`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You exit into the DOOR carrying an APPLE and an unpeeled ORANGE.`);
        });

        test('exit has restricted exit puzzle that the player cannot pass', async () => {
            nero.location.removePlayer(nero);
            cave9.addPlayer(nero);
            const cave9Puzzle = testGame.entityFinder.getPuzzle("DOOR", "cave-9", "restricted exit");
            cave9Puzzle.setAccessible();
            const startMoveAction = new StartMoveAction(testGame, undefined, nero, nero.location, false);
            await startMoveAction.performStartMove(false, cave9Door);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            await sendMessages();

            await vi.advanceTimersByTimeAsync(8600);
            expect(nero.remainingTime).toBeCloseTo(0, 3);
            expect(nero.isMoving).toBe(false);
            expect(nero.isRunning).toBe(false);
            expect(nero.moveTimer).toBeNull();
            expect(nero.currentMovingSpeed).toEqual(0);
            expect(nero.pos).toStrictEqual(cave9Door.pos);
            expect(moveSpy).not.toHaveBeenCalled();
            expect(nero.moveQueue).toHaveLength(0);

            clearMessages();
            await sendMessages();
            expect(cave9.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(0);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(cave9NarrationMessage.content).toBe(`> -# Nero tries to open the DOOR, but it seems to be locked.`);
            expect(neroFirstNotificationMessage.content).toBe(`You try to open the DOOR, but it seems to be locked.`);
        });
    });

    describe('one player starts moving with followers', () => {
        test('moving player runs out of stamina', async () => {
            asuka.location.removePlayer(asuka);
            meatballRoom.addPlayer(asuka);
            nero.location.removePlayer(nero);
            meatballRoom.addPlayer(nero);
            asuka.setPos(meatballBeginning.pos);
            nero.setPos(meatballBeginning.pos);
            const followAction = new FollowAction(testGame, undefined, asuka, asuka.location, false);
            await followAction.performFollow(nero);
            await sendMessages();
            clearMessages();

            const startMoveAction = new StartMoveAction(testGame, undefined, nero, nero.location, false);
            await startMoveAction.performStartMove(true, meatballEnd);
            expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(2);
            const calculatedTime = 424339.472;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(calculatedTime, 3);
            expect(calculateMoveTimeSpy.mock.results[1].value).toBeCloseTo(calculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).toHaveBeenCalledOnce();
            expect(nero.remainingTime).toBeCloseTo(calculatedTime, 3);
            expect(nero.isMoving).toBe(true);
            expect(nero.isRunning).toBe(true);
            expect(nero.moveTimer).not.toBeNull();
            expect(nero.currentMovingSpeed).toEqual(1);

            await vi.advanceTimersByTimeAsync(100);
            expect(queueMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledTimes(2);
            expect(asuka.remainingTime).toBeCloseTo(calculatedTime, 3);
            expect(asuka.isMoving).toBe(true);
            expect(asuka.isRunning).toBe(true);
            expect(asuka.moveTimer).not.toBeNull();
            expect(asuka.currentMovingSpeed).toEqual(1);

            await sendMessages();
            expect(meatballRoom.channel.messages.cache).toHaveSize(2);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(0);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(meatballNarrationMessage.content).toBe(`> -# Nero starts running toward the END.`);
            expect(meatballRoom.channel.messages.cache.last().content).toBe(`> -# Following Nero, Asuka starts running toward the END carrying a POT.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# You start running toward the END.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# Following Nero, you start running toward the END carrying a POT.`);

            /**
             * Fast forward to when we might expect Nero to have depleted half of his stamina.
             * For the sake of simplicity, we'll go with 16.9 seconds (making up for the advance by 100ms earlier).
             */
            const elapsedTime = 16900;
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(nero.remainingTime).toBeCloseTo(407339.472, 3);
            expect(nero.stamina).toBeCloseTo(0.490, 3);
            expect(asuka.stamina).toBeGreaterThan(nero.stamina);
            expect(narrateReachedHalfStaminaSpy).toHaveBeenCalledOnce();

            clearMessages();
            await sendMessages();
            expect(meatballRoom.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(0);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(meatballNarrationMessage.content).toBe(`> -# Nero's breathing is getting heavy. It seems like he's starting to get tired.`);
            expect(neroFirstNotificationMessage.content).toBe(`Your breathing is getting heavy. You might want to stop moving and rest soon.`);

            /**
             * Fast forward to when we expect Nero to have run out of stamina.
             */
            await vi.advanceTimersByTimeAsync(elapsedTime + 100);
            expect(nero.remainingTime).toBeCloseTo(0, 3);
            expect(nero.isMoving).toBe(false);
            expect(nero.isRunning).toBe(false);
            expect(nero.moveTimer).toBeNull();
            expect(nero.currentMovingSpeed).toEqual(0);
            expect(nero.pos).toStrictEqual({ x: 425, y: 0, z: 2641 });
            expect(nero.stamina).toBeCloseTo(0, 3);
            expect(nero.hasStatus("weary")).toBe(true);
            nero.cure(testGame.entityFinder.getStatusEffect("weary"));
            expect(nero.moveQueue).toHaveLength(0);
            expect(asuka.remainingTime).toBeCloseTo(0, 3);
            expect(asuka.isMoving).toBe(false);
            expect(asuka.isRunning).toBe(false);
            expect(asuka.moveTimer).toBeNull();
            expect(asuka.currentMovingSpeed).toEqual(0);
            // We can expect Asuka to be a little behind.
            expect(asuka.pos).toStrictEqual({ x: 425, y: 0, z: 2646 });
            expect(asuka.stamina).not.toBeCloseTo(0, 3);
            expect(asuka.hasStatus("weary")).toBe(false);

            clearMessages();
            await sendMessages();
            expect(meatballRoom.channel.messages.cache).toHaveSize(2);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(0);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(meatballNarrationMessage.content).toBe(`> -# Nero stops moving. He seems weary.`);
            expect(meatballRoom.channel.messages.cache.last().content).toBe(`> -# Asuka stops moving.`);
            expect(neroFirstNotificationMessage.content).toBe(`After to moving to this room, you have become **weary**. You need to take a short break before moving to another room.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# You stop moving.`);
        });

        test('following player runs out of stamina', async () => {
            asuka.location.removePlayer(asuka);
            meatballRoom.addPlayer(asuka);
            nero.location.removePlayer(nero);
            meatballRoom.addPlayer(nero);
            asuka.setPos(meatballBeginning.pos);
            nero.setPos(meatballBeginning.pos);
            const followAction = new FollowAction(testGame, undefined, nero, nero.location, false);
            await followAction.performFollow(asuka);
            await sendMessages();
            clearMessages();

            const startMoveAction = new StartMoveAction(testGame, undefined, asuka, asuka.location, false);
            await startMoveAction.performStartMove(true, meatballEnd);
            expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(2);
            const asukaCalculatedTime = 151645.207;
            const neroCalculatedTime = 424339.472;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(asukaCalculatedTime, 3);
            expect(calculateMoveTimeSpy.mock.results[1].value).toBeCloseTo(neroCalculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).toHaveBeenCalledOnce();
            expect(asuka.remainingTime).toBeCloseTo(asukaCalculatedTime, 3);
            expect(asuka.isMoving).toBe(true);
            expect(asuka.isRunning).toBe(true);
            expect(asuka.moveTimer).not.toBeNull();
            expect(asuka.currentMovingSpeed).toEqual(5);

            await vi.advanceTimersByTimeAsync(100);
            expect(queueMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledTimes(2);
            expect(nero.remainingTime).toBeCloseTo(neroCalculatedTime, 3);
            expect(nero.isMoving).toBe(true);
            expect(nero.isRunning).toBe(true);
            expect(nero.moveTimer).not.toBeNull();
            expect(nero.currentMovingSpeed).toEqual(1);

            await sendMessages();
            expect(meatballRoom.channel.messages.cache).toHaveSize(2);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(0);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(meatballNarrationMessage.content).toBe(`> -# Asuka starts running toward the END carrying a POT.`);
            expect(meatballRoom.channel.messages.cache.last().content).toBe(`> -# Following Asuka, Nero starts running toward the END.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# You start running toward the END carrying a POT.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# Following Asuka, you start running toward the END.`);

            /**
             * Fast forward to when we might expect Nero to have depleted half of his stamina.
             * For the sake of simplicity, we'll go with 17 seconds.
             */
            const elapsedTime = 17000;
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(nero.remainingTime).toBeCloseTo(407339.472, 3);
            expect(nero.stamina).toBeCloseTo(0.490, 3);
            expect(asuka.stamina).toBeGreaterThan(nero.stamina);
            expect(narrateReachedHalfStaminaSpy).toHaveBeenCalledOnce();

            clearMessages();
            await sendMessages();
            expect(meatballRoom.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(0);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(meatballNarrationMessage.content).toBe(`> -# Nero's breathing is getting heavy. It seems like he's starting to get tired.`);
            expect(neroFirstNotificationMessage.content).toBe(`Your breathing is getting heavy. You might want to stop moving and rest soon.`);

            /**
             * Fast forward to when we expect Nero to have run out of stamina.
             */
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(nero.remainingTime).toBeCloseTo(0, 3);
            expect(nero.isMoving).toBe(false);
            expect(nero.isRunning).toBe(false);
            expect(nero.moveTimer).toBeNull();
            expect(nero.currentMovingSpeed).toEqual(0);
            expect(nero.pos).toStrictEqual({ x: 425, y: 0, z: 2641 });
            expect(nero.stamina).toBeCloseTo(0, 3);
            expect(nero.hasStatus("weary")).toBe(true);
            nero.cure(testGame.entityFinder.getStatusEffect("weary"));
            expect(nero.moveQueue).toHaveLength(0);
            expect(asuka.remainingTime).toBeGreaterThan(0);
            expect(asuka.isMoving).toBe(true);
            expect(asuka.isRunning).toBe(true);
            expect(asuka.moveTimer).not.toBeNull();
            expect(asuka.currentMovingSpeed).toEqual(5);
            // Asuka will have made it further than Nero, due to moving at a higher speed.
            expect(asuka.pos).toStrictEqual({ x: 425, y: 0, z: 1091 });
            expect(asuka.stamina).not.toBeCloseTo(0, 3);
            expect(asuka.hasStatus("weary")).toBe(false);

            clearMessages();
            await sendMessages();
            expect(meatballRoom.channel.messages.cache).toHaveSize(2);
            expect(meatballRoom.channel.messages.cache).toHaveSize(2);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(0);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(meatballNarrationMessage.content).toBe(`> -# Asuka's breathing is getting heavy. It seems like she's starting to get tired.`);
            expect(meatballRoom.channel.messages.cache.last().content).toBe(`> -# Nero stops moving. He seems weary.`);
            expect(asukaFirstNotificationMessage.content).toBe(`Your breathing is getting heavy. You might want to stop moving and rest soon.`);
            expect(neroFirstNotificationMessage.content).toBe(`After to moving to this room, you have become **weary**. You need to take a short break before moving to another room.`);
        });

        test('follower is closer to exit than moving player', async () => {
            const followAction = new FollowAction(testGame, undefined, asuka, asuka.location, false);
            await followAction.performFollow(astrid);
            await sendMessages();
            clearMessages();

            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, hall5);
            expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(2);
            const asukaCalculatedTime = 0;
            const astridCalculatedTime = 3852.926;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(astridCalculatedTime, 3);
            expect(calculateMoveTimeSpy.mock.results[1].value).toBeCloseTo(asukaCalculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).toHaveBeenCalledOnce();
            expect(astrid.remainingTime).toBeCloseTo(astridCalculatedTime, 3);
            expect(astrid.isMoving).toBe(true);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).not.toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(10);
            expect(asuka.remainingTime).toBeCloseTo(astridCalculatedTime + 100, 3);
            expect(asuka.isMoving).toBe(false);
            expect(asuka.isRunning).toBe(false);
            expect(asuka.moveTimer).not.toBeNull();
            expect(asuka.currentMovingSpeed).toEqual(0);

            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK starts walking toward HALL 5 carrying an APPLE and an unpeeled ORANGE.`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You start walking toward HALL 5 carrying an APPLE and an unpeeled ORANGE.`);

            /**
             * Fast forward to the end of Astrid's move.
             */
            await vi.advanceTimersByTimeAsync(3900);
            expect(astrid.remainingTime).toBeCloseTo(0, 3);
            expect(astrid.isMoving).toBe(false);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(0);
            expect(astrid.pos).toStrictEqual(hall5.pos);
            expect(moveSpy).toBeInvokedWith(false, lobby, hall5.dest, hall5, hall5.getLinkedExit(), false, new Set([astrid]));
            moveSpy.mockClear();
            // Asuka still shouldn't have started moving yet.
            expect(asuka.location).toStrictEqual(lobby);
            expect(asuka.isMoving).toBe(false);
            expect(asuka.remainingTime).toBeCloseTo(52.926, 3);

            /**
             * Fast forward to the end of Asuka's delay timer.
             */
            await vi.advanceTimersByTimeAsync(100);
            expect(queueMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledTimes(2);
            expect(asuka.remainingTime).toBeCloseTo(0, 3);
            expect(asuka.isMoving).toBe(true);
            expect(asuka.isRunning).toBe(false);
            expect(asuka.moveTimer).not.toBeNull();
            expect(asuka.currentMovingSpeed).toEqual(5);
            expect(moveSpy).not.toHaveBeenCalled();
            /**
             * Fast forward to the end of Asuka's move timer.
             */
            await vi.advanceTimersByTimeAsync(100);
            expect(asuka.remainingTime).toBeCloseTo(0, 3);
            expect(asuka.isMoving).toBe(false);
            expect(asuka.isRunning).toBe(false);
            expect(asuka.moveTimer).toBeNull();
            expect(asuka.currentMovingSpeed).toEqual(0);
            expect(asuka.pos).toStrictEqual(hall5.pos);
            expect(moveSpy).toBeInvokedWith(false, lobby, hall5.dest, hall5, hall5.getLinkedExit(), false, new Set([asuka]));
            expect(asuka.location).toStrictEqual(astrid.location);

            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(2);
            // Astrid is concealed, so she'll receive the exit notification, the room description, and a narration about Asuka entering from the lobby.
            expect(astrid.notificationChannel.messages.cache).toHaveSize(3);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lobbyFirstNarrationMessage.content).toBe(`An individual wearing a MASK exits into HALL 5 carrying an APPLE and an unpeeled ORANGE.`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You exit into HALL 5 carrying an APPLE and an unpeeled ORANGE.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# You exit into HALL 5 carrying a POT.`);
        });

        test('exit locks before single follower reaches it', async () => {
            const followAction = new FollowAction(testGame, undefined, nero, nero.location, false);
            await followAction.performFollow(astrid);
            await sendMessages();
            clearMessages();

            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, hall5);
            expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(2);
            const astridCalculatedTime = 3852.926;
            const neroCalculatedTime = 11310.121;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(astridCalculatedTime, 3);
            expect(calculateMoveTimeSpy.mock.results[1].value).toBeCloseTo(neroCalculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).toHaveBeenCalledOnce();
            expect(astrid.remainingTime).toBeCloseTo(astridCalculatedTime, 3);
            expect(astrid.isMoving).toBe(true);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).not.toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(10);

            await vi.advanceTimersByTimeAsync(100);
            expect(queueMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledTimes(2);
            expect(nero.remainingTime).toBeCloseTo(neroCalculatedTime, 3);
            expect(nero.isMoving).toBe(true);
            expect(nero.isRunning).toBe(false);
            expect(nero.moveTimer).not.toBeNull();
            expect(nero.currentMovingSpeed).toEqual(1);

            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(2);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK starts walking toward HALL 5 carrying an APPLE and an unpeeled ORANGE.`);
            expect(lobbyLastNarrationMessage.content).toBe(`> -# Following an individual wearing a MASK, Nero starts walking toward HALL 5.`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You start walking toward HALL 5 carrying an APPLE and an unpeeled ORANGE.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward HALL 5.`);

            /**
             * Fast forward to the end of Astrid's move.
             */
            await vi.advanceTimersByTimeAsync(3800);
            expect(astrid.remainingTime).toBeCloseTo(0, 3);
            expect(astrid.isMoving).toBe(false);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(0);
            expect(astrid.pos).toStrictEqual(hall5.pos);
            expect(astrid.stamina).toBeCloseTo(5.891, 3);
            expect(narrateReachedHalfStaminaSpy).not.toHaveBeenCalled();
            expect(astrid.hasStatus("weary")).toBe(false);
            expect(moveSpy).toBeInvokedWith(false, lobby, hall5.dest, hall5, hall5.getLinkedExit(), false, new Set([astrid]));

            moveSpy.mockClear();
            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(hall5.dest.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lobbyFirstNarrationMessage.content).toBe(`An individual wearing a MASK exits into HALL 5 carrying an APPLE and an unpeeled ORANGE.`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You exit into HALL 5 carrying an APPLE and an unpeeled ORANGE.`);
            expect(hall5NarrationMessage.content).toBe(`An individual wearing a MASK enters from the LOBBY carrying an APPLE and an unpeeled ORANGE.`);

            hall5.lock();

            /**
             * Fast forward to the end of Nero's move.
             */
            await vi.advanceTimersByTimeAsync(7600);
            expect(nero.remainingTime).toBeCloseTo(0, 3);
            expect(nero.isMoving).toBe(false);
            expect(nero.isRunning).toBe(false);
            expect(nero.moveTimer).toBeNull();
            expect(nero.currentMovingSpeed).toEqual(0);
            expect(nero.pos).toStrictEqual(hall5.pos);
            expect(moveSpy).not.toHaveBeenCalled();
            expect(nero.moveQueue).toHaveLength(0);
            expect(nero.isFollowing(astrid)).toBe(false);

            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(hall5.dest.channel.messages.cache).toHaveSize(0);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(astridFirstNotificationMessage.content).toBe(`Nero stops following you.`);
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# Nero tries to open HALL 5, but it seems to be locked.`);
            expect(neroFirstNotificationMessage.content).toBe(`You try to open HALL 5, but it seems to be locked.`);
            hall5.unlock();
        });

        test('exit locks before both followers reach it', async () => {
            const followAction1 = new FollowAction(testGame, undefined, nero, nero.location, false);
            await followAction1.performFollow(astrid);
            const followAction2 = new FollowAction(testGame, undefined, asuka, asuka.location, false);
            await followAction2.performFollow(astrid);

            await sendMessages();
            clearMessages();

            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, hall3);
            expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(3);
            const astridCalculatedTime = 3838.957;
            const neroCalculatedTime = 11267.953;
            const asukaCalculatedTime = 15016.089;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(astridCalculatedTime, 3);
            expect(calculateMoveTimeSpy.mock.results[1].value).toBeCloseTo(asukaCalculatedTime, 3);
            expect(calculateMoveTimeSpy.mock.results[2].value).toBeCloseTo(neroCalculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).toHaveBeenCalledTimes(2);
            expect(astrid.remainingTime).toBeCloseTo(astridCalculatedTime, 3);
            expect(astrid.isMoving).toBe(true);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).not.toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(10);

            await vi.advanceTimersByTimeAsync(100);
            expect(queueMoveSpy).toHaveBeenCalledTimes(2);
            expect(movePlayersSpy).toHaveBeenCalledTimes(3);
            expect(nero.remainingTime).toBeCloseTo(neroCalculatedTime, 3);
            expect(nero.isMoving).toBe(true);
            expect(nero.isRunning).toBe(false);
            expect(nero.moveTimer).not.toBeNull();
            expect(nero.currentMovingSpeed).toEqual(1);
            expect(asuka.remainingTime).toBeCloseTo(asukaCalculatedTime, 3);
            expect(asuka.isMoving).toBe(true);
            expect(asuka.isRunning).toBe(false);
            expect(asuka.moveTimer).not.toBeNull();
            expect(asuka.currentMovingSpeed).toEqual(5);

            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(3);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(3);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK starts walking toward HALL 3 carrying an APPLE and an unpeeled ORANGE.`);
            expect(lobby.channel.messages.cache.at(1).content).toBe(`> -# Following an individual wearing a MASK, Asuka starts walking toward HALL 3 carrying a POT.`);
            expect(lobbyLastNarrationMessage.content).toBe(`> -# Following an individual wearing a MASK, Nero starts walking toward HALL 3.`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You start walking toward HALL 3 carrying an APPLE and an unpeeled ORANGE.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward HALL 3.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward HALL 3 carrying a POT.`);

            /**
             * Fast forward to the end of Astrid's move.
             */
            await vi.advanceTimersByTimeAsync(3900);
            expect(astrid.remainingTime).toBeCloseTo(0, 3);
            expect(astrid.isMoving).toBe(false);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(0);
            expect(astrid.pos).toStrictEqual(hall3.pos);
            expect(astrid.stamina).toBeCloseTo(5.891, 3);
            expect(narrateReachedHalfStaminaSpy).not.toHaveBeenCalled();
            expect(astrid.hasStatus("weary")).toBe(false);
            expect(moveSpy).toBeInvokedWith(false, lobby, hall3.dest, hall3, hall3.getLinkedExit(), false, new Set([astrid]));

            moveSpy.mockClear();
            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(hall3.dest.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lobbyFirstNarrationMessage.content).toBe(`An individual wearing a MASK exits into HALL 3 carrying an APPLE and an unpeeled ORANGE.`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You exit into HALL 3 carrying an APPLE and an unpeeled ORANGE.`);
            expect(hall3NarrationMessage.content).toBe(`An individual wearing a MASK enters from the LOBBY carrying an APPLE and an unpeeled ORANGE.`);

            hall3.lock();

            /**
             * Fast forward to the end of the other moves.
             */
            await vi.advanceTimersByTimeAsync(15100);
            expect(nero.remainingTime).toBeCloseTo(0, 3);
            expect(nero.isMoving).toBe(false);
            expect(nero.isRunning).toBe(false);
            expect(nero.moveTimer).toBeNull();
            expect(nero.currentMovingSpeed).toEqual(0);
            expect(nero.pos).toStrictEqual(hall3.pos);
            expect(nero.moveQueue).toHaveLength(0);
            expect(nero.isFollowing(astrid)).toBe(false);
            expect(asuka.remainingTime).toBeCloseTo(0, 3);
            expect(asuka.isMoving).toBe(false);
            expect(asuka.isRunning).toBe(false);
            expect(asuka.moveTimer).toBeNull();
            expect(asuka.currentMovingSpeed).toEqual(0);
            expect(asuka.pos).toStrictEqual(hall3.pos);
            expect(asuka.moveQueue).toHaveLength(0);
            expect(asuka.isFollowing(astrid)).toBe(false);
            expect(moveSpy).not.toHaveBeenCalled();

            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(2);
            expect(hall3.dest.channel.messages.cache).toHaveSize(0);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(astridFirstNotificationMessage.content).toBe(`Nero stops following you.`);
            expect(astridLastNotificationMessage.content).toBe(`Asuka stops following you.`);
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# Nero tries to open HALL 3, but it seems to be locked.`);
            expect(lobbyLastNarrationMessage.content).toBe(`> -# Asuka tries to open HALL 3, but it seems to be locked.`);
            expect(neroFirstNotificationMessage.content).toBe(`You try to open HALL 3, but it seems to be locked.`);
            expect(asukaFirstNotificationMessage.content).toBe(`You try to open HALL 3, but it seems to be locked.`);
            hall3.unlock();
        });

        test('exit has restricted exit puzzle that only the follower can pass (but they stop when the moving player stops)', async () => {
            nero.location.removePlayer(nero);
            cave9.addPlayer(nero);
            astrid.location.removePlayer(astrid);
            cave9.addPlayer(astrid);
            const cave9Puzzle = testGame.entityFinder.getPuzzle("DOOR", "cave-9", "restricted exit");
            cave9Puzzle.setAccessible();
            const followAction = new FollowAction(testGame, undefined, astrid, astrid.location, false);
            await followAction.performFollow(nero);
            await sendMessages();
            clearMessages();

            const startMoveAction = new StartMoveAction(testGame, undefined, nero, nero.location, false);
            await startMoveAction.performStartMove(false, cave9Door);
            expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(2);
            const calculatedTime = 8523.792;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(calculatedTime, 3);
            expect(calculateMoveTimeSpy.mock.results[1].value).toBeCloseTo(calculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).toHaveBeenCalledOnce();
            expect(nero.remainingTime).toBeCloseTo(calculatedTime, 3);
            expect(nero.isMoving).toBe(true);
            expect(nero.isRunning).toBe(false);
            expect(nero.moveTimer).not.toBeNull();
            expect(nero.currentMovingSpeed).toEqual(1);

            await vi.advanceTimersByTimeAsync(100);
            expect(queueMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledTimes(2);
            expect(astrid.remainingTime).toBeCloseTo(calculatedTime, 3);
            expect(astrid.isMoving).toBe(true);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).not.toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(1);

            await sendMessages();
            expect(cave9.channel.messages.cache).toHaveSize(2);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(cave9NarrationMessage.content).toBe(`> -# Nero starts walking toward the DOOR.`);
            expect(cave9.channel.messages.cache.last().content).toBe(`> -# Following Nero, an individual wearing a MASK starts walking toward the DOOR carrying an APPLE and an unpeeled ORANGE.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# You start walking toward the DOOR.`);
            expect(astrid.notificationChannel.messages.cache.last().content).toBe(`> -# Following Nero, you start walking toward the DOOR carrying an APPLE and an unpeeled ORANGE.`);

            /**
             * Fast forward to the end of Nero's move.
             */
            await vi.advanceTimersByTimeAsync(8600);
            expect(nero.remainingTime).toBeCloseTo(0, 3);
            expect(nero.isMoving).toBe(false);
            expect(nero.isRunning).toBe(false);
            expect(nero.moveTimer).toBeNull();
            expect(nero.currentMovingSpeed).toEqual(0);
            expect(nero.pos).toStrictEqual(cave9Door.pos);
            expect(astrid.remainingTime).toBeCloseTo(0, 3);
            expect(astrid.isMoving).toBe(false);
            expect(astrid.isRunning).toBe(false);
            expect(astrid.moveTimer).toBeNull();
            expect(astrid.currentMovingSpeed).toEqual(0);
            expect(astrid.pos).toStrictEqual({ x: 4812, y: 200, z: 453 });
            expect(astrid.isFollowing(nero)).toBe(true);
            expect(moveSpy).not.toHaveBeenCalled();

            clearMessages();
            await sendMessages();
            expect(cave9.channel.messages.cache).toHaveSize(2);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(cave9NarrationMessage.content).toBe(`> -# Nero tries to open the DOOR, but it seems to be locked.`);
            expect(cave9.channel.messages.cache.last().content).toBe(`> -# An individual wearing a MASK stops moving.`);
            expect(neroFirstNotificationMessage.content).toBe(`You try to open the DOOR, but it seems to be locked.`);
            expect(astrid.notificationChannel.messages.cache.last().content).toBe(`> -# You stop moving.`);
            cave9Puzzle.setInaccessible();
        });
    });

    describe('party leader starts moving', () => {
        let generateRoomOccupantsNotificationSpy: Mock<typeof GameNotificationGenerator.prototype.generateRoomOccupantsNotification>;

        beforeEach(async () => {
            const followAction1 = new FollowAction(testGame, undefined, asuka, asuka.location, false);
            await followAction1.performFollow(astrid);
            const followAction2 = new FollowAction(testGame, undefined, nero, nero.location, false);
            await followAction2.performFollow(astrid);
            const leadAction = new LeadAction(testGame, undefined, astrid, astrid.location, false);
            await leadAction.performLead([asuka, nero]);
            await vi.advanceTimersByTimeAsync(7800);
            await sendMessages();
            clearMessages();
            generateRoomOccupantsNotificationSpy = vi.spyOn(GameNotificationGenerator.prototype, 'generateRoomOccupantsNotification');
            vi.clearAllMocks();
        });

        afterEach(async () => {
            const disbandAction = new DisbandPartyAction(testGame, undefined, astrid, astrid.location, false);
            await disbandAction.performDisbandParty(true);
        });

        test('party member positions are always the same with 1 follower', async () => {
            const dismissAction = new DismissAction(testGame, undefined, astrid, astrid.location, false);
            await dismissAction.performDismissAction([asuka], true);
            await sendMessages();
            clearMessages();

            const party = astrid.party;
            for (const member of party.members.values())
                expect(member.positionMatches(party.leader));

            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, mainEntrance);
            expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
            const calculatedTime = 4045.566;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(calculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).not.toHaveBeenCalled();
            expect(queueMoveSpy).not.toHaveBeenCalled();
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(calculatedTime, 3);
                expect(member.isMoving).toBe(true);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).not.toBeNull();
                expect(member.currentMovingSpeed).toEqual(1);
            }

            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            let lobbyNarration = `An individual wearing a MASK starts walking toward the MAIN ENTRANCE with Nero while carrying an APPLE and an unpeeled ORANGE.`;
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# ${lobbyNarration}`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You start walking toward the MAIN ENTRANCE with Nero while carrying an APPLE and an unpeeled ORANGE.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward the MAIN ENTRANCE.`);

            /**
             * Fast forward a quarter of the way through the move to ensure that the players are moving in sync.
             * The timeRatio at this point should be about 0.247.
             */
            let elapsedTime = 1000;
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(elapsedTime / calculatedTime).toBeCloseTo(0.247, 3);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(3045.566, 3);
                expect(member.pos).toStrictEqual({ x: 2500, y: 100, z: 3103 });
            }
            expect(moveSpy).not.toHaveBeenCalled();
            /**
             * Fast forward to the halfway mark.
             */
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(2 * elapsedTime / calculatedTime).toBeCloseTo(0.494, 3);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(2045.566, 3);
                expect(member.pos).toStrictEqual({ x: 2500, y: 100, z: 3127 });
            }
            expect(moveSpy).not.toHaveBeenCalled();
            /**
             * Fast forward to the three quarters mark.
             */
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(3 * elapsedTime / calculatedTime).toBeCloseTo(0.742, 3);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(1045.566, 3);
                expect(member.pos).toStrictEqual({ x: 2500, y: 100, z: 3150 });
            }
            expect(moveSpy).not.toHaveBeenCalled();

            /**
             * Fast forward to the end of the move.
             */
            await vi.advanceTimersByTimeAsync(1100);
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(narrateReachedHalfStaminaSpy).not.toHaveBeenCalled();
            expect(moveSpy).toHaveBeenCalledTimes(1);
            expect(moveSpy).toBeInvokedWith(false, lobby, mainEntrance.dest, mainEntrance, mainEntrance.getLinkedExit(), false, new Set([astrid, nero]));
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(0, 3);
                expect(member.isMoving).toBe(false);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).toBeNull();
                expect(member.currentMovingSpeed).toEqual(0);
                expect(member.pos).toStrictEqual(mainEntrance.pos);
                expect(member.hasStatus("weary")).toBe(false);
            }

            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(2);
            lobbyNarration = `An individual wearing a MASK and Nero exit into the MAIN ENTRANCE. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE.`;
            expect(lobbyFirstNarrationMessage.content).toBe(`${lobbyNarration}`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You exit into the MAIN ENTRANCE with Nero while carrying an APPLE and an unpeeled ORANGE.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# You exit into the MAIN ENTRANCE with an individual wearing a MASK.`);
            expect(courtyard.channel.messages.cache).toHaveSize(1);
            let courtyardNarration = `An individual wearing a MASK and Nero enter from ROZZEM HOTEL. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE.`;
            expect(courtyardNarrationMessage.content).toBe(`${courtyardNarration}`);
            expect(generateRoomOccupantsNotificationSpy).toHaveBeenCalledTimes(2);
            const astridOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[0].value;
            const neroOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[1].value;
            expect(astridOccupantsList).toBe(`You see Nero here.`);
            expect(neroOccupantsList).toBe(`You see an individual wearing a MASK here.`);
        });

        test('party member positions are always the same with 2 followers', async () => {
            const party = astrid.party;
            for (const member of party.members.values())
                expect(member.positionMatches(party.leader));

            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, mainEntrance);
            expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
            const calculatedTime = 4045.566;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(calculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).not.toHaveBeenCalled();
            expect(queueMoveSpy).not.toHaveBeenCalled();
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(calculatedTime, 3);
                expect(member.isMoving).toBe(true);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).not.toBeNull();
                expect(member.currentMovingSpeed).toEqual(1);
            }

            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            let lobbyNarration = `An individual wearing a MASK starts walking toward the MAIN ENTRANCE with Asuka and Nero. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# ${lobbyNarration}`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You start walking toward the MAIN ENTRANCE with Asuka and Nero while carrying an APPLE and an unpeeled ORANGE.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward the MAIN ENTRANCE with Nero while carrying a POT.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward the MAIN ENTRANCE with Asuka.`);

            /**
             * Fast forward a quarter of the way through the move to ensure that the players are moving in sync.
             * The timeRatio at this point should be about 0.247.
             */
            let elapsedTime = 1000;
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(elapsedTime / calculatedTime).toBeCloseTo(0.247, 3);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(3045.566, 3);
                expect(member.pos).toStrictEqual({ x: 2500, y: 100, z: 3103 });
            }
            expect(moveSpy).not.toHaveBeenCalled();
            /**
             * Fast forward to the halfway mark.
             */
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(2 * elapsedTime / calculatedTime).toBeCloseTo(0.494, 3);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(2045.566, 3);
                expect(member.pos).toStrictEqual({ x: 2500, y: 100, z: 3127 });
            }
            expect(moveSpy).not.toHaveBeenCalled();
            /**
             * Fast forward to the three quarters mark.
             */
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(3 * elapsedTime / calculatedTime).toBeCloseTo(0.742, 3);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(1045.566, 3);
                expect(member.pos).toStrictEqual({ x: 2500, y: 100, z: 3150 });
            }
            expect(moveSpy).not.toHaveBeenCalled();

            /**
             * Fast forward to the end of the move.
             */
            await vi.advanceTimersByTimeAsync(1100);
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(narrateReachedHalfStaminaSpy).not.toHaveBeenCalled();
            expect(moveSpy).toHaveBeenCalledTimes(1);
            expect(moveSpy).toBeInvokedWith(false, lobby, mainEntrance.dest, mainEntrance, mainEntrance.getLinkedExit(), false, new Set([astrid, asuka, nero]));
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(0, 3);
                expect(member.isMoving).toBe(false);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).toBeNull();
                expect(member.currentMovingSpeed).toEqual(0);
                expect(member.pos).toStrictEqual(mainEntrance.pos);
                expect(member.hasStatus("weary")).toBe(false);
            }

            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
            expect(nero.notificationChannel.messages.cache).toHaveSize(2);
            lobbyNarration = `An individual wearing a MASK, Asuka, and Nero exit into the MAIN ENTRANCE. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(lobbyFirstNarrationMessage.content).toBe(`${lobbyNarration}`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You exit into the MAIN ENTRANCE with Asuka and Nero while carrying an APPLE and an unpeeled ORANGE.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# You exit into the MAIN ENTRANCE with an individual wearing a MASK and Nero while carrying a POT.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# You exit into the MAIN ENTRANCE with an individual wearing a MASK and Asuka.`);
            expect(courtyard.channel.messages.cache).toHaveSize(1);
            let courtyardNarration = `An individual wearing a MASK, Asuka, and Nero enter from ROZZEM HOTEL. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(courtyardNarrationMessage.content).toBe(`${courtyardNarration}`);
            expect(generateRoomOccupantsNotificationSpy).toHaveBeenCalledTimes(3);
            const astridOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[0].value;
            const asukaOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[1].value;
            const neroOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[2].value;
            expect(astridOccupantsList).toBe(`You see Asuka and Nero here.`);
            expect(asukaOccupantsList).toBe(`You see an individual wearing a MASK and Nero here.`);
            expect(neroOccupantsList).toBe(`You see an individual wearing a MASK and Asuka here.`);
        });

        test('party member positions are always the same with queued movements', async () => {
            const party = astrid.party;
            for (const member of party.members.values())
                expect(member.positionMatches(party.leader));

            astrid.moveQueue = ["HALL 3", "LOCKER ROOM"];
            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, hall3);
            expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
            let calculatedTime = 11427.364;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(calculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).not.toHaveBeenCalled();
            expect(queueMoveSpy).not.toHaveBeenCalled();
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(calculatedTime, 3);
                expect(member.isMoving).toBe(true);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).not.toBeNull();
                expect(member.currentMovingSpeed).toEqual(1);
            }

            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            let lobbyNarration = `An individual wearing a MASK starts walking toward HALL 3 with Asuka and Nero. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# ${lobbyNarration}`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You start walking toward HALL 3 with Asuka and Nero while carrying an APPLE and an unpeeled ORANGE.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward HALL 3 with Nero while carrying a POT.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward HALL 3 with Asuka.`);

            /**
             * Fast forward a quarter of the way through the move to ensure that the players are moving in sync.
             * The timeRatio at this point should be about 0.254.
             */
            let elapsedTime = 2900;
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(elapsedTime / calculatedTime).toBeCloseTo(0.254, 3);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(8527.364, 3);
                expect(member.pos).toStrictEqual({ x: 2434, y: 100, z: 3095 });
            }
            expect(moveSpy).not.toHaveBeenCalled();
            /**
             * Fast forward to the halfway mark.
             */
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(2 * elapsedTime / calculatedTime).toBeCloseTo(0.508, 3);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(5627.364, 3);
                expect(member.pos).toStrictEqual({ x: 2367, y: 100, z: 3109 });
            }
            expect(moveSpy).not.toHaveBeenCalled();
            /**
             * Fast forward to the three quarters mark.
             */
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(3 * elapsedTime / calculatedTime).toBeCloseTo(0.761, 3);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(2727.364, 3);
                expect(member.pos).toStrictEqual({ x: 2301, y: 100, z: 3124 });
            }
            expect(moveSpy).not.toHaveBeenCalled();

            /**
             * Fast forward to the end of the move.
             */
            vi.clearAllMocks();
            await vi.advanceTimersByTimeAsync(2800);
            expect(moveSpy).toHaveBeenCalledTimes(1);
            expect(moveSpy).toBeInvokedWith(false, lobby, hall3.dest, hall3, hall3.getLinkedExit(), false, new Set([astrid, asuka, nero]));
            expect(narrateReachedHalfStaminaSpy).not.toHaveBeenCalled();

            expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
            calculatedTime = 33354.311;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(calculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).not.toHaveBeenCalled();
            expect(queueMoveSpy).toHaveBeenCalledOnce();
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(calculatedTime, 3);
                expect(member.isMoving).toBe(true);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).not.toBeNull();
                expect(member.currentMovingSpeed).toEqual(1);
                expect(member.pos).toStrictEqual(hall3.pos);
                expect(member.hasStatus("weary")).toBe(false);
            }

            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(3);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(3);
            expect(nero.notificationChannel.messages.cache).toHaveSize(3);
            lobbyNarration = `An individual wearing a MASK, Asuka, and Nero exit into HALL 3. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(lobbyFirstNarrationMessage.content).toBe(`${lobbyNarration}`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You exit into HALL 3 with Asuka and Nero while carrying an APPLE and an unpeeled ORANGE.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# You exit into HALL 3 with an individual wearing a MASK and Nero while carrying a POT.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# You exit into HALL 3 with an individual wearing a MASK and Asuka.`);
            expect(hall3.dest.channel.messages.cache).toHaveSize(2);
            let hall3Narration1 = `An individual wearing a MASK, Asuka, and Nero enter from the LOBBY. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(hall3NarrationMessage.content).toBe(`${hall3Narration1}`);
            let hall3Narration2 = `An individual wearing a MASK starts walking toward the LOCKER ROOM with Asuka and Nero. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(hall3.dest.channel.messages.cache.last().content).toBe(`> -# ${hall3Narration2}`);
            expect(generateRoomOccupantsNotificationSpy).toHaveBeenCalledTimes(3);
            let astridOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[0].value;
            let asukaOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[1].value;
            let neroOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[2].value;
            expect(astridOccupantsList).toBe(`You see Asuka and Nero here.`);
            expect(asukaOccupantsList).toBe(`You see an individual wearing a MASK and Nero here.`);
            expect(neroOccupantsList).toBe(`You see an individual wearing a MASK and Asuka here.`);

            vi.clearAllMocks();

            /**
             * Fast forward a quarter of the way through the move to ensure that the players are moving in sync.
             */
            elapsedTime = 8400;
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(elapsedTime / calculatedTime).toBeCloseTo(0.252, 3);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(24954.311, 3);
                expect(member.pos).toStrictEqual({ x: 2074, y: 100, z: 3248 });
            }
            expect(moveSpy).not.toHaveBeenCalled();
            /**
             * Fast forward to the halfway mark.
             */
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(2 * elapsedTime / calculatedTime).toBeCloseTo(0.504, 3);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(16554.311, 3);
                expect(member.pos).toStrictEqual({ x: 1911, y: 100, z: 3358 });
            }
            expect(moveSpy).not.toHaveBeenCalled();
            /**
             * Fast forward to the three quarters mark.
             */
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(3 * elapsedTime / calculatedTime).toBeCloseTo(0.756, 3);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(8154.311, 3);
                expect(member.pos).toStrictEqual({ x: 1747, y: 100, z: 3468 });
            }
            expect(moveSpy).not.toHaveBeenCalled();

            /**
             * Fast forward to the end of the move.
             */
            vi.clearAllMocks();
            await vi.advanceTimersByTimeAsync(8200);
            const hall3Room = hall3.dest;
            const lockerRoomExit = hall3Room.getExit("LOCKER ROOM");
            const lockerRoom = lockerRoomExit.dest;
            expect(moveSpy).toHaveBeenCalledTimes(1);
            expect(moveSpy).toBeInvokedWith(false, hall3Room, lockerRoom, lockerRoomExit, lockerRoomExit.getLinkedExit(), false, new Set([astrid, asuka, nero]));
            expect(narrateReachedHalfStaminaSpy).not.toHaveBeenCalled();
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(0, 3);
                expect(member.isMoving).toBe(false);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).toBeNull();
                expect(member.currentMovingSpeed).toEqual(0);
                expect(member.pos).toStrictEqual(lockerRoomExit.pos);
                expect(member.hasStatus("weary")).toBe(false);
            }

            clearMessages();
            await sendMessages();
            expect(hall3Room.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
            expect(nero.notificationChannel.messages.cache).toHaveSize(2);
            hall3Narration1 = `An individual wearing a MASK, Asuka, and Nero exit into the LOCKER ROOM. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(hall3NarrationMessage.content).toBe(`${hall3Narration1}`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You exit into the LOCKER ROOM with Asuka and Nero while carrying an APPLE and an unpeeled ORANGE.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# You exit into the LOCKER ROOM with an individual wearing a MASK and Nero while carrying a POT.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# You exit into the LOCKER ROOM with an individual wearing a MASK and Asuka.`);
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            let lockerRoomNarration = `An individual wearing a MASK, Asuka, and Nero enter from the CURTAIN. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(lockerRoom.channel.messages.cache.first().content).toBe(`${lockerRoomNarration}`);
            expect(generateRoomOccupantsNotificationSpy).toHaveBeenCalledTimes(3);
            astridOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[0].value;
            asukaOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[1].value;
            neroOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[2].value;
            expect(astridOccupantsList).toBe(`You see Asuka and Nero here.`);
            expect(asukaOccupantsList).toBe(`You see an individual wearing a MASK and Nero here.`);
            expect(neroOccupantsList).toBe(`You see an individual wearing a MASK and Asuka here.`);
        });

        test('party has queued movements and dismisses player before reaching first destination', async () => {
            const party = astrid.party;
            for (const member of party.members.values())
                expect(member.positionMatches(party.leader));

            astrid.moveQueue = ["HALL 3", "LOCKER ROOM"];
            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, hall3);
            expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
            let partyCalculatedTime = 11427.364;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(partyCalculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).not.toHaveBeenCalled();
            expect(queueMoveSpy).not.toHaveBeenCalled();
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(partyCalculatedTime, 3);
                expect(member.isMoving).toBe(true);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).not.toBeNull();
                expect(member.currentMovingSpeed).toEqual(1);
            }

            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            let lobbyNarration = `An individual wearing a MASK starts walking toward HALL 3 with Asuka and Nero. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# ${lobbyNarration}`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You start walking toward HALL 3 with Asuka and Nero while carrying an APPLE and an unpeeled ORANGE.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward HALL 3 with Nero while carrying a POT.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward HALL 3 with Asuka.`);

            const dismissAction = new DismissAction(testGame, undefined, astrid, astrid.location, false);
            await dismissAction.performDismissAction([nero]);
            expect(astrid.party.hasFollower(nero)).toBe(false);
            expect(nero.isFollowing(astrid)).toBe(true);
            await sendMessages();
            clearMessages();

            /**
             * Fast forward a quarter of the way through the move to ensure that the players are moving in sync.
             * The timeRatio at this point should be about 0.254.
             */
            let elapsedTime = 2900;
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(elapsedTime / partyCalculatedTime).toBeCloseTo(0.254, 3);
            for (const member of [astrid, asuka, nero]) {
                expect(member.remainingTime).toBeCloseTo(8527.364, 3);
                expect(member.pos).toStrictEqual({ x: 2434, y: 100, z: 3095 });
            }
            expect(moveSpy).not.toHaveBeenCalled();
            /**
             * Fast forward to the halfway mark.
             */
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(2 * elapsedTime / partyCalculatedTime).toBeCloseTo(0.508, 3);
            for (const member of [astrid, asuka, nero]) {
                expect(member.remainingTime).toBeCloseTo(5627.364, 3);
                expect(member.pos).toStrictEqual({ x: 2367, y: 100, z: 3109 });
            }
            expect(moveSpy).not.toHaveBeenCalled();
            /**
             * Fast forward to the three quarters mark.
             */
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(3 * elapsedTime / partyCalculatedTime).toBeCloseTo(0.761, 3);
            for (const member of [astrid, asuka, nero]) {
                expect(member.remainingTime).toBeCloseTo(2727.364, 3);
                expect(member.pos).toStrictEqual({ x: 2301, y: 100, z: 3124 });
            }
            expect(moveSpy).not.toHaveBeenCalled();

            /**
             * Fast forward to the end of the move.
             */
            vi.clearAllMocks();
            await vi.advanceTimersByTimeAsync(2800);
            expect(moveSpy).toHaveBeenCalledTimes(1);
            expect(moveSpy).toBeInvokedWith(false, lobby, hall3.dest, hall3, hall3.getLinkedExit(), false, new Set([astrid, asuka, nero]));
            expect(narrateReachedHalfStaminaSpy).not.toHaveBeenCalled();

            expect(calculateMoveTimeSpy).toHaveBeenCalledTimes(2);
            partyCalculatedTime = 22402.363;
            const neroCalculatedTime = 33354.311;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(partyCalculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).toHaveBeenCalledOnce();
            expect(queueMoveSpy).toHaveBeenCalledTimes(1);
            for (const member of [astrid, asuka]) {
                expect(member.remainingTime).toBeCloseTo(partyCalculatedTime, 3);
                expect(member.isMoving).toBe(true);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).not.toBeNull();
                expect(member.currentMovingSpeed).toEqual(5);
                expect(member.pos).toStrictEqual(hall3.pos);
                expect(member.hasStatus("weary")).toBe(false);
            }
            await vi.advanceTimersByTimeAsync(100);
            expect(nero.remainingTime).toBeCloseTo(neroCalculatedTime, 3);
            expect(nero.isMoving).toBe(true);
            expect(nero.isRunning).toBe(false);
            expect(nero.moveTimer).not.toBeNull();
            expect(nero.currentMovingSpeed).toEqual(1);
            expect(nero.pos).toStrictEqual(hall3.pos);
            expect(nero.hasStatus("weary")).toBe(false);

            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(4);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(3);
            expect(nero.notificationChannel.messages.cache).toHaveSize(3);
            lobbyNarration = `An individual wearing a MASK, Asuka, and Nero exit into HALL 3. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(lobbyFirstNarrationMessage.content).toBe(`${lobbyNarration}`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You exit into HALL 3 with Asuka and Nero while carrying an APPLE and an unpeeled ORANGE.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# You exit into HALL 3 with an individual wearing a MASK and Nero while carrying a POT.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# You exit into HALL 3 with an individual wearing a MASK and Asuka.`);
            expect(hall3.dest.channel.messages.cache).toHaveSize(3);
            let hall3Narration1 = `An individual wearing a MASK, Asuka, and Nero enter from the LOBBY. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(hall3NarrationMessage.content).toBe(`${hall3Narration1}`);
            let hall3Narration2 = `An individual wearing a MASK starts walking toward the LOCKER ROOM with Asuka. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(hall3.dest.channel.messages.cache.at(1).content).toBe(`> -# ${hall3Narration2}`);
            let hall3Narration3 = `Following an individual wearing a MASK, Nero starts walking toward the LOCKER ROOM.`;
            expect(hall3.dest.channel.messages.cache.last().content).toBe(`> -# ${hall3Narration3}`);
            expect(generateRoomOccupantsNotificationSpy).toHaveBeenCalledTimes(3);
            let astridOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[0].value;
            let asukaOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[1].value;
            let neroOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[2].value;
            expect(astridOccupantsList).toBe(`You see Asuka and Nero here.`);
            expect(asukaOccupantsList).toBe(`You see an individual wearing a MASK and Nero here.`);
            expect(neroOccupantsList).toBe(`You see an individual wearing a MASK and Asuka here.`);

            /**
             * Fast forward to the end of the move.
             */
            vi.clearAllMocks();
            await vi.advanceTimersByTimeAsync(23000);
            const hall3Room = hall3.dest;
            const lockerRoomExit = hall3Room.getExit("LOCKER ROOM");
            const lockerRoom = lockerRoomExit.dest;
            expect(moveSpy).toHaveBeenCalledTimes(1);
            expect(moveSpy).toBeInvokedWith(false, hall3Room, lockerRoom, lockerRoomExit, lockerRoomExit.getLinkedExit(), false, new Set([astrid, asuka]));
            expect(narrateReachedHalfStaminaSpy).not.toHaveBeenCalled();
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(0, 3);
                expect(member.isMoving).toBe(false);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).toBeNull();
                expect(member.currentMovingSpeed).toEqual(0);
                expect(member.pos).toStrictEqual(lockerRoomExit.pos);
                expect(member.hasStatus("weary")).toBe(false);
            }
            expect(nero.remainingTime).toBeGreaterThan(0);
            expect(nero.isMoving).toBe(true);
            expect(nero.isRunning).toBe(false);
            expect(nero.moveTimer).not.toBeNull();
            expect(nero.currentMovingSpeed).toEqual(1);
            expect(nero.pos).not.toStrictEqual(lockerRoomExit.pos);
            expect(nero.hasStatus("weary")).toBe(false);

            clearMessages();
            await sendMessages();
            expect(hall3Room.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            hall3Narration1 = `An individual wearing a MASK and Asuka exit into the LOCKER ROOM. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(hall3NarrationMessage.content).toBe(`${hall3Narration1}`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You exit into the LOCKER ROOM with Asuka while carrying an APPLE and an unpeeled ORANGE.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# You exit into the LOCKER ROOM with an individual wearing a MASK while carrying a POT.`);
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            let lockerRoomNarration = `An individual wearing a MASK and Asuka enter from the CURTAIN. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(lockerRoom.channel.messages.cache.first().content).toBe(`${lockerRoomNarration}`);
            expect(generateRoomOccupantsNotificationSpy).toHaveBeenCalledTimes(2);
            astridOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[0].value;
            asukaOccupantsList = generateRoomOccupantsNotificationSpy.mock.results[1].value;
            expect(astridOccupantsList).toBe(`You see Asuka here.`);
            expect(asukaOccupantsList).toBe(`You see an individual wearing a MASK here.`);

            // We don't care what happens to Nero after this.
        });

        test('party leader runs out of stamina', async () => {
            const party = astrid.party;
            for (const member of party.members.values())
                expect(member.positionMatches(party.leader));

            astrid.stamina = 0.001;
            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, mainEntrance);
            expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
            const calculatedTime = 4045.566;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(calculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).not.toHaveBeenCalled();
            expect(queueMoveSpy).not.toHaveBeenCalled();
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(calculatedTime, 3);
                expect(member.isMoving).toBe(true);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).not.toBeNull();
                expect(member.currentMovingSpeed).toEqual(1);
            }

            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            let lobbyNarration = `An individual wearing a MASK starts walking toward the MAIN ENTRANCE with Asuka and Nero. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# ${lobbyNarration}`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You start walking toward the MAIN ENTRANCE with Asuka and Nero while carrying an APPLE and an unpeeled ORANGE.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward the MAIN ENTRANCE with Nero while carrying a POT.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward the MAIN ENTRANCE with Asuka.`);

            /**
             * Fast forward one tick. We can expect Astrid's stamina to have depleted by half.
             */
            let elapsedTime = 100;
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(narrateReachedHalfStaminaSpy).toHaveBeenCalledOnce();
            expect(astrid.stamina).toBeGreaterThan(0);
            expect(astrid.hasStatus("weary")).toBe(false);
            expect(moveSpy).not.toHaveBeenCalled();

            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK's breathing is getting heavy. It seems like they're starting to get tired.`);
            expect(astridFirstNotificationMessage.content).toBe(`Your breathing is getting heavy. You might want to stop moving and rest soon.`);

            /**
             * Fast forward two more ticks.
             */
            await vi.advanceTimersByTimeAsync(2 * elapsedTime);
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(narrateReachedHalfStaminaSpy).toHaveBeenCalledOnce();
            expect(moveSpy).not.toHaveBeenCalled();
            expect(astrid.stamina).toBeCloseTo(0, 3);
            expect(asuka.stamina).toBeGreaterThan(0);
            expect(nero.stamina).toBeGreaterThan(0);
            expect(astrid.hasStatus("weary")).toBe(true);
            expect(asuka.hasStatus("weary")).toBe(false);
            expect(nero.hasStatus("weary")).toBe(false);
            expect(astrid.isLeading(asuka)).toBe(true);
            expect(astrid.isLeading(nero)).toBe(true);
            expect(asuka.isFollowing(astrid)).toBe(true);
            expect(nero.isFollowing(astrid)).toBe(true);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(0, 3);
                expect(member.isMoving).toBe(false);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).toBeNull();
                expect(member.currentMovingSpeed).toEqual(0);
                expect(member.pos).toStrictEqual(astrid.pos);
                expect(member.party).toStrictEqual(party);
            }

            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(2);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# An individual wearing a MASK stops moving. They seem weary.`);
            expect(lobbyLastNarrationMessage.content).toBe(`> -# Asuka and Nero stop moving.`);
            expect(astridFirstNotificationMessage.content).toBe(`After to moving to this room, you have become **weary**. You need to take a short break before moving to another room.`);
            expect(astridLastNotificationMessage.content).toBe(`> -# Asuka and Nero stop moving.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# You and Nero stop moving.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# You and Asuka stop moving.`);
            astrid.cure(testGame.entityFinder.getStatusEffect("weary"));
        });

        test('party follower runs out of stamina', async () => {
            const party = astrid.party;
            for (const member of party.members.values())
                expect(member.positionMatches(party.leader));

            nero.stamina = 0.001;
            const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
            await startMoveAction.performStartMove(false, mainEntrance);
            expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
            const calculatedTime = 4045.566;
            expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(calculatedTime, 3);
            expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(doAfterDelaySpy).not.toHaveBeenCalled();
            expect(queueMoveSpy).not.toHaveBeenCalled();
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(calculatedTime, 3);
                expect(member.isMoving).toBe(true);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).not.toBeNull();
                expect(member.currentMovingSpeed).toEqual(1);
            }

            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            let lobbyNarration = `An individual wearing a MASK starts walking toward the MAIN ENTRANCE with Asuka and Nero. `
                + `An individual wearing a MASK carries an APPLE and an unpeeled ORANGE; Asuka carries a POT.`;
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# ${lobbyNarration}`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# You start walking toward the MAIN ENTRANCE with Asuka and Nero while carrying an APPLE and an unpeeled ORANGE.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward the MAIN ENTRANCE with Nero while carrying a POT.`);
            expect(neroFirstNotificationMessage.content).toBe(`> -# Following an individual wearing a MASK, you start walking toward the MAIN ENTRANCE with Asuka.`);

            /**
             * Fast forward one tick. We can expect Nero's stamina to have depleted by half.
             */
            let elapsedTime = 100;
            await vi.advanceTimersByTimeAsync(elapsedTime);
            expect(narrateReachedHalfStaminaSpy).toHaveBeenCalledOnce();
            expect(nero.stamina).toBeGreaterThan(0);
            expect(nero.hasStatus("weary")).toBe(false);
            expect(moveSpy).not.toHaveBeenCalled();

            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# Nero's breathing is getting heavy. It seems like he's starting to get tired.`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# Nero's breathing is getting heavy. It seems like he's starting to get tired.`);
            expect(neroFirstNotificationMessage.content).toBe(`Your breathing is getting heavy. You might want to stop moving and rest soon.`);

            /**
             * Fast forward two more ticks.
             */
            await vi.advanceTimersByTimeAsync(2 * elapsedTime);
            expect(movePlayersSpy).toHaveBeenCalledOnce();
            expect(narrateReachedHalfStaminaSpy).toHaveBeenCalledOnce();
            expect(moveSpy).not.toHaveBeenCalled();
            expect(astrid.stamina).toBeGreaterThan(0);
            expect(asuka.stamina).toBeGreaterThan(0);
            expect(nero.stamina).toBeCloseTo(0, 3);
            expect(astrid.hasStatus("weary")).toBe(false);
            expect(asuka.hasStatus("weary")).toBe(false);
            expect(nero.hasStatus("weary")).toBe(true);
            expect(astrid.isLeading(asuka)).toBe(true);
            expect(astrid.isLeading(nero)).toBe(true);
            expect(asuka.isFollowing(astrid)).toBe(true);
            expect(nero.isFollowing(astrid)).toBe(true);
            for (const member of party.members.values()) {
                expect(member.remainingTime).toBeCloseTo(0, 3);
                expect(member.isMoving).toBe(false);
                expect(member.isRunning).toBe(false);
                expect(member.moveTimer).toBeNull();
                expect(member.currentMovingSpeed).toEqual(0);
                expect(member.pos).toStrictEqual(astrid.pos);
                expect(member.party).toStrictEqual(party);
            }

            clearMessages();
            await sendMessages();
            expect(lobby.channel.messages.cache).toHaveSize(2);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(lobbyFirstNarrationMessage.content).toBe(`> -# Nero stops moving. He seems weary.`);
            expect(lobbyLastNarrationMessage.content).toBe(`> -# An individual wearing a MASK and Asuka stop moving.`);
            expect(astridFirstNotificationMessage.content).toBe(`> -# Nero stops moving. He seems weary.`);
            expect(astridLastNotificationMessage.content).toBe(`> -# You and Asuka stop moving.`);
            expect(asukaFirstNotificationMessage.content).toBe(`> -# You and an individual wearing a MASK stop moving.`);
            expect(neroFirstNotificationMessage.content).toBe(`After to moving to this room, you have become **weary**. You need to take a short break before moving to another room.`);
            nero.cure(testGame.entityFinder.getStatusEffect("weary"));
        });

        describe('party restricted exit tests', () => {
            beforeEach(async () => {
                nero.location.removePlayer(nero);
                cave9.addPlayer(nero);
                astrid.location.removePlayer(astrid);
                cave9.addPlayer(astrid);
                asuka.location.removePlayer(asuka);
                cave9.addPlayer(asuka);
                const cave9Puzzle = testGame.entityFinder.getPuzzle("DOOR", "cave-9", "restricted exit");
                cave9Puzzle.setAccessible();
                await sendMessages();
                clearMessages();
            });

            afterEach(() => {
                const cave9Puzzle = testGame.entityFinder.getPuzzle("DOOR", "cave-9", "restricted exit");
                cave9Puzzle.setInaccessible();
            });

            test('exit has restricted exit puzzle that only the leader can pass', async () => {
                const party = astrid.party;
                const dismissAction = new DismissAction(testGame, undefined, astrid, astrid.location, false);
                await dismissAction.performDismissAction([asuka], true);
                expect(astrid.party.hasFollower(asuka)).toBe(false);
                expect(asuka.isFollowing(astrid)).toBe(false);
                await sendMessages();
                clearMessages();

                for (const member of party.members.values())
                    expect(member.positionMatches(party.leader));

                const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
                await startMoveAction.performStartMove(false, cave9Door);
                expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
                const calculatedTime = 8523.792;
                expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(calculatedTime, 3);
                expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
                expect(movePlayersSpy).toHaveBeenCalledOnce();
                expect(doAfterDelaySpy).not.toHaveBeenCalled();
                expect(queueMoveSpy).not.toHaveBeenCalled();
                for (const member of party.members.values()) {
                    expect(member.remainingTime).toBeCloseTo(calculatedTime, 3);
                    expect(member.isMoving).toBe(true);
                    expect(member.isRunning).toBe(false);
                    expect(member.moveTimer).not.toBeNull();
                    expect(member.currentMovingSpeed).toEqual(1);
                }

                await sendMessages();

                /**
                 * Fast forward to the end of the move.
                 */
                await vi.advanceTimersByTimeAsync(8600);
                expect(movePlayersSpy).toHaveBeenCalledOnce();
                expect(narrateReachedHalfStaminaSpy).not.toHaveBeenCalled();
                expect(moveSpy).not.toHaveBeenCalled();
                expect(astrid.isLeading(asuka)).toBe(false);
                expect(astrid.isLeading(nero)).toBe(true);
                expect(asuka.isFollowing(astrid)).toBe(false);
                expect(nero.isFollowing(astrid)).toBe(true);
                for (const member of party.members.values()) {
                    expect(member.remainingTime).toBeCloseTo(0, 3);
                    expect(member.isMoving).toBe(false);
                    expect(member.isRunning).toBe(false);
                    expect(member.moveTimer).toBeNull();
                    expect(member.currentMovingSpeed).toEqual(0);
                    expect(member.pos).toStrictEqual(cave9Door.pos);
                    expect(member.hasStatus("weary")).toBe(false);
                    expect(member.party).toStrictEqual(party);
                }

                clearMessages();
                await sendMessages();
                expect(cave9.channel.messages.cache).toHaveSize(1);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
                expect(nero.notificationChannel.messages.cache).toHaveSize(1);
                expect(cave9NarrationMessage.content).toBe(`> -# An individual wearing a MASK tries to open the DOOR, but it seems to be locked. Nero stops behind them.`);
                expect(astridFirstNotificationMessage.content).toBe(`You try to open the DOOR, but it seems to be locked. Nero stops behind you.`);
                expect(neroFirstNotificationMessage.content).toBe(`An individual wearing a MASK tries to open the DOOR, but it seems to be locked. You stop behind them.`);
            });

            test('exit has restricted exit puzzle that the leader and one follower can pass', async () => {
                const party = astrid.party;
                for (const member of party.members.values())
                    expect(member.positionMatches(party.leader));

                const startMoveAction = new StartMoveAction(testGame, undefined, astrid, astrid.location, false);
                await startMoveAction.performStartMove(false, cave9Door);
                expect(calculateMoveTimeSpy).toHaveBeenCalledOnce();
                const calculatedTime = 8523.792;
                expect(calculateMoveTimeSpy.mock.results[0].value).toBeCloseTo(calculatedTime, 3);
                expect(narrateStartMoveSpy).toHaveBeenCalledOnce();
                expect(movePlayersSpy).toHaveBeenCalledOnce();
                expect(doAfterDelaySpy).not.toHaveBeenCalled();
                expect(queueMoveSpy).not.toHaveBeenCalled();
                for (const member of party.members.values()) {
                    expect(member.remainingTime).toBeCloseTo(calculatedTime, 3);
                    expect(member.isMoving).toBe(true);
                    expect(member.isRunning).toBe(false);
                    expect(member.moveTimer).not.toBeNull();
                    expect(member.currentMovingSpeed).toEqual(1);
                }

                await sendMessages();

                /**
                 * Fast forward to the end of the move.
                 */
                await vi.advanceTimersByTimeAsync(8600);
                expect(movePlayersSpy).toHaveBeenCalledOnce();
                expect(narrateReachedHalfStaminaSpy).not.toHaveBeenCalled();
                expect(moveSpy).not.toHaveBeenCalled();
                expect(astrid.isLeading(asuka)).toBe(true);
                expect(astrid.isLeading(nero)).toBe(true);
                expect(asuka.isFollowing(astrid)).toBe(true);
                expect(nero.isFollowing(astrid)).toBe(true);
                for (const member of party.members.values()) {
                    expect(member.remainingTime).toBeCloseTo(0, 3);
                    expect(member.isMoving).toBe(false);
                    expect(member.isRunning).toBe(false);
                    expect(member.moveTimer).toBeNull();
                    expect(member.currentMovingSpeed).toEqual(0);
                    expect(member.pos).toStrictEqual(cave9Door.pos);
                    expect(member.hasStatus("weary")).toBe(false);
                    expect(member.party).toStrictEqual(party);
                }

                clearMessages();
                await sendMessages();
                expect(cave9.channel.messages.cache).toHaveSize(1);
                expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
                expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
                expect(nero.notificationChannel.messages.cache).toHaveSize(1);
                expect(cave9NarrationMessage.content).toBe(`> -# An individual wearing a MASK tries to open the DOOR, but it seems to be locked. Asuka and Nero stop behind them.`);
                expect(astridFirstNotificationMessage.content).toBe(`You try to open the DOOR, but it seems to be locked. Asuka and Nero stop behind you.`);
                expect(asukaFirstNotificationMessage.content).toBe(`An individual wearing a MASK tries to open the DOOR, but it seems to be locked. You and Nero stop behind them.`);
                expect(neroFirstNotificationMessage.content).toBe(`An individual wearing a MASK tries to open the DOOR, but it seems to be locked. You and Asuka stop behind them.`);
            });
        });
    });
});
