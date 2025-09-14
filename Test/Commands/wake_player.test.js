const wake_player = include('Commands/wake_player');

var botMock = include('Test/Mocks/bot').mock;
var gameMock = include('Test/Mocks/game').mock;
var messageMock = include('Test/Mocks/message').mock;
var playerMock = include('Test/Mocks/player').mock;

describe('wake_player command', () => {
    beforeEach(() => {
        bot = botMock;
        game = gameMock;
        message = messageMock;
        player = playerMock;
    });

    test('should cure when conditions met', async () => {
        player.getAttributeStatusEffects.mockReturnValue([]);
        player.statusString.includes.mockReturnValue(true);
        await wake_player.run(bot, game, message, 'wake', [], player);
        expect(game.messageHandler.addReply).not.toHaveBeenCalled();
        expect(player.cure).toHaveBeenCalled();
    });

    test('shouldnt cure when player inflicted with disable wake', async () => {
        const statusEffect = { name: 'tranquilized' };
        player.getAttributeStatusEffects.mockReturnValue([statusEffect]);
        player.statusString.includes.mockReturnValue(true);
        await wake_player.run(bot, game, message, 'wake', [], player);
        const reply = game.messageHandler.addReply.mock.calls[0][1];
        expect(reply).toBe(`You cannot do that because you are **${statusEffect.name}**.`);
        expect(player.cure).not.toHaveBeenCalled();
    });

    test('shouldnt cure when player not asleep', async () => {
        player.getAttributeStatusEffects.mockReturnValue([]);
        player.statusString.includes.mockReturnValue(false);
        await wake_player.run(bot, game, message, 'wake', [], player);
        const reply = game.messageHandler.addReply.mock.calls[0][1];
        expect(reply).toBe("You are not currently asleep.");
        expect(player.cure).not.toHaveBeenCalled();
    });
});