import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { addReply, addGameMechanicMessage } from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "load_moderator",
    description: 'Loads game data.',
    details: 'Gathers the game data by reading it off the spreadsheet. Can specify what data to collect. '
        + '"all start" must be used at the beginning of the game after the startgame timer is over, as it will '
        + 'gather all the data and send the room description of the room they start in to each player. '
        + 'If at any point you restart the bot, use "all resume". Any data that was previously gathered will be updated. '
        + 'Any data you edit manually, including descriptions, will require use of this command.',
    usableBy: "Moderator",
    aliases: ["load", "reload", "las", "lar"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
    return `${settings.commandPrefix}load all start\n`
        + `${settings.commandPrefix}load all resume\n`
        + `${settings.commandPrefix}load all\n`
        + `${settings.commandPrefix}load rooms\n`
        + `${settings.commandPrefix}load fixtures\n`
        + `${settings.commandPrefix}load prefabs\n`
        + `${settings.commandPrefix}load recipes\n`
        + `${settings.commandPrefix}load items\n`
        + `${settings.commandPrefix}load puzzles\n`
        + `${settings.commandPrefix}load events\n`
        + `${settings.commandPrefix}load status effects\n`
        + `${settings.commandPrefix}load players\n`
        + `${settings.commandPrefix}load inventories\n`
        + `${settings.commandPrefix}load gestures\n`
        + `${settings.commandPrefix}load flags`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute(game, message, command, args) {
    if (command !== "las" && command !== "lar" && args.length === 0)
        return addReply(game, message, `You need to specify what data to get. Usage:\n${usage(game.settings)}`);

    /** @type {Error[]} */
    let errors = [];
    if (command === "las" || command === "lar" || args[0] === "all") {
        const startGame = command === "las" || command === "lar" || args[1] && (args[1] === "resume" || args[1] === "start");
        const sendPlayerRoomDescriptions = startGame && (command === "las" || args[1] === "start");
        const message = await game.entityLoader.loadAll(startGame, sendPlayerRoomDescriptions);
        addGameMechanicMessage(game, game.guildContext.commandChannel, message);
    }
    else if (args[0] === "rooms") {
        const roomCount = await game.entityLoader.loadRooms(true, errors);
        if (errors.length === 0) addGameMechanicMessage(game, game.guildContext.commandChannel, `${roomCount} rooms retrieved.`);
        else addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
    }
    else if (args[0] === "fixtures" || args[0] === "objects") {
        const fixtureCount = await game.entityLoader.loadFixtures(true, errors);
        if (errors.length === 0) addGameMechanicMessage(game, game.guildContext.commandChannel, `${fixtureCount} fixtures retrieved.`);
        else addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
    }
    else if (args[0] === "prefabs") {
        const prefabCount = await game.entityLoader.loadPrefabs(true, errors);
        if (errors.length === 0) addGameMechanicMessage(game, game.guildContext.commandChannel, `${prefabCount} prefabs retrieved.`);
        else addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
    }
    else if (args[0] === "recipes") {
        const recipeCount = await game.entityLoader.loadRecipes(true, errors);
        if (errors.length === 0) addGameMechanicMessage(game, game.guildContext.commandChannel, `${recipeCount} recipes retrieved.`);
        else addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
    }
    else if (args[0] === "roomitems" || args[0] === "items" || args[0] === "room" && args[1] === "items") {
        const roomItemCount = await game.entityLoader.loadRoomItems(true, errors);
        if (errors.length === 0) addGameMechanicMessage(game, game.guildContext.commandChannel, `${roomItemCount} room items retrieved.`);
        else addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
    }
    else if (args[0] === "puzzles") {
        const puzzleCount = await game.entityLoader.loadPuzzles(true, errors);
        if (errors.length === 0) addGameMechanicMessage(game, game.guildContext.commandChannel, `${puzzleCount} puzzles retrieved.`);
        else addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
    }
    else if (args[0] === "events") {
        const eventCount = await game.entityLoader.loadEvents(true, errors);
        if (errors.length === 0) addGameMechanicMessage(game, game.guildContext.commandChannel, `${eventCount} events retrieved.`);
        else addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
    }
    else if (args[0] === "statuses" || args[0] === "effects" || args[0] === "status" && args[1] === "effects") {
        const statusEffectCount = await game.entityLoader.loadStatusEffects(true, errors);
        if (errors.length === 0) addGameMechanicMessage(game, game.guildContext.commandChannel, `${statusEffectCount} status effects retrieved.`);
        else addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
    }
    else if (args[0] === "players") {
        const playerCount = await game.entityLoader.loadPlayers(true, errors);
        if (errors.length === 0) addGameMechanicMessage(game, game.guildContext.commandChannel, `${playerCount} players retrieved.`);
        else addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
    }
    else if (args[0] === "inventoryitems" || args[0] === "inventories" || args[0] === "inventory" && args[1] === "items") {
        const inventoryItemCount = await game.entityLoader.loadInventoryItems(true, errors);
        if (errors.length === 0) addGameMechanicMessage(game, game.guildContext.commandChannel, `${inventoryItemCount} inventory items retrieved.`);
        else addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
    }
    else if (args[0] === "gestures") {
        const gestureCount = await game.entityLoader.loadGestures(true, errors);
        if (errors.length === 0) addGameMechanicMessage(game, game.guildContext.commandChannel, `${gestureCount} gestures retrieved.`);
        else addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
    }
    else if (args[0] === "flags") {
        const flagCount = await game.entityLoader.loadFlags(true, errors);
        if (errors.length === 0) addGameMechanicMessage(game, game.guildContext.commandChannel, `${flagCount} flags retrieved.`);
        else addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
    }
}
