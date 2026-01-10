import discord from "../__mocks__/libs/discord.js";
import * as DialogClass from "../../Data/Dialog.js";
import AnnounceAction from "../../Data/Actions/AnnounceAction.js";
import { processIncomingMessage } from "../../Modules/messageHandler.js";

/**
 * @import Player from "../../Data/Player.js"
 * @import Room from "../../Data/Room.js"
 */

describe('messageHandler test', () => {
    beforeAll(async () => {
        await game.entityLoader.loadAll();
    });

    describe('processIncomingMessage tests', () => {
        let dialogConstructorSpy;

        beforeEach(() => {
            dialogConstructorSpy = vi.spyOn(DialogClass, 'default');
        });

        afterEach(() => {
            dialogConstructorSpy.mockRestore();
        });

        describe('announcement', () => {
            test('announcement message by living player', () => {
                const kyra = game.entityFinder.getLivingPlayer("Kyra");
                const message = discord.createMockMessage({
                    content: "Good morning, everyone.",
                    member: kyra.member,
                    author: kyra.member.user,
                    channel: game.guildContext.announcementChannel
                });
                const announceActionSpy = vi.spyOn(AnnounceAction.prototype, 'performAnnounce').mockImplementationOnce(vi.fn((announcement) => {}));
                processIncomingMessage(game, message);
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
                processIncomingMessage(game, message);
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
                processIncomingMessage(game, message);
                expect(dialogConstructorSpy).not.toHaveBeenCalled();
                expect(announceActionSpy).not.toHaveBeenCalled();
            });
        });

        describe('say', () => {
            /** @type {Player} */
            let kyra;
            /** @type {Player} */
            let vivian;
            /** @type {Player} */
            let astrid;
            /** @type {Player} */
            let nero;
            /** @type {Player} */
            let asuka;
            /** @type {Player} */
            let luna;
            /** @type {Player} */
            let kiara;
            /** @type {Player} */
            let amadeus;
            /** @type {Player} */
            let qm;
            /** @type {Room} */
            let breakRoom;
            /** @type {Room} */
            let gmOffice;
            /** @type {Room} */
            let f1h1;
            /** @type {Room} */
            let f1h2;
            /** @type {Room} */
            let lobby;
            /** @type {Room} */
            let commandCenter;
            /** @type {Room} */
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

                astrid.location.removePlayer(astrid);
                f1h2.addPlayer(astrid);

                kiara.location.removePlayer(kiara);
                f1h1.addPlayer(kiara);
                
                luna.location.removePlayer(luna);
                lobby.addPlayer(luna);
                asuka.location.removePlayer(asuka);
                lobby.addPlayer(asuka);

                nero.location.removePlayer(nero);
                courtyard.addPlayer(nero);
            });

            afterEach(() => {
                for (const player of players) {
                    if (player.isNPC) continue;
                    player.spectateChannel.messages.cache.clear();
                    player.notificationChannel.messages.cache.clear();
                }
                for (const room of rooms)
                    room.channel.messages.cache.clear();
            });

            
        });
    });
});