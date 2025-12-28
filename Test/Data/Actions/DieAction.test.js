import DieAction from "../../../Data/Actions/DieAction.js";
import Player from "../../../Data/Player.js";
import { createMockMessage } from "../../__mocks__/libs/discord.js";

describe('DieAction test', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll()
    })

    test('DieAction perform', () => {
        const mockMessage = createMockMessage();
        const player = game.entityFinder.getLivingPlayer("???");
        expect(player).toBeInstanceOf(Player);
        // @ts-ignore
        const death = new DieAction(game, mockMessage, player, player.location, true);
        death.performDie();
        expect(game.messageQueue.size).toStrictEqual(2);
    })
})