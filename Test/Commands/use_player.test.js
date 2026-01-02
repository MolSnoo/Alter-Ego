import PlayerCommand from "../../Classes/PlayerCommand.js";
import { usage, execute, config } from "../../Commands/use_player.js";
import ActivateAction from "../../Data/Actions/ActivateAction.js";
import AttemptAction from "../../Data/Actions/AttemptAction.js";
import DeactivateAction from "../../Data/Actions/DeactivateAction.js";
import UseAction from "../../Data/Actions/UseAction.js";
import { createMockMessage, createMockUser } from "../__mocks__/libs/discord.js";
import { sendQueuedMessages, clearQueue } from "../../Modules/messageHandler.js";

describe("use_player command", () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const use_player = new PlayerCommand(config, usage, execute);

    test("on nothing", async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const user = createMockUser();
        const message = createMockMessage({ author: user });
        // @ts-ignore
        await use_player.execute(game, message, "use", ["invalid", "item"], player);
        await sendQueuedMessages(game);
        expect(user.send).toHaveBeenCalledWith("Couldn't find \"invalid item\" to use. Try using a different command?");
    });

    describe("on inventory item", () => {
        test("UseAction on valid item", async () => {
            const player = game.entityFinder.getPlayer("Kyra");
            const item = game.entityFinder.getInventoryItem("MUG OF COFFEE", "Kyra");
            const spy = vi.spyOn(UseAction.prototype, "performUse");
            // @ts-ignore
            await use_player.execute(game, createMockMessage(), "drink", ["coffee"], player);
            expect(spy).toHaveBeenCalledWith(item);
        });

        test("UseAction on no programmed use", async () => {
            const player = game.entityFinder.getPlayer("Kyra");
            const spy = vi.spyOn(UseAction.prototype, "performUse");
            const user = createMockUser();
            const message = createMockMessage({ author: user });
            // @ts-ignore
            await use_player.execute(game, createMockMessage(), "drink", ["coffee"], player);
            // @ts-ignore
            await use_player.execute(game, message, "use", ["dirty mug"], player);
            await sendQueuedMessages(game);
            expect(spy).toHaveBeenCalledOnce();
            expect(user.send).toHaveBeenCalledWith(
                "That item has no programmed use on its own, but you may be able to use it some other way."
            );
        });
    });

    describe("on fixture", () => {
        test("ActivateAction & DeactivateAction execution", async () => {
            const player = game.entityFinder.getPlayer("Luna");
            const fixture = game.entityFinder.getFixture("MICROWAVE", "kitchen");
            const activate_spy = vi.spyOn(ActivateAction.prototype, "performActivate");
            const deactivate_spy = vi.spyOn(DeactivateAction.prototype, "performDeactivate");
            for (let i = 0; i < 6; i++) {
                // @ts-ignore
                await use_player.execute(game, createMockMessage(), "use", ["microwave"], player);
            }
            expect(activate_spy).toHaveBeenLastCalledWith(fixture, true);
            expect(activate_spy).toHaveBeenCalledTimes(3);
            expect(deactivate_spy).toHaveBeenLastCalledWith(fixture, true);
            expect(deactivate_spy).toHaveBeenCalledTimes(3);
        });
    });

    describe("on puzzle", () => {
        test("AttemptAction execution", async () => {
            const player = game.entityFinder.getPlayer("Amadeus");
            const puzzle = game.entityFinder.getPuzzle("USERNAME", "general-managers-office", "password", true);
            const spy = vi.spyOn(AttemptAction.prototype, "performAttempt");
            // @ts-ignore
            await use_player.execute(game, createMockMessage(), "use", ["USERNAME", "root"], player);
            expect(spy).toHaveBeenCalledWith(puzzle, null, "root", "use", "root", undefined);
        });
    });

    describe("on fixture & puzzle", () => {
        test("AttemptAction & ActivateAction execution", async () => {
            const player = game.entityFinder.getPlayer("Kiara");
            const fixture = game.entityFinder.getFixture("SHOWER", "restroom-11");
            const puzzle = game.entityFinder.getPuzzle("SHOWER 11", "restroom-11", "toggle", true);
            const activate_spy = vi.spyOn(ActivateAction.prototype, "performActivate");
            const attempt_spy = vi.spyOn(AttemptAction.prototype, "performAttempt");
            // @ts-ignore
            await use_player.execute(game, createMockMessage(), "use", ["shower"], player);
            expect(activate_spy).toHaveBeenCalledWith(fixture, false);
            expect(attempt_spy).toHaveBeenCalledWith(puzzle, null, "", "use", "", player);
        });
    });
});
