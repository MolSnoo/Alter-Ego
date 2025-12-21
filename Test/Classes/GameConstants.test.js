import GameConstants from "../../Classes/GameConstants.js";

describe("GameConstants test", () => {
    const gameConstants = new GameConstants();

    test("Check Singleton Enforcement", () => {
        const newGameConstants = new GameConstants();
        expect(gameConstants === newGameConstants).toBeTruthy();
    });
});
