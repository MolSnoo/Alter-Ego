const demodata = include('Configs/demodata.json');
const playerdefaults = include('Configs/playerdefaults.json');

// Mock Room so that joinChannel/leaveChannel won't call Discord APIs.
jest.mock('../../Data/Room.js');

// Mock sheets before requiring loader so loader picks up the mocked sheets module.
jest.mock('../../Modules/sheets.js', () => ({
    getData: jest.fn()
}));
const sheets = include('Modules/sheets.js');
const loader = include('Modules/loader.js');

// Mock sheets.getData to resolve with the supplied values.
function mockSheetResponse (values) {
    sheets.getData.mockImplementationOnce((sheetrange, dataOperation) => {
        if (typeof dataOperation === 'function') {
            dataOperation({ data: { values: values } });
        }
    });
}

function formatDefaultPlayers() {
    return [
        ['12345', 'Cella', '', 'female', 'a cheerful voice', playerdefaults.defaultStats.strength, playerdefaults.defaultStats.intelligence, playerdefaults.defaultStats.dexterity, playerdefaults.defaultStats.speed, playerdefaults.defaultStats.stamina, 'TRUE', playerdefaults.defaultLocation, '', playerdefaults.statusEffects, playerdefaults.defaultDescription ],
        ['54321', 'Amadeus', '', 'neutral', 'a monotone voice', playerdefaults.defaultStats.strength, playerdefaults.defaultStats.intelligence, playerdefaults.defaultStats.dexterity, playerdefaults.defaultStats.speed, playerdefaults.defaultStats.stamina, 'TRUE', playerdefaults.defaultLocation, '', playerdefaults.statusEffects, playerdefaults.defaultDescription ]
    ];
}

