import PlayerCommand from '../../Classes/PlayerCommand.js';
import { usage, execute, config } from '../../Commands/knock_player.js'
import KnockAction from '../../Data/Actions/KnockAction.js';
import { clearQueue, sendQueuedMessages } from '../../Modules/messageHandler.js';
import { createMockMessage } from '../__mocks__/libs/discord.js';

describe('knock_player command', () => {
    beforeAll(async () => {
        if (!game.inProgress) await game.entityLoader.loadAll();
    });

    afterEach(async () => {
        clearQueue(game);
        vi.resetAllMocks();
    });

    const knock_player = new PlayerCommand(config, usage, execute);
        
    test('with valid exit', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const room = game.entityFinder.getRoom("suite-9");
        const exit = game.entityFinder.getExit(room, "DOOR");
        const spy = vi.spyOn(KnockAction.prototype, "performKnock");
        // @ts-ignore
        await knock_player.execute(game, createMockMessage(), "knock", ["door"], player);
        expect(spy).toHaveBeenCalledWith(exit);
    });
    test('with invalid exit', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const spy = vi.spyOn(KnockAction.prototype, "performKnock");
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await knock_player.execute(game, message, "knock", ["invalid"], player);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(author.send).toHaveBeenCalledWith(`Couldn't find exit "INVALID" in the room.`);
    });
});