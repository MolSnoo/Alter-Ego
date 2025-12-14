import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';
import playerdefaults from '../Configs/playerdefaults.json' with { type: 'json' };
import { parseDescription, parseDescriptionWithErrors, addItem, removeItem } from '../Modules/parser.js';

import fs from 'fs';
import { EOL } from 'os';

import RoomItem from '../Data/RoomItem.js';
import InventoryItem from '../Data/InventoryItem.js';
import Player from '../Data/Player.js';

/** @type {CommandConfig} */
export const config = {
    name: "testparser_moderator",
    description: "Tests the parsing module on your descriptions.",
    details: `Tests the parsing algorithm responsible for interpreting and editing descriptions. `
        + `Sends the results as a text file to the command channel. `
        + `If testing the add or remove function, you can add "formatted" to display the formatted descriptions. `
        + `Otherwise, it will display the parsed versions. For all functions, you can input a player name to `
        + `parse the text as if that player is reading it. Note that if using the "formatted" argument, `
        + `a player name cannot be used. This command should be used to make sure you've written properly formatted descriptions.\n`
        + `-**parse**: Outputs the formatted and parsed descriptions.\n`
        + `-**add**: Goes through each object, item, puzzle, player, and inventory item description with item containers and adds random items.\n`
        + `-**remove**: Goes through each room, object, item, puzzle, player, and inventory item description with items and removes each item `
        + `in the list. In "formatted" mode, items will be removed in every possible order. However, it will only remove up to 4 items in a description.`,
    usableBy: "Moderator",
    aliases: ["testparser"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}testparser parse\n`
        + `${settings.commandPrefix}testparser parse nero\n`
        + `${settings.commandPrefix}testparser add\n`
        + `${settings.commandPrefix}testparser add vivian\n`
        + `${settings.commandPrefix}testparser add formatted\n`
        + `${settings.commandPrefix}testparser remove\n`
        + `${settings.commandPrefix}testparser remove aria\n`
        + `${settings.commandPrefix}testparser remove formatted`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to specify what function to test. Usage:\n${usage(game.settings)}`);

    const file = "./parsedText.xml";
    fs.writeFile(file, "", function (err) {
        if (err) return console.log(err);
    });

    var player = new Player(
        "",
        null,
        "Cella",
        "",
        "female",
        "a cheery voice",
        playerdefaults.defaultStats,
        true,
        "",
        "",
        [],
        "<desc><s>You examine <var v=\"container.displayName\" />.</s> <if cond=\"container.hasAttribute('concealed')\"><s><var v=\"container.pronouns.Sbj\" /> <if cond=\"container.pronouns.plural\">are</if><if cond=\"!container.pronouns.plural\">is</if> [HEIGHT], but <var v =\"container.pronouns.dpos\" /> face is concealed.</s></if><if cond=\"!container.hasAttribute('concealed')\"><s><var v=\"container.pronouns.Sbj\" /><if cond=\"container.pronouns.plural\">'re</if><if cond=\"!container.pronouns.plural\">'s</if> [HEIGHT] with [SKIN TONE], [HAIR], and [EYES].</s></if> <s><var v=\"container.pronouns.Sbj\" /> wear<if cond=\"!container.pronouns.plural\">s</if> <il name=\"equipment\"><item>a SHIRT</item>, <item>a pair of PANTS</item>, and <item>a pair of TENNIS SHOES</item></il>.</s> <s>You see <var v=\"container.pronouns.obj\" /> carrying <il name=\"hands\"></il>.</s></desc>",
        [],
        null,
        3,
        game
    );
    player.setPronouns(player.originalPronouns, player.pronounString);
    player.setPronouns(player.pronouns, player.pronounString);

    if (args[1] && args[1] !== "formatted") {
        let found = false;
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].name.toLowerCase() === args[1].toLowerCase()) {
                player = game.players_alive[i];
                found = true;
                break;
            }
        }
        if (!found) return messageHandler.addReply(game, message, `Couldn't find player "${args[1]}".`);
    }

    if (args[0] === "parse") {
        const result = await testparse(game, file, player);
        let warnings = [];
        for (let i = 0; i < result.warnings.length; i++) {
            for (let j = 0; j < result.warnings[i].warnings.length; j++) {
                result.warnings[i].warnings[j] = result.warnings[i].warnings[j].replace(/\t/g, " ").replace(/\n/g, " ");
                warnings.push(`Warning on ${result.warnings[i].cell}: ${result.warnings[i].warnings[j]}`);
            }
        }
        if (warnings.length > 0) {
            // Trim excess warnings to not exceed Discord's 2000 character limit.
            const tooManyWarnings = warnings.length > 20 || warnings.join('\n').length >= 1980;
            while (warnings.length > 20 || warnings.join('\n').length >= 1980)
                warnings = warnings.slice(0, warnings.length - 1);  
            if (tooManyWarnings)
                warnings.push("Too many warnings.");
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, warnings.join('\n'));
        }
        let errors = [];
        for (let i = 0; i < result.errors.length; i++) {
            for (let j = 0; j < result.errors[i].errors.length; j++) {
                result.errors[i].errors[j] = result.errors[i].errors[j].replace(/\t/g, " ").replace(/\n/g, " ");
                errors.push(`Error on ${result.errors[i].cell}: ${result.errors[i].errors[j]}`);
            }
        }
        if (errors.length > 0) {
            // Trim excess errors to not exceed Discord's 2000 character limit.
            const tooManyErrors = errors.length > 20 || errors.join('\n').length >= 1980;
            while (errors.length > 20 || errors.join('\n').length >= 1980)
                errors = errors.slice(0, errors.length - 1);
            if (tooManyErrors)
                errors.push("Too many errors.");
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
        }
    }
    else if (args[0] === "add") {
        let formatted = false;
        if (args[1] && args[1] === "formatted") formatted = true;
        await testadd(game, file, formatted, player);
    }
    else if (args[0] === "remove") {
        let formatted = false;
        if (args[1] && args[1] === "formatted") formatted = true;
        const result = await testremove(game, file, formatted, player);
        let warnings = [];
        for (let i = 0; i < result.length; i++)
            warnings.push(`Warning on ${result[i].cell}: ${result[i].warnings[0]}`);
        if (warnings.length > 0) {
            const tooManyWarnings = warnings.length > 20 || warnings.join('\n').length >= 1980;
            while (warnings.length > 20 || warnings.join('\n').length >= 1980)
                warnings = warnings.slice(0, warnings.length - 1);  
            if (tooManyWarnings)
                warnings.push("Too many warnings.");
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, warnings.join('\n'));
        }
    }
    else return messageHandler.addReply(game, message, 'Function not found. You need to use "parse", "add", or "remove".');

    game.guildContext.commandChannel.send({
        content: "Text parsed.",
        files: [
            {
                attachment: file,
                name: `parsedText-${args[0]}.xml`
            }
        ]
    });

    return;
};

