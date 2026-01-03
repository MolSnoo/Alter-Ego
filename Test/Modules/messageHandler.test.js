import discord from "../__mocks__/libs/discord.js";
import * as DialogClass from "../../Data/Dialog.js";
import AnnounceAction from "../../Data/Actions/AnnounceAction.js";
import { processIncomingMessage } from "../../Modules/messageHandler.js";

describe('messageHandler test', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
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
    });
});