import GameSettings from '../Classes/GameSettings.js';
import InflictAction from '../Data/Actions/InflictAction.js';
import Game from '../Data/Game.js';
import { addGameMechanicMessage, addReply } from '../Modules/messageHandler.js';

/** @typedef {import("../Data/Status.js").default} Status */

/** @type {CommandConfig} */
export const config = {
    name: "status_moderator",
    description: "Deals with status effects on players.",
    details: 'Deals with status effects on players.\n\n'
        + '-**add**/**inflict**: Inflicts the specified players with the given status effect. '
        + 'Those players will receive the "Message When Inflicted" message for the specified status effect. '
        + 'If the status effect has a timer, the players will be cured and then inflicted with the status effect '
        + 'in the "Develops Into" column when the timer reaches 0. If the status effect is fatal, '
        + 'then they will simply die when the timer reaches 0 instead.\n\n'
        + '-**remove**/**cure**: Cures the specified players of the given status effect. '
        + 'Those players will receive the "Message When Cured" message for the specified status effect. '
        + 'If the status effect develops into another effect when cured, the players will be inflicted with that status effect.\n\n'
        + '-**view**: Views all of the status effects that a player is currently afflicted with, along with the time remaining on each one, if applicable.',
    usableBy: "Moderator",
    aliases: ["status", "inflict", "cure", "view"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage(settings) {
    return `${settings.commandPrefix}status add mari heated\n`
        + `${settings.commandPrefix}inflict yume heated\n`
        + `${settings.commandPrefix}status add aki saay yuko haru asleep\n`
        + `${settings.commandPrefix}inflict all deafened\n`
        + `${settings.commandPrefix}status remove flint injured\n`
        + `${settings.commandPrefix}cure elijah injured\n`
        + `${settings.commandPrefix}status remove astrid ryou juneau drunk\n`
        + `${settings.commandPrefix}cure living asleep\n`
        + `${settings.commandPrefix}status view jordan\n`
        + `${settings.commandPrefix}view jordan`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {UserMessage} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 */
export async function execute(game, message, command, args) {
    if (command === "status") {
        if (args[0] === "add" || args[0] === "inflict") command = "inflict";
        else if (args[0] === "remove" || args[0] === "cure") command = "cure";
        else if (args[0] === "view") {
            command = "view";
            if (!args[1])
                return addReply(game, message, `You need to input a player. Usage:\n${usage(game.settings)}`);
        }
        args.splice(0, 1);
    }

    if (args.length === 0)
        return addReply(game, message, `You need to input all required arguments. Usage:\n${usage(game.settings)}`);

    // Get all listed players first.
    var players = [];
    if (args[0] === "all" || args[0] === "living") {
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].title !== "NPC" && !game.players_alive[i].member.roles.cache.find(role => role.id === game.guildContext.freeMovementRole.id))
                players.push(game.players_alive[i]);
        }
        args.splice(0, 1);
    }
    else {
        for (let i = 0; i < game.players_alive.length; i++) {
            for (let j = 0; j < args.length; j++) {
                if (args[j].toLowerCase() === game.players_alive[i].name.toLowerCase()) {
                    players.push(game.players_alive[i]);
                    args.splice(j, 1);
                    break;
                }
            }
        }
    }
    if (players.length === 0) return addReply(game, message, "You need to specify at least one player.");
    if (players.length > 1 && command === "view") return addReply(game, message, "Cannot view status of more than one player at a time.");
    const input = args.join(" ");
    if (input === "" && command !== "view") return addReply(game, message, "You need to specify a status effect.");

    /** @type {Status} */
    let status = null;
    if (command !== "view") {
        status = game.entityFinder.getStatusEffect(input);
        if (status === null) return addReply(game, message, `Couldn't find status effect "${input}".`);
    }

    if (command === "inflict") {
        if (players.length > 1) {
            for (let i = 0; i < players.length; i++) {
                const action = new InflictAction(game, undefined, players[i], players[i].location, true);
                action.performInflict(status, true, true, true);
            }
            addGameMechanicMessage(game, game.guildContext.commandChannel, "Status successfully added to the listed players.");
        }
        else {
            const action = new InflictAction(game, message, players[0], players[0].location, true);
            action.performInflict(status, true, true, true);
            addGameMechanicMessage(game, game.guildContext.commandChannel, "Status successfully added.");
        }
    }
    else if (command === "cure") {
        if (players.length > 1) {
            for (let i = 0; i < players.length; i++)
                players[i].cure(input.toLowerCase(), true, true, true);
            addGameMechanicMessage(game, game.guildContext.commandChannel, "Successfully removed status effect from the listed players.");
        }
        else {
            const response = players[0].cure(input.toLowerCase(), true, true, true);
            addGameMechanicMessage(game, game.guildContext.commandChannel, response);
        }
    }
    else if (command === "view") {
        const response = `${players[0].name}'s status:\n${players[0].getStatusList(true, true)}`;
        addGameMechanicMessage(game, game.guildContext.commandChannel, response);
    }
}
