// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ActivateAction from '../Data/Actions/ActivateAction.ts';
import ActivateAndAttemptAction from '../Data/Actions/ActivateAndAttemptAction.ts';
import AttemptAction from '../Data/Actions/AttemptAction.ts';
import DeactivateAction from '../Data/Actions/DeactivateAction.ts';
import DeactivateAndAttemptAction from '../Data/Actions/DeactivateAndAttemptAction.ts';
import UseAction from '../Data/Actions/UseAction.ts';

/** @import Fixture from '../Data/Fixture.ts' */
/** @import GameSettings from '../Classes/GameSettings.ts' */
/** @import Game from '../Data/Game.ts' */
/** @import InventoryItem from '../Data/InventoryItem.ts' */
/** @import Player from '../Data/Player.ts' */
/** @import Puzzle from '../Data/Puzzle.ts' */

/** @type {CommandConfig} */
export const config = {
    name: "use_player",
    description: "Uses an item in your inventory or a fixture in a room.",
    details: `Uses an item from your inventory. Not all items have programmed uses. Those that do will inflict you `
        + `with or cure you of a status effect of some kind. Status effects can be good, bad, or neutral, but it `
        + `should be fairly predictable what kind of effect a particular item will have on you.\n\n`
        + `Some items can be used on fixtures in the room. For example, using a key on a locker `
        + `will unlock the locker, using a crowbar on a crate will open the crate, etc.\n\n`
        + `Some fixtures are capable of turning items into other items. This is known as processing a recipe. `
        + `For example, an oven can turn raw food into cooked food. In order to use fixtures to process recipes, `
        + `drop the items in the fixture and use it. For more information, see the help details for the \`recipes\` command.\n\n`
        + `You can even use fixtures in the room without using an item at all. However, not all fixtures are usable in this way. `
        + `Those that are usable without an item have puzzles attached, which can result in many different outcomes depending on how they're used. `
        + `When interacting with a puzzle, anything entered after the name of the fixture will be treated as a password, combination, or selection. `
        + `These inputs are almost always case-sensitive. If the fixture is a lock of some kind, you can re-lock it using the \`lock\` command. `
        + `Other fixtures may require a puzzle to be solved before they do anything special.`,
    usableBy: "Player",
    aliases: ["use", "unlock", "lock", "type", "activate", "deactivate", "flip", "push", "press", "ingest", "consume", "swallow", "eat", "drink"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings
 * @returns {string}
 */
export function usage(settings) {
    return `${settings.commandPrefix}use FIRST AID KIT\n`
        + `${settings.commandPrefix}eat CHICKEN FRIED RICE\n`
        + `${settings.commandPrefix}drink COFFEE\n`
        + `${settings.commandPrefix}swallow ORANGE CAPSULE\n`
        + `${settings.commandPrefix}use OLD KEY CHEST\n`
        + `${settings.commandPrefix}use LIGHTER CANDLE\n`
        + `${settings.commandPrefix}lock LOCKER 1\n`
        + `${settings.commandPrefix}type KEYPAD Proboscis Monkey\n`
        + `${settings.commandPrefix}unlock LOCKER 1 12-22-11\n`
        + `${settings.commandPrefix}press RED BUTTON\n`
        + `${settings.commandPrefix}flip LEVER\n`
        + `${settings.commandPrefix}activate BLENDER`;
}

/**
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} message - The message in which the command was issued.
 * @param {string} command - The command alias that was used.
 * @param {string[]} args - A list of arguments passed to the command as individual words.
 * @param {Player} player - The player who issued the command.
 */
export async function execute(game, message, command, args, player) {
    if (args.length === 0)
        return game.communicationHandler.reply(message, `You need to specify a fixture or an inventory item. Usage:\n${usage(game.settings)}`);

    const status = player.getBehaviorAttributeStatusEffects("disable use");
    if (status.length > 0) return game.communicationHandler.reply(message, `You cannot do that because you are **${status[0].id}**.`);

    // This will be checked multiple times, so get it now.
    const hiddenStatus = player.getBehaviorAttributeStatusEffects("hidden");

    let input = args.join(" ");
    let parsedInput = input.toUpperCase();

    // First find the item in the player's hand, if applicable.
    /** @type {InventoryItem} */
    let item = null;
    for (const hand of game.entityFinder.getPlayerHands(player)) {
        if (hand.equippedItem !== null && (parsedInput.startsWith(hand.equippedItem.name + ' ') || hand.equippedItem.name === parsedInput)) {
            item = hand.equippedItem;
            break;
        }
    }
    if (item !== null) {
        parsedInput = parsedInput.substring(item.name.length).trim();
        input = input.substring(item.name.length).trim();
    }

    /** A set of aliases that will only result in a UseAction. */
    const useActionAliases = new Set(["ingest", "consume", "swallow", "eat", "drink"]);

    // Now check to see if the player is trying to solve a puzzle.
    /** @type {Puzzle} */
    let puzzle = null;
    /** @type {Fixture} */
    let fixture = null;
    let password = "";
    /** @type {Player} */
    let targetPlayer = null;
    if (parsedInput !== "" && !useActionAliases.has(command)) {
        let puzzles = game.puzzles.filter(puzzle => puzzle.location.id === player.location.id);
        /** A set of aliases that will filter puzzles to lock types. */
        const lockAliases = new Set(["lock", "unlock"]);
        /** A set of aliases that will filter puzzles to password types. */
        const passwordAliases = new Set(["type"]);
        /** A set of aliases that will filter puzzles to interact and switch types. */
        const interactAliases = new Set(["push", "press", "activate", "deactivate", "flip"]);
        if (lockAliases.has(command))
            puzzles = puzzles.filter(puzzle => puzzle.type === "combination lock" || puzzle.type === "key lock");
        else if (passwordAliases.has(command))
            puzzles = puzzles.filter(puzzle => puzzle.type === "password" || puzzle.type === "channels");
        else if (interactAliases.has(command))
            puzzles = puzzles.filter(puzzle => puzzle.type === "interact" || puzzle.type === "toggle" || puzzle.type === "switch" || puzzle.type === "option");
        for (let i = 0; i < puzzles.length; i++) {
            if (puzzles[i].parentFixture !== null &&
                (parsedInput.startsWith(puzzles[i].parentFixture.name + ' ') || parsedInput === puzzles[i].parentFixture.name)) {
                puzzle = puzzles[i];
                //parsedInput = parsedInput.substring(puzzle.parentFixture.name.length).trim();
                input = input.substring(puzzle.parentFixture.name.length).trim();
                break;
            }
            else if (parsedInput.startsWith(puzzles[i].name + ' ') || parsedInput === puzzles[i].name) {
                puzzle = puzzles[i];
                //parsedInput = parsedInput.substring(puzzle.name.length).trim();
                input = input.substring(puzzle.name.length).trim();
                break;
            }
        }
        if (puzzle !== null) {
            // Make sure the player can only solve the puzzle if it's a child puzzle of the fixture they're hiding in, if they're hidden.
            if (hiddenStatus.length > 0 && puzzle.parentFixture !== null && player.hidingSpot !== puzzle.parentFixture.name) return game.communicationHandler.reply(message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);
            if (puzzle.parentFixture !== null)
                fixture = puzzle.parentFixture;

            password = input;
            if (password !== "") parsedInput = parsedInput.substring(0, parsedInput.indexOf(password.toUpperCase())).trim();
            if (parsedInput !== "") targetPlayer = game.entityFinder.getLivingPlayers(parsedInput, null, player.location.id, player.hidingSpot)[0] ?? null;
        }
    }

    // Check if the player specified a fixture.
    if (fixture === null && item === null && parsedInput !== "" && !useActionAliases.has(command)) {
        const fixtures = game.fixtures.filter(fixture => fixture.location.id === player.location.id);
        for (let i = 0; i < fixtures.length; i++) {
            if (fixtures[i].name === parsedInput) {
                fixture = fixtures[i];
                break;
            }
        }
    }

    let fixtureAndPuzzle = false;
    // If there is a fixture, do the required behavior.
    if (fixture !== null && fixture.recipeTag !== "" && fixture.activatable) {
        // Make sure the player can only activate the fixture if it's the fixture they're hiding in, if they're hidden.
        if (hiddenStatus.length > 0 && player.hidingSpot !== fixture.name) return game.communicationHandler.reply(message, `You cannot do that because you are **${hiddenStatus[0].id}**.`);

        fixtureAndPuzzle = puzzle !== null;
        if (fixtureAndPuzzle && fixture.activated) {
            const deactivateAndAttemptAction = new DeactivateAndAttemptAction(game, message, player, player.location, false);
            deactivateAndAttemptAction.performDeactivateAndAttempt(fixture, puzzle, item, password, command, input, targetPlayer);
        }
        else if (fixtureAndPuzzle) {
            const activateAndAttemptAction = new ActivateAndAttemptAction(game, message, player, player.location, false);
            activateAndAttemptAction.performActivateAndAttempt(fixture, puzzle, item, password, command, input, targetPlayer);
        }
        else if (fixture.activated) {
            const deactivateAction = new DeactivateAction(game, message, player, player.location, false);
            deactivateAction.performDeactivate(fixture, true);
        }
        else {
            const activateAction = new ActivateAction(game, message, player, player.location, false);
            activateAction.performActivate(fixture, true);
        }
    }

    // If there is a puzzle, do the required behavior.
    if (!fixtureAndPuzzle && puzzle !== null) {
        const attemptAction = new AttemptAction(game, message, player, player.location, false);
        attemptAction.performAttempt(puzzle, item, password, command, input, targetPlayer);
    }
    // Otherwise, the player must be trying to use an item on themselves.
    else if (item !== null && (command === "use" || useActionAliases.has(command))) {
        if (item.uses === 0) return game.communicationHandler.reply(message, "That item has no uses left.");
        if (!item.prefab.usable) return game.communicationHandler.reply(message, "That item has no programmed use on its own, but you may be able to use it some other way.");
        if (!item.usableOn(player)) return game.communicationHandler.reply(message, `${item.name} currently has no effect on you.`);
        const action = new UseAction(game, message, player, player.location, false);
        await action.performUse(item);
    }
    else if (fixture === null) return game.communicationHandler.reply(message, `Couldn't find "${input}" to ${command}. Try using a different command?`);
}
