import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';
import * as loader from '../Modules/loader.js';

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
    aliases: ["load", "reload", "las", "lar", "gethousedata"],
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
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute(game, message, command, args) {
    if (command !== "las" && command !== "lar" && args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify what data to get. Usage:\n${usage(game.settings)}`);

    if (command === "las" || command === "lar" || args[0] === "all") {
        let errors = [];
        try {
            await loader.loadRooms(game, false);
            await loader.loadFixtures(game, false);
            await loader.loadPrefabs(game, false);
            await loader.loadRecipes(game, false);
            await loader.loadRoomItems(game, false);
            await loader.loadPuzzles(game, false);
            await loader.loadEvents(game, false);
            await loader.loadStatusEffects(game, false);
            await loader.loadPlayers(game, false);
            await loader.loadInventoryItems(game, false);
            await loader.loadGestures(game, false);
            await loader.loadFlags(game, false);
        }
        catch (error) {
            errors.push(error);
        }

        game.roomsCollection.forEach(room => {
            let error = loader.checkRoom(room);
            if (error instanceof Error) errors.push(error);
        });
        game.fixtures.forEach(fixture => {
            let error = loader.checkFixture(fixture);
            if (error instanceof Error) errors.push(error);
        });
        game.prefabsCollection.forEach(prefab => {
            let error = loader.checkPrefab(prefab);
            if (error instanceof Error) errors.push(error);
        });
        game.recipes.forEach(recipe => {
            let error = loader.checkRecipe(recipe);
            if (error instanceof Error) errors.push(error);
        });
        game.roomItems.forEach(roomItem => {
            let error = loader.checkRoomItem(roomItem);
            if (error instanceof Error) errors.push(error);
        });
        game.puzzles.forEach(puzzle => {
            let error = loader.checkPuzzle(puzzle);
            if (error instanceof Error) errors.push(error);
        });
        game.eventsCollection.forEach(event => {
            let error = loader.checkEvent(event);
            if (error instanceof Error) errors.push(error);
        });
        game.statusEffectsCollection.forEach(statusEffect => {
            let error = loader.checkStatusEffect(statusEffect);
            if (error instanceof Error) errors.push(error);
        });
        game.playersCollection.forEach(player => {
            let error = loader.checkPlayer(player);
            if (error instanceof Error) errors.push(error);
        });
        game.inventoryItems.forEach(inventoryItem => {
            let error = loader.checkInventoryItem(inventoryItem);
            if (error instanceof Error) errors.push(error);
        });
        game.gesturesCollection.forEach(gesture => {
            let error = loader.checkGesture(gesture);
            if (error instanceof Error) errors.push(error);
        });
        if (errors.length > 0) {
            if (errors.length > 15) {
                errors = errors.slice(0, 15);
                errors.push(new Error("Too many errors."));
            }
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
        }
        else {
            if (game.settings.debug) {
                printData(game.roomsCollection);
                printData(game.fixtures);
                printData(game.prefabsCollection);
                printData(game.recipes);
                printData(game.roomItems);
                printData(game.puzzles);
                printData(game.eventsCollection);
                printData(game.statusEffectsCollection);
                printData(game.playersCollection);
                printData(game.inventoryItems);
                printData(game.gesturesCollection);
                printData(game.flags);
            }

            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel,
                game.roomsCollection.size + " rooms, " +
                game.fixtures.length + " fixtures, " +
                game.prefabsCollection.size + " prefabs, " +
                game.recipes.length + " recipes, " +
                game.roomItems.length + " items, " +
                game.puzzles.length + " puzzles, " +
                game.eventsCollection.size + " events, " +
                game.statusEffectsCollection.size + " status effects, " +
                game.playersCollection.size + " players, " +
                game.inventoryItems.length + " inventory items, " +
                game.gesturesCollection.size + " gestures, and " +
                game.flags.size + " flags retrieved."
            );

            const privatePlayers = [];
            game.livingPlayersCollection.forEach(async player => {
                const canDmPlayer = await checkCanDmPlayer(player);
                if (!canDmPlayer) privatePlayers.push(player.name);
            });
            if (privatePlayers.length > 0) {
                const privatePlayerList = privatePlayers.join(", ");
                messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Warning: Cannot send direct messages to player(s): ${privatePlayerList}. Please ask them to allow direct messages from server members in their privacy settings for this server.`);
            }

            if (command === "las" || args[1] && args[1] === "start") {
                game.inProgress = true;
                game.canJoin = false;
                if (!game.settings.debug)
                    game.botContext.updatePresence();
                game.livingPlayersCollection.forEach(player => {
                    player.sendDescription(player.location.description, player.location);
                });
            }
            else if (command === "lar" || args[1] && args[1] === "resume") {
                game.inProgress = true;
                game.canJoin = false;
                if (!game.settings.debug)
                    game.botContext.updatePresence();
            }

            // Start event timers.
            game.eventsCollection.forEach(event => {
                if (event.ongoing && event.duration !== null)
                    event.startTimer();
                if (event.ongoing && (event.effects.length > 0 || event.refreshes.length > 0))
                    event.startEffectsTimer();
            });
        }
    }
    else if (args[0] === "rooms") {
        try {
            await loader.loadRooms(game, true);
            if (game.settings.debug) printData(game.roomsCollection);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.roomsCollection.size + " rooms retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "fixtures") {
        try {
            await loader.loadFixtures(game, true);
            if (game.settings.debug) printData(game.fixtures);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.fixtures.length + " fixtures retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "prefabs") {
        try {
            await loader.loadPrefabs(game, true);
            if (game.settings.debug) printData(game.prefabsCollection);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.prefabsCollection.size + " prefabs retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "recipes") {
        try {
            await loader.loadRecipes(game, true);
            if (game.settings.debug) printData(game.recipes);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.recipes.length + " recipes retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "items") {
        try {
            await loader.loadRoomItems(game, true);
            if (game.settings.debug) printData(game.roomItems);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.roomItems.length + " items retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "puzzles") {
        try {
            await loader.loadPuzzles(game, true);
            if (game.settings.debug) printData(game.puzzles);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.puzzles.length + " puzzles retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "events") {
        try {
            await loader.loadEvents(game, true);
            if (game.settings.debug) printData(game.eventsCollection);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.eventsCollection.size + " events retrieved.");

            // Start event timers.
            game.eventsCollection.forEach(event => {
                if (event.ongoing && event.duration !== null)
                    event.startTimer();
                if (event.ongoing && (event.effects.length > 0 || event.refreshes.length > 0))
                    event.startEffectsTimer();
            });
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "statuses" || args[0] === "effects" || args[0] === "status" && args[1] === "effects") {
        try {
            await loader.loadStatusEffects(game, true);
            if (game.settings.debug) printData(game.statusEffectsCollection);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.statusEffectsCollection.size + " status effects retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "players") {
        try {
            await loader.loadPlayers(game, true);
            if (game.settings.debug) printData(game.playersCollection);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.playersCollection.size + " players retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }

        const privatePlayers = [];
        game.livingPlayersCollection.forEach(async player => {
            const canDmPlayer = await checkCanDmPlayer(player);
            if (!canDmPlayer) privatePlayers.push(player.name);
        });
        if (privatePlayers.length > 0) {
            const privatePlayerList = privatePlayers.join(", ");
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Warning: Cannot send direct messages to player(s): ${privatePlayerList}. Please ask them to allow direct messages from server members in their privacy settings for this server.`);
        }
    }
    else if (args[0] === "inventories") {
        try {
            await loader.loadInventoryItems(game, true);
            if (game.settings.debug) printData(game.inventoryItems);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.inventoryItems.length + " inventory items retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "gestures") {
        try {
            await loader.loadGestures(game, true);
            if (game.settings.debug) printData(game.gesturesCollection);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.gesturesCollection.size + " gestures retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "flags") {
        try {
            await loader.loadFlags(game, true);
            if (game.settings.debug) printData(game.flags);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.flags.size + " flags retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
}

/**
 * Prints an array or map of entities to the console.
 * @param {*[]|Map<*, *>} data 
 */
function printData(data) {
    if (data instanceof Array) {
        for (var i = 0; i < data.length; i++) {
            console.log(data[i]);
        }
    }
    else if (data instanceof Map) {
        data.forEach(entry => {
            console.log(entry);
        });
    }
}

/**
 * Checks whether or not the member can receive direct messages from guild members.
 * @param {Player} player - The player to check for.
 * @returns {Promise<boolean>} True if the player can receive direct messages from guild members, false if not.
 */
function checkCanDmPlayer(player) {
    return new Promise(resolve => {
        player.member.send('').catch(error => {
            if (error.hasOwnProperty("code") && error.code === 50007)
                resolve(false);
            else resolve(true);
        });
    });
}
