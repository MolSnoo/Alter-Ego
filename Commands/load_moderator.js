import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
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
export function usage (settings) {
    return `${settings.commandPrefix}load all start\n`
        + `${settings.commandPrefix}load all resume\n`
        + `${settings.commandPrefix}load all\n`
        + `${settings.commandPrefix}load rooms\n`
        + `${settings.commandPrefix}load objects\n`
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
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    if (command !== "las" && command !== "lar" && args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify what data to get. Usage:\n${usage(game.settings)}`);

    if (command === "las" || command === "lar" || args[0] === "all") {
        var errors = [];
        await loader.loadRooms(game, false);
        await loader.loadObjects(game, false);
        await loader.loadPrefabs(game, false);
        await loader.loadRecipes(game, false);
        await loader.loadItems(game, false);
        await loader.loadPuzzles(game, false);
        await loader.loadEvents(game, false);
        await loader.loadStatusEffects(game, false);
        await loader.loadPlayers(game, false);
        await loader.loadInventories(game, false);
        await loader.loadGestures(game, false);
        await loader.loadFlags(game, false, errors);

        for (let i = 0; i < game.rooms.length; i++) {
            let error = loader.checkRoom(game.rooms[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.objects.length; i++) {
            let error = loader.checkObject(game.objects[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.prefabs.length; i++) {
            let error = loader.checkPrefab(game.prefabs[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.recipes.length; i++) {
            let error = loader.checkRecipe(game.recipes[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.items.length; i++) {
            let error = loader.checkItem(game.items[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.puzzles.length; i++) {
            let error = loader.checkPuzzle(game.puzzles[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.events.length; i++) {
            let error = loader.checkEvent(game.events[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.statusEffects.length; i++) {
            let error = loader.checkStatusEffect(game.statusEffects[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.players.length; i++) {
            let error = loader.checkPlayer(game.players[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.inventoryItems.length; i++) {
            let error = loader.checkInventoryItem(game.inventoryItems[i]);
            if (error instanceof Error) errors.push(error);
        }
        for (let i = 0; i < game.gestures.length; i++) {
            let error = loader.checkGesture(game.gestures[i]);
            if (error instanceof Error) errors.push(error);
        }
        if (errors.length > 0) {
            if (errors.length > 15) {
                errors = errors.slice(0, 15);
                errors.push(new Error("Too many errors."));
            }
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
        }
        else {
            if (game.settings.debug) {
                printData(game.rooms);
                printData(game.objects);
                printData(game.prefabs);
                printData(game.recipes);
                printData(game.items);
                printData(game.puzzles);
                printData(game.events);
                printData(game.statusEffects);
                printData(game.players);
                printData(game.inventoryItems);
                printData(game.gestures);
                printData(game.flags);
            }

            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel,
                game.rooms.length + " rooms, " +
                game.objects.length + " objects, " +
                game.prefabs.length + " prefabs, " +
                game.recipes.length + " recipes, " +
                game.items.length + " items, " +
                game.puzzles.length + " puzzles, " +
                game.events.length + " events, " +
                game.statusEffects.length + " status effects, " +
                game.players.length + " players, " +
                game.inventoryItems.length + " inventory items, " +
                game.gestures.length + " gestures, and " +
                game.flags.size + " flags retrieved."
            );

            const privatePlayers = [];
            for (let i = 0; i < game.players_alive.length; i++) {
                if (game.players_alive[i].title !== "NPC") {
                    const canDmPlayer = await checkCanDmPlayer(game.players_alive[i]);
                    if (!canDmPlayer) privatePlayers.push(game.players_alive[i].name);
                }
            }
            if (privatePlayers.length > 0) {
                const privatePlayerList = privatePlayers.join(", ");
                messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Warning: Cannot send direct messages to player(s): ${privatePlayerList}. Please ask them to allow direct messages from server members in their privacy settings for this server.`);
            }

            if (command === "las" || args[1] && args[1] === "start") {
                game.inProgress = true;
                game.canJoin = false;
                if (!game.settings.debug)
                    game.botContext.updatePresence();
                for (let i = 0; i < game.players_alive.length; i++)
                    game.players_alive[i].sendDescription(game.players_alive[i].location.description, game.players_alive[i].location);
            }
            else if (command === "lar" || args[1] && args[1] === "resume") {
                game.inProgress = true;
                game.canJoin = false;
                if (!game.settings.debug)
                    game.botContext.updatePresence();
            }

            // Start event timers.
            for (let i = 0; i < game.events.length; i++) {
                if (game.events[i].ongoing && game.events[i].duration !== null)
                    game.events[i].startTimer();
                if (game.events[i].ongoing && (game.events[i].effects.length > 0 || game.events[i].refreshes.length > 0))
                    game.events[i].startEffectsTimer();
            }
        }
    }
    else if (args[0] === "rooms") {
        try {
            await loader.loadRooms(game, true);
            if (game.settings.debug) printData(game.rooms);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.rooms.length + " rooms retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "objects") {
        try {
            await loader.loadObjects(game, true);
            if (game.settings.debug) printData(game.objects);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.objects.length + " objects retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "prefabs") {
        try {
            await loader.loadPrefabs(game, true);
            if (game.settings.debug) printData(game.prefabs);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.prefabs.length + " prefabs retrieved.");
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
            await loader.loadItems(game, true);
            if (game.settings.debug) printData(game.items);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.items.length + " items retrieved.");
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
            if (game.settings.debug) printData(game.events);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.events.length + " events retrieved.");

            // Start event timers.
            for (let i = 0; i < game.events.length; i++) {
                if (game.events[i].ongoing && game.events[i].duration !== null)
                    game.events[i].startTimer();
                if (game.events[i].ongoing && (game.events[i].effects.length > 0 || game.events[i].refreshes.length > 0))
                    game.events[i].startEffectsTimer();
            }
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "statuses" || args[0] === "effects" || args[0] === "status" && args[1] === "effects") {
        try {
            await loader.loadStatusEffects(game, true);
            if (game.settings.debug) printData(game.statusEffects);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.statusEffects.length + " status effects retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "players") {
        try {
            await loader.loadPlayers(game, true);
            if (game.settings.debug) printData(game.players);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.players.length + " players retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }

        const privatePlayers = [];
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].title !== "NPC") {
                const canDmPlayer = await checkCanDmPlayer(game.players_alive[i]);
                if (!canDmPlayer) privatePlayers.push(game.players_alive[i].name);
            }
        }
        if (privatePlayers.length > 0) {
            const privatePlayerList = privatePlayers.join(", ");
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Warning: Cannot send direct messages to player(s): ${privatePlayerList}. Please ask them to allow direct messages from server members in their privacy settings for this server.`);
        }
    }
    else if (args[0] === "inventories") {
        try {
            await loader.loadInventories(game, true);
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
            if (game.settings.debug) printData(game.gestures);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.gestures.length + " gestures retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
    else if (args[0] === "flags") {
        try {
            await loader.loadFlags(game, true, errors);
            if (game.settings.debug) printData(game.flags);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, game.flags.size + " flags retrieved.");
        }
        catch (err) {
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, err);
        }
    }
}

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

function checkCanDmPlayer(player) {
    return new Promise(resolve => {
        player.member.send('').catch(error => {
            if (error.hasOwnProperty("code") && error.code === 50007)
                resolve(false);
            else resolve(true);
        });
    });
}
