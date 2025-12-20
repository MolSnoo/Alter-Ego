import { beforeAll, beforeEach, afterEach, afterAll, describe, test } from 'vitest';
import {usage, execute} from '../../Commands/uncraft_player.js';

describe('uncraft_player command', () => {
    test('', () => {});
    /*describe('no uncraftable inventory item in hands', () => {
        beforeEach(async () => {
            const players = [];
            const inventoryItems = [
                [ "Cella", "PEN CAP", "", "RIGHT HAND", "", "1", "", "<desc><s>This is a plain, black pen cap.</s></desc>" ],
                [ "Cella", "NULL", "", "LEFT HAND", "", "", "", "" ],
                [ "Cella", "PEN", "", "FACE", "", "1", "", "<desc><s>This is a plain, black pen.</s> <s>The cap is on.</s></desc>" ]
            ];
            await game.initPlayersAndInventories(players, inventoryItems);
            player = game.players_alive[0];
            player.getAttributeStatusEffects = vi.fn(() => []);
            player.uncraft = vi.fn(() => ({ ingredient1: null, ingredient2: null }));
        });

        test('should abort when empty args provided', async () => {
            const args = [];
            await uncraft_player.run(bot, game, message, 'uncraft', args, player);
            expect(game.messageHandler.addReply).toHaveBeenCalled();
            expect(player.getAttributeStatusEffects).not.toHaveBeenCalled();
        });

        test('cannot use command because player has attribute `disable uncraft`', async () => {
            const args = ['pen'];
            player.getAttributeStatusEffects.mockReturnValue([{ name: 'asleep' }]);
            await uncraft_player.run(bot, game, message, 'uncraft', args, player);
            expect(game.messageHandler.addReply).toHaveBeenCalledWith(message, 'You cannot do that because you are **asleep**.');
            expect(player.uncraft).not.toHaveBeenCalled();
        });

        test('item not in player\'s hand', async () => {
            const args = ['pen'];
            await uncraft_player.run(bot, game, message, 'uncraft', args, player);
            expect(game.messageHandler.addReply).toHaveBeenCalledWith(message, `Couldn't find item "PEN" in either of your hands.`);
            expect(player.uncraft).not.toHaveBeenCalled();
        });

        test('item not uncraftable', async () => {
            const args = ['pen cap'];
            await uncraft_player.run(bot, game, message, 'uncraft', args, player);
            expect(game.messageHandler.addReply).toHaveBeenCalledWith(message, `Couldn't find an uncraftable recipe that produces a PEN CAP. Contact a moderator if you think there should be one.`);
            expect(player.uncraft).not.toHaveBeenCalled();
        });
    });

    describe('no free hands', () => {
        beforeEach(async () => {
            const players = [];
            const inventoryItems = [
                [ "Cella", "PEN", "", "RIGHT HAND", "", "1", "", "<desc><s>This is a plain, black pen.</s> <s>The cap is on.</s></desc>" ],
                [ "Cella", "PEN", "", "LEFT HAND", "", "1", "", "" ]
            ];
            await game.initPlayersAndInventories(players, inventoryItems);
            player = game.players_alive[0];
            player.getAttributeStatusEffects = vi.fn(() => []);
            player.uncraft = vi.fn(() => ({ ingredient1: null, ingredient2: null }));
        });

        test('both hands contain uncraftable item', async () => {
            const args = ['pen'];
            await uncraft_player.run(bot, game, message, 'uncraft', args, player);
            expect(game.messageHandler.addReply).toHaveBeenCalledWith(message, `You do not have an empty hand to uncraft a PEN. Either drop the item in your other hand or stash it in one of your equipped items.`);
            expect(player.uncraft).not.toHaveBeenCalled();
        });
    });*/
});