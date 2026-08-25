// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import PlayerCommand from "../../Classes/PlayerCommand.ts";
import { usage, execute, config } from "../../Commands/use_player.js";
import ActivateAction from "../../Data/Actions/ActivateAction.ts";
import AttemptAction from "../../Data/Actions/AttemptAction.ts";
import DeactivateAction from "../../Data/Actions/DeactivateAction.ts";
import ActivateAndAttemptAction from "../../Data/Actions/ActivateAndAttemptAction.ts";
import DeactivateAndAttemptAction from "../../Data/Actions/DeactivateAndAttemptAction.ts";
import UseAction from "../../Data/Actions/UseAction.ts";
import { createMockMessage, createMockUser } from "../__mocks__/libs/discord.js";
import { sendQueuedMessages, clearQueue } from "../../Modules/messageHandler.ts";

describe("use_player command", () => {
    beforeAll(async () => {
        if (!testGame.inProgress) await testGame.entityLoader.loadAll();
    });

    afterEach(async () => {
        clearQueue(testGame);
        vi.resetAllMocks();
    });

    const use_player = new PlayerCommand(config, usage, execute);

    test("on nothing", async () => {
        const player = testGame.entityFinder.getPlayer("Kyra");
        const user = createMockUser();
        const message = createMockMessage({ author: user });
        // @ts-ignore
        await use_player.execute(testGame, message, "use", ["invalid", "item"], player);
        await sendQueuedMessages(testGame);
        expect(user.send).toBeInvokedWith("Couldn't find \"invalid item\" to use. Try using a different command?");
    });

    describe("on inventory item", () => {
        afterEach(async () => {
            await testGame.entityLoader.loadPlayers(false);
        });

        test("UseAction on valid item", async () => {
            const player = testGame.entityFinder.getPlayer("Kyra");
            const item = testGame.entityFinder.getInventoryItem("MUG OF COFFEE", "Kyra");
            const spy = vi.spyOn(UseAction.prototype, "performUse");
            // @ts-ignore
            await use_player.execute(testGame, createMockMessage(), "drink", ["coffee"], player);
            expect(spy).toBeInvokedWith(item);
        });

        test("UseAction on no programmed use", async () => {
            const player = testGame.entityFinder.getPlayer("Kyra");
            const spy = vi.spyOn(UseAction.prototype, "performUse");
            const user = createMockUser();
            const message = createMockMessage({ author: user });
            // @ts-ignore
            await use_player.execute(testGame, createMockMessage(), "drink", ["coffee"], player);
            // @ts-ignore
            await use_player.execute(testGame, message, "use", ["dirty", "mug"], player);
            await sendQueuedMessages(testGame);
            expect(spy).toHaveBeenCalledOnce();
            expect(user.send).toBeInvokedWith(
                "That item has no programmed use on its own, but you may be able to use it some other way."
            );
        });

        test("UseAction without current effect", async () => {
            const player = testGame.entityFinder.getPlayer("Kyra");
            const spy = vi.spyOn(UseAction.prototype, "performUse");
            const user = createMockUser();
            const message = createMockMessage({ author: user });
            // @ts-ignore
            await use_player.execute(testGame, createMockMessage(), "drink", ["coffee"], player);
            await testGame.entityLoader.loadInventoryItems(false);
            // @ts-ignore
            await use_player.execute(testGame, message, "drink", ["coffee"], player);
            await sendQueuedMessages(testGame);
            expect(spy).toHaveBeenCalledOnce();
            expect(user.send).toBeInvokedWith(
                "COFFEE currently has no effect on you."
            );
        });
    });

    describe("on fixture", () => {
        afterEach(async () => {
            await testGame.entityLoader.loadFixtures(false);
        });

        test("ActivateAction & DeactivateAction execution", async () => {
            const player = testGame.entityFinder.getPlayer("Luna");
            const fixture = testGame.entityFinder.getFixture("MICROWAVE", "kitchen");
            const activate_spy = vi.spyOn(ActivateAction.prototype, "performActivate");
            const deactivate_spy = vi.spyOn(DeactivateAction.prototype, "performDeactivate");
            for (let i = 0; i < 6; i++) {
                // @ts-ignore
                await use_player.execute(testGame, createMockMessage(), "use", ["microwave"], player);
            }
            expect(activate_spy).toHaveBeenLastCalledWith(fixture, true);
            expect(activate_spy).toHaveBeenCalledTimes(3);
            expect(deactivate_spy).toHaveBeenLastCalledWith(fixture, true);
            expect(deactivate_spy).toHaveBeenCalledTimes(3);
        });
    });

    describe("on puzzle", () => {
        afterEach(async () => {
            await testGame.entityLoader.loadPuzzles(false);
        });

        test("AttemptAction execution", async () => {
            const player = testGame.entityFinder.getPlayer("Amadeus");
            const puzzle = testGame.entityFinder.getPuzzle("USERNAME", "general-managers-office", "password", true);
            const spy = vi.spyOn(AttemptAction.prototype, "performAttempt");
            // @ts-ignore
            await use_player.execute(testGame, createMockMessage(), "use", ["USERNAME", "root"], player);
            expect(spy).toBeInvokedWith(puzzle, null, "root", "use", "root", null);
        });
    });

    describe("on fixture & puzzle", () => {
        afterAll(async () => {
            await testGame.entityLoader.loadFixtures(false);
            await testGame.entityLoader.loadPuzzles(false);
        });

        test("ActivateAndAttemptAction execution", async () => {
            const player = testGame.entityFinder.getPlayer("Kiara");
            const fixture = testGame.entityFinder.getFixture("SHOWER", "restroom-11");
            const puzzle = testGame.entityFinder.getPuzzle("SHOWER 11", "restroom-11", "toggle", true);
            const activate_and_attempt_spy = vi.spyOn(ActivateAndAttemptAction.prototype, "performActivateAndAttempt");
            // @ts-ignore
            await use_player.execute(testGame, createMockMessage(), "use", ["shower"], player);
            expect(activate_and_attempt_spy).toBeInvokedWith(fixture, puzzle, null, "", "use", "", null);
        });

        test("DeactivateAndAttemptAction execution", async () => {
            const player = testGame.entityFinder.getPlayer("Kiara");
            const fixture = testGame.entityFinder.getFixture("SHOWER", "restroom-11");
            const puzzle = testGame.entityFinder.getPuzzle("SHOWER 11", "restroom-11", "toggle", true);
            const deactivate_and_attempt_spy = vi.spyOn(DeactivateAndAttemptAction.prototype, "performDeactivateAndAttempt");
            // @ts-ignore
            await use_player.execute(testGame, createMockMessage(), "use", ["shower"], player);
            expect(deactivate_and_attempt_spy).toBeInvokedWith(fixture, puzzle, null, "", "use", "", null);
        });
    });
});
