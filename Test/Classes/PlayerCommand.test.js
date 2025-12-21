import { isAsyncFunction } from "util/types";
import PlayerCommand from "../../Classes/PlayerCommand.js";

describe("PlayerCommand test", () => {
    test("Construct Player Command", async () => {
        const command = new PlayerCommand(
            { name: "", description: "", details: "", usableBy: "", aliases: [], requiresGame: false },
            () => "",
            async () => {}
        );

        expect(command.config.aliases instanceof Array).toBeTruthy();
        expect(typeof command.config.description === "string").toBeTruthy();
        expect(typeof command.config.details === "string").toBeTruthy();
        expect(typeof command.config.name === "string").toBeTruthy();
        expect(typeof command.config.requiresGame === "boolean").toBeTruthy();
        expect(typeof command.config.usableBy === "string").toBeTruthy();
        expect(isAsyncFunction(command.execute)).toBeTruthy();
        expect(command.usage instanceof Function).toBeTruthy();
    });
});
