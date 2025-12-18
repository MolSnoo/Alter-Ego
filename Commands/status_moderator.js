import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';
import Player from '../Data/Player.js';

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
 * @param {Message} message - The message in which the command was issued. 
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
                return messageHandler.addReply(game, message, `You need to input a player. Usage:\n${usage(game.settings)}`);
        }
        args.splice(0, 1);
    }

    if (args.length === 0)
        return messageHandler.addReply(game, message, `You need to input all required arguments. Usage:\n${usage(game.settings)}`);

    // Get all listed players first.
    /**
     * @type {Array<Player>}
     */
    const players = new Array();
    if (args[0] === "all" || args[0] === "living") {
        players.concat(game.entityFinder.getLivingPlayers(null, false).filter((player) => {!player.member.roles.cache.find(role => role.id === game.guildContext.freeMovementRole.id)}));
        args.splice(0, 1);
    }
    else {
        for (let i = args.length - 1; i >= 0; i--) {
            const fetchedPlayer = game.entityFinder.getLivingPlayer(args[i]);
            if (fetchedPlayer) {
                players.push(fetchedPlayer);
                args.splice(i, 1);
            }
        }
    }
    if (players.length === 0) return messageHandler.addReply(game, message, "You need to specify at least one player.");
    if (players.length > 1 && command === "view") return messageHandler.addReply(game, message, "Cannot view status of more than one player at a time.");
    const input = args.join(" ");
    if (input === "" && command !== "view") return messageHandler.addReply(game, message, "You need to specify a status effect.");

    if (command === "inflict") {
        if (players.length > 1) {
            let success = true;
            for (let i = 0; i < players.length; i++) {
                const response = players[i].inflict(input.toLowerCase(), true, true, true);
                if (response.startsWith("Couldn't find status effect")) {
                    messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, response);
                    success = false;
                    break;
                }
            }
            if (success) messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, "Status successfully added to the listed players.");
        }
        else {
            const response = players[0].inflict(input.toLowerCase(), true, true, true);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, response);
        }
    }
    else if (command === "cure") {
        if (players.length > 1) {
            for (let i = 0; i < players.length; i++)
                players[i].cure(input.toLowerCase(), true, true, true);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, "Successfully removed status effect from the listed players.");
        }
        else {
            const response = players[0].cure(input.toLowerCase(), true, true, true);
            messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, response);
        }
    }
    else if (command === "view") {
        const response = `${players[0].name}'s status:\n${players[0].getStatusList(true, true)}`;
        messageHandler.addGameMechanicMessage(game, game.guildContext.commandChannel, response);
    }
}
