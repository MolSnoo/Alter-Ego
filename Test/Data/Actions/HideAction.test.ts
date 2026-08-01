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

describe('HideAction test', () => {
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

    describe('one player hides with no party', () => {
        test('player hides in empty hiding spot', async () => {
            const hideAction = new HideAction(testGame, undefined, astrid, astrid.location, false);
            await hideAction.performHide(stall1);
            expect(stall1.occupants).toHaveSize(1);
            expect(stall1.hasOccupant(astrid)).toBe(true);
            expect(astrid.hasStatus("hidden")).toBe(true);
            expect(deleteWhisperSpy).not.toHaveBeenCalled();
            expect(createWhisperSpy).toHaveBeenCalledOnce();
            expect(stall1.whisper).not.toBeNull();
            expect(stall1.whisper.id).toBe(`locker-room-stall-1-an-individual-wearing-a-mask`);
            expect(stall1.whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(lockerRoom.occupantsString).toBe(`Asuka and Nero`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`An individual wearing a MASK hides in STALL 1.`);
            expect(astridFirstNotificationMessage.content).toBe(`You hide in STALL 1.`);
            expect(astridLastNotificationMessage.content).toBe(`You are now **hidden**.`);
        });

        test('player hides in occupied hiding spot', async () => {
            const hideAction1 = new HideAction(testGame, undefined, astrid, astrid.location, false);
            await hideAction1.performHide(stall1);
            await sendMessages();
            clearMessages();

            const hideAction2 = new HideAction(testGame, undefined, asuka, asuka.location, false);
            await hideAction2.performHide(stall1);
            expect(stall1.occupants).toHaveSize(2);
            expect(stall1.hasOccupant(astrid)).toBe(true);
            expect(stall1.hasOccupant(asuka)).toBe(true);
            expect(astrid.hasStatus("hidden")).toBe(true);
            expect(asuka.hasStatus("hidden")).toBe(true);
            expect(deleteWhisperSpy).toHaveBeenCalledOnce();
            expect(createWhisperSpy).toHaveBeenCalledTimes(2);
            expect(stall1.whisper).not.toBeNull();
            expect(stall1.whisper.id).toBe(`locker-room-stall-1-an-individual-wearing-a-mask-asuka`);
            expect(stall1.whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(asuka.id)).not.toBeUndefined();
            expect(lockerRoom.occupantsString).toBe(`Nero`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(stall1.whisper.channel.messages.cache).toHaveSize(0);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`Asuka hides in STALL 1.`);
            expect(astridFirstNotificationMessage.content).toBe(`You're found by Asuka! She hides with you.`);
            expect(asukaFirstNotificationMessage.content).toBe(`When you hide in STALL 1, you find an individual wearing a MASK already there!`);
            expect(asukaLastNotificationMessage.content).toBe(`You are now **hidden**.`);
        });

        test('player with no sight behavior attribute hides in occupied hiding spot', async () => {
            const hideAction1 = new HideAction(testGame, undefined, astrid, astrid.location, false);
            await hideAction1.performHide(stall1);
            await sendMessages();
            clearMessages();

            const hideAction2 = new HideAction(testGame, undefined, nero, nero.location, false);
            await hideAction2.performHide(stall1);
            expect(stall1.occupants).toHaveSize(2);
            expect(stall1.hasOccupant(astrid)).toBe(true);
            expect(stall1.hasOccupant(nero)).toBe(true);
            expect(astrid.hasStatus("hidden")).toBe(true);
            expect(nero.hasStatus("hidden")).toBe(true);
            expect(deleteWhisperSpy).toHaveBeenCalledOnce();
            expect(createWhisperSpy).toHaveBeenCalledTimes(2);
            expect(stall1.whisper).not.toBeNull();
            expect(stall1.whisper.id).toBe(`locker-room-stall-1-an-individual-wearing-a-mask-nero`);
            expect(stall1.whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(nero.id)).toBeUndefined();
            expect(lockerRoom.occupantsString).toBe(`Asuka`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(stall1.whisper.channel.messages.cache).toHaveSize(0);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(0);
            expect(nero.notificationChannel.messages.cache).toHaveSize(2);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`Nero hides in STALL 1.`);
            expect(astridFirstNotificationMessage.content).toBe(`You're found by Nero! He hides with you.`);
            expect(neroFirstNotificationMessage.content).toBe(`When you hide in STALL 1, you find someone already there!`);
            expect(neroLastNotificationMessage.content).toBe(`You are now **hidden**.`);
        });

        test('player cannot hide in full hiding spot', async () => {
            const hideAction1 = new HideAction(testGame, undefined, astrid, astrid.location, false);
            await hideAction1.performHide(stall1);
            const hideAction2 = new HideAction(testGame, undefined, nero, nero.location, false);
            await hideAction2.performHide(stall1);
            await sendMessages();
            clearMessages();

            const hideAction3 = new HideAction(testGame, undefined, asuka, asuka.location, false);
            await hideAction3.performHide(stall1);
            expect(stall1.occupants).toHaveSize(2);
            expect(stall1.hasOccupant(astrid)).toBe(true);
            expect(stall1.hasOccupant(nero)).toBe(true);
            expect(stall1.hasOccupant(asuka)).toBe(false);
            expect(astrid.hasStatus("hidden")).toBe(true);
            expect(nero.hasStatus("hidden")).toBe(true);
            expect(asuka.hasStatus("hidden")).toBe(false);
            expect(deleteWhisperSpy).toHaveBeenCalledTimes(1);
            expect(createWhisperSpy).toHaveBeenCalledTimes(2);
            expect(stall1.whisper).not.toBeNull();
            expect(stall1.whisper.id).toBe(`locker-room-stall-1-an-individual-wearing-a-mask-nero`);
            expect(stall1.whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(nero.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(asuka.id)).toBeUndefined();
            expect(lockerRoom.occupantsString).toBe(`Asuka`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(stall1.whisper.channel.messages.cache).toHaveSize(0);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`Asuka attempts to hide in STALL 1, but there doesn't seem to be enough room for it.`);
            expect(astridFirstNotificationMessage.content).toBe(`You're found by Asuka! She tries to hide with you, but there isn't enough room.`);
            expect(asukaFirstNotificationMessage.content).toBe(`You attempt to hide in STALL 1, but you find an individual wearing a MASK and Nero already there! There doesn't seem to be enough room for you.`);
            expect(neroFirstNotificationMessage.content).toBe(`Someone finds you! They try to hide with you, but there isn't enough room.`);
        });

        test('player can hide in full hiding spot if forced', async () => {
            const hideAction1 = new HideAction(testGame, undefined, astrid, astrid.location, false);
            await hideAction1.performHide(stall1);
            const hideAction2 = new HideAction(testGame, undefined, nero, nero.location, false);
            await hideAction2.performHide(stall1);
            await sendMessages();
            clearMessages();

            const hideAction3 = new HideAction(testGame, undefined, asuka, asuka.location, true);
            await hideAction3.performHide(stall1);
            expect(stall1.occupants).toHaveSize(3);
            expect(stall1.hasOccupant(astrid)).toBe(true);
            expect(stall1.hasOccupant(nero)).toBe(true);
            expect(stall1.hasOccupant(asuka)).toBe(true);
            expect(astrid.hasStatus("hidden")).toBe(true);
            expect(nero.hasStatus("hidden")).toBe(true);
            expect(asuka.hasStatus("hidden")).toBe(true);
            expect(deleteWhisperSpy).toHaveBeenCalledTimes(2);
            expect(createWhisperSpy).toHaveBeenCalledTimes(3);
            expect(stall1.whisper).not.toBeNull();
            expect(stall1.whisper.id).toBe(`locker-room-stall-1-an-individual-wearing-a-mask-asuka-nero`);
            expect(stall1.whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(nero.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(asuka.id)).not.toBeUndefined();
            expect(lockerRoom.occupantsString).toBe(``);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(stall1.whisper.channel.messages.cache).toHaveSize(0);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`Asuka hides in STALL 1.`);
            expect(astridFirstNotificationMessage.content).toBe(`You're found by Asuka! She hides with you.`);
            expect(asukaFirstNotificationMessage.content).toBe(`When you hide in STALL 1, you find an individual wearing a MASK and Nero already there!`);
            expect(asukaLastNotificationMessage.content).toBe(`You are now **hidden**.`);
            expect(neroFirstNotificationMessage.content).toBe(`Someone finds you! They hide with you.`);
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

        test('party of two hide in empty hiding spot', async () => {
            const hideAction = new HideAction(testGame, undefined, astrid, astrid.location, false);
            await hideAction.performHide(stall1);
            expect(stall1.occupants).toHaveSize(2);
            expect(stall1.hasOccupant(astrid)).toBe(true);
            expect(stall1.hasOccupant(asuka)).toBe(true);
            expect(astrid.hasStatus("hidden")).toBe(true);
            expect(asuka.hasStatus("hidden")).toBe(true);
            expect(deleteWhisperSpy).not.toHaveBeenCalled();
            expect(createWhisperSpy).toHaveBeenCalledOnce();
            expect(stall1.whisper).not.toBeNull();
            expect(stall1.whisper.id).toBe(`locker-room-stall-1-an-individual-wearing-a-mask-asuka`);
            expect(stall1.whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(asuka.id)).not.toBeUndefined();
            expect(lockerRoom.occupantsString).toBe(`Nero`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(stall1.whisper.channel.messages.cache).toHaveSize(0);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
            expect(nero.notificationChannel.messages.cache).toHaveSize(0);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`An individual wearing a MASK and Asuka hide in STALL 1.`);
            expect(astridFirstNotificationMessage.content).toBe(`You and Asuka hide in STALL 1.`);
            expect(astridLastNotificationMessage.content).toBe(`You are now **hidden**.`);
            expect(asukaFirstNotificationMessage.content).toBe(`You and an individual wearing a MASK hide in STALL 1.`);
            expect(asukaLastNotificationMessage.content).toBe(`You are now **hidden**.`);
        });

        test('party of two cannot hide in full hiding spot', async () => {
            const hideAction1 = new HideAction(testGame, undefined, nero, nero.location, false);
            await hideAction1.performHide(stall1);
            await sendMessages();
            clearMessages();

            const hideAction2 = new HideAction(testGame, undefined, astrid, astrid.location, false);
            await hideAction2.performHide(stall1);
            expect(stall1.occupants).toHaveSize(1);
            expect(stall1.hasOccupant(astrid)).toBe(false);
            expect(stall1.hasOccupant(asuka)).toBe(false);
            expect(stall1.hasOccupant(nero)).toBe(true);
            expect(astrid.hasStatus("hidden")).toBe(false);
            expect(asuka.hasStatus("hidden")).toBe(false);
            expect(nero.hasStatus("hidden")).toBe(true);
            expect(deleteWhisperSpy).not.toHaveBeenCalled();
            expect(createWhisperSpy).toHaveBeenCalledOnce();
            expect(stall1.whisper).not.toBeNull();
            expect(stall1.whisper.id).toBe(`locker-room-stall-1-nero`);
            expect(stall1.whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(asuka.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(nero.id)).toBeUndefined();
            expect(lockerRoom.occupantsString).toBe(`an individual wearing a MASK and Asuka`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(stall1.whisper.channel.messages.cache).toHaveSize(0);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`An individual wearing a MASK and Asuka attempt to hide in STALL 1, but there doesn't seem to be enough room for them.`);
            expect(astridFirstNotificationMessage.content).toBe(`You attempt to hide in STALL 1, but you find Nero already there! There doesn't seem to be enough room for you and Asuka.`);
            expect(asukaFirstNotificationMessage.content).toBe(`You attempt to hide in STALL 1, but you find Nero already there! There doesn't seem to be enough room for you and an individual wearing a MASK.`);
            expect(neroFirstNotificationMessage.content).toBe(`Several people find you! They try to hide with you, but there isn't enough room.`);
        });

        test('party of two can hide in full hiding spot if forced', async () => {
            const hideAction1 = new HideAction(testGame, undefined, nero, nero.location, false);
            await hideAction1.performHide(stall1);
            await sendMessages();
            clearMessages();

            const hideAction2 = new HideAction(testGame, undefined, astrid, astrid.location, true);
            await hideAction2.performHide(stall1);
            expect(stall1.occupants).toHaveSize(3);
            expect(stall1.hasOccupant(astrid)).toBe(true);
            expect(stall1.hasOccupant(asuka)).toBe(true);
            expect(stall1.hasOccupant(nero)).toBe(true);
            expect(astrid.hasStatus("hidden")).toBe(true);
            expect(asuka.hasStatus("hidden")).toBe(true);
            expect(nero.hasStatus("hidden")).toBe(true);
            expect(deleteWhisperSpy).toHaveBeenCalledOnce();
            expect(createWhisperSpy).toHaveBeenCalledTimes(2);
            expect(stall1.whisper).not.toBeNull();
            expect(stall1.whisper.id).toBe(`locker-room-stall-1-an-individual-wearing-a-mask-asuka-nero`);
            expect(stall1.whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(asuka.id)).not.toBeUndefined();
            expect(stall1.whisper.channel.permissionOverwrites.resolve(nero.id)).toBeUndefined();
            expect(lockerRoom.occupantsString).toBe(``);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(stall1.whisper.channel.messages.cache).toHaveSize(0);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(2);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(2);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`An individual wearing a MASK and Asuka hide in STALL 1.`);
            expect(astridFirstNotificationMessage.content).toBe(`When you and Asuka hide in STALL 1, you find Nero already there!`);
            expect(astridLastNotificationMessage.content).toBe(`You are now **hidden**.`);
            expect(asukaFirstNotificationMessage.content).toBe(`When you and an individual wearing a MASK hide in STALL 1, you find Nero already there!`);
            expect(asukaLastNotificationMessage.content).toBe(`You are now **hidden**.`);
            expect(neroFirstNotificationMessage.content).toBe(`Several people find you! They hide with you.`);
        });
    });

    describe('party of three hide', () => {
        beforeAll(async () => {
            const followAction1 = new FollowAction(testGame, undefined, asuka, asuka.location, false);
            await followAction1.performFollow(astrid);
            const followAction2 = new FollowAction(testGame, undefined, nero, nero.location, false);
            await followAction2.performFollow(astrid);
            const leadAction = new LeadAction(testGame, undefined, astrid, astrid.location, false);
            await leadAction.performLead([asuka, nero]);
            await sendMessages();
            clearMessages();
            vi.clearAllMocks();
        });

        afterAll(async () => {
            const disbandAction = new DisbandPartyAction(testGame, undefined, astrid, astrid.location, false);
            await disbandAction.performDisbandParty(true);
        });

        test('party of three cannot hide in empty hiding spot', async () => {
            const hideAction1 = new HideAction(testGame, undefined, astrid, astrid.location, false);
            await hideAction1.performHide(stall1);
            expect(stall1.occupants).toHaveSize(0);
            expect(stall1.hasOccupant(astrid)).toBe(false);
            expect(stall1.hasOccupant(asuka)).toBe(false);
            expect(stall1.hasOccupant(nero)).toBe(false);
            expect(astrid.hasStatus("hidden")).toBe(false);
            expect(asuka.hasStatus("hidden")).toBe(false);
            expect(nero.hasStatus("hidden")).toBe(false);
            expect(deleteWhisperSpy).not.toHaveBeenCalled();
            expect(createWhisperSpy).not.toHaveBeenCalledOnce();
            expect(stall1.whisper).toBeNull();
            expect(lockerRoom.occupantsString).toBe(`an individual wearing a MASK, Asuka, and Nero`);

            await sendMessages();
            expect(lockerRoom.channel.messages.cache).toHaveSize(1);
            expect(astrid.notificationChannel.messages.cache).toHaveSize(1);
            expect(asuka.notificationChannel.messages.cache).toHaveSize(1);
            expect(nero.notificationChannel.messages.cache).toHaveSize(1);
            expect(lockerRoomFirstNarrationMessage.content).toBe(`An individual wearing a MASK, Asuka, and Nero attempt to hide in STALL 1, but there doesn't seem to be enough room for them.`);
            expect(astridFirstNotificationMessage.content).toBe(`You attempt to hide in STALL 1, but there doesn't seem to be enough room for you, Asuka, and Nero.`);
            expect(asukaFirstNotificationMessage.content).toBe(`You attempt to hide in STALL 1, but there doesn't seem to be enough room for you, an individual wearing a MASK, and Nero.`);
            expect(neroFirstNotificationMessage.content).toBe(`You attempt to hide in STALL 1, but there doesn't seem to be enough room for you, an individual wearing a MASK, and Asuka.`);
        });
    });
});
