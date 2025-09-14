const setvoice_bot = include('Commands/setvoice_bot');

var botMock = include('Test/Mocks/bot').mock;
var gameMock = include('Test/Mocks/game').mock;
var messageMock = include('Test/Mocks/message').mock;
var playerMock = include('Test/Mocks/player').mock;

describe('setvoice_bot command', () => {
    beforeEach(() => {
        bot = botMock;
        game = gameMock;
        message = messageMock;
        player = playerMock;
    });
        
    test('', async () => {});
});