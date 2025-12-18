import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';
import playerdefaults from '../Configs/playerdefaults.json' with { type: 'json' };
import { appendRowsToSheet } from '../Modules/sheets.js';

import Player from '../Data/Player.js';

/** @type {CommandConfig} */
export const config = {
    name: "addplayer_moderator",
    description: "Adds a player to the game.",
    details: "Adds a user to the list of players for the current game. This command will give the specified user the "
        + "Player role and add their data to the players and inventory items spreadsheets. This will be generated "
        + "using the data in the playerdefaults config file. Note that edit mode must be turned on in order to use "
        + "this command. After using this command, you may edit the new Player's data. Then, the players sheet "
        + "must be loaded, otherwise the new player will not be created correctly, and their data may be overwritten.",
    usableBy: "Moderator",
    aliases: ["addplayer"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}addplayer @cella`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (game.inProgress && !game.editMode)
        return messageHandler.addReply(game, message, `You cannot add a player to the spreadsheet while edit mode is disabled. Please turn edit mode on before using this command.`);

    if (args.length !== 1) return messageHandler.addReply(game, message, `You need to mention a user to add. Usage:\n${usage(game.settings)}`);

    const mentionedMember = message.mentions.members.first();
    const member = await game.guildContext.guild.members.fetch(mentionedMember.id);
    if (!member) return messageHandler.addReply(game, message, `Couldn't find "${args[0]}" in the server. If the user you want isn't appearing in Discord's suggestions, type @ and enter their full username.`);

    for (let i = 0; i < game.players.length; i++) {
        if (member.id === game.players[i].id)
            return message.reply("That user is already playing.");
    }

    var player = new Player(
        member.id,
        member,
        member.displayName,
        "",
        "neutral",
        "an average voice",
        playerdefaults.defaultStats,
        true,
        playerdefaults.defaultLocation,
        "",
        [],
        playerdefaults.defaultDescription,
        [],
        null,
        0,
        game
    );
    player.statusString = playerdefaults.defaultStatusEffects;

    game.players.push(player);
    game.players_alive.push(player);
    member.roles.add(game.guildContext.playerRole);

    var playerCells = [];
    var inventoryCells = [];
    playerCells.push([
        player.id,
        player.name,
        player.title,
        player.pronounString,
        player.originalVoiceString,
        String(player.defaultStrength),
        String(player.defaultIntelligence),
        String(player.defaultDexterity),
        String(player.defaultSpeed),
        String(player.defaultStamina),
        player.alive ? "TRUE" : "FALSE",
        player.locationDisplayName,
        player.hidingSpot,
        player.statusString,
        player.description
    ]);

    for (let i = 0; i < playerdefaults.defaultInventory.length; i++) {
        let row = [player.name];
        row = row.concat(playerdefaults.defaultInventory[i]);
        for (let j = 0; j < row.length; j++) {
            if (row[j].includes('#'))
                row[j] = row[j].replace(/#/g, String(game.players.length));
        }
        inventoryCells.push(row);
    }

    try {
        await appendRowsToSheet(game.constants.playerSheetDataCells, playerCells);
        await appendRowsToSheet(game.constants.inventorySheetDataCells, inventoryCells);

        const successMessage = `<@${member.id}> has been added to the game. `
            + "After making any desired changes to the players and inventory items sheets, be sure to load players before disabling edit mode.";
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, successMessage);
    }
    catch (err) {
        const errorMessage = `<@${member.id}> has been added to the game, but there was an error saving the data to the spreadsheet. `
            + "It is recommended that you add their data to the spreadsheet manually, then load it before proceeding. Error:\n```" + err + "```";
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, errorMessage);
    }

    return;
}
