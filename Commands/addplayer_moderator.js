const settings = require('../Configs/settings.json');
const constants = require('../Configs/constants.json');
const playerdefaults = require('../Configs/playerdefaults.json');
const serverconfig = require('../Configs/serverconfig.json');
const sheets = require('../Modules/sheets.js');

const Player = require('../Data/Player.js');

module.exports.config = {
    name: "addplayer_moderator",
    description: "Adds a player to the game.",
    details: "Adds a user to the list of players for the current game. This command will give the specified user the "
        + "Player role and add their data to the players and inventory items spreadsheets. This will be generated "
        + "using the data in the playerdefaults config file. Note that edit mode must be turned on in order to use "
        + "this command. After using this command, you may edit the new Player's data. Then, the players sheet "
        + "must be loaded, otherwise the new player will not be created correctly, and their data may be overwritten.",
    usage: `${settings.commandPrefix}addplayer @cella`,
    usableBy: "Moderator",
    aliases: ["addplayer"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    if (game.inProgress && !game.editMode)
        return game.messageHandler.addReply(message, `You cannot add a player to the spreadsheet while edit mode is disabled. Please turn edit mode on before using this command.`);

    if (args.length !== 1) return game.messageHandler.addReply(message, `You need to mention a user to add. Usage:\n${exports.config.usage}`);

    const mentionedMember = message.mentions.members.first();
    const member = await game.guild.members.fetch(mentionedMember.id);
    if (!member) return game.messageHandler.addReply(message, `Couldn't find "${args[0]}" in the server. If the user you want isn't appearing in Discord's suggestions, type @ and enter their full username.`);

    for (let i = 0; i < game.players.length; i++) {
        if (member.id === game.players[i].id)
            return message.reply("That user is already playing.");
    }

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
        playerdefaults.defaultLocation,
        "",
        playerdefaults.defaultStatusEffects,
        playerdefaults.defaultDescription,
        new Array(),
        null
    );

    game.players.push(player);
    game.players_alive.push(player);
    member.roles.add(serverconfig.playerRole);

    var playerCells = [];
    var inventoryCells = [];
    playerCells.push([
        player.id,
        player.name,
        player.talent,
        player.pronounString,
        player.originalVoiceString,
        player.defaultStrength,
        player.defaultIntelligence,
        player.defaultDexterity,
        player.defaultSpeed,
        player.defaultStamina,
        player.alive,
        player.location,
        player.hidingSpot,
        player.status,
        player.description
    ]);

    for (let i = 0; i < playerdefaults.defaultInventory.length; i++) {
        let row = [player.name];
        row = row.concat(playerdefaults.defaultInventory[i]);
        for (let j = 0; j < row.length; j++) {
            if (row[j].includes('#'))
                row[j] = row[j].replace(/#/g, game.players.length);
        }
        inventoryCells.push(row);
    }

    try {
        await sheets.appendRows(constants.playerSheetDataCells, playerCells);
        await sheets.appendRows(constants.inventorySheetDataCells, inventoryCells);

        const successMessage = `<@${member.id}> has been added to the game. `
            + "After making any desired changes to the players and inventory items sheets, be sure to load players before disabling edit mode.";
        game.messageHandler.addGameMechanicMessage(message.channel, successMessage);
    }
    catch (err) {
        const errorMessage = `<@${member.id}> has been added to the game, but there was an error saving the data to the spreadsheet. `
            + "It is recommended that you add their data to the spreadsheet manually, then load it before proceeding. Error:\n```" + err + "```";
        game.messageHandler.addGameMechanicMessage(message.channel, errorMessage);
    }

    return;
};
