import ModeratorCommand from '../../Classes/ModeratorCommand.js';
import { usage, execute, config } from '../../Commands/unequip_moderator.js'
import UnequipAction from '../../Data/Actions/UnequipAction.js';
import { clearQueue, sendQueuedMessages } from '../../Modules/messageHandler.js';
import { createMockMessage } from '../__mocks__/libs/discord.js';

describe('unequip_moderator command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const unequip_moderator = new ModeratorCommand(config, usage, execute);
        
    test('given valid item', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const item = game.entityFinder.getInventoryItem("kyras glasses", "Kyra");
        const slot = player.inventoryCollection.get("GLASSES");
        const hand = game.entityFinder.getPlayerFreeHand(player);
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        // @ts-ignore
        await unequip_moderator.execute(game, createMockMessage(), "unequip", ["kyra's", "kyras", "glasses"]);
        expect(spy).toHaveBeenCalledWith(item, slot, hand);
    });
    test('given valid item from valid slot', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const item = game.entityFinder.getInventoryItem("kyras glasses", "Kyra");
        const slot = player.inventoryCollection.get("GLASSES");
        const hand = game.entityFinder.getPlayerFreeHand(player);
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        // @ts-ignore
        await unequip_moderator.execute(game, createMockMessage(), "unequip", ["kyra's", "kyras", "glasses", "from", "glasses"]);
        expect(spy).toHaveBeenCalledWith(item, slot, hand);
    });
    test('given invalid item', async () => {
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_moderator.execute(game, message, "unequip", ["kyra's", "invalid"]);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith(`Couldn't find equipped item "INVALID".`);
    });
    test('given valid item from invalid (unrelated) slot', async () => {
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_moderator.execute(game, message, "unequip", ["kyra's", "kyras", "glasses", "from", "jacket"]);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith(`Couldn't find "KYRAS GLASSES" equipped to JACKET.`);
    });
    test('given valid item from invalid (nonexistent) slot', async () => {
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_moderator.execute(game, message, "unequip", ["kyra's", "kyras", "glasses", "from", "invalid"]);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith(`Couldn't find equipment slot "INVALID".`);
    });
    test('given anything from invalid (empty) slot', async () => {
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_moderator.execute(game, message, "unequip", ["kyra's", "invalid", "from", "hat"]);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith(`Nothing is equipped to "HAT".`);
    });
    test('given invalid item (held in hand)', async () => {
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_moderator.execute(game, message, "unequip", ["kyra's", "mug", "of", "coffee"]);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith(`Cannot unequip items from either of Kyra's hands. To get rid of this item, use the drop command.`);
    });
    test('given no player', async () => {
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_moderator.execute(game, message, "unequip", ["glasses"]);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith(`You need to specify a player and an item. Usage:\n${unequip_moderator.usage(game.settings)}`);
    });
    test('given no player (alternate)', async () => {
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_moderator.execute(game, message, "unequip", ["kyras", "glasses", "from", "glasses"]);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith(`Player "kyras" not found.`);
    });
    test('without free hand', async () => {
        const spy = vi.spyOn(UnequipAction.prototype, "performUnequip");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await unequip_moderator.execute(game, message, "unequip", ["kyra's", "kyras", "glasses"]);
        await unequip_moderator.execute(game, message, "unequip", ["kyra's", "kyras", "tie"]);
        await sendQueuedMessages(game);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(author.send).toHaveBeenCalledWith(`Kyra does not have a free hand to unequip an item.`);
    });
});