// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import PlayerCommand from "../../Classes/PlayerCommand.ts";
import {usage, execute, config} from "../../Commands/status_player.js";
import {clearQueue, sendQueuedMessages} from "../../Modules/messageHandler.ts";
import {createMockMessage} from "../__mocks__/libs/discord.js";
import GameCommunicationHandler from "../../Classes/GameCommunicationHandler.ts";
import Status from "../../Data/Status.ts";
import {Duration} from "luxon";
import {createDisableStatus} from "../__mocks__/utility.ts";

/** 
 * @type import("vitest").Mock<(player: import("../../Data/Player.ts").default, messageText: string, mirrorInSpectateChannel?: boolean, messageType?: import("../../Modules/enums.ts").MessageDisplayType, attachments?: import("discord.js").Collection<string, import("discord.js").Attachment>, interactables?: import("../../Classes/Interactables/Interactable.ts").default[]) => void> 
 */
let spy;

describe("status_player command", () => {
    beforeAll(async () => {
        if (!testGame.inProgress) await testGame.entityLoader.loadAll();
    });

    beforeEach(() => {
        spy = vi.spyOn(GameCommunicationHandler.prototype, "sendMessageToPlayer");
    })

    afterEach(async () => {
        clearQueue(testGame);
        vi.resetAllMocks();
    });

    const status_player = new PlayerCommand(config, usage, execute);

    test("player with status effects", async () => {
        const player = testGame.entityFinder.getPlayer("Kyra");
        await status_player.execute(testGame, createMockMessage(), "", [], player);
        expect(spy).toHaveBeenCalledWith(player, "You are currently:\nsatisfied, well rested, clean", false);
    });
    test("player without status effects", async () => {
        const player = testGame.entityFinder.getPlayer("Astrid");
        await status_player.execute(testGame, createMockMessage(), "", [], player);
        expect(spy).toHaveBeenCalledWith(player, "You are currently:\n", false);
    });
    test("player with command disabled", async () => {
        const player = testGame.entityFinder.getPlayer("Astrid");
        let getBehavior = vi.spyOn(player, "getBehaviorAttributeStatusEffects");
        getBehavior.mockReturnValue([createDisableStatus(player, "status")]);
        let replySpy = vi.spyOn(testGame.communicationHandler, "reply");
        let message = createMockMessage();
        await status_player.execute(testGame, message, "", [], player);
        expect(replySpy).toHaveBeenCalledWith(message, "You cannot do that because you are **MOCK_DISABLED_STATUS**.");
    });
});
