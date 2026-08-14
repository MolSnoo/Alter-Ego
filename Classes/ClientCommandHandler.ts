// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type ClientContext from './ClientContext.ts';
import type Game from '../Data/Game.ts';
import Flag from '../Data/Flag.ts';
import type Player from '../Data/Player.ts';
import Puzzle from '../Data/Puzzle.ts';
import type Command from '../Classes/Command.ts';
import BotCommand from '../Classes/BotCommand.ts';
import ModeratorCommand from '../Classes/ModeratorCommand.ts';
import PlayerCommand from '../Classes/PlayerCommand.ts';
import EligibleCommand from '../Classes/EligibleCommand.ts';
import { getErrorMessage } from '../Modules/helpers.ts';

export type CommandType = "Bot" | "Moderator" | "Player" | "Eligible";
export type CommandOf<T extends CommandType> =
    T extends "Bot" ? BotCommand
        : T extends "Moderator" ? ModeratorCommand
            : T extends "Player" ? PlayerCommand
                : T extends "Eligible" ? EligibleCommand
                    : undefined;

/**
 * Represents the client command handler as a singleton.
 */
export default class ClientCommandHandler {
    /**
     * The single instance of the command handler that can exist.
     */
    static #instance: ClientCommandHandler;
    /**
     * The client handling the commands.
     */
    readonly #client: ClientContext;

    private constructor(client: ClientContext) {
        this.#client = client;
    }

