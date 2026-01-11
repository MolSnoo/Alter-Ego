import ModeratorCommand from '../../Classes/ModeratorCommand.js';
import { usage, execute, config } from '../../Commands/instantiate_moderator.js'
import InstantiateAction from '../../Data/Actions/InstantiateAction.js';
import { clearQueue } from '../../Modules/messageHandler.js';
import { createMockMessage } from '../__mocks__/libs/discord.js';

describe('instantiate_moderator command', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
    });

    afterEach(async () => {
        await game.entityLoader.loadInventoryItems(false);
        await game.entityLoader.loadRoomItems(false);
        clearQueue(game);
        vi.resetAllMocks();
    });

    const instantiate_moderator = new ModeratorCommand(config, usage, execute);
        
    test('valid item into player hand', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const prefab = game.entityFinder.getPrefab("mug of coffee");
        /** @type {InstantiateAction} */
        let context;
        const original = InstantiateAction.prototype.performInstantiateInventoryItem;
        const spy = vi.spyOn(InstantiateAction.prototype, "performInstantiateInventoryItem");
        spy.mockImplementation(function (...args) {
            context = this;
            return original.apply(this, args);
        });
        // @ts-ignore
        await instantiate_moderator.execute(game, createMockMessage(), "create", ["mug", "of", "coffee", "in", "kyra's", "left", "hand"])
        expect(spy).toHaveBeenCalledWith(prefab, "LEFT HAND", null, "", 1, expect.any(Map));
        expect(context).not.toBeUndefined();
        expect(context.player.name).toBe(player.name);
    });
});