import PlayerCommand from "../../Classes/PlayerCommand.js";
import { usage, execute, config } from "../../Commands/unstash_player.js";
import UnstashAction from "../../Data/Actions/UnstashAction.js";
import { clearQueue, sendQueuedMessages } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe("unstash_player command", () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
    });

    afterEach(async () => {
        await game.entityLoader.loadInventoryItems(false);
        clearQueue(game);
        vi.resetAllMocks();
    });

    const unstash_player = new PlayerCommand(config, usage, execute);

    test("valid item from valid container", async () => {
        const player = game.entityFinder.getPlayer("Vivian");
        const container = game.entityFinder.getInventoryItem("PACK OF TOILET PAPER 2", player.name);
        const [slot] = container.inventoryCollection.values();
        const [item] = slot.items;
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_player.execute(game, createMockMessage(), "retrieve", ["hamburger", "bun", "from", "pack", "of", "toilet", "paper"], player);
        expect(spy).toHaveBeenCalledWith(item, expect.toBeOneOf(game.entityFinder.getPlayerHands(player)), container, slot);
    });
    test("valid item without specified container", async () => {
        const player = game.entityFinder.getPlayer("Vivian");
        const containers = [game.entityFinder.getInventoryItem("PACK OF TOILET PAPER 2", player.name).container, game.entityFinder.getInventoryItem("PACK OF TOILET PAPER 3", player.name).container];
        const slots = containers.flatMap(item => Array.from(item.inventoryCollection.values()));
        const items = slots.flatMap(slot => slot.items).filter(item => item.name === "PACK OF TOILET PAPER");
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_player.execute(game, createMockMessage(), "retrieve", ["pack", "of", "toilet", "paper"], player);
        expect(spy).toHaveBeenCalledWith(expect.toBeOneOf(items), expect.toBeOneOf(game.entityFinder.getPlayerHands(player)), expect.toBeOneOf(containers), expect.toBeOneOf(slots));
    });
    test("valid item with item of same name in hand", async () => {
        const player = game.entityFinder.getPlayer("Vivian");
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_player.execute(game, createMockMessage(), "retrieve", ["pack", "of", "toilet", "paper"], player);
        // @ts-ignore
        await unstash_player.execute(game, createMockMessage(), "retrieve", ["pack", "of", "toilet", "paper"], player);
        expect(spy).toHaveBeenCalledTimes(2);
    });
    test("invalid item from valid container", async () => {
        const player = game.entityFinder.getPlayer("Vivian");
        const message = createMockMessage();
        const author = message.author;
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_player.execute(game, message, "retrieve", ["hamburger", "from", "pack", "of", "toilet", "paper"], player);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith("Couldn't find \"PACK OF TOILET PAPER\" in your inventory containing \"HAMBURGER\".");
    });
    test("valid item from invalid container", async () => {
        const player = game.entityFinder.getPlayer("Vivian");
        const message = createMockMessage();
        const author = message.author;
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_player.execute(game, message, "retrieve", ["hamburger", "bun", "from", "bag", "of", "toilet", "paper"], player);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith("Couldn't find \"BAG OF TOILET PAPER\" in your inventory containing \"HAMBURGER BUN\".");
    });
    test("no free hand", async () => {
        const player = game.entityFinder.getPlayer("Vivian");
        const message = createMockMessage();
        const author = message.author;
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_player.execute(game, message, "retrieve", ["hamburger", "bun", "from", "pack", "of", "toilet", "paper"], player);
        // @ts-ignore
        await unstash_player.execute(game, message, "retrieve", ["detergent", "from", "pack", "of", "toilet", "paper"], player);
        // @ts-ignore
        await unstash_player.execute(game, message, "retrieve", ["pack", "of", "toilet", "paper", "from", "white", "jeans"], player);
        await sendQueuedMessages(game);
        expect(spy).toHaveBeenCalledTimes(2);
        expect(author.send).toHaveBeenCalledWith("You do not have a free hand to retrieve an item. Either drop an item you're currently holding or stash it in one of your equipped items.");
    });
    test("valid item without container", async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const message = createMockMessage();
        const author = message.author;
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_player.execute(game, message, "retrieve", ["coffee"], player);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith("COFFEE is not contained in another item and cannot be unstashed.");
    });
});
