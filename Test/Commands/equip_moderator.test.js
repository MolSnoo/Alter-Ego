const equip_moderator = include('Commands/equip_moderator');

var botMock = include('Test/Mocks/bot').mock;
var gameMock = include('Test/Mocks/game').mock;
var messageMock = include('Test/Mocks/message').mock;
var playerMock = include('Test/Mocks/player').mock;

describe('equip_moderator command', () => {
    beforeEach(() => {
        bot = botMock;
        game = gameMock;
        message = messageMock;
        player = playerMock;
    });
        
    test('', async () => {});
});