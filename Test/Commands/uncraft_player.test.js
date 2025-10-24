const constants = include('Configs/constants.json');
const uncraft_player = include(`${constants.commandsDir}/uncraft_player.js`);

var botMock = include('Test/Mocks/bot').mock;
var gameMock = include('Test/Mocks/game').mock;
var messageMock = include('Test/Mocks/message').mock;
var player;

describe('uncraft_player command', () => {
    beforeAll(async () => {
        bot = botMock;
        game = gameMock;
        message = messageMock;
        await game.init();
    });

    beforeEach(async () => {
        await game.initPlayersAndInventories();
        player = game.players_alive[0];
        
        player.getAttributeStatusEffects = jest.fn();
    });

    afterAll(() => {
        game.reset();
    });

    describe('command failed', () => {
        beforeEach(() => {
            player.uncraft = jest.fn(() => ({ ingredient1: null, ingredient2: null }));
        });

        test('should abort when empty args provided', async () => {
            const args = [];
            await uncraft_player.run(bot, game, message, 'uncraft', args, player);
            expect(game.messageHandler.addReply).toHaveBeenCalled();
            expect(player.getAttributeStatusEffects).not.toHaveBeenCalled();
        });

        test('cannot use command because player has attribute `disable uncraft`', async () => {
            const args = ['pen'];
            player.getAttributeStatusEffects.mockReturnValue([{ name: 'asleep' }]);
            await uncraft_player.run(bot, game, message, 'uncraft', args, player);
            expect(game.messageHandler.addReply).toHaveBeenCalledWith(message, 'You cannot do that because you are **asleep**.');
            expect(player.uncraft).not.toHaveBeenCalled();
        });
    });

    test('', async () => {
        player.getAttributeStatusEffects.mockReturnValue([]);
        await uncraft_player.run(bot, game, message, 'uncraft', ['pen'], player);
    });
});