import GameSettings from "../Classes/GameSettings.js";
import Game from "../Data/Game.js";
import Player from "../Data/Player.js";
import Event from "../Data/Event.js";
import Flag from "../Data/Flag.js";
import InventoryItem from "../Data/InventoryItem.js";
import Puzzle from "../Data/Puzzle.js";
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "setpronouns_bot",
    description: "Sets a player's pronouns.",
    details: "Sets the pronouns that will be used in the given player's description and other places where pronouns are used. This will not change "
        + "their pronouns on the spreadsheet, and when player data is reloaded, their pronouns will be reverted to their original pronouns. "
        + "Note that if the player is inflicted with or cured of a status effect with the concealed attribute, their pronouns will be updated, "
        + "thus overwriting the ones that were set manually. However, this command can be used to overwrite their new pronouns afterwards as well. "
        + "Temporary custom pronoun sets can be applied with this method. They must adhere to the following format: "
        + "`subjective\objective\dependent possessive\independent possessive\reflexive\plural`. If you use \"player\" in place of a player's name, "
        + "then the player who triggered the command will have their pronouns set.",
    usableBy: "Bot",
    aliases: ["setpronouns"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `setpronouns sadie female\n`
        + `setpronouns roma neutral\n`
        + `setpronouns platt male\n`
        + `setpronouns monokuma it\it\its\its\itself\false\n`
        + `setpronouns player she\her\her\hers\herself\false\n`
        + `setpronouns player they\them\their\theirs\themself\true\n`
        + `setpronouns player he\him\his\his\himself\false`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} [player] - The player who caused the command to be executed, if applicable. 
 * @param {Event|Flag|InventoryItem|Puzzle} [callee] - The in-game entity that caused the command to be executed, if applicable. 
 */
export async function execute (game, command, args, player, callee) {
    const cmdString = command + " " + args.join(" ");
    if (args.length !== 2)
        return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". You need to specify a player and a pronoun set. Usage:\n${exports.config.usage}`);

    if (args[0].toLowerCase() !== "player") {
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
                player = game.players_alive[i];
                break;
            }
        }
        if (player === null) return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". Player "${args[0]}" not found.`);
    }
    else if (args[0].toLowerCase() === "player" && player === null)
        return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". The "player" argument was used, but no player was passed into the command.`);

    args.splice(0, 1);

    let input = args.join(" ").toLowerCase().replace(/\\/g, "/");
    if (input !== "female" && input !== "male" && input !== "neutral" && input.split('/').length !== 6)
        return messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}". The supplied pronoun string is invalid.`);
    player.setPronouns(player.pronouns, input);

    // Check if the pronouns were set correctly.
    let correct = true;
    let errorMessage = "";
    if (player.pronouns.sbj === null || player.pronouns.sbj === "") {
        correct = false;
        errorMessage += "No subject pronoun was given.\n";
    }
    if (player.pronouns.obj === null || player.pronouns.obj === "") {
        correct = false;
        errorMessage += "No object pronoun was given.\n";
    }
    if (player.pronouns.dpos === null || player.pronouns.dpos === "") {
        correct = false;
        errorMessage += "No dependent possessive pronoun was given.\n";
    }
    if (player.pronouns.ipos === null || player.pronouns.ipos === "") {
        correct = false;
        errorMessage += "No independent possessive pronoun was given.\n";
    }
    if (player.pronouns.ref === null || player.pronouns.ref === "") {
        correct = false;
        errorMessage += "No reflexive pronoun was given.\n";
    }
    if (player.pronouns.plural === null) {
        correct = false;
        errorMessage += "Whether the player's pronouns pluralize verbs was not specified.\n";
    }

    if (correct === false) {
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${cmdString}".\n${errorMessage}`);
        // Revert the player's pronouns.
        player.setPronouns(player.pronouns, player.pronounString);
    }

    return;
}
