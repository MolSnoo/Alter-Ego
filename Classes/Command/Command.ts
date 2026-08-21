// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type GameSettings from "../GameSettings.ts";
import type Context from "./Context.ts";
import type { MatchedInvocation, ValidatedInvocation, ValidationResult } from "./Invocation.ts";
import type { Pattern } from "./Pattern.ts";

export type CommandType = "Bot" | "Moderator" | "Player" | "Eligible";
type CommandUsage = (settings: GameSettings) => string;
type CommandValidate<T extends Context> = (context: T, invocation: MatchedInvocation) => Promise<ValidationResult>;
type CommandExecute<T extends Context> = (context: T, invocation: ValidatedInvocation) => Promise<void>;

/**
 * The configuration for a command.
 */
export interface CommandConfig<T extends (Set<string> | Array<string>)> {
    /** The name of the command. */
    name: string;
    /** A brief description of what the command does. */
    description: string;
    /** Detailed information about the command. */
    details: string;
    /** The role that can use the command. */
    usableBy: CommandType;
    /** Alternative names for the command. */
    aliases: T;
    /** Indicates whether the command requires an ongoing game to be executed. */
    requiresGame: boolean;
    /** Whether the command is sensitive to whitespace, and should not have argument whitespace altered. */
    whitespaceSensitive?: boolean;
    /** Whether the possessive genitive form of player names should be allowed for the command. */
    possessivePlayer?: boolean;
    /** Whether the command is usable in edit mode. */
    usableInEditMode?: boolean;
    /** 
     * Declare the behavior for how player names should be specified.
     * - 0, or undefined, is the default (moderators and the bot use name, players use display name)
     * - 1 is inverted (moderators and the bot use display name, players use name)
     * - 2 is simultaneous (moderators, players, and the bot all can use display name or name)
     */
    playerNameStyle?: 0 | 1 | 2;
}

interface CommandConstructorArgs<T extends Context> {
    /**
     * The specific configuration of the command.
     */
    config: CommandConfig<string[]>;
    /**
     * Examples of the command's usage.
     */
    usage: CommandUsage;
    /**
     * Grammar patterns for the command.
     */
    patterns?: Pattern[];
    /**
     * The code to execute when the command is called, inputs matched to at least one pattern, but the invocation is not yet validated.
     */
    validate: CommandValidate<T>;
    /**
     * The code to execute when the command is called, and the invocation has been validated.
     */
    execute: CommandExecute<T>;
}

/**
 * Converts a CommandConfig whose aliases is an array of strings to a CommandConfig whose aliases is a set of strings
 * @param config - A CommandConfig whose aliases is an array of strings
 * @returns A CommandConfig whose aliases is a set of strings
 */
function toSetConfig(config: CommandConfig<string[]>): CommandConfig<Set<string>> {
    const { aliases, ...rest } = config;
    return {
        ...rest,
        aliases: new Set(aliases)
    };
}

/**
 * Abstract base class for all new-generation commands.
 */
export default abstract class Command<T extends Context> {
    /**
     * The specific configuration of the command.
     */
    readonly config: CommandConfig<Set<string>>;

    /**
     * Examples of the command's usage.
     */
    readonly usage: CommandUsage;

    /**
     * Grammar patterns for the command.
     */
    readonly patterns: Pattern[];

    /**
     * The code to execute when the command is called, inputs matched to at least one pattern, but the invocation is not yet validated.
     */
    readonly validate: CommandValidate<T>;

    /**
     * The code to execute when the command is called, and the invocation has been validated.
     */
    readonly execute: CommandExecute<T>;

    constructor(args: CommandConstructorArgs<T>) {
        this.config = toSetConfig(args.config);
        this.usage = args.usage;
        this.patterns = args.patterns ?? [];
        this.validate = args.validate;
        this.execute = args.execute;
    }
}