function formatDefaultInventoryItems(players) {
    let inventoryItems = [];
    for (let i = 0; i < players.length; i++) {
        for (let j = 0; j < playerdefaults.defaultInventory.length; j++) {
            let inventoryItem = [players[i][1]];
            inventoryItem = inventoryItem.concat(playerdefaults.defaultInventory[j]);
            for (let k = 0; k < inventoryItem.length; k++) {
                if (inventoryItem[k].includes('#'))
                    inventoryItem[k] = inventoryItem[k].replace(/#/g, i + 1);
            }
            inventoryItems.push(inventoryItem);
        }
    }
    return inventoryItems;
}

module.exports.mock = {
    guild: { channels: { cache: [] }, members: { fetch: jest.fn() } },
    commandChannel: null,
    logChannel: null,
    inProgress: true,
    canJoin: false,
    halfTimer: null,
    endTimer: null,
    heated: false,
    editMode: false,
    players: [],
    players_alive: [],
    players_dead: [],
    rooms: [],
    objects: [],
    prefabs: [],
    recipes: [],
    items: [],
    puzzles: [],
    events: [],
    whispers: [],
    statusEffects: [],
    inventoryItems: [],
    gestures: [],
    messageHandler: {
        addReply: jest.fn(),
        addGameMechanicMessage: jest.fn()
    },

    init: jest.fn(async () => {
        this.mock.guild = this.mock.guild;

        mockSheetResponse(demodata.rooms);
        await loader.loadRooms(this.mock, false);

        mockSheetResponse(demodata.objects);
        await loader.loadObjects(this.mock, false);

        mockSheetResponse(demodata.prefabs);
        await loader.loadPrefabs(this.mock, false);

        mockSheetResponse(demodata.recipes);
        await loader.loadRecipes(this.mock, false);

        mockSheetResponse(demodata.items);
        await loader.loadItems(this.mock, false);

        mockSheetResponse(demodata.puzzles);
        await loader.loadPuzzles(this.mock, false);

        mockSheetResponse(demodata.events);
        await loader.loadEvents(this.mock, false);

        mockSheetResponse(demodata.statusEffects);
        await loader.loadStatusEffects(this.mock, false);

        mockSheetResponse(demodata.gestures);
        await loader.loadGestures(this.mock, false);
    }),

    initPlayersAndInventories: jest.fn(async (players = [], inventoryItems = []) => {
        // If no player data was supplied, create two players with the default player data.
        if (players.length === 0)
            players = formatDefaultPlayers();

        // Prevent loadPlayers from calling loadInventories internally by temporarily mocking loadInventories.
        const originalLoadInventories = loader.loadInventories;
        loader.loadInventories = jest.fn(async () => Promise.resolve(this.mock));

        mockSheetResponse(players);
        await loader.loadPlayers(this.mock, false);

        // Restore the original implementation so we can call it explicitly below.
        loader.loadInventories = originalLoadInventories;
        // If no inventory data was supplied, create default inventories for all players.
        if (inventoryItems.length === 0)
            inventoryItems = formatDefaultInventoryItems(players);

        mockSheetResponse(inventoryItems);
        await loader.loadInventories(this.mock, false);
    }),

    clearPlayersAndInventories: jest.fn(() => {
        for (let i = 0; i < this.mock.players.length; i++) {
            for (let j = 0; j < this.mock.players[i].status.length; j++) {
                if (this.mock.players[i].status[j].hasOwnProperty("timer") && this.mock.players[i].status[j].timer !== null)
                    this.mock.players[i].status[j].timer.stop();
            }
            this.mock.players[i].isMoving = false;
            clearInterval(this.mock.players[i].interval);
            clearInterval(this.mock.players[i].moveTimer);
            clearInterval(this.mock.players[i].onlineInterval);
            this.mock.players[i].remainingTime = 0;
            this.mock.players[i].moveQueue.length = 0;
        }
        this.mock.players.length = 0;
        this.mock.players_alive.length = 0;
        this.mock.players_dead.length = 0;
        this.mock.inventoryItems.length = 0;
    }),

    reset: jest.fn(() => {
        for (let i = 0; i < this.mock.objects.length; i++) {
            if (this.mock.objects[i].recipeInterval !== null)
                this.mock.objects[i].recipeInterval.stop();
            if (this.mock.objects[i].process.timer !== null)
                this.mock.objects[i].process.timer.stop();
        }
        for (let i = 0; i < this.mock.events.length; i++) {
            if (this.mock.events[i].timer !== null)
                this.mock.events[i].timer.stop();
            if (this.mock.events[i].effectsTimer !== null)
                this.mock.events[i].effectsTimer.stop();
        }
        for (let i = 0; i < this.mock.players.length; i++) {
            for (let j = 0; j < this.mock.players[i].status.length; j++) {
                if (this.mock.players[i].status[j].hasOwnProperty("timer") && this.mock.players[i].status[j].timer !== null)
                    this.mock.players[i].status[j].timer.stop();
            }
            this.mock.players[i].isMoving = false;
            clearInterval(this.mock.players[i].interval);
            clearInterval(this.mock.players[i].moveTimer);
            clearInterval(this.mock.players[i].onlineInterval);
            this.mock.players[i].remainingTime = 0;
            this.mock.players[i].moveQueue.length = 0;
        }

        this.mock.commandChannel = null;
        this.mock.logChannel = null;
        this.mock.inProgress = true;
        this.mock.canJoin = false;
        this.mock.halfTimer = null;
        this.mock.endTimer = null;
        this.mock.heated = false;
        this.mock.editMode = false;
        this.mock.players = [];
        this.mock.players_alive = [];
        this.mock.players_dead = [];
        this.mock.rooms = [];
        this.mock.objects = [];
        this.mock.prefabs = [];
        this.mock.recipes = [];
        this.mock.items = [];
        this.mock.puzzles = [];
        this.mock.events = [];
        this.mock.whispers = [];
        this.mock.statusEffects = [];
        this.mock.inventoryItems = [];
        this.mock.gestures = []
    })
};