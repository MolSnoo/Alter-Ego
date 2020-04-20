const settings = include('settings.json');
const parser = include(`${settings.modulesDir}/parser.js`);

const fs = require('fs');
const os = require('os');

const Player = include(`${settings.dataDir}/Player.js`);

let game = include('game.json');

module.exports.config = {
    name: "testspeeds_moderator",
    description: "Checks the move times between each exit.",
    details: 'Tests the amount of time it takes to move between every exit in the game. '
        + 'Sends the results as a text file to the command channel. '
        + 'An argument must be provided. If the "players" argument is given, then the move times will be calculated for each player in the game. '
        + 'Note that the weight of any items the players are carrying will affect their calculated speed. '
        + 'If the "stats" argument is given, then the move times will be calculated for hypothetical players with speed from 1-10.',
    usage: `${settings.commandPrefix}testspeeds players\n`
        + `${settings.commandPrefix}testspeeds stats`,
    usableBy: "Moderator",
    aliases: ["testspeeds"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `you need to specify what to test. Usage:\n${exports.config.usage}`);

    const file = "./speeds.txt";
    fs.writeFile(file, "", function (err) {
        if (err) return console.log(err);
    });

    if (args[0] === "players")
        await testplayers(file);
    else if (args[0] === "stats")
        await testspeeds(file);
    else return game.messageHandler.addReply(message, 'Function not found. You need to use "players" or "stats".');

    message.channel.send("Speeds calculated.", {
        files: [
            {
                attachment: file,
                name: `speeds-${args[0]}.txt`
            }
        ]
    });

    return;
};

testplayers = async (file) => {
    var text = "";
    for (let i = 0; i < game.rooms.length; i++) {
        const room = game.rooms[i];
        text += game.rooms[i].name + '\n';
        for (let j = 0; j < room.exit.length; j++) {
            const exit1 = room.exit[j];
            for (let k = 0; k < room.exit.length; k++) {
                const exit2 = room.exit[k];
                if (exit1.row !== exit2.row) {
                    text += "   ";
                    text += `${exit1.name} ==> ${exit2.name}\n`;
                    for (let l = 0; l < game.players.length; l++) {
                        let player = game.players[l];
                        // Save the original coordinates.
                        const x = player.pos.x;
                        const y = player.pos.y;
                        const z = player.pos.z;
                        player.pos.x = exit1.pos.x;
                        player.pos.y = exit1.pos.y;
                        player.pos.z = exit1.pos.z;

                        text += "      ";
                        text += `${player.name}: `;
                        const walkTime = Math.round(player.calculateMoveTime(exit2, false) / 1000);
                        text += `${walkTime} seconds walking, `;
                        const runTime = Math.round(player.calculateMoveTime(exit2, true) / 1000);
                        text += `${runTime} seconds running\n`;

                        player.pos.x = x;
                        player.pos.y = y;
                        player.pos.z = z;
                    }
                }
            }
        }
    }
    await appendText(file, text);

    return;
};

testspeeds = async (file) => {
    var text = "";
    for (let i = 0; i < game.rooms.length; i++) {
        const room = game.rooms[i];
        text += game.rooms[i].name + '\n';
        for (let j = 0; j < room.exit.length; j++) {
            const exit1 = room.exit[j];
            for (let k = 0; k < room.exit.length; k++) {
                const exit2 = room.exit[k];
                if (exit1.row !== exit2.row) {
                    text += "   ";
                    text += `${exit1.name} ==> ${exit2.name}\n`;
                    for (let l = 1; l <= 10; l++) {
                        let player = new Player("", null, "", "", "", "neutral", { speed: l }, true, room, null, [], "", [], 1);
                        player.pos.x = exit1.pos.x;
                        player.pos.y = exit1.pos.y;
                        player.pos.z = exit1.pos.z;

                        text += "      ";
                        text += `Speed ${l}: `;
                        const walkTime = Math.round(player.calculateMoveTime(exit2, false) / 1000);
                        text += `${walkTime} seconds walking, `;
                        const runTime = Math.round(player.calculateMoveTime(exit2, true) / 1000);
                        text += `${runTime} seconds running\n`;
                    }
                }
            }
        }
    }
    await appendText(file, text);

    return;
};

function appendText(file, text) {
    return new Promise((resolve) => {
        fs.appendFile(file, text + os.EOL, function (err) {
            if (err) return console.log(err);
            resolve(file);
        });
    });
}
