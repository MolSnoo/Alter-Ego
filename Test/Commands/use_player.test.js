import PlayerCommand from "../../Classes/PlayerCommand.js";
import { usage, execute, config } from "../../Commands/use_player.js";
import ActivateAction from "../../Data/Actions/ActivateAction.js";
import AttemptAction from "../../Data/Actions/AttemptAction.js";
import DeactivateAction from "../../Data/Actions/DeactivateAction.js";
import UseAction from "../../Data/Actions/UseAction.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe("use_player command", () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        vi.resetAllMocks();
    });

    const use_player = new PlayerCommand(config, usage, execute);

    describe("on inventory item", () => {
        test("UseAction execution", async () => {
            const player = game.entityFinder.getPlayer("Kyra");
            const item = game.entityFinder.getInventoryItem("MUG OF COFFEE", "Kyra");
            const spy = vi.spyOn(UseAction.prototype, "performUse");
            // @ts-ignore
            await use_player.execute(game, createMockMessage(), "drink", ["coffee"], player);
            expect(spy).toHaveBeenCalledWith(item);
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