/**
 * Parses all in-game descriptions and writes the results to a file.
 * If there's something wrong with any of the descriptions, issues warnings and errors.
 * @param {Game} game - The game being tested.
 * @param {string} fileName - The name of the file to write the results to.
 * @param {Player|PseudoPlayer} player - The player to pass into the parser module.
 * @returns {Promise<TestParserResults>} All of the warnings and errors found when parsing descriptions.
 */
async function testparse (game, fileName, player) {
    var warnings = [];
    var errors = [];

    // Get rooms first.
    {
        await appendFile(fileName, "ROOMS:");
        let text = "";
        for (let i = 0; i < game.rooms.length; i++) {
            text += "   ";
            text += game.rooms[i].name + EOL;

            for (let j = 0; j < game.rooms[i].exit.length; j++) {
                text += "      ";
                text += game.rooms[i].exit[j].name + EOL;
                const parsedDescription = parseDescriptionWithErrors(game.rooms[i].exit[j].description, game.rooms[i], player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.rooms[i].exit[j].descriptionCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: game.rooms[i].exit[j].descriptionCell(), errors: parsedDescription.errors });

                text += "         ";
                text += game.rooms[i].exit[j].description + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }
            text += EOL;
        }
        await appendFile(fileName, text);
    }

    // Get fixtures next.
    {
        await appendFile(fileName, "FIXTURES:");
        let text = "";
        for (let i = 0; i < game.fixtures.length; i++) {
            text += "   ";
            text += game.fixtures[i].name + EOL;

            const parsedDescription = parseDescriptionWithErrors(game.fixtures[i].description, game.fixtures[i], player);
            if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.fixtures[i].descriptionCell(), warnings: parsedDescription.warnings });
            if (parsedDescription.errors.length !== 0) errors.push({ cell: game.fixtures[i].descriptionCell(), errors: parsedDescription.errors });

            text += "      ";
            text += game.fixtures[i].description + EOL;

            text += "      ";
            text += parsedDescription.text + EOL;
        }
        await appendFile(fileName, text);
    }

    // Get prefabs next.
    {
        await appendFile(fileName, "PREFABS:");
        let text = "";
        for (let i = 0; i < game.prefabs.length; i++) {
            text += "   ";
            text += game.prefabs[i].id + EOL;

            const parsedDescription = parseDescriptionWithErrors(game.prefabs[i].description, game.prefabs[i], player);
            if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.prefabs[i].descriptionCell(), warnings: parsedDescription.warnings });
            if (parsedDescription.errors.length !== 0) errors.push({ cell: game.prefabs[i].descriptionCell(), errors: parsedDescription.errors });

            text += "      ";
            text += game.prefabs[i].description + EOL;

            text += "      ";
            text += parsedDescription.text + EOL;
        }
        await appendFile(fileName, text);
    }

    // Get recipes next.
    {
        await appendFile(fileName, "RECIPES:");
        let text = "";
        for (let i = 0; i < game.recipes.length; i++) {
            text += "   ";
            text += "ROW " + game.recipes[i].row + EOL;

            const taggedFixture = game.fixtures.find(fixture => fixture.recipeTag === game.recipes[i].fixtureTag);
            // First, do the initiated text.
            if (game.recipes[i].initiatedDescription !== "") {
                text += "      MESSAGE WHEN INITIATED:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(game.recipes[i].initiatedDescription, taggedFixture ? taggedFixture : game.recipes[i], player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.recipes[i].initiatedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: game.recipes[i].initiatedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += game.recipes[i].initiatedDescription + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            // Next, do the completed text.
            if (game.recipes[i].completedDescription !== "") {
                text += "      MESSAGE WHEN COMPLETED:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(game.recipes[i].completedDescription, taggedFixture ? taggedFixture : game.recipes[i], player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.recipes[i].completedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: game.recipes[i].completedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += game.recipes[i].completedDescription + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            // Finally, do the uncrafted text.
            if (game.recipes[i].uncraftedDescription !== "") {
                text += "      MESSAGE WHEN UNCRAFTED:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(game.recipes[i].uncraftedDescription, game.recipes[i], player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.recipes[i].uncraftedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: game.recipes[i].uncraftedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += game.recipes[i].uncraftedDescription + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }
        }
        await appendFile(fileName, text);
    }

    // Get items next.
    {
        await appendFile(fileName, "ITEMS:");
        let text = "";
        for (let i = 0; i < game.items.length; i++) {
            text += "   ";
            text += game.items[i].name + EOL;

            const parsedDescription = parseDescriptionWithErrors(game.items[i].description, game.items[i], player);
            if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.items[i].descriptionCell(), warnings: parsedDescription.warnings });
            if (parsedDescription.errors.length !== 0) errors.push({ cell: game.items[i].descriptionCell(), errors: parsedDescription.errors });

            text += "      ";
            text += game.items[i].description + EOL;

            text += "      ";
            text += parsedDescription.text + EOL;
        }
        await appendFile(fileName, text);
    }

    // Get puzzles next.
    {
        await appendFile(fileName, "PUZZLES:");
        let text = "";
        for (let i = 0; i < game.puzzles.length; i++) {
            text += "   ";
            text += game.puzzles[i].name + EOL;

            const puzzle = game.puzzles[i];
            // First, do the correct description.
            if (puzzle.correctDescription !== "") {
                text += "      CORRECT ANSWER:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(puzzle.correctDescription, puzzle, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: puzzle.correctCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: puzzle.correctCell(), errors: parsedDescription.errors });

                text += "         ";
                text += puzzle.correctDescription + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            // Next, do the already solved description.
            if (puzzle.alreadySolvedDescription !== "") {
                text += "      ALREADY SOLVED:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(puzzle.alreadySolvedDescription, puzzle, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: puzzle.alreadySolvedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: puzzle.alreadySolvedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += puzzle.alreadySolvedDescription + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            // Next, do the incorrect description.
            if (puzzle.incorrectDescription !== "") {
                text += "      INCORRECT ANSWER:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(puzzle.incorrectDescription, puzzle, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: puzzle.incorrectCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: puzzle.incorrectCell(), errors: parsedDescription.errors });

                text += "         ";
                text += puzzle.incorrectDescription + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            // Next, do the no more attempts description.
            if (puzzle.noMoreAttemptsDescription !== "") {
                text += "      NO MORE ATTEMPTS:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(puzzle.noMoreAttemptsDescription, puzzle, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: puzzle.noMoreAttemptsCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: puzzle.noMoreAttemptsCell(), errors: parsedDescription.errors });

                text += "         ";
                text += puzzle.noMoreAttemptsDescription + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            // Finally, do the requirements not met description.
            if (puzzle.requirementsNotMetDescription !== "") {
                text += "      REQUIREMENTS NOT MET:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(puzzle.requirementsNotMetDescription, puzzle, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: puzzle.requirementsNotMetCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: puzzle.requirementsNotMetCell(), errors: parsedDescription.errors });

                text += "         ";
                text += puzzle.requirementsNotMetDescription + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            text += EOL;
        }
        await appendFile(fileName, text);
    }

    // Get events next.
    {
        await appendFile(fileName, "EVENTS:");
        let text = "";
        for (let i = 0; i < game.events.length; i++) {
            text += "   ";
            text += game.events[i].id + EOL;

            const event = game.events[i];
            // First, do the triggered text.
            if (event.triggeredNarration !== "") {
                text += "      MESSAGE WHEN TRIGGERED:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(event.triggeredNarration, event, null);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: event.triggeredCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: event.triggeredCell(), errors: parsedDescription.errors });

                text += "         ";
                text += event.triggeredNarration + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            // Finally, do the ended text.
            if (event.endedNarration !== "") {
                text += "      MESSAGE WHEN ENDED:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(event.endedNarration, event, null);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: event.endedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: event.endedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += event.endedNarration + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            text += EOL;
        }
        await appendFile(fileName, text);
    }

    // Get status effects next.
    {
        await appendFile(fileName, "STATUS EFFECTS:");
        let text = "";
        for (let i = 0; i < game.statusEffects.length; i++) {
            text += "   ";
            text += game.statusEffects[i].name + EOL;

            const status = game.statusEffects[i];
            // First, do the inflicted text.
            if (status.inflictedDescription !== "") {
                text += "      MESSAGE WHEN INFLICTED:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(status.inflictedDescription, status, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: status.inflictedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: status.inflictedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += status.inflictedDescription + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            // Finally, do the cured text.
            if (status.curedDescription !== "") {
                text += "      MESSAGE WHEN CURED:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(status.curedDescription, status, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: status.curedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: status.curedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += status.curedDescription + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            text += EOL;
        }
        await appendFile(fileName, text);
    }

    // Get players next.
    {
        await appendFile(fileName, "PLAYERS:");
        let text = "";
        for (let i = 0; i < game.players.length; i++) {
            text += "   ";
            text += game.players[i].name + EOL;

            const parsedDescription = parseDescriptionWithErrors(game.players[i].description, game.players[i], player);
            if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.players[i].descriptionCell(), warnings: parsedDescription.warnings });
            if (parsedDescription.errors.length !== 0) errors.push({ cell: game.players[i].descriptionCell(), errors: parsedDescription.errors });

            text += "      ";
            text += game.players[i].description + EOL;

            text += "      ";
            text += parsedDescription.text + EOL;
        }
        await appendFile(fileName, text);
    }

    // Finally, get inventory items.
    {
        await appendFile(fileName, "INVENTORY ITEMS:");
        let text = "";
        for (let i = 0; i < game.inventoryItems.length; i++) {
            if (game.inventoryItems[i].prefab !== null) {
                text += "   ";
                text += game.inventoryItems[i].name + EOL;

                const parsedDescription = parseDescriptionWithErrors(game.inventoryItems[i].description, game.inventoryItems[i], player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: game.inventoryItems[i].descriptionCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: game.inventoryItems[i].descriptionCell(), errors: parsedDescription.errors });

                text += "      ";
                text += game.inventoryItems[i].description + EOL;

                text += "      ";
                text += parsedDescription.text + EOL;
            }
        }
        await appendFile(fileName, text);
    }

    return { warnings: warnings, errors: errors };
}

/**
 * Tests the parser module's addItem function on all in-game descriptions with il tags.
 * Adds 4 instances of random prefabs to each description. Writes the final results to a file.
 * @param {Game} game - The game being tested. 
 * @param {string} fileName - The name of the file to write the results to.
 * @param {boolean} formatted - Whether or not to write the resulting text with its XML tags.
 * @param {Player|PseudoPlayer} player - The player to pass into the parser module.
 */
async function testadd (game, fileName, formatted, player) {
    // Skip over rooms because you can't add items to them.

    // Get fixtures first.
    {
        await appendFile(fileName, "FIXTURES:");
        let text = "";
        for (let i = 0; i < game.fixtures.length; i++) {
            const fixture = game.fixtures[i];
            if (fixture.description.includes('<il>') && fixture.description.includes('</il>')) {
                text += "   ";
                text += fixture.name + EOL;

                text += "      ";
                text += (formatted ? fixture.description : parseDescription(fixture.description, fixture, player)) + EOL;

                let items = new Array();
                let itemNames = "";
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * game.prefabs.length);
                    while (itemNames.includes(game.prefabs[randomIndex].name) || fixture.description.includes(game.prefabs[randomIndex].name) || fixture.description.includes(game.prefabs[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * game.prefabs.length);
                    let newItem = new RoomItem(game.prefabs[randomIndex].id, "", fixture.location.id, true, `Object: ${fixture.name}`, 1, game.prefabs[randomIndex].uses, game.prefabs[randomIndex].description, 0, game);
                    newItem.setPrefab(game.prefabs[randomIndex]);
                    newItem.location = fixture.location;
                    items.push(newItem);
                    itemNames += game.prefabs[randomIndex].name + " ";
                }

                let description = fixture.description;
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    let item = items[j];
                    item.quantity = 0;
                    text += `(Drop ${item.name}): `;
                    description = addItem(description, item);
                    text += (formatted ? description : parseDescription(description, fixture, player)) + EOL;
                    tabs++;
                }
            }
        }
        await appendFile(fileName, text);
    }

    // Prefabs can't have items inside them.

    // Get items next.
    {
        await appendFile(fileName, "ITEMS:");
        let text = "";
        for (let i = 0; i < game.items.length; i++) {
            const item = game.items[i];
            if (item.description.includes('<il') && item.description.includes('</il>') && item.inventory.length > 0) {
                text += "   ";
                text += item.name + EOL;

                text += "      ";
                text += (formatted ? item.description : parseDescription(item.description, item, player)) + EOL;

                let items = new Array();
                let itemNames = "";
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * game.prefabs.length);
                    while (itemNames.includes(game.prefabs[randomIndex].name) || item.description.includes(game.prefabs[randomIndex].name) || item.description.includes(game.prefabs[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * game.prefabs.length);
                    let newItem = new RoomItem(game.prefabs[randomIndex].id, "", item.location.id, true, `Item: ${item.name}`, 1, game.prefabs[randomIndex].uses, game.prefabs[randomIndex].description, 0, game);
                    newItem.setPrefab(game.prefabs[randomIndex]);
                    newItem.location = item.location;
                    items.push(newItem);
                    itemNames += game.prefabs[randomIndex].name + " ";
                }

                let description = item.description;
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    let newItem = items[j];
                    newItem.quantity = 0;
                    text += `(Drop ${newItem.name}): `;
                    let slot = item.inventory[Math.floor(Math.random() * item.inventory.length)].name;
                    description = addItem(description, newItem, slot);
                    text += (formatted ? description : parseDescription(description, item, player)) + EOL;
                    tabs++;
                }
            }
        }
        await appendFile(fileName, text);
    }

    // Get puzzles next.
    {
        await appendFile(fileName, "PUZZLES:");
        let text = "";
        for (let i = 0; i < game.puzzles.length; i++) {
            const puzzle = game.puzzles[i];
            if (puzzle.alreadySolvedDescription.includes('<il>') && puzzle.alreadySolvedDescription.includes('</il>')) {
                text += "   ";
                text += puzzle.name + EOL;

                text += "      ";
                text += (formatted ? puzzle.alreadySolvedDescription : parseDescription(puzzle.alreadySolvedDescription, puzzle, player)) + EOL;

                let items = new Array();
                let itemNames = "";
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * game.prefabs.length);
                    while (itemNames.includes(game.prefabs[randomIndex].name) || puzzle.alreadySolvedDescription.includes(game.prefabs[randomIndex].name) || puzzle.alreadySolvedDescription.includes(game.prefabs[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * game.prefabs.length);
                    let newItem = new RoomItem(game.prefabs[randomIndex].id, "", puzzle.location.id, true, `Puzzle: ${puzzle.name}`, 1, game.prefabs[randomIndex].uses, game.prefabs[randomIndex].description, 0, game);
                    newItem.setPrefab(game.prefabs[randomIndex]);
                    newItem.location = puzzle.location;
                    items.push(newItem);
                    itemNames += game.prefabs[randomIndex].name + " ";
                }

                let description = puzzle.alreadySolvedDescription;
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    let item = items[j];
                    item.quantity = 0;
                    text += `(Drop ${item.name}): `;
                    description = addItem(description, item);
                    text += (formatted ? description : parseDescription(description, puzzle, player)) + EOL;
                    tabs++;
                }
            }
        }
        await appendFile(fileName, text);
    }

    // Get players next.
    {
        await appendFile(fileName, "PLAYERS:");
        let text = "";
        for (let i = 0; i < game.players.length; i++) {
            const currentPlayer = game.players[i];
            if (currentPlayer.description.includes('<il') && currentPlayer.description.includes('</il>')) {
                text += "   ";
                text += currentPlayer.name + EOL;

                text += "      ";
                text += (formatted ? currentPlayer.description : parseDescription(currentPlayer.description, currentPlayer, player)) + EOL;

                let items = new Array();
                let itemNames = "";
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * game.prefabs.length);
                    while (itemNames.includes(game.prefabs[randomIndex].name) || currentPlayer.description.includes(game.prefabs[randomIndex].name) || currentPlayer.description.includes(game.prefabs[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * game.prefabs.length);
                    items.push(game.items[randomIndex]);
                    let newItem = new InventoryItem(player.name, game.prefabs[randomIndex].id, "", "", "", 1, game.prefabs[randomIndex].uses, game.prefabs[randomIndex].description, 0, game);
                    newItem.setPrefab(game.prefabs[randomIndex]);
                    if (player instanceof Player) newItem.player = player;
                    items.push(newItem);
                    itemNames += game.prefabs[randomIndex].name + " ";
                }

                let description = currentPlayer.description;
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    let item = items[j];
                    item.quantity = 0;
                    text += `(Equip ${item.name}): `;
                    description = addItem(description, item, "equipment");
                    text += (formatted ? description : parseDescription(description, currentPlayer, player)) + EOL;
                    tabs++;
                }
            }
        }
        await appendFile(fileName, text);
    }

    // Finally, get inventory items.
    {
        await appendFile(fileName, "INVENTORY ITEMS:");
        let text = "";
        for (let i = 0; i < game.inventoryItems.length; i++) {
            const inventoryItem = game.inventoryItems[i];
            if (inventoryItem.prefab !== null && inventoryItem.description.includes('<il') && inventoryItem.description.includes('</il>') && inventoryItem.inventory.length > 0) {
                text += "   ";
                text += inventoryItem.name + EOL;

                text += "      ";
                text += (formatted ? inventoryItem.description : parseDescription(inventoryItem.description, inventoryItem, player)) + EOL;

                let items = new Array();
                let itemNames = "";
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * game.prefabs.length);
                    while (itemNames.includes(game.prefabs[randomIndex].name) || inventoryItem.description.includes(game.prefabs[randomIndex].name) || inventoryItem.description.includes(game.prefabs[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * game.prefabs.length);
                    let newItem = new InventoryItem(player.name, game.prefabs[randomIndex].id, "", "", "", 1, game.prefabs[randomIndex].uses, game.prefabs[randomIndex].description, 0, game);
                    newItem.setPrefab(game.prefabs[randomIndex]);
                    if (player instanceof Player) newItem.player = player;
                    items.push(newItem);
                    itemNames += game.prefabs[randomIndex].name + " ";
                }

                let description = inventoryItem.description;
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    let newItem = items[j];
                    newItem.quantity = 0;
                    text += `(Stash ${newItem.name}): `;
                    let slot = inventoryItem.inventory[Math.floor(Math.random() * inventoryItem.inventory.length)].name;
                    description = addItem(description, newItem, slot);
                    text += (formatted ? description : parseDescription(description, inventoryItem, player)) + EOL;
                    tabs++;
                }
            }
        }
        await appendFile(fileName, text);
    }

    return;
}

/**
 * Tests the parser module's removeItem function on all in-game descriptions with item tags.
 * Tries to remove every item from each description. Issues a warning for every description where it can't remove all items.
 * Writes the final results to a file.
 * @param {Game} game - The game being tested. 
 * @param {string} fileName - The name of the file to write the results to.
 * @param {boolean} formatted - Whether or not to write the resulting text with its XML tags. If this is true, also tries to remove items in every possible order.
 * @param {Player|PseudoPlayer} player - The player to pass into the parser module.
 * @returns {Promise<TestParserWarningOrError[]>} A list of warnings for items that failed to be removed.
 */
async function testremove (game, fileName, formatted, player) {
    var warnings = [];
    // Get rooms first.
    {
        await appendFile(fileName, "ROOMS:");
        let text = "";
        for (let i = 0; i < game.rooms.length; i++) {
            const room = game.rooms[i];
            if (room.description.includes('<item>') && room.description.includes('</item>')) {
                text += "   ";
                text += room.name + EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let k = 0; k < game.items.length; k++) {
                    if (game.items[k].location.id === room.id
                        && game.items[k].containerName === ""
                        && game.items[k].container === null
                        && !items.find(item => item.singleContainingPhrase === game.items[k].singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === game.items[k].pluralContainingPhrase)) {
                        let newItem = new RoomItem(game.items[k].prefab.id, game.items[k].identifier, game.items[k].location.id, game.items[k].accessible, game.items[k].containerName, game.items[k].quantity, game.items[k].uses, game.items[k].description, game.items[k].row, game);
                        newItem.setPrefab(game.items[k].prefab);
                        newItem.location = game.items[k].location;
                        items.push(newItem);
                        itemNames.push(game.items[k].name);
                    }
                }
                if (formatted) {
                    // If the number of items is higher than 4, the bot usually runs out of memory.
                    // Make 4 the limit.
                    if (items.length > 4) {
                        items = items.slice(0, 4);
                        itemNames = itemNames.slice(0, 4);
                    }
                }
                const orders = formatted ? permute(itemNames) : [itemNames.join(',')];

                for (let j = 0; j < room.exit.length; j++) {
                    const exit = room.exit[j];
                    text += "      ";
                    text += exit.name + EOL;

                    text += "         ";
                    text += (formatted ? exit.description : parseDescription(exit.description, room, player)) + EOL;

                    for (let k = 0; k < orders.length; k++) {
                        let description = exit.description;
                        let tabs = 1;
                        const permutation = orders[k].split(',');
                        for (let l = 0; l < permutation.length; l++) {
                            text += "         ";
                            for (let m = 0; m < tabs; m++)
                                text += "   ";
                            let item;
                            for (let m = 0; m < items.length; m++) {
                                if (permutation[l] === items[m].name) {
                                    item = items[m];
                                    item.quantity = 0;
                                    break;
                                }
                            }
                            text += `(Take ${permutation[l]}): `;
                            if (item) description = removeItem(description, item, null, NaN);
                            text += (formatted ? description : parseDescription(description, room, player)) + EOL;
                            tabs++;
                        }
                    }
                }
                text += EOL;
            }
        }
        await appendFile(fileName, text);
    }

    // Get fixtures next.
    {
        await appendFile(fileName, "FIXTURES:");
        let text = "";
        for (let i = 0; i < game.fixtures.length; i++) {
            const fixture = game.fixtures[i];
            if (fixture.description.includes('<item>') && fixture.description.includes('</item>')) {
                text += "   ";
                text += fixture.name + EOL;

                text += "      ";
                text += (formatted ? fixture.description : parseDescription(fixture.description, fixture, player)) + EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let j = 0; j < game.items.length; j++) {
                    if (game.items[j].location.id === fixture.location.id
                        && game.items[j].containerName === `Object: ${fixture.name}`
                        && game.items[j].container.row === fixture.row
                        && fixture.preposition !== ""
                        && !items.find(item => item.singleContainingPhrase === game.items[j].singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === game.items[j].pluralContainingPhrase)) {
                        let newItem = new RoomItem(game.items[j].prefab.id, game.items[j].identifier, game.items[j].location.id, game.items[j].accessible, game.items[j].containerName, game.items[j].quantity, game.items[j].uses, game.items[j].description, game.items[j].row, game);
                        newItem.setPrefab(game.items[j].prefab);
                        newItem.location = game.items[j].location;
                        items.push(newItem);
                        itemNames.push(game.items[j].name);
                    }
                }
                if (formatted) {
                    // If the number of items is higher than 4, the bot usually runs out of memory.
                    // Make 4 the limit.
                    if (items.length > 4) {
                        items = items.slice(0, 4);
                        itemNames = itemNames.slice(0, 4);
                    }
                }
                const orders = formatted ? permute(itemNames) : [itemNames.join(',')];

                for (let j = 0; j < orders.length; j++) {
                    let description = fixture.description;
                    let tabs = 1;
                    const permutation = orders[j].split(',');
                    for (let k = 0; k < permutation.length; k++) {
                        text += "      ";
                        for (let l = 0; l < tabs; l++)
                            text += "   ";
                        let item;
                        for (let l = 0; l < items.length; l++) {
                            if (permutation[k] === items[l].name) {
                                item = items[l];
                                item.quantity = 0;
                                break;
                            }
                        }
                        text += `(Take ${permutation[k]}): `;
                        if (item) description = removeItem(description, item, null, NaN);
                        text += (formatted ? description : parseDescription(description, fixture, player)) + EOL;
                        tabs++;
                        if (k === permutation.length - 1 && description.includes("<item>") && description.includes("</item"))
                            warnings.push({ cell: fixture.descriptionCell(), warnings: ["Unable to remove all item tags."] });
                    }
                }
            }
        }
        await appendFile(fileName, text);
    }

    // Prefabs can't have items inside them.

    // Get items next.
    {
        await appendFile(fileName, "ITEMS:");
        let text = "";
        for (let i = 0; i < game.items.length; i++) {
            const item = game.items[i];
            if (item.description.includes('<item>') && item.description.includes('</item>')) {
                text += "   ";
                text += item.identifier + EOL;

                text += "      ";
                text += (formatted ? item.description : parseDescription(item.description, item, player)) + EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let j = 0; j < game.items.length; j++) {
                    if (game.items[j].location.id === item.location.id
                        && game.items[j].containerName.startsWith(`Item: ${item.identifier}/`)
                        && game.items[j].container.row === item.row
                        && item.prefab.preposition !== ""
                        && !items.find(item => item.singleContainingPhrase === game.items[j].singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === game.items[j].pluralContainingPhrase)) {
                        let newItem = new RoomItem(game.items[j].prefab.id, game.items[j].identifier, game.items[j].location.id, game.items[j].accessible, game.items[j].containerName, game.items[j].quantity, game.items[j].uses, game.items[j].description, game.items[j].row, game);
                        newItem.setPrefab(game.items[j].prefab);
                        newItem.location = game.items[j].location;
                        newItem.slot = game.items[j].slot;
                        items.push(newItem);
                        itemNames.push(game.items[j].name);
                    }
                }
                if (formatted) {
                    // If the number of items is higher than 4, the bot usually runs out of memory.
                    // Make 4 the limit.
                    if (items.length > 4) {
                        items = items.slice(0, 4);
                        itemNames = itemNames.slice(0, 4);
                    }
                }
                const orders = formatted ? permute(itemNames) : [itemNames.join(',')];

                for (let j = 0; j < orders.length; j++) {
                    let description = item.description;
                    let tabs = 1;
                    const permutation = orders[j].split(',');
                    for (let k = 0; k < permutation.length; k++) {
                        text += "      ";
                        for (let l = 0; l < tabs; l++)
                            text += "   ";
                        let newItem;
                        for (let l = 0; l < items.length; l++) {
                            if (permutation[k] === items[l].name) {
                                newItem = items[l];
                                newItem.quantity = 0;
                                break;
                            }
                        }
                        text += `(Take ${permutation[k]}): `;
                        if (newItem) description = removeItem(description, newItem, newItem.slot, NaN);
                        text += (formatted ? description : parseDescription(description, item, player)) + EOL;
                        tabs++;
                        if (k === permutation.length - 1 && description.includes("<item>") && description.includes("</item"))
                            warnings.push({ cell: item.descriptionCell(), text: "Unable to remove all item tags." });
                    }
                }
            }
        }
        await appendFile(fileName, text);
    }

    // Get puzzles next.
    {
        await appendFile(fileName, "PUZZLES:");
        let text = "";
        for (let i = 0; i < game.puzzles.length; i++) {
            const puzzle = game.puzzles[i];
            if (puzzle.alreadySolvedDescription !== "" && puzzle.alreadySolvedDescription.includes('<item>') && puzzle.alreadySolvedDescription.includes('</item>')) {
                text += "   ";
                text += puzzle.name + EOL;

                text += "      ";
                text += (formatted ? puzzle.alreadySolvedDescription : parseDescription(puzzle.alreadySolvedDescription, puzzle, player)) + EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let j = 0; j < game.items.length; j++) {
                    if (game.items[j].location.id === puzzle.location.id
                        && game.items[j].containerName === `Puzzle: ${puzzle.name}`
                        && !items.find(item => item.singleContainingPhrase === game.items[j].singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === game.items[j].pluralContainingPhrase)) {
                        let newItem = new RoomItem(game.items[j].prefab.id, game.items[j].identifier, game.items[j].location.id, game.items[j].accessible, game.items[j].containerName, game.items[j].quantity, game.items[j].uses, game.items[j].description, game.items[j].row, game);
                        newItem.setPrefab(game.items[j].prefab);
                        newItem.location = game.items[j].location;
                        items.push(newItem);
                        itemNames.push(game.items[j].name);
                    }
                }
                if (formatted) {
                    // If the number of items is higher than 4, the bot usually runs out of memory.
                    // Make 4 the limit.
                    if (items.length > 4) {
                        items = items.slice(0, 4);
                        itemNames = itemNames.slice(0, 4);
                    }
                }
                const orders = formatted ? permute(itemNames) : [itemNames.join(',')];

                for (let j = 0; j < orders.length; j++) {
                    let description = puzzle.alreadySolvedDescription;
                    let tabs = 1;
                    const permutation = orders[j].split(',');
                    for (let k = 0; k < permutation.length; k++) {
                        text += "      ";
                        for (let l = 0; l < tabs; l++)
                            text += "   ";
                        let item;
                        for (let l = 0; l < items.length; l++) {
                            if (permutation[k] === items[l].name) {
                                item = items[l];
                                item.quantity = 0;
                                break;
                            }
                        }
                        text += `(Take ${permutation[k]}): `;
                        if (item) description = removeItem(description, item, null, NaN);
                        text += (formatted ? description : parseDescription(description, puzzle, player)) + EOL;
                        tabs++;
                        if (k === permutation.length - 1 && description.includes("<item>") && description.includes("</item"))
                            warnings.push({ cell: puzzle.alreadySolvedCell(), text: "Unable to remove all item tags." });
                    }
                }
            }
        }
        await appendFile(fileName, text);
    }

    // Get players next.
    {
        await appendFile(fileName, "PLAYERS:");
        let text = "";
        for (let i = 0; i < game.players.length; i++) {
            const currentPlayer = game.players[i];
            if (currentPlayer.description.includes('<item>') && currentPlayer.description.includes('</item>')) {
                text += "   ";
                text += currentPlayer.name + EOL;

                text += "      ";
                text += (formatted ? currentPlayer.description : parseDescription(currentPlayer.description, currentPlayer, player)) + EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let j = 0; j < game.inventoryItems.length; j++) {
                    if (game.inventoryItems[j].player.name === currentPlayer.name
                        && game.inventoryItems[j].prefab !== null
                        && game.inventoryItems[j].container === null
                        && !items.find(item => item.singleContainingPhrase === game.inventoryItems[j].singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === game.inventoryItems[j].pluralContainingPhrase)) {
                        let newItem = new InventoryItem(game.inventoryItems[j].player.name, game.inventoryItems[j].prefab.id, game.inventoryItems[j].identifier, game.inventoryItems[j].equipmentSlot, game.inventoryItems[j].containerName, game.inventoryItems[j].quantity, game.inventoryItems[j].uses, game.inventoryItems[j].description, game.inventoryItems[j].row, game);
                        newItem.setPrefab(game.inventoryItems[j].prefab);
                        newItem.player = game.inventoryItems[j].player;
                        items.push(newItem);
                        itemNames.push(game.inventoryItems[j].name);
                    }
                }
                if (formatted) {
                    // If the number of items is higher than 4, the bot usually runs out of memory.
                    // Make 4 the limit.
                    if (items.length > 4) {
                        items = items.slice(0, 4);
                        itemNames = itemNames.slice(0, 4);
                    }
                }
                const orders = formatted ? permute(itemNames) : [itemNames.join(',')];

                for (let j = 0; j < orders.length; j++) {
                    let description = currentPlayer.description;
                    let tabs = 1;
                    const permutation = orders[j].split(',');
                    for (let k = 0; k < permutation.length; k++) {
                        text += "      ";
                        for (let l = 0; l < tabs; l++)
                            text += "   ";
                        let item;
                        for (let l = 0; l < items.length; l++) {
                            if (permutation[k] === items[l].name) {
                                item = items[l];
                                item.quantity = 0;
                                break;
                            }
                        }
                        text += `(Unequip ${permutation[k]}): `;
                        if (item) {
                            if (item.equipmentSlot === "RIGHT HAND" || item.equipmentSlot === "LEFT HAND") description = removeItem(description, item, "hands", NaN);
                            else description = removeItem(description, item, "equipment", NaN);
                        }
                        text += (formatted ? description : parseDescription(description, currentPlayer, player)) + EOL;
                        tabs++;
                        if (k === permutation.length - 1 && description.includes("<item>") && description.includes("</item"))
                            warnings.push({ cell: currentPlayer.descriptionCell(), text: "Unable to remove all item tags." });
                    }
                }
            }
        }
        await appendFile(fileName, text);
    }

    // Finally, get inventory items.
    {
        await appendFile(fileName, "INVENTORY ITEMS:");
        let text = "";
        for (let i = 0; i < game.inventoryItems.length; i++) {
            const inventoryItem = game.inventoryItems[i];
            if (inventoryItem.prefab !== null && inventoryItem.description.includes('<item>') && inventoryItem.description.includes('</item>')) {
                text += "   ";
                text += inventoryItem.identifier + EOL;

                text += "      ";
                text += (formatted ? inventoryItem.description : parseDescription(inventoryItem.description, inventoryItem, player)) + EOL;

                let items = new Array();
                let itemNames = new Array();
                for (let j = 0; j < game.inventoryItems.length; j++) {
                    if (game.inventoryItems[j].player.name === inventoryItem.player.name
                        && game.inventoryItems[j].prefab !== null
                        && game.inventoryItems[j].containerName.startsWith(`${inventoryItem.identifier}/`)
                        && game.inventoryItems[j].container !== null
                        && game.inventoryItems[j].container.row === inventoryItem.row
                        && inventoryItem.prefab.preposition !== ""
                        && !items.find(item => item.singleContainingPhrase === game.inventoryItems[j].singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === game.inventoryItems[j].pluralContainingPhrase)) {
                        let newItem = new InventoryItem(game.inventoryItems[j].player.name, game.inventoryItems[j].prefab.id, game.inventoryItems[j].identifier, game.inventoryItems[j].equipmentSlot, game.inventoryItems[j].containerName, game.inventoryItems[j].quantity, game.inventoryItems[j].uses, game.inventoryItems[j].description, game.inventoryItems[j].row, game);
                        newItem.setPrefab(game.inventoryItems[j].prefab);
                        newItem.player = game.inventoryItems[j].player;
                        newItem.slot = game.inventoryItems[j].slot;
                        items.push(newItem);
                        itemNames.push(game.inventoryItems[j].name);
                    }
                }
                if (formatted) {
                    // If the number of items is higher than 4, the bot usually runs out of memory.
                    // Make 4 the limit.
                    if (items.length > 4) {
                        items = items.slice(0, 4);
                        itemNames = itemNames.slice(0, 4);
                    }
                }
                const orders = formatted ? permute(itemNames) : [itemNames.join(',')];

                for (let j = 0; j < orders.length; j++) {
                    let description = inventoryItem.description;
                    let tabs = 1;
                    const permutation = orders[j].split(',');
                    for (let k = 0; k < permutation.length; k++) {
                        text += "      ";
                        for (let l = 0; l < tabs; l++)
                            text += "   ";
                        let item;
                        for (let l = 0; l < items.length; l++) {
                            if (permutation[k] === items[l].name) {
                                item = items[l];
                                item.quantity = 0;
                                break;
                            }
                        }
                        text += `(Unstash ${permutation[k]}): `;
                        if (item) description = removeItem(description, item, item.slot, NaN);
                        text += (formatted ? description : parseDescription(description, inventoryItem, player)) + EOL;
                        tabs++;
                        if (k === permutation.length - 1 && description.includes("<item>") && description.includes("</item"))
                            warnings.push({ cell: inventoryItem.descriptionCell(), text: "Unable to remove all item tags." });
                    }
                }
            }
        }
        await appendFile(fileName, text);
    }
    
    return warnings;
}

/**
 * Recursively gets all possible permutations of the contents of the array.
 * @param {string[]} array - The array of strings to find all permutations of.
 * @returns {string[]} An array comma-separated strings representing all possible permutations.
 */
function permute(array) {
    if (array.length < 2) return array;

    var permutations = [];
    for (let i = 0; i < array.length; i++) {
        let element = array[i];

        if (array.indexOf(element) !== i)
            continue;

        let remainingElements = array.filter(piece => piece !== array[i]);

        for (var subPermutation of permute(remainingElements))
            permutations.push(`${element},${subPermutation}`);
    }
    return permutations;
}

/**
 * Appends text to the file.
 * @param {string} fileName - The name of the file to append.
 * @param {string} text - The text to add to the end of the file.
 * @returns {Promise<string>} The name of the file.
 */
function appendFile(fileName, text) {
    return new Promise((resolve) => {
        fs.appendFile(fileName, text + EOL, function (err) {
            if (err) return console.log(err);
            resolve(fileName);
        });
    });
}
