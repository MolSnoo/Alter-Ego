import ModeratorCommand from '../../Classes/ModeratorCommand.js';
import { usage, execute, config } from '../../Commands/knock_moderator.js'
import KnockAction from '../../Data/Actions/KnockAction.js';
import { clearQueue, sendQueuedMessages } from '../../Modules/messageHandler.js';
import { createMockMessage } from '../__mocks__/libs/discord.js';

describe('knock_moderator command', () => {
    beforeEach(async () => {
        await game.entityLoader.loadAll();
    });

    afterEach(() => {
        game.entityLoader.clearAll();
        clearQueue(game);
        vi.resetAllMocks();
    });

    const knock_moderator = new ModeratorCommand(config, usage, execute);
        
    test('with valid exit', async () => {
        const player = game.entityFinder.getPlayer("Kyra");
        const room = game.entityFinder.getRoom("suite-9");
        const exit = game.entityFinder.getExit(room, "DOOR");
        /** @type {KnockAction} */
        let context;
        const original = KnockAction.prototype.performKnock;
        const spy = vi.spyOn(KnockAction.prototype, "performKnock");
        spy.mockImplementation(function (...args) {
            context = this;
            return original.apply(this, args);
        });
        // @ts-ignore
        await knock_moderator.execute(game, createMockMessage(), "knock", ["kyra", "door"]);
        expect(context.player.name).toBe(player.name);
        expect(spy).toHaveBeenCalledWith(exit);
    });
    test('with invalid exit', async () => {
        /** @type {KnockAction} */
        let context;
        const original = KnockAction.prototype.performKnock;
        const spy = vi.spyOn(KnockAction.prototype, "performKnock");
        spy.mockImplementation(function (...args) {
            context = this;
            return original.apply(this, args);
        });
        const message = createMockMessage();
        const author = message.author;
        // @ts-ignore
        await knock_moderator.execute(game, message, "knock", ["kyra", "invalid"]);
        await sendQueuedMessages(game);
        expect(spy).not.toHaveBeenCalled();
        expect(context).toBeUndefined();
        expect(author.send).toHaveBeenCalledWith(`Couldn't find exit "INVALID" in the room.`);
    });
});