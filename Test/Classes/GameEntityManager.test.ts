// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Player from "../../Data/Player.ts";
import Whisper from "../../Data/Whisper.ts";

describe('GameEntityManager test', () => {
    describe('createWhisper tests', () => {
        let astrid: Player;
        let nero: Player;
        let asuka: Player;
        let existingWhispersCount: number;

        beforeAll(async () => {
            await testGame.entityLoader.loadAll();
            astrid = testGame.entityFinder.getLivingPlayer("Astrid");
            nero = testGame.entityFinder.getLivingPlayer("Nero");
            asuka = testGame.entityFinder.getLivingPlayer("Asuka");
            existingWhispersCount = testGame.whispers.size;
        });

        test('createWhisper', async () => {
            const players = [nero, asuka, astrid];
            const whisper = await testGame.entityLoader.createWhisper(players);
            expect(whisper).toBeInstanceOf(Whisper);
            expect(whisper.channel).toBeDefined();
            expect(testGame.whispers.size).toBe(existingWhispersCount + 1);
            expect(testGame.whispers.has("lobby-astrid-asuka-nero")).toBe(true);
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
            const whisper = testGame.entityFinder.getWhisper(oldPlayers);
            const newId = Whisper.generateValidId(newPlayers, astrid.location);
            testGame.entityLoader.updateWhisperId(whisper, newId);
            expect(testGame.whispers.size).toBe(existingWhispersCount + 1);
            expect(testGame.whispers.has("lobby-astrid-asuka-nero")).toBe(false);
            expect(testGame.whispers.has("lobby-astrid-asuka")).toBe(true);
            expect(whisper.channelName).toBe("lobby-astrid-asuka");
            expect(whisper.channel.name).toBe(whisper.channelName);
        });

        test('deleteWhisper while autoDeleteWhisperChannels === true', async () => {
            testGame.settings.autoDeleteWhisperChannels = true;
            const players = [asuka, astrid];
            const whisper = testGame.entityFinder.getWhisper(players);
            await testGame.entityLoader.deleteWhisper(whisper);
            expect(whisper.channel.delete).toHaveBeenCalledOnce();
            expect(whisper.players.size).toBe(0);
            expect(testGame.whispers.has("lobby-astrid-asuka")).toBe(false);
        });

        test('deleteWhisper while autoDeleteWhisperChannels === false', async () => {
            testGame.settings.autoDeleteWhisperChannels = false;
            const players = [asuka, astrid];
            const whisper = await testGame.entityLoader.createWhisper(players);
            await testGame.entityLoader.deleteWhisper(whisper);
            expect(whisper.channel.name).toBe("archived-lobby");
            expect(whisper.channel.permissionOverwrites.resolve(asuka.id)).toBeUndefined();
            expect(whisper.channel.permissionOverwrites.resolve(astrid.id)).toBeUndefined();
            expect(whisper.channel.permissionOverwrites.cache.size).toBe(0);
            expect(whisper.players.size).toBe(0);
            expect(testGame.whispers.has("lobby-astrid-asuka")).toBe(false);
        });
    });
});
