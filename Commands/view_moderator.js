import ViewAction from '../Data/Actions/ViewAction.ts';
import { getErrorMessage } from '../Modules/errorHandler.ts';

/** @import Moderator from '../Data/Moderator.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "view_moderator",
    description: "View a game entity.",
    details: `View in-game data. You can view any entry on the spreadsheet, but you must specify which kind of data to `
        + `find, as well as its row number. If the entity has a unique ID, you can also view it using that. `
        + `You will be shown most of the data visible on the spreadsheet for that entity. `
        + `To avoid exceeding Discord's character limit, some fields may be omitted. These can be viewed with `
        + `the interactables that are sent alongside the result.\n\n`
        + `To view a game entity that doesn't have a unique ID with this command, you must know its row number, `
        + `which can be found on the spreadsheet. Alternatively, you can obtain it with the \`find\` command.`,
    usableBy: "Moderator",
    aliases: ["view", "v"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}view room 496\n`
        + `${settings.commandPrefix}v room chancellors-office\n`
        + `${settings.commandPrefix}view exit 497\n`
        + `${settings.commandPrefix}v fixture 21\n`
        + `${settings.commandPrefix}view prefab 75\n`
        + `${settings.commandPrefix}v prefab COMBAT BOOTS\n`
        + `${settings.commandPrefix}view recipe 43\n`
        + `${settings.commandPrefix}v room item 1173\n`
        + `${settings.commandPrefix}view item 692\n`
        + `${settings.commandPrefix}v puzzle 81\n`
        + `${settings.commandPrefix}view event 16\n`
        + `${settings.commandPrefix}v event SUNRISE\n`
        + `${settings.commandPrefix}view status effect 92\n`
        + `${settings.commandPrefix}v status refreshed\n`
        + `${settings.commandPrefix}view player 4\n`
        + `${settings.commandPrefix}v player Sid\n`
        + `${settings.commandPrefix}view inventory item 70\n`
        + `${settings.commandPrefix}v inventoryitem 381\n`
        + `${settings.commandPrefix}view gesture 102\n`
        + `${settings.commandPrefix}v gesture point at\n`
        + `${settings.commandPrefix}view flag 7\n`
        + `${settings.commandPrefix}v flag AUTO LIGHTS`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Moderator} moderator - The moderator who issued the command.
 */
export async function execute(game, message, command, args, moderator) {
    let input = args.join(' ');

    if (args.length < 2)
        return game.communicationHandler.reply(message, `You need to specify a data type and the row number of an entity to view. Usage:\n${usage(game.settings)}`);

    // First, separate the input into data type and search.
    const dataTypeMatch = input.match(ViewAction.dataTypeRegex);
    if (!dataTypeMatch && !dataTypeMatch.groups) return game.communicationHandler.reply(message, `Couldn't find a valid data type in "${input}".`);
    if (!dataTypeMatch.groups.search) return game.communicationHandler.reply(message, `You need to specify the row number of an entity to view.`);
    input = input.substring(input.indexOf(dataTypeMatch.groups.search)).trim();
    const row = parseInt(input);
    const query = input;

    /** @type {PersistentGameEntityName} */
    let entityType;
    /** @type {PersistentGameEntity<any>} */
    let entity;
    if (isNaN(row)) {
        if (entityType === "Exit" || entityType === "Fixture" || entityType === "Recipe" || entityType === "RoomItem" || entityType === "Puzzle" || entityType === "InventoryItem")
            return game.communicationHandler.reply(message, `Invalid row number: "${input}".`);
    }
    if (dataTypeMatch.groups.Room) {
        entityType = "Room";
        if (query) entity = game.entityFinder.getRoom(query);
        if (!entity) entity = game.entityFinder.getRoomByRow(row);
    }
    else if (dataTypeMatch.groups.Exit) {
        entityType = "Exit";
        if (isNaN(row)) return game.communicationHandler.reply(message, `${entityType}s can only be viewed by row number. Invalid row number: "${input}".`);
        entity = game.entityFinder.getExitByRow(row);
    }
    else if (dataTypeMatch.groups.Fixture) {
        entityType = "Fixture";
        if (isNaN(row)) return game.communicationHandler.reply(message, `${entityType}s can only be viewed by row number. Invalid row number: "${input}".`);
        entity = game.entityFinder.getFixtureByRow(row);
    }
    else if (dataTypeMatch.groups.Prefab) {
        entityType = "Prefab";
        if (query) entity = game.entityFinder.getPrefab(query);
        if (!entity) entity = game.entityFinder.getPrefabByRow(row);
    }
    else if (dataTypeMatch.groups.Recipe) {
        entityType = "Recipe";
        if (isNaN(row)) return game.communicationHandler.reply(message, `${entityType}s can only be viewed by row number. Invalid row number: "${input}".`);
        entity = game.entityFinder.getRecipeByRow(row);
    }
    else if (dataTypeMatch.groups.RoomItem) {
        entityType = "RoomItem";
        if (isNaN(row)) return game.communicationHandler.reply(message, `${entityType}s can only be viewed by row number. Invalid row number: "${input}".`);
        entity = game.entityFinder.getRoomItemByRow(row);
    }
    else if (dataTypeMatch.groups.Puzzle) {
        entityType = "Puzzle";
        if (isNaN(row)) return game.communicationHandler.reply(message, `${entityType}s can only be viewed by row number. Invalid row number: "${input}".`);
        entity = game.entityFinder.getPuzzleByRow(row);
    }
    else if (dataTypeMatch.groups.Event) {
        entityType = "Event";
        if (query) entity = game.entityFinder.getEvent(query);
        if (!entity) entity = game.entityFinder.getEventByRow(row);
    }
    else if (dataTypeMatch.groups.Status) {
        entityType = "StatusEffect";
        if (query) entity = game.entityFinder.getStatusEffect(query);
        if (!entity) entity = game.entityFinder.getStatusEffectByRow(row);
    }
    else if (dataTypeMatch.groups.Player) {
        entityType = "Player";
        if (query) entity = game.entityFinder.getPlayer(query);
        if (!entity) entity = game.entityFinder.getPlayerByRow(row);
    }
    else if (dataTypeMatch.groups.InventoryItem) {
        entityType = "InventoryItem";
        if (isNaN(row)) return game.communicationHandler.reply(message, `${entityType}s can only be viewed by row number. Invalid row number: "${input}".`);
        entity = game.entityFinder.getInventoryItemByRow(row);
    }
    else if (dataTypeMatch.groups.Gesture) {
        entityType = "Gesture";
        if (query) entity = game.entityFinder.getGesture(query);
        if (!entity) entity = game.entityFinder.getGestureByRow(row);
    }
    else if (dataTypeMatch.groups.Flag) {
        entityType = "Flag";
        if (query) entity = game.entityFinder.getFlag(query);
        if (!entity) entity = game.entityFinder.getFlagByRow(row);
    }
    if (!entity) {
        if (!isNaN(row)) return game.communicationHandler.reply(message, `Couldn't find ${entityType} on row ${row}.`);
        else return game.communicationHandler.reply(message, `Couldn't find ${entityType} "${query}".`);
    }

    try {
        const action = new ViewAction(game, message, undefined, undefined, true, undefined, moderator);
        action.performView(entity);
    }
    catch (error) {
        game.communicationHandler.reply(message, `${getErrorMessage(error)} Usage:\n${usage(game.settings)}`);
    }
}
