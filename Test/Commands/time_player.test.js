const time_player = include('Commands/time_player');

describe('time_player command', () => {
    beforeEach(() => {
        bot = {};
        
        game = {
            messageHandler: {
                addReply: jest.fn(),
                addGameMechanicMessage: jest.fn()
            }
        };
        
        message = {};
        
        player = {
            getAttributeStatusEffects: jest.fn(),
            member: {}
        };
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    test('should show time when player is ok', async () => {
        player.getAttributeStatusEffects.mockReturnValue([]);
        await time_player.run(bot, game, message, 'time', [], player);
        expect(game.messageHandler.addGameMechanicMessage).toHaveBeenCalled();
        expect(game.messageHandler.addReply).not.toHaveBeenCalled();
        const timeMessage = game.messageHandler.addGameMechanicMessage.mock.calls[0][1];
        expect(timeMessage).toBe(`The time is **${new Date().toLocaleTimeString()}**.`);
    });
    
    test('should not show time when player has disable time status', async () => {
        const statusEffect = { name: 'timeless' };
        player.getAttributeStatusEffects.mockReturnValue([statusEffect]);
        await time_player.run(bot, game, message, 'time', [], player);
        expect(game.messageHandler.addReply).toHaveBeenCalled();
        expect(game.messageHandler.addGameMechanicMessage).not.toHaveBeenCalled();
        const timeMessage = game.messageHandler.addReply.mock.calls[0][1];
        expect(timeMessage).toBe(`You cannot do that because you are **${statusEffect.name}**.`);
    });
});