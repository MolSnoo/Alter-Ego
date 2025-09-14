const knock_player = include('Commands/knock_player');

var botMock = include('Test/Mocks/bot').mock;
var gameMock = include('Test/Mocks/game').mock;
var messageMock = include('Test/Mocks/message').mock;
var playerMock = include('Test/Mocks/player').mock;

describe('knock_player command', () => {
    beforeEach(() => {
        bot = botMock;
        game = gameMock;
        message = messageMock;
        player = playerMock;
    });
        
    test('', async () => {});
});