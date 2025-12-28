import ModeratorCommand from "../../Classes/ModeratorCommand.js";
import { usage, execute, config } from "../../Commands/dead_moderator.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";
import * as messageHandler from "../../Modules/messageHandler.js";

describe("dead_moderator command", () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll()
    })

    const dead_moderator = new ModeratorCommand(config, usage, execute);

    test("dead_moderator execution", async () => {
        // @ts-ignore
        await dead_moderator.execute(game, createMockMessage(), "dead", []);
        messageHandler.sendQueuedMessages(game);
        /** @type {import('vitest').Mock} */
        // @ts-ignore
        const sendMock = game.guildContext.commandChannel.send;
        expect(sendMock).toHaveBeenCalledExactlyOnceWith("Dead players:\nEvad, Wu");
    });
});
