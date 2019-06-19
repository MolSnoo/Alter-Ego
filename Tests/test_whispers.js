const settings = include('settings.json');

var assert = require('assert');

const Exit = include(`${settings.dataDir}/Exit.js`);
const Room = include(`${settings.dataDir}/Room.js`);
const Player = include(`${settings.dataDir}/Player.js`);
const InventoryItem = include(`${settings.dataDir}/InventoryItem.js`);
const Whisper = include(`${settings.dataDir}/Whisper.js`);

exports.run = async function (bot) {
    let game = include('game.json');
    game.guild = bot.guilds.first();
    game.logChannel = game.guild.channels.find(channel => channel.id === settings.logChannel);

    await init(game);
    await test_create_whispers(game);
    await test_move_player_0(game);
    await test_move_player_1(game);
    await test_move_player_2(game);

    for (let i = 0; i < game.whispers.length; i++)
        await game.whispers[i].channel.delete().catch();
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].location.name !== game.rooms[0].name) {
            game.rooms[1].removePlayer(game, game.players_alive[i], game.rooms[1].exit[0], null);
            game.rooms[0].addPlayer(game, game.players_alive[i], game.rooms[0].exit[0], null, false);
        }
    }
    return;
};

async function init(game) {
    game.rooms.push(
        new Room(
            "lobby",
            true,
            game.guild.channels.find(channel => channel.name === "lobby"),
            new Exit(
                "DOOR 1",
                "dorm-1",
                "DOOR",
                66
            ),
            63
        )
    );
    game.rooms.push(
        new Room(
            "dorm-1",
            true,
            game.guild.channels.find(channel => channel.name === "dorm-1"),
            new Exit(
                "DOOR",
                "lobby",
                "DOOR 1",
                66
            ),
            66
        )
    );
    const item = new InventoryItem(null, null, null, null, null, null, null, null, 3);
    game.players_alive.push(
        new Player(
            "578764435766640640",
            game.guild.members.find(member => member.id === "578764435766640640"),
            "Nero",
            "Nero",
            "",
            1,
            true,
            game.rooms[0],
            "",
            new Array(),
            new Array(item, item, item),
            3
        )
    );
    game.players_alive.push(
        new Player(
            "132591626366353410",
            game.guild.members.find(member => member.id === "132591626366353410"),
            "Faye",
            "Faye",
            "",
            1,
            true,
            game.rooms[0],
            "",
            new Array(),
            new Array(item, item, item),
            6
        )
    );
    game.players_alive.push(
        new Player(
            "430830419793936394",
            game.guild.members.find(member => member.id === "430830419793936394"),
            "Jared",
            "Jared",
            "",
            1,
            true,
            game.rooms[0],
            "",
            new Array(),
            new Array(item, item, item),
            9
        )
    );
    game.players = game.players_alive;

    for (let i = 0; i < game.rooms.length; i++) {
        for (let j = 0; j < game.rooms[i].exit.length; j++) {
            game.rooms[i].exit[j].dest = game.rooms.find(room => room.name === game.rooms[i].exit[j].dest);
        }
        for (let j = 0; j < game.players_alive.length; j++) {
            if (game.players_alive[j].location.name === game.rooms[i].name) {
                game.rooms[i].addPlayer(game, game.players_alive[j], null, null, false);
            }
        }
    }
}

async function test_create_whispers(game) {
    var whisper0 = new Whisper([game.players_alive[1], game.players_alive[2]], game.rooms[0]);
    await whisper0.init(game);
    game.whispers.push(whisper0);
    assert.ok(
        game.whispers[0].channelName === "lobby-faye-jared",
        game.whispers[0].channelName
    );

    var whisper1 = new Whisper([game.players_alive[0], game.players_alive[1], game.players_alive[2]], game.rooms[0]);
    await whisper1.init(game);
    game.whispers.push(whisper1);
    assert.ok(
        game.whispers[1].channelName === "lobby-faye-jared-nero",
        game.whispers[1].channelName
    );

    var whisper2 = new Whisper([game.players_alive[0], game.players_alive[2]], game.rooms[0]);
    await whisper2.init(game);
    game.whispers.push(whisper2);
    assert.ok(
        game.whispers[2].channelName === "lobby-jared-nero",
        game.whispers[2].channelName
    );

    var whisper3 = new Whisper([game.players_alive[0], game.players_alive[1]], game.rooms[0]);
    await whisper3.init(game);
    game.whispers.push(whisper3);
    assert.ok(
        game.whispers[3].channelName === "lobby-faye-nero",
        game.whispers[3].channelName
    );
}

async function test_move_player_0(game) {
    game.rooms[0].removePlayer(game, game.players_alive[0], game.rooms[0].exit[0], null);
    game.rooms[1].addPlayer(game, game.players_alive[0], game.rooms[1].exit[0], null, false);

    assert.ok(
        game.whispers.length === 3,
        game.whispers.length
    );

    assert.ok(
        game.whispers[0].channelName === "lobby-faye-jared",
        game.whispers[0].channelName
    );

    assert.ok(
        game.whispers[1].channelName === "lobby-jared",
        game.whispers[1].channelName
    );

    assert.ok(
        game.whispers[2].channelName === "lobby-faye",
        game.whispers[2].channelName
    );
}

async function test_move_player_1(game) {
    game.rooms[0].removePlayer(game, game.players_alive[1], game.rooms[0].exit[0], null);
    game.rooms[1].addPlayer(game, game.players_alive[1], game.rooms[1].exit[0], null, false);

    assert.ok(
        game.whispers.length === 1
    );

    assert.ok(
        game.whispers[0].channelName === "lobby-jared",
        game.whispers[0].channelName
    );
}

async function test_move_player_2(game) {
    game.rooms[0].removePlayer(game, game.players_alive[2], game.rooms[0].exit[0], null);
    game.rooms[1].addPlayer(game, game.players_alive[2], game.rooms[1].exit[0], null, false);

    assert.ok(
        game.whispers.length === 0
    );
}