    /**
     * Gets the command handler, or creates it if it doesn't exist.
     * @param client - The client associated with the command handler.
     */
    public static Instance(client: ClientContext) {
        if (ClientCommandHandler.#instance) return ClientCommandHandler.#instance;
        else return this.#instance = new this(client);
    }

    /**
     * The single instance of the command handler that can exist.
     */
    public static get instance() {
        return ClientCommandHandler.#instance;
    }

    /**
     * Returns the type of command based on the given message.
     * @param game - The game in which the command is being executed.
     * @param message - The message in which the command was issued, if applicable.
     */
    private getCommandType(game: Game, message?: UserMessage): CommandType | undefined {
        if (!message) return "Bot";
        else {
            // Don't attempt to find the member who sent this message if it was sent by a webhook.
            if (message.webhookId !== null)
                return undefined;
            const member = game.guildContext.getMember(message.author.id);
            if (!member)
                return undefined;
            if (game.guildContext.hasModeratorRole(member))
                return "Moderator";
            else if (game.guildContext.hasPlayerRole(member))
                return "Player";
            else if (game.settings.debug && game.guildContext.hasTesterRole(member))
                return "Eligible";
            else if (!game.settings.debug && game.guildContext.hasEligibleRole(member))
                return "Eligible";
            return undefined;
        }
    }

    /**
     * A function used to wait a set amount of time before executing the next command.
     * @param seconds - The number of seconds to wait.
     */
    private async sleep(seconds: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    }

    /**
     * Finds the right command file for the user and executes it.
     * @param commandStr - The full text of the command issued.
     * @param game - The game in which the command is being executed.
     * @param message - The message in which the command was issued, if applicable.
     * @param player - The player who issued the command, or caused it to be executed, if applicable.
     * @param callee - The in-game entity that caused the command to be executed, if applicable.
     * @returns Whether the command was successfully executed.
     */
    public async executeCommand(commandStr: string, game: Game, message?: UserMessage, player?: Player, callee?: Callee): Promise<boolean> {
        const timestamp = new Date();
        const commandType = this.getCommandType(game, message);
        if (!commandType) return false;

        const commandSplit = commandStr?.split(/[^\S\n]/).filter(arg => arg !== "");
        const commandAlias = commandSplit[0] ? commandSplit[0].toLocaleLowerCase() : "";
        let args = commandSplit.slice(1);
        const command = this.#client.getCommand(commandType, commandAlias);
        if (!command) return false;

        // Execute the command based on who issued it.
        if (command instanceof BotCommand) {
            try {
                await command.execute(game, commandAlias, args, player, callee);
                this.#client.logCommand(this.#client.user.username, commandStr, timestamp);
            }
            catch (error) {
                game.communicationHandler.sendToCommandChannel(getErrorMessage(error));
            }
            return true;
        }
        else if (command instanceof ModeratorCommand && this.#client.commandIssuedInValidChannel(command, message)) {
            // Unreachable code, but necessary for TypeScript to not throw errors in compilation,
            // since commandIssuedInValidChannel() is an implicit narrowing against undefined.
            if (message === undefined)
                return false;
            const messageDeletable = message.channel.id !== game.guildContext.commandChannel.id;
            if (command.config.requiresGame && !game.inProgress) {
                game.communicationHandler.reply(message, "There is no game currently running.", messageDeletable);
                return true;
            }
            const moderator = message.member ? game.entityLoader.getOrCreateModerator(message.member) : undefined;
            if (!moderator) {
                game.communicationHandler.reply(message, "You are not a moderator.", messageDeletable);
                return true;
            }
            if (command.config.whitespaceSensitive)
                args = commandStr.split(" ").slice(1);
            try {
                await command.execute(game, message, commandAlias, args, moderator);
                this.#client.logCommand(message.author.username, message.content, timestamp);
                if (messageDeletable) await game.communicationHandler.deleteMessage(message);
            }
            catch (error) {
                game.communicationHandler.reply(message, getErrorMessage(error));
            }
            return true;
        }
        else if (command instanceof PlayerCommand && this.#client.commandIssuedInValidChannel(command, message)) {
            // Compiler-mandated unreachable code.
            if (message === undefined)
                return false;
            let messageDeletable = !game.settings.debug && !game.guildContext.sentInDMChannel(message);
            if (command.config.requiresGame && !game.inProgress) {
                game.communicationHandler.reply(message, "There is no game currently running.", messageDeletable);
                return true;
            }
            const player = game.entityFinder.getLivingPlayerById(message.author.id);
            if (!player) {
                game.communicationHandler.reply(message, "You are not on the list of living players.", messageDeletable);
                return true;
            }
            const commandName = command.config.name.substring(0, command.config.name.indexOf('_'));
            /**
             * @privateRemarks
             * We make an exception here for the say command because it handles its own deletion after using some of the
             * properties of the original message. However, if we're awaiting the command execution, is this necessary
             * anymore? This will require some investigation.
             * - MS
             */
            messageDeletable = messageDeletable && commandName !== "say";
            const status = player.getBehaviorAttributeStatusEffects("disable all");
            if (status.length > 0 && !player.hasBehaviorAttribute(`enable ${commandName}`)) {
                if (player.hasStatus("heated")) game.communicationHandler.reply(message, "The situation is **heated**. Moderator intervention is required.", messageDeletable);
                else game.communicationHandler.reply(message, `You cannot do that because you are **${status[0].id}**.`, messageDeletable);
                return true;
            }
            if (game.editMode && !command.config.usableInEditMode) {
                game.communicationHandler.reply(message, "You cannot do that because edit mode is currently enabled.", messageDeletable);
                return true;
            }

            player.setOnline();
            if (command.config.whitespaceSensitive)
                args = commandStr.split(" ").slice(1);
            try {
                await command.execute(game, message, commandAlias, args, player);
                this.#client.logCommand(player.name, message.content, timestamp);
                if (messageDeletable) await game.communicationHandler.deleteMessage(message);
            }
            catch (error) {
                game.communicationHandler.reply(message, getErrorMessage(error));
            }
            return true;
        }
        else if (command instanceof EligibleCommand && this.#client.commandIssuedInValidChannel(command, message)) {
            // Compiler-mandated unreachable code.
            if (message === undefined)
                return false;
            const messageDeletable = !game.settings.debug && !game.guildContext.sentInDMChannel(message);
            if (command.config.requiresGame && !game.inProgress) {
                game.communicationHandler.reply(message, "There is no game currently running.", messageDeletable);
                return true;
            }
            try {
                await command.execute(game, message, commandAlias, args);
                this.#client.logCommand(message.author.username, message.content, timestamp);
                if (messageDeletable) await game.communicationHandler.deleteMessage(message);
            }
            catch (error) {
                game.communicationHandler.reply(message, getErrorMessage(error));
            }
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
    public async parseAndExecuteBotCommands(commandSet: string[], game: Game, callee: Callee, player?: Player): Promise<void> {
        for (let command of commandSet) {
            if (command.startsWith("wait")) {
                let args = command.split(" ");
                if (!args[1]) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${command}". No amount of seconds to wait was specified.`);
                const seconds = parseInt(args[1]);
                if (isNaN(seconds) || seconds < 0) return game.communicationHandler.sendToCommandChannel(`Error: Couldn't execute command "${command}". Invalid amount of seconds to wait.`);
                await this.sleep(seconds);
            }
            else {
                if (callee instanceof Puzzle && callee.type === "matrix") {
                    const regex = /{([^{},/]+?)}/g;
                    let match: RegExpExecArray | null;
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
                await this.executeCommand(command, game, undefined, player, callee);
            }
        }
    }
}
