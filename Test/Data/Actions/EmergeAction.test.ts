// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type HidingSpot from "../../../Data/HidingSpot.ts";
import type Player from "../../../Data/Player.ts";
import type Room from "../../../Data/Room.ts";
import type Status from "../../../Data/Status.ts";
import DisbandPartyAction from "../../../Data/Actions/DisbandPartyAction.ts";
import EmergeAction from "../../../Data/Actions/EmergeAction.ts";
import FollowAction from "../../../Data/Actions/FollowAction.ts";
import HideAction from "../../../Data/Actions/HideAction.ts";
import LeadAction from "../../../Data/Actions/LeadAction.ts";
import GameEntityManager from "../../../Classes/GameEntityManager.ts";
import { sendQueuedMessages } from "../../../Modules/messageHandler.ts";
import type { Mock } from "vitest";
import type { Message } from "discord.js";
import InflictAction from "../../../Data/Actions/InflictAction.ts";

describe('EmergeAction test', () => {
    let astrid: Player;
    let asuka: Player;
    let nero: Player;
    let lockerRoom: Room;
    let stall1: HidingSpot;
    let concealed: Status;
    let blind: Status;
    let concealedDisplayName: string;
    let lockerRoomFirstNarrationMessage: Message<boolean>;
    let lockerRoomLastNarrationMessage: Message<boolean>;
    let stall1FirstNarrationMessage: Message<boolean>;
    let stall1LastNarrationMessage: Message<boolean>;
    let astridFirstNotificationMessage: Message<boolean>;
    let astridLastNotificationMessage: Message<boolean>;
    let asukaFirstNotificationMessage: Message<boolean>;
    let asukaLastNotificationMessage: Message<boolean>;
    let neroFirstNotificationMessage: Message<boolean>;
    let neroLastNotificationMessage: Message<boolean>;
    let createWhisperSpy: Mock<typeof GameEntityManager.prototype.createWhisper>;
    let deleteWhisperSpy: Mock<typeof GameEntityManager.prototype.deleteWhisper>;
    const clearMessages = () => {
        lockerRoom.channel.messages.cache.clear();
        astrid.notificationChannel.messages.cache.clear();
        asuka.notificationChannel.messages.cache.clear();
        nero.notificationChannel.messages.cache.clear();
    };

    const sendMessages = async () => {
        await sendQueuedMessages(testGame);
        lockerRoomFirstNarrationMessage = lockerRoom.channel.messages.cache.first();
        lockerRoomLastNarrationMessage = lockerRoom.channel.messages.cache.last();
        stall1FirstNarrationMessage = stall1.whisper?.channel?.messages.cache.first();
        stall1LastNarrationMessage = stall1.whisper?.channel?.messages.cache.last();
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
        lockerRoom = testGame.entityFinder.getRoom("locker-room");
        stall1 = testGame.entityFinder.getFixture("STALL 1", lockerRoom.id).hidingSpot;
        concealed = testGame.entityFinder.getStatusEffect("concealed");
        blind = testGame.entityFinder.getStatusEffect("blind");
        nero.inflict(blind);
        astrid.inflict(concealed);
        concealedDisplayName = "an individual wearing a MASK";
        astrid.setPronouns(astrid.pronouns, "neutral");
        astrid.displayName = concealedDisplayName;
        astrid.location.removePlayer(astrid);
        asuka.location.removePlayer(asuka);
        nero.location.removePlayer(nero);
        lockerRoom.addPlayer(astrid);
        lockerRoom.addPlayer(asuka);
        lockerRoom.addPlayer(nero);
    });

    beforeEach(async () => {
        createWhisperSpy = vi.spyOn(GameEntityManager.prototype, 'createWhisper');
        deleteWhisperSpy = vi.spyOn(GameEntityManager.prototype, 'deleteWhisper');
        await sendMessages();
        clearMessages();
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(async () => {
        for (const player of [astrid, asuka, nero]) {
            const emergeAction = new EmergeAction(testGame, undefined, player, player.location, true);
            await emergeAction.performEmerge();
        }
        await sendMessages();
        clearMessages();
        vi.restoreAllMocks();
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    afterAll(() => {
        nero.inflict(blind);
        astrid.cure(concealed);
        astrid.displayName = "Astrid";
        astrid.setPronouns(astrid.pronouns, astrid.pronounString);
        astrid.location.removePlayer(astrid);
        asuka.location.removePlayer(asuka);
        nero.location.removePlayer(nero);
        const lobby = testGame.entityFinder.getRoom('lobby');
        lobby.addPlayer(astrid);
        lobby.addPlayer(asuka);
        lobby.addPlayer(nero);
    });

    test('Setup is correct', () => {
        expect(astrid.location.id).toBe("locker-room");
        expect(asuka.location.id).toBe("locker-room");
        expect(nero.location.id).toBe("locker-room");
    });

    describe('one player emerges with no party', () => {
        test('player emerges from hiding with no hiding spot', async () => {
            const hidden = testGame.entityFinder.getStatusEffect("hidden");
            const inflictAction = new InflictAction(testGame, undefined, astrid, astrid.location, true);
            await inflictAction.performInflict(hidden, false, false, false);
            expect(createWhisperSpy).not.toHaveBeenCalled();
            await sendMessages();
            clearMessages();

            const emergeAction = new EmergeAction(testGame, undefined, astrid, astrid.location, false);
            await emergeAction.performEmerge();
            expect(astrid.hasStatus("hidden")).toBe(false);
            expect(deleteWhisperSpy).not.toHaveBeenCalled();
            expect(lockerRoom.occupantsString).toBe(`an individual wearing a MASK, Asuka, and Nero`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`An individual wearing a MASK comes out of hiding.`);
            expect(astridFirstNotificationMessage.content).toBe(`You come out of hiding.`);
            expect(astridLastNotificationMessage.content).toBe(`You are no longer hidden.`);
        });

        test('last player emerges from hiding spot', async () => {
            const hideAction1 = new HideAction(testGame, undefined, astrid, astrid.location, false);
            await hideAction1.performHide(stall1);
            expect(createWhisperSpy).toHaveBeenCalledTimes(1);
            await sendMessages();
            clearMessages();

            const emergeAction = new EmergeAction(testGame, undefined, astrid, astrid.location, false);
            await emergeAction.performEmerge(stall1);
            expect(stall1.occupants).toHaveSize(0);
            expect(astrid.hasStatus("hidden")).toBe(false);
            expect(deleteWhisperSpy).toHaveBeenCalledOnce();
            expect(stall1.whisper).toBeNull();
            expect(lockerRoom.occupantsString).toBe(`an individual wearing a MASK, Asuka, and Nero`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`An individual wearing a MASK comes out of STALL 1.`);
            expect(astridFirstNotificationMessage.content).toBe(`You come out of STALL 1.`);
            expect(astridLastNotificationMessage.content).toBe(`You are no longer hidden.`);
        });

        test('player emerges from occupied hiding spot', async () => {
            const hideAction1 = new HideAction(testGame, undefined, astrid, astrid.location, false);
            await hideAction1.performHide(stall1);
            const hideAction2 = new HideAction(testGame, undefined, asuka, asuka.location, false);
            await hideAction2.performHide(stall1);
            expect(createWhisperSpy).toHaveBeenCalledTimes(2);
            deleteWhisperSpy.mockClear();
            await sendMessages();
            clearMessages();

            const emergeAction = new EmergeAction(testGame, undefined, astrid, astrid.location, false);
            await emergeAction.performEmerge();
            expect(stall1.occupants).toHaveSize(1);
            expect(stall1.hasOccupant(astrid)).toBe(false);
            expect(stall1.hasOccupant(asuka)).toBe(true);
            expect(astrid.hasStatus("hidden")).toBe(false);
            expect(asuka.hasStatus("hidden")).toBe(true);
            expect(deleteWhisperSpy).not.toHaveBeenCalled();
            expect(stall1.whisper).not.toBeNull();
            expect(stall1.whisper.id).toBe(`locker-room-stall-1-asuka`);
            expect(stall1.whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(asuka.id)).not.toBeUndefined();
            expect(lockerRoom.occupantsString).toBe(`an individual wearing a MASK and Nero`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(stall1.whisper.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`An individual wearing a MASK comes out of STALL 1.`);
            expect(stall1FirstNarrationMessage.content).toBe(`An individual wearing a MASK comes out of STALL 1.`);
            expect(astridFirstNotificationMessage.content).toBe(`You come out of STALL 1.`);
            expect(astridLastNotificationMessage.content).toBe(`You are no longer hidden.`);
        });

        test('player emerges from occupied hiding spot that has occupant with no sight behavior attribute', async () => {
            const hideAction1 = new HideAction(testGame, undefined, astrid, astrid.location, true);
            await hideAction1.performHide(stall1);
            const hideAction2 = new HideAction(testGame, undefined, asuka, asuka.location, true);
            await hideAction2.performHide(stall1);
            const hideAction3 = new HideAction(testGame, undefined, nero, nero.location, true);
            await hideAction3.performHide(stall1);
            expect(createWhisperSpy).toHaveBeenCalledTimes(3);
            deleteWhisperSpy.mockClear();
            await sendMessages();
            clearMessages();

            const emergeAction = new EmergeAction(testGame, undefined, astrid, astrid.location, false);
            await emergeAction.performEmerge();
            expect(stall1.occupants).toHaveSize(2);
            expect(stall1.hasOccupant(astrid)).toBe(false);
            expect(stall1.hasOccupant(asuka)).toBe(true);
            expect(stall1.hasOccupant(nero)).toBe(true);
            expect(astrid.hasStatus("hidden")).toBe(false);
            expect(asuka.hasStatus("hidden")).toBe(true);
            expect(nero.hasStatus("hidden")).toBe(true);
            expect(deleteWhisperSpy).not.toHaveBeenCalled();
            expect(stall1.whisper).not.toBeNull();
            expect(stall1.whisper.id).toBe(`locker-room-stall-1-asuka-nero`);
            expect(stall1.whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(asuka.id)).not.toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(nero.id)).toBeUndefined();
            expect(lockerRoom.occupantsString).toBe(`an individual wearing a MASK`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(stall1.whisper.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`An individual wearing a MASK comes out of STALL 1.`);
            expect(stall1FirstNarrationMessage.content).toBe(`An individual wearing a MASK comes out of STALL 1.`);
            expect(astridFirstNotificationMessage.content).toBe(`You come out of STALL 1.`);
            expect(astridLastNotificationMessage.content).toBe(`You are no longer hidden.`);
            expect(neroFirstNotificationMessage.content).toBe(`Someone comes out of STALL 1.`);
        });
    });

    describe('party of two hide', () => {
        beforeAll(async () => {
            const followAction = new FollowAction(testGame, undefined, asuka, asuka.location, false);
            await followAction.performFollow(astrid);
            const leadAction = new LeadAction(testGame, undefined, astrid, astrid.location, false);
            await leadAction.performLead([asuka]);
            await sendMessages();
            clearMessages();
            vi.clearAllMocks();
        });

        afterAll(async () => {
            const disbandAction = new DisbandPartyAction(testGame, undefined, astrid, astrid.location, false);
            await disbandAction.performDisbandParty(true);
        });

        test('party of two emerges from hiding with no hiding spot', async () => {
            const hidden = testGame.entityFinder.getStatusEffect("hidden");
            const inflictAction1 = new InflictAction(testGame, undefined, astrid, astrid.location, true);
            await inflictAction1.performInflict(hidden, false, false, false);
            const inflictAction2 = new InflictAction(testGame, undefined, asuka, asuka.location, true);
            await inflictAction2.performInflict(hidden, false, false, false);
            expect(createWhisperSpy).not.toHaveBeenCalled();
            await sendMessages();
            clearMessages();

            const emergeAction = new EmergeAction(testGame, undefined, astrid, astrid.location, false);
            await emergeAction.performEmerge();
            expect(astrid.hasStatus("hidden")).toBe(false);
            expect(asuka.hasStatus("hidden")).toBe(false);
            expect(deleteWhisperSpy).not.toHaveBeenCalled();
            expect(lockerRoom.occupantsString).toBe(`an individual wearing a MASK, Asuka, and Nero`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`An individual wearing a MASK and Asuka come out of hiding.`);
            expect(astridFirstNotificationMessage.content).toBe(`You and Asuka come out of hiding.`);
            expect(astridLastNotificationMessage.content).toBe(`You are no longer hidden.`);
            expect(asukaFirstNotificationMessage.content).toBe(`You and an individual wearing a MASK come out of hiding.`);
            expect(asukaLastNotificationMessage.content).toBe(`You are no longer hidden.`);
        });

        test('party of two emerges from hiding spot with no more occupants', async () => {
            const hideAction = new HideAction(testGame, undefined, astrid, astrid.location, false);
            await hideAction.performHide(stall1);
            expect(createWhisperSpy).toHaveBeenCalledTimes(1);
            await sendMessages();
            clearMessages();

            const emergeAction = new EmergeAction(testGame, undefined, astrid, astrid.location, false);
            await emergeAction.performEmerge(stall1);
            expect(stall1.occupants).toHaveSize(0);
            expect(astrid.hasStatus("hidden")).toBe(false);
            expect(asuka.hasStatus("hidden")).toBe(false);
            expect(deleteWhisperSpy).toHaveBeenCalledOnce();
            expect(stall1.whisper).toBeNull();
            expect(lockerRoom.occupantsString).toBe(`an individual wearing a MASK, Asuka, and Nero`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`An individual wearing a MASK and Asuka come out of STALL 1.`);
            expect(astridFirstNotificationMessage.content).toBe(`You and Asuka come out of STALL 1.`);
            expect(astridLastNotificationMessage.content).toBe(`You are no longer hidden.`);
            expect(asukaFirstNotificationMessage.content).toBe(`You and an individual wearing a MASK come out of STALL 1.`);
            expect(asukaLastNotificationMessage.content).toBe(`You are no longer hidden.`);
        });

        test('party of two emerges from occupied hiding spot', async () => {
            nero.cure(blind);
            const hideAction1 = new HideAction(testGame, undefined, astrid, astrid.location, true);
            await hideAction1.performHide(stall1);
            const hideAction2 = new HideAction(testGame, undefined, nero, nero.location, true);
            await hideAction2.performHide(stall1);
            expect(createWhisperSpy).toHaveBeenCalledTimes(2);
            deleteWhisperSpy.mockClear();
            await sendMessages();
            clearMessages();

            const emergeAction = new EmergeAction(testGame, undefined, astrid, astrid.location, false);
            await emergeAction.performEmerge();
            expect(stall1.occupants).toHaveSize(1);
            expect(stall1.hasOccupant(astrid)).toBe(false);
            expect(stall1.hasOccupant(asuka)).toBe(false);
            expect(stall1.hasOccupant(nero)).toBe(true);
            expect(astrid.hasStatus("hidden")).toBe(false);
            expect(asuka.hasStatus("hidden")).toBe(false);
            expect(nero.hasStatus("hidden")).toBe(true);
            expect(deleteWhisperSpy).not.toHaveBeenCalled();
            expect(stall1.whisper).not.toBeNull();
            expect(stall1.whisper.id).toBe(`locker-room-stall-1-nero`);
            expect(stall1.whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(asuka.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(nero.id)).not.toBeUndefined();
            expect(lockerRoom.occupantsString).toBe(`an individual wearing a MASK and Asuka`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(stall1.whisper.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`An individual wearing a MASK and Asuka come out of STALL 1.`);
            expect(stall1FirstNarrationMessage.content).toBe(`An individual wearing a MASK and Asuka come out of STALL 1.`);
            expect(astridFirstNotificationMessage.content).toBe(`You and Asuka come out of STALL 1.`);
            expect(astridLastNotificationMessage.content).toBe(`You are no longer hidden.`);
            expect(asukaFirstNotificationMessage.content).toBe(`You and an individual wearing a MASK come out of STALL 1.`);
            expect(asukaLastNotificationMessage.content).toBe(`You are no longer hidden.`);
            nero.inflict(blind);
        });

        test('player emerges from occupied hiding spot that has occupant with no sight behavior attribute', async () => {
            const hideAction1 = new HideAction(testGame, undefined, astrid, astrid.location, true);
            await hideAction1.performHide(stall1);
            const hideAction2 = new HideAction(testGame, undefined, nero, nero.location, true);
            await hideAction2.performHide(stall1);
            expect(createWhisperSpy).toHaveBeenCalledTimes(2);
            deleteWhisperSpy.mockClear();
            await sendMessages();
            clearMessages();

            const emergeAction = new EmergeAction(testGame, undefined, astrid, astrid.location, false);
            await emergeAction.performEmerge();
            expect(stall1.occupants).toHaveSize(1);
            expect(stall1.hasOccupant(astrid)).toBe(false);
            expect(stall1.hasOccupant(asuka)).toBe(false);
            expect(stall1.hasOccupant(nero)).toBe(true);
            expect(astrid.hasStatus("hidden")).toBe(false);
            expect(asuka.hasStatus("hidden")).toBe(false);
            expect(nero.hasStatus("hidden")).toBe(true);
            expect(deleteWhisperSpy).not.toHaveBeenCalled();
            expect(stall1.whisper).not.toBeNull();
            expect(stall1.whisper.id).toBe(`locker-room-stall-1-nero`);
            expect(stall1.whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(asuka.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(nero.id)).toBeUndefined();
            expect(lockerRoom.occupantsString).toBe(`an individual wearing a MASK and Asuka`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(stall1.whisper.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`An individual wearing a MASK and Asuka come out of STALL 1.`);
            expect(stall1FirstNarrationMessage.content).toBe(`An individual wearing a MASK and Asuka come out of STALL 1.`);
            expect(astridFirstNotificationMessage.content).toBe(`You and Asuka come out of STALL 1.`);
            expect(astridLastNotificationMessage.content).toBe(`You are no longer hidden.`);
            expect(asukaFirstNotificationMessage.content).toBe(`You and an individual wearing a MASK come out of STALL 1.`);
            expect(asukaLastNotificationMessage.content).toBe(`You are no longer hidden.`);
            expect(neroFirstNotificationMessage.content).toBe(`Several people come out of STALL 1.`);
        });
    });
});
