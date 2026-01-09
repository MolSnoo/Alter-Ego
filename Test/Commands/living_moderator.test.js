import ModeratorCommand from "../../Classes/ModeratorCommand.js";
import { usage, execute, config } from "../../Commands/living_moderator.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";
import { sendQueuedMessages } from "../../Modules/messageHandler.js";

describe("living_moderator command", () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll()
    })

    const living_moderator = new ModeratorCommand(config, usage, execute);

    test("living_moderator execution", async () => {
        // @ts-ignore
        await living_moderator.execute(game, createMockMessage(), "living", []);
        sendQueuedMessages(game);
        /** @type {import('vitest').Mock} */
        // @ts-ignore
        const sendMock = game.guildContext.commandChannel.send;
        expect(sendMock).toHaveBeenCalledExactlyOnceWith("Living players:\nKyra Vivian Astrid Nero Asuka Luna Kiara Amadeus ???");
    });
});
