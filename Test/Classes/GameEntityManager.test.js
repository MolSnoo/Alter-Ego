import Whisper from "../../Data/Whisper.js";

/** @typedef {import("../../Data/Player.js").default} Player */

describe('GameEntityManager test', () => {
    describe('createWhisper tests', () => {
        /** @type {Player} */
        let astrid;
        /** @type {Player} */
        let nero;
        /** @type {Player} */
        let asuka;

        beforeAll(async () => {
            await game.entityLoader.loadAll();
            astrid = game.entityFinder.getLivingPlayer("Astrid");
            nero = game.entityFinder.getLivingPlayer("Nero");
            asuka = game.entityFinder.getLivingPlayer("Asuka");
        });

        test('createWhisper', async () => {
            const players = [nero, asuka, astrid];
            const whisper = await game.entityLoader.createWhisper(players);
            expect(whisper).toBeInstanceOf(Whisper);
            expect(whisper.channel).toBeDefined();
            expect(game.whispersCollection.size).toBe(1);
            expect(game.whispersCollection.has("lobby-astrid-asuka-nero")).toBe(true);
            for (const player of players) {
                expect(whisper.channel.permissionOverwrites.resolve(player.id)).toMatchObject({
                    ViewChannel: true,
                    ReadMessageHistory: true
                });
            }
        });

        test('updateWhisperId', () => {
            const oldPlayers = [asuka, astrid, nero];
            const newPlayers = [asuka, astrid];
            const whisper = game.entityFinder.getWhisper(oldPlayers);
            const newId = Whisper.generateValidId(newPlayers, astrid.location);
            game.entityLoader.updateWhisperId(whisper, newId);
            expect(game.whispersCollection.size).toBe(1);
            expect(game.whispersCollection.has("lobby-astrid-asuka-nero")).toBe(false);
            expect(game.whispersCollection.has("lobby-astrid-asuka")).toBe(true);
            expect(whisper.channelName).toBe("lobby-astrid-asuka");
            expect(whisper.channel.name).toBe(whisper.channelName);
        });

        test('deleteWhisper while autoDeleteWhisperChannels === true', async () => {
            game.settings.autoDeleteWhisperChannels = true;
            const players = [asuka, astrid];
            const whisper = game.entityFinder.getWhisper(players);
            await game.entityLoader.deleteWhisper(whisper);
            expect(whisper.channel.delete).toHaveBeenCalledOnce();
            expect(whisper.playersCollection.size).toBe(0);
            expect(game.whispersCollection.has("lobby-astrid-asuka")).toBe(false);
        });

        test('deleteWhisper while autoDeleteWhisperChannels === false', async () => {
            game.settings.autoDeleteWhisperChannels = false;
            const players = [asuka, astrid];
            const whisper = await game.entityLoader.createWhisper(players);
            await game.entityLoader.deleteWhisper(whisper);
            expect(whisper.channel.name).toBe("archived-lobby");
            expect(whisper.channel.permissionOverwrites.resolve(asuka.id)).toBeUndefined();
            expect(whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(whisper.channel.permissionOverwrites.cache.size).toBe(0);
            expect(whisper.playersCollection.size).toBe(0);
            expect(game.whispersCollection.has("lobby-astrid-asuka")).toBe(false);
        });
    });
});