const exit_bot = include('Commands/exit_bot');

var bot_mock = include('Test/Mocks/bot').mock;
var game_mock = include('Test/Mocks/game').mock;
var message_mock = include('Test/Mocks/message').mock;
var player_mock = include('Test/Mocks/player').mock;

describe('exit_bot command', () => {
    beforeEach(() => {
        bot = bot_mock;
        game = game_mock;
        message = message_mock;
        player = player_mock;
    });
        
    test('', async () => {});
});