const settings = include('Configs/settings.json');
const constants = include('Configs/constants.json');
const playerdefaults = include('Configs/playerdefaults.json');
const serverconfig = include('Configs/serverconfig.json');
const sheets = include(`${constants.modulesDir}/sheets.js`);

const Player = include(`${constants.dataDir}/Player.js`);

module.exports.config = {
    name: "addplayer_moderator",
    description: "Adds a player to the game.",
    details: "Adds a player to the list of players for the current game. You can additionally specify a "
        + "non-default starting room and a list of non-default status effects. Note that if you specify "
        + "a list of non-default status effects, the default status effects will not be applied.",
    usage: `${settings.commandPrefix}addplayer @MolSno\n`
        + `${settings.commandPrefix}addplayer @MolSno kitchen\n`
        + `${settings.commandPrefix}addplayer @MolSno living-room warm, well rested, full\n`,
    usableBy: "Moderator",
    aliases: ["addplayer"]
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to mention a user to add. Usage:\n${exports.config.usage}`);

    const member = message.mentions.members.first();
    var location = null;
    var status = null;
    var locationCheck = false;
    var statusCheck = 0;

    for (let i = 0; i < game.players.length; i++) {
        if (member.id === game.players[i].id)
            return message.reply("That user is already playing.");
    }

    if (args.length === 1) {
        location = playerdefaults.defaultLocation;
        status = playerdefaults.defaultStatusEffects.split(', ');
    }
    else if (args.length === 2) {
        location = args[1];
        status = playerdefaults.defaultStatusEffects.split(', ');
    }
    else if (args.length >= 3) {
        location = args[1];
        status = args.slice(2).join(' ').split(', ');
    }

    if (settings.debug) {
        console.log(location)
        console.log(status)
        console.log(args)
    }

    for (let i = 0; i < game.rooms.length; i++) {
        if (game.rooms[i].name === location) {
            locationCheck = true;
            break;
        }
    }
    for (let i = 0; i < game.statusEffects.length; i++) {
        if (status.includes(game.statusEffects[i].name)) {
            statusCheck++;
        }
        if (statusCheck === status.length) break;
    }

    if (!locationCheck)
        return game.messageHandler.addReply(message, `Room ${location} couldn't be found.`);
    if (statusCheck !== status.length)
        return game.messageHandler.addReply(message, `Not all given status effects could be found. Missing: ${status.length - statusCheck}.`);

    var player = new Player(
        member.id,
        member,
        member.displayName,
        member.displayName,
        "",
        "neutral",
        "an average voice",
        playerdefaults.defaultStats,
        true,
        location,
        "",
        status.join(", "),
        playerdefaults.defaultDescription,
        new Array(),
        null
    );
    game.players.push(player);
    game.players_alive.push(player);
    member.roles.add(serverconfig.playerRole);
    var playerCells = [];
    var inventoryCells = [];
    for (let i = 0; i < game.players.length; i++) {
        const p = game.players[i];
        const playerData = [
            p.id,
            p.name,
            p.talent,
            p.pronounString,
            p.originalVoiceString,
            p.strength,
            p.intelligence,
            p.dexterity,
            p.speed,
            p.stamina,
            p.alive,
            p.location,
            p.hidingSpot,
            p.status,
            p.description
        ];
        playerCells.push(playerData);

        for (let j = 0; j < playerdefaults.defaultInventory.length; j++) {
            var row = [player.name];
            row = row.concat(playerdefaults.defaultInventory[j]);
            for (let k = 0; k < row.length; k++) {
                if (row[k].includes('#'))
                    row[k] = row[k].replace(/#/g, i + 1);
            }
            inventoryCells.push(row);
        }
    }
    sheets.updateData(constants.playerSheetDataCells, playerCells);
    sheets.updateData(constants.inventorySheetDataCells, inventoryCells);
    message.channel.send(`<@${member.id}> added to game!`);

    return;
};
