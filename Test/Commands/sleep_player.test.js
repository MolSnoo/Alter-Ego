const sleep_player = include('Commands/sleep_player');

var botMock = include('Test/Mocks/bot').mock;
var gameMock = include('Test/Mocks/game').mock;
var messageMock = include('Test/Mocks/message').mock;
var playerMock = include('Test/Mocks/player').mock;

describe('sleep_player command', () => {
    beforeEach(() => {
        bot = botMock;
        game = gameMock;
        message = messageMock;
        player = playerMock;
    });
    
    test('should inflict when conditions met', async () => {
        player.getAttributeStatusEffects.mockReturnValue([]);
        player.statusString.includes.mockReturnValue(true);
        await sleep_player.run(bot, game, message, 'sleep', [], player);
        expect(game.messageHandler.addReply).not.toHaveBeenCalled();
        expect(player.inflict).toHaveBeenCalled();
        expect(player.setOffline).toHaveBeenCalled();
    });

    test('shouldnt inflict when player inflicted with disable sleep', async () => {
        const statusEffect = { name: 'stimulated' };
        player.getAttributeStatusEffects.mockReturnValue([statusEffect]);
        await sleep_player.run(bot, game, message, 'sleep', [], player);
        const reply = game.messageHandler.addReply.mock.calls[0][1];
        expect(reply).toBe(`You cannot do that because you are **${statusEffect.name}**.`);
        expect(player.inflict).not.toHaveBeenCalled();
        expect(player.setOffline).not.toHaveBeenCalled();
    });
});