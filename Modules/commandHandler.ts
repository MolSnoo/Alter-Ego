import type Game from '../Data/Game.ts';
import BotCommand from "../Classes/BotCommand.ts";
import ModeratorCommand from "../Classes/ModeratorCommand.ts";
import PlayerCommand from "../Classes/PlayerCommand.ts";
import EligibleCommand from "../Classes/EligibleCommand.ts";
import type Player from '../Data/Player.ts';
import Puzzle from '../Data/Puzzle.ts';
import Flag from '../Data/Flag.ts';

/**
 * Finds the right command file for the user and executes it.
 * @param commandStr - The full text of the command issued.
 * @param game - The game in which the command is being executed.
 * @param message - The message in which the command was issued, if applicable.
 * @param player - The player who issued the command, or caused it to be executed, if applicable.
 * @param callee - The in-game entity that caused the command to be executed, if applicable.
 * @returns Whether the command was successfully executed.
 */
export async function executeCommand(commandStr: string, game: Game, message?: UserMessage, player?: Player, callee?: Callee): Promise<boolean> {
    const timestamp = new Date();
    const commandType = getCommandType(game, message);
    if (!commandType) return false;

    const commandSplit = commandStr?.split(/[^\S\n]/).filter(arg => arg !== "");
    const commandAlias = commandSplit[0] ? commandSplit[0].toLocaleLowerCase() : "";
    let args = commandSplit.slice(1);
    const command = game.botContext.getCommand(commandType, commandAlias);
    if (!command) return false;

    // Execute the command based on who issued it.
    if (command instanceof BotCommand) {
        command.execute(game, commandAlias, args, player, callee);
        game.botContext.logCommand(game.botContext.client.user.username, commandStr, timestamp);
        return true;
    }
    else if (command instanceof ModeratorCommand && game.botContext.commandIssuedInValidChannel(command, message)) {
        if (command.config.requiresGame && !game.inProgress) {
            if (message.channel.id === game.guildContext.commandChannel.id) {
                message.reply("There is no game currently running.");
                return false;
            }
            else {
                message.author.send("There is no game currently running.");
                message.delete().catch();
                return false;
            }
        }
        const moderator = message.member ? game.entityLoader.getOrCreateModerator(message.member) : undefined;
        if (!moderator) {
            game.communicationHandler.reply(message, "You are not a moderator.");
            return false;
        }
        if (command.config.whitespaceSensitive) {
            args = commandStr.split(" ").slice(1);
        }
        command.execute(game, message, commandAlias, args, moderator);
        if (message.channel.id !== game.guildContext.commandChannel.id)
            message.delete().catch();
        game.botContext.logCommand(message.author.username, message.content, timestamp);
        return true;
    }
    else if (command instanceof PlayerCommand && game.botContext.commandIssuedInValidChannel(command, message)) {
        if (command.config.requiresGame && !game.inProgress) {
            message.reply("There is no game currently running.");
            return false;
        }
        for (const livingPlayer of game.livingPlayers.values()) {
            if (livingPlayer.id === message.author.id) {
                player = livingPlayer;
                break;
            }
        }
        if (!player) {
            game.communicationHandler.reply(message, "You are not on the list of living players.");
            return false;
        }
        const commandName = command.config.name.substring(0, command.config.name.indexOf('_'));
        const status = player.getBehaviorAttributeStatusEffects("disable all");
        if (status.length > 0 && !player.hasBehaviorAttribute(`enable ${commandName}`)) {
            if (player.hasStatus("heated")) game.communicationHandler.reply(message, "The situation is **heated**. Moderator intervention is required.");
            else game.communicationHandler.reply(message, `You cannot do that because you are **${status[0].id}**.`);
            return false;
        }
        if (game.editMode && commandName !== "say") {
            game.communicationHandler.reply(message, "You cannot do that because edit mode is currently enabled.");
            return false;
        }

        player.setOnline();
        
        if (command.config.whitespaceSensitive) {
            args = commandStr.split(" ").slice(1);
        }

        command.execute(game, message, commandAlias, args, player).then(() => {
            if (!game.settings.debug && commandName !== "say" && !game.guildContext.sentInDMChannel(message))
                message.delete().catch();
        });
        game.botContext.logCommand(player.name, message.content, timestamp);
        return true;
    }
    else if (command instanceof EligibleCommand && game.botContext.commandIssuedInValidChannel(command, message)) {
        if (command.config.requiresGame && !game.inProgress) {
            message.reply("There is no game currently running.");
            return false;
        }
        command.execute(game, message, commandAlias, args).then(() => {
            if (!game.settings.debug && !game.guildContext.sentInDMChannel(message))
                message.delete().catch();
        });
        game.botContext.logCommand(message.author.username, message.content, timestamp);
        return true;
    }

    return false;
}

/**
 * @param commandSet - A list of bot commands to pass into the command handler's execute function.
 * @param game - The game in which the command is being executed.
 * @param callee - The in-game entity that caused the command to be executed.
 * @param player - The player who caused the command to be executed, if applicable.
 */
export async function parseAndExecuteBotCommands(commandSet: string[], game: Game, callee: Callee, player?: Player) {
    for (let command of commandSet) {
        if (command.startsWith("wait")) {
            let args = command.split(" ");
            if (!args[1]) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${command}". No amount of seconds to wait was specified.`);
            const seconds = parseInt(args[1]);
            if (isNaN(seconds) || seconds < 0) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${command}". Invalid amount of seconds to wait.`);
            await sleep(seconds);
        }
        else {
            if (callee instanceof Puzzle && callee.type === "matrix") {
                const regex = /{([^{},/]+?)}/g;
                let match: RegExpExecArray;
                const originalCommand = command;
                while (match = regex.exec(originalCommand)) {
                    for (const requirement of callee.requirements) {
                        if (requirement instanceof Puzzle && requirement.name.toUpperCase() === match[1].toUpperCase() && requirement.outcome !== "")
                            command = command.replace(match[0], requirement.outcome);
                        else if (requirement instanceof Flag && typeof requirement.value === 'string' && requirement.id === match[1].toUpperCase() && requirement.value !== null)
                            command = command.replace(match[0], requirement.value);
                    }
                }
            }
            executeCommand(command, game, null, player, callee);
        }
    }
}

/**
 * @param seconds
 */
function sleep(seconds: number) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/**
 * Returns the type of command based on the given message.
 * @param game - The game in which the command is being executed.
 * @param message - The message in which the command was issued, if applicable.
 */
function getCommandType(game: Game, message: UserMessage): "Bot" | "Moderator" | "Player" | "Eligible" {
    if (!message) return "Bot";
    else {
        // Don't attempt to find the member who sent this message if it was sent by a webhook.
        if (message.webhookId !== null) return undefined;
        const member = game.guildContext.getMember(message.author.id);
        if (!member) return undefined;
        if (game.guildContext.hasModeratorRole(member)) return "Moderator";
        else if (game.guildContext.hasPlayerRole(member)) return "Player";
        else if (game.settings.debug && game.guildContext.hasTesterRole(member)) return "Eligible";
        else if (!game.settings.debug && game.guildContext.hasEligibleRole(member)) return "Eligible";
        return undefined;
    }
}
