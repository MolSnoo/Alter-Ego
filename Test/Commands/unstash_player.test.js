import PlayerCommand from "../../Classes/PlayerCommand.js";
import { usage, execute, config } from "../../Commands/unstash_player.js";
import UnstashAction from "../../Data/Actions/UnstashAction.js";
import InventoryItem from "../../Data/InventoryItem.js";
import { clearQueue } from "../../Modules/messageHandler.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe("unstash_player command", () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const unstash_player = new PlayerCommand(config, usage, execute);

    test("valid item from valid container", async () => {
        const player = game.entityFinder.getPlayer("Vivian");
        const spy = vi.spyOn(UnstashAction.prototype, "performUnstash");
        // @ts-ignore
        await unstash_player.execute(game, createMockMessage(), "retrieve", ["hamburger", "bun", "from", "pack", "of", "toilet", "paper"], player);
        expect(spy).toHaveBeenCalled()
    });
});
