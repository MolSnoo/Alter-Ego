import { isAsyncFunction } from "util/types";
import EligibleCommand from "../../Classes/EligibleCommand.js";

describe("EligibleCommand test", () => {
    test("Construct Eligible Command", async () => {
        const command = new EligibleCommand(
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
