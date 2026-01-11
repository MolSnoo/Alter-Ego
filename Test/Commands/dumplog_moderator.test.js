import ModeratorCommand from "../../Classes/ModeratorCommand.js";
import { usage, execute, config } from "../../Commands/dumplog_moderator.js";
import { createMockMessage } from "../__mocks__/libs/discord.js";

describe("dumplog_moderator command", () => {
    const dumplog_moderator = new ModeratorCommand(config, usage, execute);

    test('execute', async () => {
        const mockMessage = createMockMessage();
        // @ts-ignore
        await dumplog_moderator.execute(game, mockMessage, "dumplog", [])
        expect(game.messageQueue.size()).toStrictEqual(0);
        expect(game.guildContext.commandChannel.send).toHaveBeenCalledOnce()
        // @ts-ignore
        expect(game.guildContext.commandChannel.send.mock.lastCall[0].content).toBe("Successfully generated log files.")
        // @ts-ignore
        expect(game.guildContext.commandChannel.send.mock.lastCall[0].files.length).toBe(2)
    });
});
