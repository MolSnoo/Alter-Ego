import Event from '../Data/Event.js';
import Flag from '../Data/Flag.js';
import Game from '../Data/Game.js';
import InventoryItem from '../Data/InventoryItem.js';
import Player from '../Data/Player.js';
import Puzzle from '../Data/Puzzle.js';
import { addReply, addGameMechanicMessage } from './messageHandler.js';
import { ChannelType, Message } from 'discord.js';

/**
 * Finds the right command file for the user and executes it.
 * @param {string} commandStr - The full text of the command issued.
 * @param {Game} game - The game in which the command is being executed.
 * @param {UserMessage} [message] - The message in which the command was issued, if applicable.
 * @param {Player} [player] - The player who issued the command, or caused it to be executed, if applicable.
 * @param {Event|Flag|InventoryItem|Puzzle} [callee] - The in-game entity that caused the command to be executed, if applicable.
 * @returns {Promise<boolean>} Whether the command was successfully executed.
 */
export async function executeCommand(commandStr, game, message, player, callee) {
    let isBot = false, isModerator = false, isPlayer = false, isEligible = false;
    // First, determine who is using the command.
    if (!message) isBot = true;
    else if ((message.channel.id === game.guildContext.commandChannel.id || commandStr.startsWith('delete'))
        && message.member.roles.resolve(game.guildContext.moderatorRole))
        isModerator = true;
    else {
        // Don't attempt to find the member who sent this message if it was sent by a webhook.
        if (message.webhookId !== null) return false;
        let member = game.guildContext.guild.members.resolve(message.author.id);
        if (member && member.roles.resolve(game.guildContext.playerRole)) isPlayer = true;
        else if (member && game.settings.debug && member.roles.resolve(game.guildContext.testerRole)) isEligible = true;
        else if (member && !game.settings.debug && member.roles.resolve(game.guildContext.eligibleRole)) isEligible = true;
    }

    const commandSplit = commandStr.split(" ");
    const commandAlias = commandSplit[0].toLocaleLowerCase();
    const args = commandSplit.slice(1);

    // Find the command by the alias used.
    let botCommand;
    let moderatorCommand;
    let playerCommand;
    let eligibleCommand;
    if (isBot) botCommand = game.botContext.botCommands.find(command => command.config.aliases.includes(commandAlias));
    else if (isModerator) moderatorCommand = game.botContext.moderatorCommands.find(command => command.config.aliases.includes(commandAlias));
    else if (isPlayer) playerCommand = game.botContext.playerCommands.find(command => command.config.aliases.includes(commandAlias));
    else if (isEligible) eligibleCommand = game.botContext.eligibleCommands.find(command => command.config.aliases.includes(commandAlias));

    if (!botCommand && !moderatorCommand && !playerCommand && !botCommand) return false;
    const getCommandName = (command) => command.config.name.substring(0, command.config.name.indexOf('_'));

    // If the commandLog is at its maximum capacity, remove the oldest entry.
    /** @type {CommandLogEntry} */
    let entry;
    if (game.botContext.commandLog.length >= 10000) {
        game.botContext.commandLog.shift();
    }

    // Execute the command based on who issued it.
    if (isBot) {
        botCommand.execute(game, commandAlias, args, player, callee);
        entry = {
            timestamp: new Date(),
            author: game.botContext.client.user.username,
            content: commandStr
        };
        game.botContext.commandLog.push(entry);
        return true;
    }
    else if (isModerator) {
        if (moderatorCommand.config.requiresGame && !game.inProgress) {
            message.reply("There is no game currently running.");
            return false;
        }
        moderatorCommand.execute(game, message, commandAlias, args);
        entry = {
            timestamp: new Date(),
            author: message.author.username,
            content: message.content
        };
        game.botContext.commandLog.push(entry);
        return true;
    }
    else if (isPlayer) {
        if (playerCommand.config.requiresGame && !game.inProgress) {
            message.reply("There is no game currently running.");
            return false;
        }
        if (message.channel.type === ChannelType.DM
            || message.channel.type === ChannelType.GuildText && game.guildContext.roomCategories.includes(message.channel.parentId)) {
            for (const livingPlayer of game.livingPlayersCollection.values()) {
                if (livingPlayer.id === message.author.id) {
                    player = livingPlayer;
                    break;
                }
            }
            if (!player) {
                addReply(game, message, "You are not on the list of living players.");
                return false;
            }
            const commandName = getCommandName(playerCommand);
            const status = player.getBehaviorAttributeStatusEffects("disable all");
            if (status.length > 0 && !player.hasBehaviorAttribute(`enable ${commandName}`)) {
                if (player.hasStatus("heated")) addReply(game, message, "The situation is **heated**. Moderator intervention is required.");
                else addReply(game, message, `You cannot do that because you are **${status[0].id}**.`);
                return false;
            }
            if (game.editMode && commandName !== "say") {
                addReply(game, message, "You cannot do that because edit mode is currently enabled.");
                return false;
            }

            player.setOnline();

            playerCommand.execute(game, message, commandAlias, args, player).then(() => {
                if (!game.settings.debug && commandName !== "say" && message.channel.type !== ChannelType.DM)
                    message.delete().catch();
            });

            entry = {
                timestamp: new Date(),
                author: player.name,
                content: message.content
            };
            game.botContext.commandLog.push(entry);
            return true;
        }
        return false;
    }
    else if (isEligible) {
        if (eligibleCommand.config.requiresGame && !game.inProgress) {
            message.reply("There is no game currently running.");
            return false;
        }
        if (message.channel.type === ChannelType.DM
            || game.settings.debug && message.channel.id === game.guildContext.testingChannel.id
            || !game.settings.debug && message.channel.id === game.guildContext.generalChannel.id) {
            eligibleCommand.execute(game, message, commandAlias, args).then(() => {
                if (!game.settings.debug)
                    message.delete().catch();
            });
            entry = {
                timestamp: new Date(),
                author: message.author.username,
                content: message.content
            };
            game.botContext.commandLog.push(entry);
            return true;
        }
        return false;
    }

    return false;
}

/**
 * 
 * @param {string[]} commandSet - A list of bot commands to pass into the command handler's execute function.
 * @param {Game} game - The game in which the command is being executed.
 * @param {Event|Flag|InventoryItem|Puzzle} callee - The in-game entity that caused the command to be executed.
 * @param {Player} [player] - The player who caused the command to be executed, if applicable.
 */
export async function parseAndExecuteBotCommands(commandSet, game, callee, player) {
    for (let command of commandSet) {
        if (command.startsWith("wait")) {
            let args = command.split(" ");
            if (!args[1]) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${command}". No amount of seconds to wait was specified.`);
            const seconds = parseInt(args[1]);
            if (isNaN(seconds) || seconds < 0) return addGameMechanicMessage(game, game.guildContext.commandChannel, `Error: Couldn't execute command "${command}". Invalid amount of seconds to wait.`);
            await sleep(seconds);
        }
        else {
            if (callee instanceof Puzzle && callee.type === "matrix") {
                const regex = /{([^{},/]+?)}/g;
                let match;
                while (match = regex.exec(command)) {
                    for (const requirement of callee.requirements) {
                        if (requirement instanceof Puzzle && requirement.name.toUpperCase() === match[1].toUpperCase() && requirement.outcome !== "") {
                            command = command.replace(match[0], requirement.outcome);
                        }
                    }
                }
            }
            executeCommand(command, game, null, player, callee);
        }
    }
}

/**
 * @param {number} seconds 
 */
function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}
