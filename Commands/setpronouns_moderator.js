import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';

/** @type {CommandConfig} */
export const config = {
    name: "setpronouns_moderator",
    description: "Sets a player's pronouns.",
    details: "Sets the pronouns that will be used in the given player's description and other places where pronouns are used. This will not change "
        + "their pronouns on the spreadsheet, and when player data is reloaded, their pronouns will be reverted to their original pronouns. "
        + "Note that if the player is inflicted with or cured of a status effect with the concealed attribute, their pronouns will be updated, "
        + "thus overwriting the ones that were set manually. However, this command can be used to overwrite their new pronouns afterwards as well. "
        + "Temporary custom pronoun sets can be applied with this method. They must adhere to the following format: "
        + "`subjective/objective/dependent possessive/independent possessive/reflexive/plural`.",
    usableBy: "Moderator",
    aliases: ["setpronouns"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}setpronouns sadie female\n`
        + `${settings.commandPrefix}setpronouns roma neutral\n`
        + `${settings.commandPrefix}setpronouns platt male\n`
        + `${settings.commandPrefix}setpronouns monokuma it/it/its/its/itself/false\n`
        + `${settings.commandPrefix}setpronouns sadie she/her/her/hers/herself/false\n`
        + `${settings.commandPrefix}setpronouns roma they/them/their/theirs/themself/true\n`
        + `${settings.commandPrefix}setpronouns platt he/him/his/his/himself/false`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute (game, message, command, args) {
    if (args.length !== 2)
        return messageHandler.addReply(game, message, `You need to specify a player and a pronoun set. Usage:\n${usage(game.settings)}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            args.splice(0, 1);
            break;
        }
    }
    if (player === null) return messageHandler.addReply(game, message, `Player "${args[0]}" not found.`);

    var input = args.join(" ").toLowerCase();
    player.setPronouns(player.pronouns, input);

    // Check if the pronouns were set correctly.
    var correct = true;
    var errorMessage = "";
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
    if (player.pronouns.plural === null || player.pronouns.plural === "") {
        correct = false;
        errorMessage += "Whether the player's pronouns pluralize verbs was not specified.\n";
    }

    if (correct === false) {
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, errorMessage);
        // Revert the player's pronouns.
        player.setPronouns(player.pronouns, player.pronounString);
    }
    else messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, `Successfully set ${player.name}'s pronouns.`);

    return;
}
