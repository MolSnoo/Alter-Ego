import ModeratorCommand from '../../Classes/ModeratorCommand.js';
import { usage, execute, config } from '../../Commands/destroy_moderator.js'
import DestroyAction from '../../Data/Actions/DestroyAction.js';
import { clearQueue } from '../../Modules/messageHandler.js';
import { createMockMessage } from '../__mocks__/libs/discord.js';

describe('destroy_moderator command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const destroy_moderator = new ModeratorCommand(config, usage, execute);
        
    test('given player hand with item', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const item = game.entityFinder.getInventoryItem("mug of coffee", "Kyra");
        /** @type {DestroyAction} */
        let context;
        const original = DestroyAction.prototype.performDestroyInventoryItem;
        const spy = vi.spyOn(DestroyAction.prototype, "performDestroyInventoryItem");
        spy.mockImplementation(function (...args) {
            context = this;
            return original.apply(this, args);
        });
        // @ts-ignore
        await destroy_moderator.execute(game, createMockMessage(), "destroy", ["kyra's", "right", "hand"]);
        expect(spy).toHaveBeenCalledWith(item, item.quantity, true, true);
        expect(context).not.toBeUndefined();
        expect(context.player.name).toBe(player.name);
    });
        
    test('given player hand without item', async () => {
        /** @type {DestroyAction} */
        let context;
        const original = DestroyAction.prototype.performDestroyInventoryItem;
        const spy = vi.spyOn(DestroyAction.prototype, "performDestroyInventoryItem");
        spy.mockImplementation(function (...args) {
            context = this;
            return original.apply(this, args);
        });
        // @ts-ignore
        await destroy_moderator.execute(game, createMockMessage(), "destroy", ["kyra's", "left", "hand"]);
        expect(spy).not.toHaveBeenCalled();
        expect(context).toBeUndefined();
        // todo: test reply
    });
});