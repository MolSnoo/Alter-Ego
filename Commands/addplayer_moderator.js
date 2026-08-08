import Game from '../Data/Game.ts';
import Player from '../Data/Player.ts';
import Room from '../Data/Room.ts';
import { appendRowsToSheet } from '../Modules/sheets.js';
import { Collection } from 'discord.js';
import {loadPlayerDefaults} from "../Modules/settingsLoader.ts";

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "addplayer_moderator",
    description: "Adds a player to the game.",
    details: "Adds a user to the list of players for the current game. This command will give the specified user the "
        + "Player role and add their data to the Players and Inventory Items spreadsheets. This will be generated "
        + "using the data in the \`Player Defaults\` section of your \`.env\` file. However, their name will be set as "
        + "whatever their current nickname is in the server. So, you should set their nickname to their character's "
        + "name before using this command. Note that edit mode must be turned on in order to use this command. "
        + "After using this command, you may edit the new player's data. Then, the Players sheet must be loaded, "
        + "otherwise the new player will not be created correctly, and their data may be overwritten.",
    usableBy: "Moderator",
    aliases: ["addplayer"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}addplayer @cella`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Moderator} moderator - The moderator who issued the command.
 */
export async function execute(game, message, command, args, moderator) {
    if (game.inProgress && !game.editMode)
        return game.communicationHandler.reply(message, `You cannot add a player to the spreadsheet while edit mode is disabled. Please turn edit mode on before using this command.`);

    if (args.length !== 1) return game.communicationHandler.reply(message, `You need to mention a user to add. Usage:\n${usage(game.settings)}`);

    const mentionedMember = message.mentions.members.first();
    const member = await game.guildContext.guild.members.fetch(mentionedMember.id);
    if (!member) return game.communicationHandler.reply(message, `Couldn't find "${args[0]}" in the server. If the user you want isn't appearing in Discord's suggestions, type @ and enter their full username.`);

    for (const player of game.players.values()) {
        if (member.id === player.id)
            return game.communicationHandler.reply(message, "That user is already playing.");
    }

    const playerName = Player.generateValidName(member.displayName);
    if (!playerName || playerName === "")
        return game.communicationHandler.reply(message, `<@${member.id}>'s username consists entirely of invalid characters. Please set their nickname first, preferably without any spaces or special characters.`);
    /** @type {Messageable} */
    let notificationChannel;
    try {
        notificationChannel = await game.guildContext.createDM(member);
    } catch (error) { console.error(error); }
    if (!notificationChannel)
        return game.communicationHandler.reply(message, `Couldn't create a DM channel with <@${member.id}>. Please ask them to allow direct messages from server members in their privacy settings for this server.`);
    const spectateChannel = await game.guildContext.getOrCreateSpectateChannel(Room.generateValidId(playerName));

    const [playerdefaults] = loadPlayerDefaults();
    const player = new Player(
        member.id,
        member,
        playerName,
        "",
        "neutral",
        "an average voice",
        playerdefaults.defaultStats,
        true,
        playerdefaults.defaultLocation,
        "",
        [],
        playerdefaults.defaultDescription,
        new Collection(),
        notificationChannel,
        spectateChannel,
        0,
        game
    );

    // Only add them to the player collections if an actual game isn't currently ongoing.
    const addPlayer = !game.inProgress || game.canJoin;
    if (addPlayer) {
        game.players.set(Game.generateValidEntityName(player.name), player);
        game.livingPlayers.set(Game.generateValidEntityName(player.name), player);
    }
    member.roles.add(game.guildContext.playerRole);

    const playerCells = [];
    const inventoryCells = [];
    playerCells.push([
        player.id,
        player.name,
        player.title,
        player.pronounString,
        player.originalVoiceString,
        String(player.defaultStrength),
        String(player.defaultPerception),
        String(player.defaultDexterity),
        String(player.defaultSpeed),
        String(player.defaultStamina),
        player.alive ? "TRUE" : "FALSE",
        player.locationDisplayName,
        player.hidingSpot,
        playerdefaults.defaultStatusEffects,
        player.description.text
    ]);

    for (let i = 0; i < playerdefaults.defaultInventory.length; i++) {
        let row = [player.name];
        row = row.concat(playerdefaults.defaultInventory[i]);
        for (let j = 0; j < row.length; j++) {
            if (row[j].includes('#'))
                row[j] = row[j].replace(/#/g, String(game.players.size + (addPlayer ? 0 : 1)));
        }
        inventoryCells.push(row);
    }

    try {
        await appendRowsToSheet(game.constants.playerSheetDataCells, playerCells, game.settings.spreadsheetID, true);
        await appendRowsToSheet(game.constants.inventorySheetDataCells, inventoryCells, game.settings.spreadsheetID, true);
        game.loadedEntitiesWithErrors.add("Players");

        const successMessage = `<@${member.id}> has been added to the game. `
            + "After making any desired changes to the players and inventory items sheets, be sure to load players before disabling edit mode.";
        game.communicationHandler.sendToCommandChannel(successMessage);
    }
    catch (err) {
        const errorMessage = `<@${member.id}> has been added to the game, but there was an error saving the data to the spreadsheet. `
            + "It is recommended that you add their data to the spreadsheet manually, then load it before proceeding. Error:\n```" + err + "```";
        game.communicationHandler.sendToCommandChannel(errorMessage);
    }
}
