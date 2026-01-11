import ModeratorCommand from "../../Classes/ModeratorCommand.js";
import { usage, execute, config } from '../../Commands/unstash_moderator.js'
import UnstashAction from "../../Data/Actions/UnstashAction.js";
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe("unstash_moderator command", () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
    });

    afterEach(async () => {
        await game.entityLoader.loadInventoryItems(false);
        clearQueue(game);
        vi.resetAllMocks();
    });

    const unstash_moderator = new ModeratorCommand(config, usage, execute);

    test("valid item from valid container", async () => {
        const player = game.entityFinder.getPlayer("Vivian");
        const container = game.entityFinder.getInventoryItem("PACK OF TOILET PAPER 2", player.name);
        const [slot] = container.inventoryCollection.values();
        const [item] = slot.items;
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_moderator.execute(game, createMockMessage(), "retrieve", ["vivian", "hamburger", "bun", "from", "pack", "of", "toilet", "paper", "2"]);
        expect(spy).toHaveBeenCalledWith(item, expect.toBeOneOf(game.entityFinder.getPlayerHands(player)), container, slot);
    });
    test("valid item without specified container", async () => {
        const player = game.entityFinder.getPlayer("Vivian");
        const containers = [game.entityFinder.getInventoryItem("PACK OF TOILET PAPER 2", player.name).container, game.entityFinder.getInventoryItem("PACK OF TOILET PAPER 3", player.name).container];
        const slots = containers.flatMap(item => Array.from(item.inventoryCollection.values()));
        const items = slots.flatMap(slot => slot.items).filter(item => item.name === "PACK OF TOILET PAPER");
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_moderator.execute(game, createMockMessage(), "retrieve", ["vivian", "pack", "of", "toilet", "paper"]);
        expect(spy).toHaveBeenCalledWith(expect.toBeOneOf(items), expect.toBeOneOf(game.entityFinder.getPlayerHands(player)), expect.toBeOneOf(containers), expect.toBeOneOf(slots));
    });
    test("valid item with item of same name in hand", async () => {
        const player = game.entityFinder.getPlayer("Vivian");
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_moderator.execute(game, createMockMessage(), "retrieve", ["vivian", "pack", "of", "toilet", "paper"]);
        // @ts-ignore
        await unstash_moderator.execute(game, createMockMessage(), "retrieve", ["vivian", "pack", "of", "toilet", "paper"]);
        expect(spy).toHaveBeenCalledTimes(2);
    });
    test("invalid item from valid container", async () => {
        const player = game.entityFinder.getPlayer("Vivian");
        const message = createMockMessage();
        const author = message.author;
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_moderator.execute(game, message, "retrieve", ["vivian", "hamburger", "from", "pack", "of", "toilet", "paper"]);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith("Couldn't find \"PACK OF TOILET PAPER\" in Vivian's inventory containing \"HAMBURGER\".");
    });
    test("valid item from invalid container", async () => {
        const player = game.entityFinder.getPlayer("Vivian");
        const message = createMockMessage();
        const author = message.author;
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_moderator.execute(game, message, "retrieve", ["vivian", "hamburger", "bun", "from", "bag", "of", "toilet", "paper"]);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith("Couldn't find \"BAG OF TOILET PAPER\" in Vivian's inventory containing \"HAMBURGER BUN\".");
    });
    test("no free hand", async () => {
        const player = game.entityFinder.getPlayer("Vivian");
        const message = createMockMessage();
        const author = message.author;
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_moderator.execute(game, message, "retrieve", ["vivian", "hamburger", "bun", "from", "pack", "of", "toilet", "paper"]);
        // @ts-ignore
        await unstash_moderator.execute(game, message, "retrieve", ["vivian", "detergent", "from", "pack", "of", "toilet", "paper"]);
        // @ts-ignore
        await unstash_moderator.execute(game, message, "retrieve", ["vivian", "pack", "of", "toilet", "paper", "from", "white", "jeans"]);
        await sendQueuedMessages(game);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(author.send).toHaveBeenCalledWith("Vivian does not have a free hand to retrieve an item.");
    });
    test("valid item without container", async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const message = createMockMessage();
        const author = message.author;
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_moderator.execute(game, message, "retrieve", ["kyra", "mug", "of", "coffee"]);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith("MUG OF COFFEE is not contained in another item and cannot be unstashed.");
    });
});
