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
import { type default as Command, type CommandType } from '../Classes/Command/Command.ts';
import BotCommand from '../Classes/Command/BotCommand.ts';
import ModeratorCommand from '../Classes/Command/ModeratorCommand.ts';
import PlayerCommand from '../Classes/Command/PlayerCommand.ts';
import EligibleCommand from '../Classes/Command/EligibleCommand.ts';
import type Context from '../Classes/Command/Context.ts';
import BotContext from '../Classes/Command/BotContext.ts';
import ModeratorContext from '../Classes/Command/ModeratorContext.ts';
import PlayerContext from '../Classes/Command/PlayerContext.ts';
import EligibleContext from '../Classes/Command/EligibleContext.ts';
import { MatchedInvocation, ValidatedInvocation, type InvalidInvocation, type MatchResult, type ValidationResult } from '../Classes/Command/Invocation.ts';
import type { Pattern } from '../Classes/Command/Pattern.ts';
import type { Token } from '../Classes/Command/Token.ts';
import Trie from '../Classes/Command/Trie.ts';

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
    private getCommandType(game: Game, message: UserMessage): CommandType {
        if (!message) return "Bot";
        else {
            // Don't attempt to find the member who sent this message if it was sent by a webhook.
            if (message.webhookId !== null && message.webhookId !== undefined) return undefined;
            const member = game.guildContext.getMember(message.author.id);
            if (!member) return undefined;
            if (game.guildContext.hasModeratorRole(member)) return "Moderator";
            else if (game.guildContext.hasPlayerRole(member)) return "Player";
            else if (game.settings.debug && game.guildContext.hasTesterRole(member)) return "Eligible";
            else if (!game.settings.debug && game.guildContext.hasEligibleRole(member)) return "Eligible";
            return undefined;
        }
    }

    /**
     * Match a stream of tokens against command patterns.
     * @param tokens - The array of token arrays to match with.
     * @param patterns - The array of patterns to attempt matches against.
     * @param game - The game to match within.
     * @returns The array of pattern match results, that is, an array of Invalid Invocations and/or Matched Invocations.
     */
    private async matchTokens(tokens: Token[][], patterns: Pattern[], game: Game): Promise<MatchResult[]> {
        return patterns.map(pattern => pattern.match(tokens, game));
    }

    /**
     * Validate an array of matches against a command's validator function.
     * @param matches - The array of matches to validate.
     * @param command - The command to validate for.
     * @param context - The context to validate within.
     * @returns The array of validation results, that is, an array of Invalid Invocations and/or Validated Invocations.
     */
    private async validateMatches(matches: MatchedInvocation[], command: Command<Context>, context: Context): Promise<ValidationResult[]> {
        const invocations: ValidationResult[] = [];
        for (const match of matches)
            invocations.push(await command.validate(context, match));
        return invocations;
    }

    /**
     * Validates the command and returns the first validated invocation.
     * @param command - The command to validate.
     * @param context - The context with which the command was invoked.
     * @param args - The args the command was invoked with.
     * @param game - The game to validate on.
     * @returns The first validated invocation.
     * @throws {@link Error}
     * Thrown if the command invocation is invalid.
     */
    private async validateCommand<T extends Context>(command: Command<T>, context: T, args: string[], game: Game): Promise<ValidatedInvocation> {
        const trie = Trie.buildFromCommandAndPatterns(context, command);
        const tokens = trie.tokenize(args);
        const errors: InvalidInvocation[] = [];
        const matches: MatchedInvocation[] = [];
        const validations: ValidatedInvocation[] = [];
        let patterns: Pattern[] = [];
        if (context instanceof ModeratorContext) {
            const latch = context.moderator.getLatch() !== null
            patterns = command.patterns.filter(pattern => pattern.latch === latch || pattern.latch === undefined);
        }
        else patterns = command.patterns;

        const matchResults = await this.matchTokens(tokens, patterns, game);
        for (const result of matchResults) {
            if (result instanceof MatchedInvocation) matches.push(result);
            else errors.push(result);
        }
        if (matches.length === 0) {
            if (errors.length > 0) throw new Error(errors.pop().errors[0]);
            else matches.push(new MatchedInvocation());
        }

        const validationResults = await this.validateMatches(matches, command, context);
        for (const result of validationResults) {
            if (result instanceof ValidatedInvocation) validations.push(result);
            else errors.push(result);
        }
        if (validations.length === 0) {
            if (errors.length > 0) throw new Error(errors.pop().errors[0]);
            else validations.push(new ValidatedInvocation());
        }
        return validations[0];
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
            const context = new BotContext(game, commandAlias, player, callee);
            try {
                const invocation = await this.validateCommand(command, context, args, game);
                await command.execute(context, invocation);
                this.#client.logCommand(this.#client.user.username, commandStr, timestamp);
            }
            catch (error) {
                game.communicationHandler.sendToCommandChannel(error.message ?? error);
            }
            return true;
        }
        else if (command instanceof ModeratorCommand && this.#client.commandIssuedInValidChannel(command, message)) {
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
            const context = new ModeratorContext(game, commandAlias, message, moderator);
            try {
                const invocation = await this.validateCommand(command, context, args, game);
                await command.execute(context, invocation);
                if (messageDeletable) await message.delete();
                this.#client.logCommand(message.author.username, message.content, timestamp);
                if (messageDeletable) await game.communicationHandler.deleteMessage(message);
            }
            catch (error) {
                game.communicationHandler.reply(message, error.message ?? error);
            }
            return true;
        }
        else if (command instanceof PlayerCommand && this.#client.commandIssuedInValidChannel(command, message)) {
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
            if (game.editMode && commandName !== "say") {
                game.communicationHandler.reply(message, "You cannot do that because edit mode is currently enabled.", messageDeletable);
                return true;
            }

            player.setOnline();
            if (command.config.whitespaceSensitive)
                args = commandStr.split(" ").slice(1);
            const context = new PlayerContext(game, player, commandAlias, message);
            try {
                const invocation = await this.validateCommand(command, context, args, game);
                await command.execute(context, invocation);
                /**
                 * @privateRemarks
                 * We make an exception here for the say command because it handles its own deletion after using some of the
                 * properties of the original message. However, if we're awaiting the command execution, is this necessary
                 * anymore? This will require some investigation.
                 * - MS
                 */
                if (!game.settings.debug && commandName !== "say" && !game.guildContext.sentInDMChannel(message))
                    await message.delete().catch();
                this.#client.logCommand(player.name, message.content, timestamp);
                if (messageDeletable) await game.communicationHandler.deleteMessage(message);
            }
            catch (error) {
                game.communicationHandler.reply(message, error.message ?? error);
            }
            return true;
        }
        else if (command instanceof EligibleCommand && this.#client.commandIssuedInValidChannel(command, message)) {
            const messageDeletable = !game.settings.debug && !game.guildContext.sentInDMChannel(message);
            if (command.config.requiresGame && !game.inProgress) {
                game.communicationHandler.reply(message, "There is no game currently running.", messageDeletable);
                return true;
            }
            const context = new EligibleContext(game, commandAlias, message);
            try {
                const invocation = await this.validateCommand(command, context, args, game);
                await command.execute(context, invocation);
                if (!game.settings.debug && !game.guildContext.sentInDMChannel(message))
                    await message.delete().catch();
                this.#client.logCommand(message.author.username, message.content, timestamp);
                if (messageDeletable) await game.communicationHandler.deleteMessage(message);
            }
            catch (error) {
                game.communicationHandler.reply(message, error.message ?? error);
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
                await this.executeCommand(command, game, null, player, callee);
            }
        }
    }
}
