const move_player = include('Commands/move_player');

var bot_mock = include('Test/Mocks/bot').mock;
var game_mock = include('Test/Mocks/game').mock;
var message_mock = include('Test/Mocks/message').mock;
var player_mock = include('Test/Mocks/player').mock;

describe('move_player command', () => {
    beforeEach(() => {
        bot = bot_mock;
        game = game_mock;
        message = message_mock;
        player = player_mock;
    });
        
    test('', async () => {});
});