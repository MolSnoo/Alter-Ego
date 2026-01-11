import PlayerCommand from '../../Classes/PlayerCommand.js';
import { usage, execute, config } from '../../Commands/unequip_player.js'
import UnequipAction from '../../Data/Actions/UnequipAction.js';
import { clearQueue, sendQueuedMessages } from '../../Modules/messageHandler.js';
import { createMockMessage } from '../__mocks__/libs/discord.js';

describe('unequip_player command', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
    });

    afterEach(async () => {
        await game.entityLoader.loadInventoryItems(false);
        clearQueue(game);
        vi.resetAllMocks();
    });

    const unequip_player = new PlayerCommand(config, usage, execute);
        
    test('given valid item', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const item = game.entityFinder.getInventoryItem("kyras glasses", "Kyra");
        const slot = player.inventoryCollection.get("GLASSES");
        const hand = game.entityFinder.getPlayerFreeHand(player);
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        // @ts-ignore
        await unequip_player.execute(game, createMockMessage(), "unequip", ["glasses"], player);
        expect(spy).toHaveBeenCalledWith(item, slot, hand);
    });
    test('given valid item from valid slot', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const item = game.entityFinder.getInventoryItem("kyras glasses", "Kyra");
        const slot = player.inventoryCollection.get("GLASSES");
        const hand = game.entityFinder.getPlayerFreeHand(player);
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        // @ts-ignore
        await unequip_player.execute(game, createMockMessage(), "unequip", ["glasses", "from", "glasses"], player);
        expect(spy).toHaveBeenCalledWith(item, slot, hand);
    });
    test('given invalid item', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_player.execute(game, message, "unequip", ["invalid"], player);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith(`Couldn't find equipped item "INVALID".`);
    });
    test('given valid item from invalid (unrelated) slot', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_player.execute(game, message, "unequip", ["glasses", "from", "jacket"], player);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith(`Couldn't find "GLASSES" equipped to JACKET.`);
    });
    test('given valid item from invalid (nonexistent) slot', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_player.execute(game, message, "unequip", ["glasses", "from", "invalid"], player);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith(`Couldn't find equipment slot "INVALID".`);
    });
    test('given anything from invalid (empty) slot', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_player.execute(game, message, "unequip", ["invalid", "from", "hat"], player);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith(`Nothing is equipped to "HAT".`);
    });
    test('given invalid item (held in hand)', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_player.execute(game, message, "unequip", ["coffee"], player);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith(`You cannot unequip items from your hands. To get rid of this item, use the drop command.`);
    });
    test('without free hand', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_player.execute(game, message, "unequip", ["glasses"], player);
        await unequip_player.execute(game, message, "unequip", ["tie"], player);
        await sendQueuedMessages(game);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(author.send).toHaveBeenCalledWith(`You do not have a free hand to unequip an item. Either drop an item you're currently holding or stash it in one of your equipped items.`);
    });
});