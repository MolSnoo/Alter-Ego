import discord from "../__mocks__/libs/discord.js";
import * as DialogClass from "../../Data/Dialog.js";
import AnnounceAction from "../../Data/Actions/AnnounceAction.js";
import SayAction from "../../Data/Actions/SayAction.js";
import * as messageHandler from "../../Modules/messageHandler.js";
import { instantiateInventoryItem } from "../../Modules/itemManager.js";

/**
 * @import Player from "../../Data/Player.js"
 * @import Room from "../../Data/Room.js"
 */

describe('messageHandler test', () => {
    beforeAll(async () => {
        await game.entityLoader.loadAll();
    });

    describe('processIncomingMessage tests', () => {
        describe('announcement', () => {
            let dialogConstructorSpy;

            beforeEach(() => {
                dialogConstructorSpy = vi.spyOn(DialogClass, 'default');
            });

            afterEach(() => {
                dialogConstructorSpy.mockRestore();
            });

            test('announcement message by living player', () => {
                const kyra = game.entityFinder.getLivingPlayer("Kyra");
                const message = discord.createMockMessage({
                    content: "Good morning, everyone.",
                    member: kyra.member,
                    author: kyra.member.user,
                    channel: game.guildContext.announcementChannel
                });
                const announceActionSpy = vi.spyOn(AnnounceAction.prototype, 'performAnnounce').mockImplementationOnce(vi.fn((announcement) => {}));
                messageHandler.processIncomingMessage(game, message);
                expect(dialogConstructorSpy).toHaveBeenCalledOnce();
                expect(announceActionSpy).toHaveBeenCalledOnce();
            });

            test('announcement message by dead player', () => {
                const evad = game.entityFinder.getDeadPlayer("Evad");
                const message = discord.createMockMessage({
                    content: "Good morning, y'all.",
                    member: evad.member,
                    author: evad.member.user,
                    channel: game.guildContext.announcementChannel
                });
                const announceActionSpy = vi.spyOn(AnnounceAction.prototype, 'performAnnounce').mockImplementationOnce(vi.fn((announcement) => {}));
                messageHandler.processIncomingMessage(game, message);
                expect(dialogConstructorSpy).not.toHaveBeenCalled();
                expect(announceActionSpy).not.toHaveBeenCalled();
            });

            test('announcement message by non-player', () => {
                const member = discord.createMockMember();
                const message = discord.createMockMessage({
                    content: "Good morning, everyone.",
                    member: member,
                    author: member.user,
                    channel: game.guildContext.announcementChannel
                });
                const announceActionSpy = vi.spyOn(AnnounceAction.prototype, 'performAnnounce').mockImplementationOnce(vi.fn((announcement) => {}));
                messageHandler.processIncomingMessage(game, message);
                expect(dialogConstructorSpy).not.toHaveBeenCalled();
                expect(announceActionSpy).not.toHaveBeenCalled();
            });
        });

        describe('say', () => {
            /** 
             * Location: command-center
             * 
             * Behavior Attributes: concealed, no channel, see room, hear room
             * 
             * Knows: vivian, nero
             * @type {Player}
             */
            let kyra;
            /** 
             * Location: general-managers-office
             * 
             * Behavior Attributes:
             * 
             * Knows: kyra, nero
             * @type {Player}
             */
            let vivian;
            /** 
             * Location: floor-1-hall-2
             * 
             * Behavior Attributes: 
             * 
             * Knows: kiara
             * @type {Player}
             */
            let astrid;
            /** 
             * Location: courtyard
             * 
             * Behavior Attributes: sender, receiver
             * 
             * Knows: vivian, kyra
             * @type {Player}
             */
            let nero;
            /** 
             * Location: subject to change
             * 
             * Behavior Attributes: 
             * 
             * Knows: 
             * @type {Player}
             */
            let asuka;
            /** 
             * Location: subject to change
             * 
             * Behavior Attributes:
             * 
             * Knows: 
             * @type {Player}
             */
            let luna;
            /** 
             * Location: floor-1-hall-1
             * 
             * Behavior Attributes:
             * 
             * Knows: astrid
             * @type {Player}
             */
            let kiara;
            /** 
             * Location: command-center
             * 
             * Behavior Attributes: 
             * 
             * Knows: everyone
             * @type {Player}
             */
            let amadeus;
            /** 
             * Location: general-managers-office 
             * 
             * Behavior Attributes: hidden, sender, receiver
             * 
             * Knows: 
             * @type {Player}
             */
            let qm;
            /**
             * Tags: video surveilled, audio surveilled, audio monitoring
             * 
             * Audio Monitored By: lobby, command-center
             * 
             * Video Monitored By: lobby, command-center
             * 
             * Occupants: 
             * @type {Room}
             */
            let breakRoom;
            /** 
             * Tags: soundproof
             * 
             * Audio Monitored By: 
             * 
             * Video Monitored By: 
             * 
             * Occupants: vivian, qm (hidden in DESK)
             * @type {Room}
             */
            let gmOffice;
            /** 
             * Tags: video surveilled, audio surveilled
             * 
             * Audio Monitored By: lobby, break-room, command-center
             * 
             * Video Monitored By: lobby, command-center
             * 
             * Occupants: kiara
             * @type {Room}
             */
            let f1h1;
            /**
             * Tags: 
             * 
             * Audio Monitored By: 
             * 
             * Video Monitored By: 
             * 
             * Occupants: astrid
             * @type {Room}
             */
            let f1h2;
            /**
             * Tags: video monitoring, video surveilled, audio monitoring, audio surveilled
             * 
             * Audio Monitored By: break-room, command-center
             * 
             * Video Monitored By: command-center
             * 
             * Occupants: subject to change
             * @type {Room}
             */
            let lobby;
            /** 
             * Tags: soundproof, video monitoring, video surveilled, audio monitoring, audio surveilled, secret
             * 
             * Audio Monitored By: lobby, break-room 
             * 
             * Video Monitored By: lobby
             * 
             * Occupants: kyra, amadeus
             * @type {Room}
             */
            let commandCenter;
            /** 
             * Tags: 
             * 
             * Audio Monitored By: 
             * 
             * Video Monitored By: 
             * 
             * Occupants: subject to change
             * @type {Room}
             */
            let courtyard;
            /** @type {Player[]} */
            let players;
            /** @type {Room[]} */
            let rooms;

            beforeAll(() => {
                kyra = game.entityFinder.getLivingPlayer("Kyra");
                vivian = game.entityFinder.getLivingPlayer("Vivian");
                astrid = game.entityFinder.getLivingPlayer("Astrid");
                nero = game.entityFinder.getLivingPlayer("Nero");
                asuka = game.entityFinder.getLivingPlayer("Asuka");
                luna = game.entityFinder.getLivingPlayer("Luna");
                kiara = game.entityFinder.getLivingPlayer("Kiara");
                amadeus = game.entityFinder.getLivingPlayer("Amadeus");
                qm = game.entityFinder.getLivingPlayer("???");
                breakRoom = game.entityFinder.getRoom("break-room");
                gmOffice = game.entityFinder.getRoom("general-managers-office");
                f1h1 = game.entityFinder.getRoom("floor-1-hall-1");
                f1h2 = game.entityFinder.getRoom("floor-1-hall-2");
                lobby = game.entityFinder.getRoom("lobby");
                commandCenter = game.entityFinder.getRoom("command-center");
                courtyard = game.entityFinder.getRoom("courtyard");
                players = [kyra, vivian, astrid, nero, asuka, luna, kiara, amadeus, qm];
                rooms = [breakRoom, gmOffice, f1h1, f1h2, lobby, commandCenter, courtyard];

                kyra.location.removePlayer(kyra);
                commandCenter.addPlayer(kyra);
                amadeus.location.removePlayer(amadeus);
                commandCenter.addPlayer(amadeus);

                vivian.location.removePlayer(vivian);
                gmOffice.addPlayer(vivian);

                nero.location.removePlayer(nero);
                breakRoom.addPlayer(nero);

                astrid.location.removePlayer(astrid);
                f1h2.addPlayer(astrid);

                kiara.location.removePlayer(kiara);
                f1h1.addPlayer(kiara);
                
                luna.location.removePlayer(luna);
                courtyard.addPlayer(luna);
                asuka.location.removePlayer(asuka);
                courtyard.addPlayer(asuka);

                const mask = game.entityFinder.getPrefab("PLAGUE DOCTOR MASK");
                instantiateInventoryItem(mask, kyra, "FACE", null, "", 1, new Map());
            });

            beforeEach(() => {
                for (const player of players) {
                    if (player.isNPC) continue;
                    player.spectateChannel.messages.cache.clear();
                    player.notificationChannel.messages.cache.clear();
                }
                for (const room of rooms)
                    room.channel.messages.cache.clear();
            });

            test('standard dialog is communicated to spectate channels', async () => {
                const performSaySpy = vi.spyOn(SayAction.prototype, 'performSay');
                const message = discord.createPlayerMessage(luna, "Oh, hello!");
                await messageHandler.processIncomingMessage(game, message);
                await messageHandler.sendQueuedMessages(game);
                expect(performSaySpy).toHaveBeenCalledOnce();
                expect(game.communicationHandler.getDialogSpectateMirrors(message)).toHaveLength(2);
                for (const occupant of luna.location.occupants) {
                    expect(occupant.notificationChannel.messages.cache.size).toBe(0);
                    expect(occupant.spectateChannel.messages.cache.size).toBe(1);
                    const spectateMessage = occupant.spectateChannel.messages.cache.first();
                    expect(spectateMessage.webhookId).not.toBeNull();
                    expect(spectateMessage.author.username).toBe("Luna");
                    expect(spectateMessage.author.avatarURL()).toBe(luna.member.avatarURL());
                    expect(spectateMessage.content).toBe("Oh, hello!");
                }
            });
        });
    });
});