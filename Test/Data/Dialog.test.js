import { createMockMessage } from "../__mocks__/libs/discord.js";
import Dialog from "../../Data/Dialog.js";

describe('Dialog test', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
        const kyra = game.entityFinder.getLivingPlayer("Kyra");
        const breakRoom = game.entityFinder.getRoom("break-room");
        kyra.location.removePlayer(kyra);
        breakRoom.addPlayer(kyra);
        const astrid = game.entityFinder.getLivingPlayer("Astrid");
        const floor1Hall2 = game.entityFinder.getRoom("floor-1-hall-2");
        astrid.location.removePlayer(astrid);
        floor1Hall2.addPlayer(astrid);
    });

    test('standard dialog construction', () => {
        const kyra = game.entityFinder.getLivingPlayer("Kyra");
        const message = createMockMessage({
            content: 'Hello.',
            member: kyra.member,
            author: kyra.member.user,
            channel: kyra.location.channel
        });
        const dialog = new Dialog(game, message, kyra, kyra.location);
        expect(dialog.isAnnouncement).toBe(false);
        expect(dialog.whisper).toBe(null);
        expect(dialog.attachments.size).toBe(0);
        expect(dialog.embeds).toHaveLength(0);
        expect(dialog.speakerDisplayName).toBe("Kyra");
        expect(dialog.speakerDisplayIcon).toBe(kyra.member.displayAvatarURL());
        expect(dialog.speakerVoiceString).toBe("a crisp voice");
        expect(dialog.speakerRecognitionName).toBe("Kyra");
        expect(dialog.isOOCMessage).toBe(false);
        expect(dialog.isShouted).toBe(false);
        expect(dialog.neighboringRooms).toHaveLength(1);
        expect(dialog.neighboringRooms.at(0).id).toBe("floor-1-hall-2");
        expect(dialog.acuteHearingContext).toHaveLength(1);
        expect(dialog.acuteHearingContext.at(0).id).toBe("floor-1-hall-2");
        expect(dialog.locationIsAudioSurveilled).toBe(false);
        expect(dialog.locationIsVideoSurveilled).toBe(false);
        expect(dialog.neighboringAudioSurveilledRooms).toHaveLength(0);
        expect(dialog.audioMonitoringRooms).toHaveLength(0);
        expect(dialog.receivers).toHaveLength(0);
    });

    describe('shouting tests', () => {
        test('standard shouted dialog', () => {
            const kyra = game.entityFinder.getLivingPlayer("Kyra");
            const message = createMockMessage({
                content: 'HELLO!',
                member: kyra.member,
                author: kyra.member.user,
                channel: kyra.location.channel
            });
            const dialog = new Dialog(game, message, kyra, kyra.location);
            expect(dialog.isShouted).toBe(true);
        });

        test('shouted dialog insufficient length', () => {
            const kyra = game.entityFinder.getLivingPlayer("Kyra");
            const message = createMockMessage({
                content: 'I...',
                member: kyra.member,
                author: kyra.member.user,
                channel: kyra.location.channel
            });
            const dialog = new Dialog(game, message, kyra, kyra.location);
            expect(dialog.isShouted).toBe(false);
        });

        test('shouted dialog in french', () => {
            const astrid = game.entityFinder.getLivingPlayer("Astrid");
            const message = createMockMessage({
                content: 'SŒUR',
                member: astrid.member,
                author: astrid.member.user,
                channel: astrid.location.channel
            });
            const dialog = new Dialog(game, message, astrid, astrid.location);
            expect(dialog.isShouted).toBe(true);
        });

        test('shouted dialog is emoji', () => {
            const kyra = game.entityFinder.getLivingPlayer("Kyra");
            const message = createMockMessage({
                content: '<:WHAT:722254291686916137>',
                member: kyra.member,
                author: kyra.member.user,
                channel: kyra.location.channel
            });
            const dialog = new Dialog(game, message, kyra, kyra.location);
            expect(dialog.isShouted).toBe(false);
        });

        test('shouted dialog of insufficient length with emoji', () => {
            const kyra = game.entityFinder.getLivingPlayer("Kyra");
            const message = createMockMessage({
                content: 'I... :WHAT:',
                member: kyra.member,
                author: kyra.member.user,
                channel: kyra.location.channel
            });
            const dialog = new Dialog(game, message, kyra, kyra.location);
            expect(dialog.isShouted).toBe(false);
        });

        test('shouted dialog with emoji', () => {
            const kyra = game.entityFinder.getLivingPlayer("Kyra");
            const message = createMockMessage({
                content: 'WHAT? :WHAT:',
                member: kyra.member,
                author: kyra.member.user,
                channel: kyra.location.channel
            });
            const dialog = new Dialog(game, message, kyra, kyra.location);
            expect(dialog.isShouted).toBe(true);
        });
    });
});