const sleep_player = include('Commands/sleep_player');

var bot_mock = include('Test/Mocks/bot').mock;
var game_mock = include('Test/Mocks/game').mock;
var message_mock = include('Test/Mocks/message').mock;
var player_mock = include('Test/Mocks/player').mock;

describe('sleep_player command', () => {
    beforeEach(() => {
        bot = bot_mock;
        game = game_mock;
        message = message_mock;
        player = player_mock;
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