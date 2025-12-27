import fs from 'fs';
import RoomItem from '../Data/RoomItem.js';
import InventoryItem from '../Data/InventoryItem.js';
import Player from '../Data/Player.js';
import playerdefaults from '../Configs/playerdefaults.json' with { type: 'json' };
import { parseDescription, parseDescriptionWithErrors, addItem, removeItem } from '../Modules/parser.js';
import { EOL } from 'os';
import { Collection } from 'discord.js';
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import('../Classes/GameSettings.js').default} GameSettings */
/** @typedef {import('../Data/Game.js').default} Game */

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
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length === 0)
        return addReply(game, message, `You need to specify what function to test. Usage:\n${usage(game.settings)}`);

    const file = "./parsedText.xml";
    fs.writeFile(file, "", function (err) {
        if (err) return console.log(err);
    });

    let player = new Player(
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
        "<desc><s>You examine <const v=\"container.displayName\" />.</s> <if cond=\"container.hasBehaviorAttribute('concealed')\"><s><const v=\"container.pronouns.Sbj\" /> <if cond=\"container.pronouns.plural\">are</if><if cond=\"!container.pronouns.plural\">is</if> [HEIGHT], but <const v =\"container.pronouns.dpos\" /> face is concealed.</s></if><if cond=\"!container.hasBehaviorAttribute('concealed')\"><s><const v=\"container.pronouns.Sbj\" /><if cond=\"container.pronouns.plural\">'re</if><if cond=\"!container.pronouns.plural\">'s</if> [HEIGHT] with [SKIN TONE], [HAIR], and [EYES].</s></if> <s><const v=\"container.pronouns.Sbj\" /> wear<if cond=\"!container.pronouns.plural\">s</if> <il name=\"equipment\"><item>a SHIRT</item>, <item>a pair of PANTS</item>, and <item>a pair of TENNIS SHOES</item></il>.</s> <s>You see <const v=\"container.pronouns.obj\" /> carrying <il name=\"hands\"></il>.</s></desc>",
        new Collection(),
        null,
        3,
        game
    );
    player.setPronouns(player.originalPronouns, player.pronounString);
    player.setPronouns(player.pronouns, player.pronounString);

    if (args[1] && args[1] !== "formatted") {
        player = game.entityFinder.getLivingPlayer(args[1]);
        if (player === undefined) return addReply(game, message, `Couldn't find player "${args[1]}".`);
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
            addGameMechanicMessage(game, game.guildContext.commandChannel, warnings.join('\n'));
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
            addGameMechanicMessage(game, game.guildContext.commandChannel, errors.join('\n'));
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
            addGameMechanicMessage(game, game.guildContext.commandChannel, warnings.join('\n'));
        }
    }
    else return addReply(game, message, 'Function not found. You need to use "parse", "add", or "remove".');

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
    const warnings = [];
    const errors = [];

    // Get rooms first.
    {
        await appendFile(fileName, "ROOMS:");
        let text = "";
        for (const room of game.roomsCollection.values()) {
            text += "   ";
            text += room.id + EOL;

            for (const exit of room.exitCollection.values()) {
                text += "      ";
                text += exit.name + EOL;
                const parsedDescription = parseDescriptionWithErrors(exit.description, room, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: exit.descriptionCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: exit.descriptionCell(), errors: parsedDescription.errors });

                text += "         ";
                text += exit.description + EOL;

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
        for (const prefab of game.prefabsCollection.values()) {
            text += "   ";
            text += prefab.id + EOL;

            const parsedDescription = parseDescriptionWithErrors(prefab.description, prefab, player);
            if (parsedDescription.warnings.length !== 0) warnings.push({ cell: prefab.descriptionCell(), warnings: parsedDescription.warnings });
            if (parsedDescription.errors.length !== 0) errors.push({ cell: prefab.descriptionCell(), errors: parsedDescription.errors });

            text += "      ";
            text += prefab.description + EOL;

            text += "      ";
            text += parsedDescription.text + EOL;
        }
        await appendFile(fileName, text);
    }

    // Get recipes next.
    {
        await appendFile(fileName, "RECIPES:");
        let text = "";
        for (const recipe of game.recipes) {
            text += "   ";
            text += "ROW " + recipe.row + EOL;

            const taggedFixture = game.fixtures.find(fixture => fixture.recipeTag === recipe.fixtureTag);
            // First, do the initiated text.
            if (recipe.initiatedDescription !== "") {
                text += "      MESSAGE WHEN INITIATED:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(recipe.initiatedDescription, taggedFixture ? taggedFixture : recipe, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: recipe.initiatedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: recipe.initiatedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += recipe.initiatedDescription + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            // Next, do the completed text.
            if (recipe.completedDescription !== "") {
                text += "      MESSAGE WHEN COMPLETED:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(recipe.completedDescription, taggedFixture ? taggedFixture : recipe, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: recipe.completedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: recipe.completedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += recipe.completedDescription + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            // Finally, do the uncrafted text.
            if (recipe.uncraftedDescription !== "") {
                text += "      MESSAGE WHEN UNCRAFTED:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(recipe.uncraftedDescription, recipe, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: recipe.uncraftedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: recipe.uncraftedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += recipe.uncraftedDescription + EOL;

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
        for (const roomItem of game.roomItems) {
            text += "   ";
            text += roomItem.name + EOL;

            const parsedDescription = parseDescriptionWithErrors(roomItem.description, roomItem, player);
            if (parsedDescription.warnings.length !== 0) warnings.push({ cell: roomItem.descriptionCell(), warnings: parsedDescription.warnings });
            if (parsedDescription.errors.length !== 0) errors.push({ cell: roomItem.descriptionCell(), errors: parsedDescription.errors });

            text += "      ";
            text += roomItem.description + EOL;

            text += "      ";
            text += parsedDescription.text + EOL;
        }
        await appendFile(fileName, text);
    }

    // Get puzzles next.
    {
        await appendFile(fileName, "PUZZLES:");
        let text = "";
        for (const puzzle of game.puzzles) {
            text += "   ";
            text += puzzle.name + EOL;

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
        for (const event of game.eventsCollection.values()) {
            text += "   ";
            text += event.id + EOL;

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
        for (const statusEffect of game.statusEffectsCollection.values()) {
            text += "   ";
            text += statusEffect.id + EOL;

            // First, do the inflicted text.
            if (statusEffect.inflictedDescription !== "") {
                text += "      MESSAGE WHEN INFLICTED:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(statusEffect.inflictedDescription, statusEffect, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: statusEffect.inflictedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: statusEffect.inflictedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += statusEffect.inflictedDescription + EOL;

                text += "         ";
                text += parsedDescription.text + EOL;
            }

            // Finally, do the cured text.
            if (statusEffect.curedDescription !== "") {
                text += "      MESSAGE WHEN CURED:" + EOL;

                const parsedDescription = parseDescriptionWithErrors(statusEffect.curedDescription, statusEffect, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: statusEffect.curedCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: statusEffect.curedCell(), errors: parsedDescription.errors });

                text += "         ";
                text += statusEffect.curedDescription + EOL;

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
        for (const player of game.playersCollection.values()) {
            text += "   ";
            text += player.name + EOL;

            const parsedDescription = parseDescriptionWithErrors(player.description, player, player);
            if (parsedDescription.warnings.length !== 0) warnings.push({ cell: player.descriptionCell(), warnings: parsedDescription.warnings });
            if (parsedDescription.errors.length !== 0) errors.push({ cell: player.descriptionCell(), errors: parsedDescription.errors });

            text += "      ";
            text += player.description + EOL;

            text += "      ";
            text += parsedDescription.text + EOL;
        }
        await appendFile(fileName, text);
    }

    // Finally, get inventory items.
    {
        await appendFile(fileName, "INVENTORY ITEMS:");
        let text = "";
        for (const inventoryItem of game.inventoryItems) {
            if (inventoryItem.prefab !== null) {
                text += "   ";
                text += inventoryItem.name + EOL;

                const parsedDescription = parseDescriptionWithErrors(inventoryItem.description, inventoryItem, player);
                if (parsedDescription.warnings.length !== 0) warnings.push({ cell: inventoryItem.descriptionCell(), warnings: parsedDescription.warnings });
                if (parsedDescription.errors.length !== 0) errors.push({ cell: inventoryItem.descriptionCell(), errors: parsedDescription.errors });

                text += "      ";
                text += inventoryItem.description + EOL;

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
        for (const fixture of game.fixtures) {
            if (fixture.description.includes('<il>') && fixture.description.includes('</il>')) {
                text += "   ";
                text += fixture.name + EOL;

                text += "      ";
                text += (formatted ? fixture.description : parseDescription(fixture.description, fixture, player)) + EOL;

                /** @type {Array<RoomItem>} */
                const items = new Array();
                let itemNames = "";
                const prefabArray = [... game.prefabsCollection.values()];
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * prefabArray.length);
                    while (itemNames.includes(prefabArray[randomIndex].name) || fixture.description.includes(prefabArray[randomIndex].name) || fixture.description.includes(prefabArray[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * prefabArray.length);
                    const newItem = new RoomItem(prefabArray[randomIndex].id, "", fixture.location.id, true, "Fixture", `Object: ${fixture.name}`, 1, prefabArray[randomIndex].uses, prefabArray[randomIndex].description, 0, game);
                    newItem.setPrefab(prefabArray[randomIndex]);
                    newItem.location = fixture.location;
                    items.push(newItem);
                    itemNames += prefabArray[randomIndex].name + " ";
                }

                let description = fixture.description;
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    const item = items[j];
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
        for (const item of game.roomItems) {
            if (item.description.includes('<il') && item.description.includes('</il>') && item.inventoryCollection.size > 0) {
                text += "   ";
                text += item.name + EOL;

                text += "      ";
                text += (formatted ? item.description : parseDescription(item.description, item, player)) + EOL;

                /** @type {Array<RoomItem>} */
                const items = new Array();
                let itemNames = "";
                const prefabArray = [... game.prefabsCollection.values()];
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * prefabArray.length);
                    while (itemNames.includes(prefabArray[randomIndex].name) || item.description.includes(prefabArray[randomIndex].name) || item.description.includes(prefabArray[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * prefabArray.length);
                    const newItem = new RoomItem(prefabArray[randomIndex].id, "", item.location.id, true, "RoomItem", `Item: ${item.name}`, 1, prefabArray[randomIndex].uses, prefabArray[randomIndex].description, 0, game);
                    newItem.setPrefab(prefabArray[randomIndex]);
                    newItem.location = item.location;
                    items.push(newItem);
                    itemNames += prefabArray[randomIndex].name + " ";
                }

                let description = item.description;
                let tabs = 1;
                const slots = [...item.inventoryCollection.values()]
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    const newItem = items[j];
                    newItem.quantity = 0;
                    text += `(Drop ${newItem.name}): `;
                    const slot = slots[Math.floor(Math.random() * slots.length)].id;
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

                /** @type {Array<RoomItem>} */
                const items = new Array();
                let itemNames = "";
                const prefabArray = [... game.prefabsCollection.values()];
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * prefabArray.length);
                    while (itemNames.includes(prefabArray[randomIndex].name) || puzzle.alreadySolvedDescription.includes(prefabArray[randomIndex].name) || puzzle.alreadySolvedDescription.includes(prefabArray[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * prefabArray.length);
                    const newItem = new RoomItem(prefabArray[randomIndex].id, "", puzzle.location.id, true, "Puzzle", `Puzzle: ${puzzle.name}`, 1, prefabArray[randomIndex].uses, prefabArray[randomIndex].description, 0, game);
                    newItem.setPrefab(prefabArray[randomIndex]);
                    newItem.location = puzzle.location;
                    items.push(newItem);
                    itemNames += prefabArray[randomIndex].name + " ";
                }

                let description = puzzle.alreadySolvedDescription;
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    const item = items[j];
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
        for (const currentPlayer of game.playersCollection.values()) {
            if (currentPlayer.description.includes('<il') && currentPlayer.description.includes('</il>')) {
                text += "   ";
                text += currentPlayer.name + EOL;

                text += "      ";
                text += (formatted ? currentPlayer.description : parseDescription(currentPlayer.description, currentPlayer, player)) + EOL;

                /** @type {Array<RoomItem | InventoryItem>} */
                const items = new Array();
                let itemNames = "";
                const prefabArray = [... game.prefabsCollection.values()];
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * prefabArray.length);
                    while (itemNames.includes(prefabArray[randomIndex].name) || currentPlayer.description.includes(prefabArray[randomIndex].name) || currentPlayer.description.includes(prefabArray[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * prefabArray.length);
                    items.push(game.roomItems[Math.min(randomIndex, game.roomItems.length)]);
                    const newItem = new InventoryItem(player.name, prefabArray[randomIndex].id, "", "", "", "", 1, prefabArray[randomIndex].uses, prefabArray[randomIndex].description, 0, game);
                    newItem.setPrefab(prefabArray[randomIndex]);
                    if (player instanceof Player) newItem.player = player;
                    items.push(newItem);
                    itemNames += prefabArray[randomIndex].name + " ";
                }

                let description = currentPlayer.description;
                let tabs = 1;
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    const item = items[j];
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

                /** @type {Array<InventoryItem>} */
                const items = new Array();
                let itemNames = "";
                const prefabArray = [... game.prefabsCollection.values()];
                for (let j = 0; j < 4; j++) {
                    let randomIndex = Math.floor(Math.random() * prefabArray.length);
                    while (itemNames.includes(prefabArray[randomIndex].name) || inventoryItem.description.includes(prefabArray[randomIndex].name) || inventoryItem.description.includes(prefabArray[randomIndex].pluralName))
                        randomIndex = Math.floor(Math.random() * prefabArray.length);
                    const newItem = new InventoryItem(player.name, prefabArray[randomIndex].id, "", "", "", "", 1, prefabArray[randomIndex].uses, prefabArray[randomIndex].description, 0, game);
                    newItem.setPrefab(prefabArray[randomIndex]);
                    if (player instanceof Player) newItem.player = player;
                    items.push(newItem);
                    itemNames += prefabArray[randomIndex].name + " ";
                }

                let description = inventoryItem.description;
                let tabs = 1;
                const slots = [...inventoryItem.inventoryCollection.values()]
                for (let j = 0; j < items.length; j++) {
                    text += "      ";
                    for (let l = 0; l < tabs; l++)
                        text += "   ";
                    const newItem = items[j];
                    newItem.quantity = 0;
                    text += `(Stash ${newItem.name}): `;
                    const slot = slots[Math.floor(Math.random() * slots.length)].id;
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
    const warnings = [];
    // Get rooms first.
    {
        await appendFile(fileName, "ROOMS:");
        let text = "";
        for (const room of game.roomsCollection.values()) {
            if (room.description.includes('<item>') && room.description.includes('</item>')) {
                text += "   ";
                text += room.id + EOL;

                let items = new Array();
                let itemNames = new Array();
                for (const roomItem of game.roomItems) {
                    if (roomItem.location.id === room.id
                        && roomItem.containerName === ""
                        && roomItem.container === null
                        && !items.find(item => item.singleContainingPhrase === roomItem.singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === roomItem.pluralContainingPhrase)) {
                        const newItem = new RoomItem(roomItem.prefab.id, roomItem.identifier, roomItem.location.id, roomItem.accessible, roomItem.containerType, roomItem.containerName, roomItem.quantity, roomItem.uses, roomItem.description, roomItem.row, game);
                        newItem.setPrefab(roomItem.prefab);
                        newItem.location = roomItem.location;
                        items.push(newItem);
                        itemNames.push(roomItem.name);
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

                for (const exit of room.exitCollection.values()) {
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
                for (const roomItem of game.roomItems) {
                    if (roomItem.location.id === fixture.location.id
                        && roomItem.containerName === `Object: ${fixture.name}`
                        && roomItem.container.row === fixture.row
                        && fixture.preposition !== ""
                        && !items.find(item => item.singleContainingPhrase === roomItem.singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === roomItem.pluralContainingPhrase)) {
                        const newItem = new RoomItem(roomItem.prefab.id, roomItem.identifier, roomItem.location.id, roomItem.accessible, roomItem.containerType, roomItem.containerName, roomItem.quantity, roomItem.uses, roomItem.description, roomItem.row, game);
                        newItem.setPrefab(roomItem.prefab);
                        newItem.location = roomItem.location;
                        items.push(newItem);
                        itemNames.push(roomItem.name);
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
        for (const roomItem of game.roomItems) {
            if (roomItem.description.includes('<item>') && roomItem.description.includes('</item>')) {
                text += "   ";
                text += roomItem.identifier + EOL;

                text += "      ";
                text += (formatted ? roomItem.description : parseDescription(roomItem.description, roomItem, player)) + EOL;

                let items = new Array();
                let itemNames = new Array();
                for (const roomItem2 of game.roomItems) {
                    if (roomItem2.location.id === roomItem.location.id
                        && roomItem2.containerName.startsWith(`Item: ${roomItem.identifier}/`)
                        && roomItem2.container.row === roomItem.row
                        && roomItem.prefab.preposition !== ""
                        && !items.find(item => item.singleContainingPhrase === roomItem2.singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === roomItem2.pluralContainingPhrase)) {
                        const newItem = new RoomItem(roomItem2.prefab.id, roomItem2.identifier, roomItem2.location.id, roomItem2.accessible, roomItem2.containerType, roomItem2.containerName, roomItem2.quantity, roomItem2.uses, roomItem2.description, roomItem2.row, game);
                        newItem.setPrefab(roomItem2.prefab);
                        newItem.location = roomItem2.location;
                        newItem.slot = roomItem2.slot;
                        items.push(newItem);
                        itemNames.push(roomItem2.name);
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
                    let description = roomItem.description;
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
                        text += (formatted ? description : parseDescription(description, roomItem, player)) + EOL;
                        tabs++;
                        if (k === permutation.length - 1 && description.includes("<item>") && description.includes("</item"))
                            warnings.push({ cell: roomItem.descriptionCell(), text: "Unable to remove all item tags." });
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
        for (const puzzle of game.puzzles) {
            if (puzzle.alreadySolvedDescription !== "" && puzzle.alreadySolvedDescription.includes('<item>') && puzzle.alreadySolvedDescription.includes('</item>')) {
                text += "   ";
                text += puzzle.name + EOL;

                text += "      ";
                text += (formatted ? puzzle.alreadySolvedDescription : parseDescription(puzzle.alreadySolvedDescription, puzzle, player)) + EOL;

                let items = new Array();
                let itemNames = new Array();
                for (const roomItem of game.roomItems) {
                    if (roomItem.location.id === puzzle.location.id
                        && roomItem.containerName === `Puzzle: ${puzzle.name}`
                        && !items.find(item => item.singleContainingPhrase === roomItem.singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === roomItem.pluralContainingPhrase)) {
                        const newItem = new RoomItem(roomItem.prefab.id, roomItem.identifier, roomItem.location.id, roomItem.accessible, roomItem.containerType, roomItem.containerName, roomItem.quantity, roomItem.uses, roomItem.description, roomItem.row, game);
                        newItem.setPrefab(roomItem.prefab);
                        newItem.location = roomItem.location;
                        items.push(newItem);
                        itemNames.push(roomItem.name);
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
        for (const currentPlayer of game.playersCollection.values()) {
            if (currentPlayer.description.includes('<item>') && currentPlayer.description.includes('</item>')) {
                text += "   ";
                text += currentPlayer.name + EOL;

                text += "      ";
                text += (formatted ? currentPlayer.description : parseDescription(currentPlayer.description, currentPlayer, player)) + EOL;

                let items = new Array();
                let itemNames = new Array();
                for (const inventoryItem of game.inventoryItems) {
                    if (inventoryItem.player.name === currentPlayer.name
                        && inventoryItem.prefab !== null
                        && inventoryItem.container === null
                        && !items.find(item => item.singleContainingPhrase === inventoryItem.singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === inventoryItem.pluralContainingPhrase)) {
                        const newItem = new InventoryItem(inventoryItem.player.name, inventoryItem.prefab.id, inventoryItem.identifier, inventoryItem.equipmentSlot, inventoryItem.containerType, inventoryItem.containerName, inventoryItem.quantity, inventoryItem.uses, inventoryItem.description, inventoryItem.row, game);
                        newItem.setPrefab(inventoryItem.prefab);
                        newItem.player = inventoryItem.player;
                        items.push(newItem);
                        itemNames.push(inventoryItem.name);
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
        for (const inventoryItem of game.inventoryItems) {
            if (inventoryItem.prefab !== null && inventoryItem.description.includes('<item>') && inventoryItem.description.includes('</item>')) {
                text += "   ";
                text += inventoryItem.identifier + EOL;

                text += "      ";
                text += (formatted ? inventoryItem.description : parseDescription(inventoryItem.description, inventoryItem, player)) + EOL;

                let items = new Array();
                let itemNames = new Array();
                for (const inventoryItem2 of game.inventoryItems) {
                    if (inventoryItem.player.name === inventoryItem.player.name
                        && inventoryItem.prefab !== null
                        && inventoryItem.containerName.startsWith(`${inventoryItem.identifier}/`)
                        && inventoryItem.container !== null
                        && inventoryItem.container.row === inventoryItem.row
                        && inventoryItem.prefab.preposition !== ""
                        && !items.find(item => item.singleContainingPhrase === inventoryItem.singleContainingPhrase || item.pluralContainingPhrase !== "" && item.pluralContainingPhrase === inventoryItem.pluralContainingPhrase)) {
                        const newItem = new InventoryItem(inventoryItem.player.name, inventoryItem.prefab.id, inventoryItem.identifier, inventoryItem.equipmentSlot, inventoryItem.containerType, inventoryItem.containerName, inventoryItem.quantity, inventoryItem.uses, inventoryItem.description, inventoryItem.row, game);
                        newItem.setPrefab(inventoryItem.prefab);
                        newItem.player = inventoryItem.player;
                        newItem.slot = inventoryItem.slot;
                        items.push(newItem);
                        itemNames.push(inventoryItem.name);
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

    const permutations = [];
    for (let i = 0; i < array.length; i++) {
        const element = array[i];

        if (array.indexOf(element) !== i)
            continue;

        const remainingElements = array.filter(piece => piece !== array[i]);

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
