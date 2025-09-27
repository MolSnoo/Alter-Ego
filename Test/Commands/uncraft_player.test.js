const uncraft_player = include('Commands/uncraft_player');

var botMock = include('Test/Mocks/bot').mock;
var gameMock = include('Test/Mocks/game').mock;
var messageMock = include('Test/Mocks/message').mock;
var playerMock = include('Test/Mocks/player').mock;

describe('uncraft_player command', () => {
    beforeEach(() => {
        bot = botMock;
        game = gameMock;
        message = messageMock;
        player = playerMock;
    });
        
    test('should abort when empty args provided', async () => {
        await uncraft_player.run(bot, game, message, 'uncraft', [], player)
        expect(game.messageHandler.addReply).toHaveBeenCalled();
        expect(player.getAttributeStatusEffects).not.toHaveBeenCalled();
    });
        
    test('', async () => {
        player.getAttributeStatusEffects.mockReturnValue([]);
        await uncraft_player.run(bot, game, message, 'uncraft', ['pen'], player)
    });
});