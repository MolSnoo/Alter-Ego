// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { InvalidInvocation, MatchedInvocation, type MatchResult } from "./Invocation.ts";
import {
    ConstantToken,
    EntityToken,
    ItemContainerToken,
    PocketToken,
    PrepositionToken,
    SentinelToken,
    type Token,
} from "./Token.ts";
import type GameEntity from "../../Data/GameEntity.ts";
import { Collection } from "discord.js";
import ItemInstance from "../../Data/ItemInstance.ts";
import type InventorySlot from "../../Data/InventorySlot.ts";
import DefaultMap, { concatToInnerArray, pushToInnerArray } from "../DefaultMap.ts";
import type Game from "../../Data/Game.ts";
import type GameErrorMessageGenerator from "../GameErrorMessageGenerator.ts";

/** Shorthand type representing the function that returns a string on pattern element match error. */
export type ErrorFactory = (game: Game) => string;

/**
 * Base interface representing a pattern element.
 */
interface PatternElement {
    /**
     * Data on the GameErrorMessageGenerator function to call when this pattern element encounters an error in matching.
     */
    readonly error?: ErrorFactory;
}

/**
 * Special sentinel class representing a Constant in a Pattern.
 *
 * This class represents a constant value that must always be present in a Pattern for it to be considered valid.
 */
export class Constant implements PatternElement {
    /**
     * The GameErrorMessageGenerator call data when the Constant sentinel encounters an error in matching.
     */
    readonly error?: ErrorFactory;

    /**
     * The data of the Constant sentinel.
     */
    readonly value: string;

    /**
     * @param value - The data of the Constant sentinel.
     * @param error - The data to call the GameErrorMessageGenerator with when an error is encountered in matching. Optional.
     */
    constructor(value: string, error?: ErrorFactory) {
        this.error = error;
        this.value = value;
    }

    /**
     * Returns whether this Constant is satisfied by the given token.
     * @param token - The token to check against this Constant.
     */
    satisfiedBy(token: ConstantToken): boolean {
        return token.value === this.value;
    }
}

/**
 * Special sentinel class representing a Multiconstant in a Pattern.
 *
 * This class represents one of many constant values that must always be present in a Pattern for it to be considered valid.
 */
export class Multiconstant implements PatternElement {
    /**
     * The GameErrorMessageGenerator call data when the Multiconstant sentinel encounters an error in matching.
     */
    readonly error?: ErrorFactory;

    /**
     * The data of the Multiconstant sentinel.
     */
    readonly values: Set<string>;

    /**
     * @param values - The data of the Multiconstant sentinel.
     * @param error - The data to call the GameErrorMessageGenerator with when an error is encountered in matching. Optional.
     */
    constructor(values: string[], error?: ErrorFactory) {
        this.error = error;
        this.values = new Set(values);
    }

    /**
     * Returns whether this Constant is satisfied by the given token.
     * @param token - The token to check against this Constant.
     */
    satisfiedBy(token: ConstantToken): boolean {
        return this.values.has(token.value);
    }
}

/**
 * Slot class representing a slot in a grammar pattern for a tokenized argument.
 */
export class Slot<T extends GameEntity = GameEntity> implements PatternElement {
    /**
     * The GameErrorMessageGenerator call data when the Slot element encounters an error in matching.
     */
    readonly error?: ErrorFactory;

    /**
     * The type of the Slot. Tokens must match this type to fit into the Slot.
     */
    readonly type: Constructor<T>;

    /**
     * The name to refer to the Slot with. Inherited by any Tokens that fit the Slot.
     */
    readonly name: string;

    /**
     * @param type - The type of the Slot. Tokens must match this type to fit into the Slot.
     * @param name - The name to refer to the Slot with. Inherited by any Tokens that fit the Slot.
     * @param error - The data to call the GameErrorMessageGenerator with when an error is encountered in matching. Optional.
     */
    constructor(type: Constructor<T>, name: string, error?: ErrorFactory) {
        this.error = error;
        this.type = type.prototype.constructor as Constructor<T>;
        this.name = name;
    }

    /**
     * Returns whether this Slot is satisfied by the given token.
     * @param token - The token to check against this Slot.
     */
    satisfiedBy(token: EntityToken<GameEntity>): token is EntityToken<T> {
        return this.type.name === token.reference.getEntityType();
    }
}

/**
 * Multislot class representing a piece of a grammar pattern that represents a Multislot.
 */
export class Multislot implements PatternElement {
    /**
     * The GameErrorMessageGenerator call data when the Multislot element encounters an error in matching.
     */
    readonly error?: ErrorFactory;

    /**
     * The slots that make up the Multislot.
     */
    readonly slots: Set<Constructor<GameEntity>>;

    /**
     * The name to refer to the Multislot with. Inherited by any Tokens that fit the Slot.
     */
    readonly name: string;

    /**
     * The types of Game Entities contained within a multislot.
     */
    #types: Set<Constructor<GameEntity>>;

    /**
     * @param slots - The slots that make up the Multislot.
     * @param name - The name to refer to the Multislot with. Inherited by any Tokens that fit the Slot.
     * @param error - The data to call the GameErrorMessageGenerator with when an error is encountered in matching. Optional.
     */
    constructor(slots: Constructor<GameEntity>[], name: string, error?: ErrorFactory) {
        this.error = error;
        this.slots = new Set(slots);
        this.name = name;
        this.#types = new Set();
        for (const slot of slots) {
            this.types.add(slot);
        }
    }

    /**
     * The types of Game Entities contained within a multislot.
     */
    get types(): Set<Constructor<GameEntity>> {
        return this.#types;
    }

    protected set types(types: Set<Constructor<GameEntity>>) {
        this.#types = types;
    }

    /**
     * Returns whether this Multislot is satisfied by the given token.
     * @param token - The token to check against this Multislot.
     */
    satisfiedBy(token: EntityToken<GameEntity>): boolean {
        for (const slot of this.slots) {
            if (slot.name === token.reference.getEntityType()) return true;
        }
        return false;
    }
}

/**
 * Preposition class representing a piece of a grammar pattern that represents the preposition of a Slot.
 */
export class Preposition implements PatternElement {
    /**
     * The GameErrorMessageGenerator call data when the Preposition element encounters an error in matching.
     */
    readonly error?: ErrorFactory;

    /**
     * The name of the Slot that the Preposition refers to.
     */
    readonly name: string;

    /**
     * @param name - The name of the Slot that the Preposition refers to.
     * @param error - The data to call the GameErrorMessageGenerator with when an error is encountered in matching. Optional.
     */
    constructor(name: string, error?: ErrorFactory) {
        this.error = error;
        this.name = name;
    }
}

/**
 * Pocket class representing a piece of a grammar pattern that represents an InventorySlot of a Slot representing an ItemInstance.
 */
export class Pocket implements PatternElement {
    /**
     * The GameErrorMessageGenerator call data when the Pocket element encounters an error in matching.
     */
    readonly error?: ErrorFactory;

    /**
     * The ID of the Slot that the Pocket refers to.
     */
    readonly id: string;

    /**
     * The name to refer to the Pocket with. Inherited by any Tokens that fit the Pocket.
     */
    readonly name: string;

    /**
     * @param id - The ID of the Slot that the Pocket refers to.
     * @param name - The name to refer to the Pocket with. Inherited by any Tokens that fit the Pocket.
     * @param error - The data to call the GameErrorMessageGenerator with when an error is encountered in matching. Optional.
     */
    constructor(id: string, name: string, error?: ErrorFactory) {
        this.error = error;
        this.id = id;
        this.name = name;
    }
}

/**
 * Option class representing a piece of a grammar pattern that represents a multiple-choice option in a pattern.
 */
export class Option extends Multiconstant {
    /**
     * The name to refer to the Option with. Inherited by any Tokens that fit the Option.
     */
    readonly name: string;

    /**
     * @param name - The name to refer to the Option with.
     * @param values - The values possible in the Option element.
     * @param error - The data to call the GameErrorMessageGenerator with when an error is encountered in matching. Optional.
     */
    constructor(name: string, values: string[], error?: ErrorFactory) {
        super(values, error);
        this.name = name;
    }
}

/**
 * Glob interface representing a piece of a grammar pattern that represents a Glob.
 *
 * Globs must ALWAYS be the final Element of a Pattern!
 */
export class Glob implements PatternElement {
    /** The error property of Globs will always be undefined. */
    readonly error: undefined;
}

/** Internal-use class for passing runtime pattern matching data between innerMatch calls. */
class MatchData {
    /** The game this match is running over. */
    game: Game;

    /** Array of errors encountered while matching, such as slots that cannot be filled, or missing prepositions or constants. */
    errors: string[];

    /** Collection of PatternElements to Tokens, representing the tokens that have been successfully matched to pattern elements. */
    matches: DefaultMap<PatternElement, Token[]>;

    /** Collection of Patterns to booleans, representing whether or not they have begun the process of consuming tokens. */
    hasConsumed: Collection<Pattern, boolean>;

    /** Array of strings representing globbed user input. */
    glob: string[];

    /**
     * Array of token arrays.
     *
     * The outer array is indexed by the position of user input, while the inner array is each possible token for that position.
     */
    readonly streams: Token[][];

    /**
     * Index of the outer token array.
     *
     * This is stored in MatchData to keep token stream consumption synchronized even when sub-patterns are matched.
     */
    private streamIndex: number;

    constructor(streams: Token[][], game: Game) {
        this.game = game;
        this.errors = [];
        this.matches = new DefaultMap(() => []);
        this.hasConsumed = new Collection();
        this.glob = [];
        this.streams = streams;
        this.streamIndex = 0;
    }

    /** Shorthand for the Game Error Message Generator. */
    get errorGenerator(): GameErrorMessageGenerator {
        return this.game.errorMessageGenerator;
    }

    /** Returns a boolean representing whether or not the token stream has been exhausted. */
    get exhausted(): boolean {
        return this.index >= this.streams.length;
    }

    /** Returns the current token stream for the current stream index. */
    get stream(): Token[] {
        return this.streams[this.index];
    }

    /** Moves the stream index forward by 1, returning that token stream. This should only be used after verifying that `this.exhausted === false`. */
    next(): Token[] {
        return this.streams[++this.index];
    }

    /** Returns the current stream index. */
    get index(): number {
        return this.streamIndex;
    }

    /** Sets the stream index to an arbitrary number. Use sparingly! */
    set index(i: number) {
        this.streamIndex = i;
    }

    /** Return a clone of this MatchData. */
    clone(): MatchData {
        const data = new MatchData(this.streams, this.game);
        data.index = this.index;
        data.glob = this.glob.map((o) => o);
        data.errors = this.errors.map((o) => o);
        for (const [element, tokens] of this.matches) {
            concatToInnerArray(data.matches, element, tokens);
        }
        for (const entry of this.hasConsumed) {
            data.hasConsumed.set(entry[0], entry[1]);
        }
        return data;
    }
}

interface PatternConstructorArgs {
    /**
     * Whether the fulfillment of this Pattern is optional or not. This is most useful for optional sub-patterns. Defaults to false.
     */
    optional?: boolean;
    /**
     * Whether the fulfillment of this Pattern is mandatory or not. This is most useful for optional sub-patterns that must be completely matched once partially matched. Defaults to false.
     */
    mandatory?: boolean;
    /**
     * Whether the fulfillment of this pattern can be done repeatedly. If this is true, then the pattern will attempt to match until the token stream is exhausted or the pattern fails to match. Defaults to false.
     */
    repeatable?: boolean;
    /**
     * Whether the pattern can only be matched by a latched moderator. Has no effect outside of moderator commands.
     * * `true` - The pattern can only be matched if the command is invoked by a latched moderator.
     * * `false` - The pattern can only be matched if the command is invoked by an unlatched moderator.
     * * `undefined` - The pattern can be matched regardless of if the command is invoked by a latched or unlatched moderator. This is the default.
     */
    latch?: boolean;
}

/**
 * Grammar pattern representing a command syntax.
 */
export class Pattern implements PatternElement {
    /** The error property of Patterns will always be undefined. */
    readonly error: undefined;

    /**
     * The grammar of the pattern.
     *
     * This is an ordered Array, containing Constants, Slots, and other Patterns representing the grammar pattern of a desired command syntax.
     */
    readonly grammar: Array<PatternElement>;

    /**
     * Whether the fulfillment of this Pattern is optional or not. This is most useful for optional sub-patterns.
     */
    readonly optional: boolean;

    /**
     * Whether this pattern, or the children of this pattern, are mandatory. This is most useful for optional sub-patterns that must be completely matched once partially matched.
     */
    readonly mandatory: boolean;

    /**
     * Whether the fulfillment of this pattern can be done repeatedly. If this is true, then the pattern will attempt to match until the token stream is exhausted or the pattern fails to match.
     */
    readonly repeatable: boolean;

    /**
     * Whether the pattern can only be matched by a latched moderator. Has no effect outside of moderator commands.
     * * `true` - The pattern can only be matched if the command is invoked by a latched moderator.
     * * `false` - The pattern can only be matched if the command is invoked by an unlatched moderator.
     * * `undefined` - The pattern can be matched regardless of if the command is invoked by a latched or unlatched moderator. This is the default.
     */
    readonly latch?: boolean;

    /**
     * The types of Game Entities contained within a pattern. Informs Contexts what must be gathered, to prevent gathering unnecessary context.
     */
    #types: Set<Constructor<GameEntity>>;

    /**
     * The constants contained within a pattern. Informs Contexts what constants exist for the given pattern.
     */
    #constants: Set<string>;

    /**
     * @param grammar - The grammar of the pattern. This is an ordered array, containing pattern elements, as well as other patterns.
     * @param optional - Whether the fulfillment of this Pattern is optional or not. This is most useful for optional sub-patterns. Defaults to false.
     * @param mandatory - Whether the fulfillment of this Pattern is mandatory or not. This is most useful for optional sub-patterns that must be completely matched once partially matched. Defaults to false.
     */
    constructor(grammar: Array<PatternElement> = [], args: PatternConstructorArgs = {}) {
        this.grammar = grammar;
        this.optional = args.optional ?? false;
        this.mandatory = args.mandatory ?? false;
        this.repeatable = args.repeatable ?? false;
        this.latch = args.latch;
        this.#types = new Set();
        this.#constants = new Set();
        for (const element of grammar) {
            if (element instanceof Slot)
                this.types.add(element.type);
            else if (element instanceof Multislot)
                this.types = this.types.union(element.types);
            else if (element instanceof Constant)
                this.constants.add(element.value);
            else if (element instanceof Multiconstant)
                for (const choice of element.values)
                    this.constants.add(choice);
            else if (element instanceof Pattern) {
                this.constants = this.constants.union(element.constants);
                this.types = this.types.union(element.types);
                if (element.mandatory)
                    this.mandatory = true;
            }
        }
    }

    /**
     * The types of Game Entities contained within a pattern. Informs Contexts what must be gathered, to prevent gathering unnecessary context.
     */
    get types(): Set<Constructor<GameEntity>> {
        return this.#types;
    }

    protected set types(types: Set<Constructor<GameEntity>>) {
        this.#types = types;
    }

    /**
     * The constants contained within a pattern. Informs Contexts what constants exist for the given pattern.
     */
    get constants(): Set<string> {
        return this.#constants;
    }

    protected set constants(constants: Set<string>) {
        this.#constants = constants;
    }

    /**
     * Internal error-pushing function to consolidate formatting.
     * @param element - The PatternElement that a match failure was encountered on.
     * @param nearMatch - The string that was found instead of a valid token to fit PatternElement.
     * @param data - The MatchData of the matching function thus far.
     */
    private pushError(element: PatternElement, nearMatch: string, data: MatchData): MatchData {
        if (element instanceof Slot) {
            // this scary regex replaces all upper case characters with a space, then the lowercase version of that character.
            // for example, "InventoryItem" will become " inventory item". the leading space is obviously not desired, so the string is then trimmed.
            const slotType: string = element.type.name.replace(/([A-Z])/g, (match) => " " + match.toLowerCase()).trim();

            if (element.error !== undefined)
                data.errors.push(element.error(data.game));
            else
                data.errors.push(data.errorGenerator.generateEntityNotFoundError(slotType, nearMatch));
        }
        else if (element instanceof Multislot) {
            const formatter = new Intl.ListFormat('en', { style: 'long', type: 'disjunction' });
            const slotTypes: string[] = [];
            for (const slot of element.slots) {
                slotTypes.push(slot.name.replace(/([A-Z])/g, (match) => " " + match.toLowerCase()).trim());
            }

            if (element.error !== undefined)
                data.errors.push(element.error(data.game));
            else
                data.errors.push(data.errorGenerator.generateEntityNotFoundError(formatter.format(slotTypes), nearMatch));
        }
        else if (element instanceof Preposition) {
            /**
             * @privateRemarks
             * It would probably be better to create a new GameErrorMessageGenerator function for this, so that we can provide the nearMatch...?
             * - AC
             */
            if (element.error !== undefined)
                data.errors.push(element.error(data.game));
            else
                data.errors.push(data.errorGenerator.generateSpecifyError("a preposition"));
        }
        else if (element instanceof Constant) {
            /**
             * @privateRemarks
             * As above...
             * - AC
             */
            if (element.error !== undefined)
                data.errors.push(element.error(data.game));
            else
                data.errors.push(data.errorGenerator.generateSpecifyError(`"${element.value}"`));
        }
        else if (element instanceof Multiconstant) {
            /**
             * @privateRemarks
             * As above...
             * Also, where do we put the constructed return of ListFormat‽
             * - AC
            */
            const formatter = new Intl.ListFormat('en', { style: 'long', type: 'disjunction' })
            const values: string[] = [];
            element.values.forEach(v => values.push(`"${v}"`));
            if (element.error !== undefined)
                data.errors.push(element.error(data.game));
            else
                data.errors.push(data.errorGenerator.generateSpecifyError(formatter.format(values)));
        }
        else if (element instanceof Pocket) {
            if (element.error !== undefined)
                data.errors.push(element.error(data.game));
            else
                data.errors.push(data.errorGenerator.generateSpecifyError("a pocket"));
        }
        /**
         * @privateRemarks
         * I am not really sure what to do in this case, nor do I know how we would get here...
         * - AC
         */
        else throw new Error("‽");

        return data;
    }

    /**
     * Internal matching function for Patterns. Used for recursive pattern matching.
     * @param base - MatchData for the innerMatch to use. This is cloned, and if the pattern is both optional and fails to match, is returned as-is.
     */
    private innerMatch(base: MatchData): MatchData {
        let stem = base.clone();

        // it is useful to know whether this is the root pattern. this can be intuited by how many consumers are known in data
        const root = stem.hasConsumed.size === 1;

        let iterations = 0;
        let iterating = !stem.exhausted;

        while (iterating) {
            let data = stem.clone();

            const unmatchedIndices: Set<number> = new Set();
            const matchedIndices: Set<number> = new Set();
            const nearMatchIndices: Collection<number, string[]> = new Collection();

            this.grammar.forEach((_, index) => {
                unmatchedIndices.add(index);
            });

            let finished = data.exhausted;

            let grammarIndex = 0;
            let element: PatternElement;

            while (!finished) {
                element = this.grammar[grammarIndex];

                if (element instanceof Constant || element instanceof Multiconstant) {
                    for (const token of data.stream) constant:{
                        if (token instanceof ConstantToken && element.satisfiedBy(token)) {
                            pushToInnerArray(data.matches, element, token);
                            matchedIndices.add(grammarIndex);
                            data.hasConsumed.set(this, true);
                            break constant;
                        }
                    }
                } else if (element instanceof Slot || element instanceof Multislot) {
                    let elementMatches: EntityToken<GameEntity>[] = [];
                    for (const token of data.stream) {
                        if (token instanceof EntityToken && element.satisfiedBy(token))
                            elementMatches.push(token);
                    }
                    if (elementMatches.length > 0) {
                        concatToInnerArray(data.matches, element, elementMatches);
                        matchedIndices.add(grammarIndex);
                        data.hasConsumed.set(this, true);
                    }
                } else if (element instanceof Preposition) {
                    for (const token of data.stream) preposition:{
                        if (token instanceof PrepositionToken) {
                            pushToInnerArray(data.matches, element, token);
                            matchedIndices.add(grammarIndex);
                            data.hasConsumed.set(this, true);
                            break preposition;
                        }
                    }
                } else if (element instanceof Glob) {
                    let globbed = data.index >= data.streams.length;
                    let stream = data.stream;
                    while (!globbed) {
                        for (const token of stream) glob:{
                            if (token instanceof SentinelToken) {
                                data.glob.push(token.value);
                                break glob;
                            }
                        }
                        if (data.index >= data.streams.length - 1) {
                            globbed = true;
                        } else stream = data.next();
                    }
                    matchedIndices.add(grammarIndex);
                    data.hasConsumed.set(this, true);
                } else if (element instanceof Pocket) {
                    let elementMatches: PocketToken<ItemInstance>[] = data.stream.filter(token => token instanceof PocketToken);
                    if (elementMatches.length > 0) {
                        concatToInnerArray(data.matches, element, elementMatches);
                        matchedIndices.add(grammarIndex);
                        data.hasConsumed.set(this, true);
                    }
                } else if (element instanceof Pattern) {
                    data.hasConsumed.set(element, false);
                    data = element.innerMatch(data);
                    if (data.hasConsumed.get(element)) {
                        data.hasConsumed.set(this, true);
                    }
                    matchedIndices.add(grammarIndex);
                }

                if (!data.matches.has(element) && !(element instanceof Pattern) && !(element instanceof Glob)) {
                    // this is an error state. if this pattern is optional, we should simply abandon matching this pattern.
                    if ((!this.mandatory || !data.hasConsumed.get(this)) && this.optional) return base;
                    // this is an error state: we have gone over all possibilities, and the element has not been matched.
                    // this kind of error severs the anchor between the token streams and the grammar pattern, even if there are still valid tokens to match to the pattern.
                    // this section of code is tasked with the unenviable job of finding the nearest anchor for reorientation.
                    // for this task, we will find the distance to the closest preposition or constant, and consider everything between here and there "unrecoverable".
                    // no matter what, this now concludes with errors. the purpose of this is to minimize those errors.
                    let searchingPattern = true;
                    let preposition = false;
                    let constant = false;
                    let patternSearchIndex = grammarIndex + 1;
                    let streamSearchIndex = data.index + 1;
                    let patternAnchorIndex: number;
                    let streamAnchorIndex: number;

                    while (searchingPattern) {
                        if (patternSearchIndex >= this.grammar.length) searchingPattern = false;
                        else if (this.grammar[patternSearchIndex] instanceof Constant || this.grammar[patternSearchIndex] instanceof Multiconstant || this.grammar[patternSearchIndex] instanceof Option) {
                            patternAnchorIndex = patternSearchIndex;
                            constant = true;
                            searchingPattern = false;
                        } else if (this.grammar[patternSearchIndex] instanceof Preposition) {
                            patternAnchorIndex = patternSearchIndex;
                            preposition = true;
                            searchingPattern = false;
                        } else patternSearchIndex++;
                    }

                    let searchingStream = constant || preposition;
                    while (searchingStream) {
                        if (streamSearchIndex >= data.streams.length) searchingStream = false;
                        else if (
                            data.streams[streamSearchIndex].filter(
                                (token) =>
                                    (preposition && token instanceof PrepositionToken) ||
                                    (constant && token instanceof ConstantToken),
                            ).length > 0
                        ) {
                            streamAnchorIndex = streamSearchIndex;
                            searchingStream = false;
                        } else streamSearchIndex++;
                    }

                    if (patternAnchorIndex === undefined || streamAnchorIndex === undefined) {
                        // this is the worst error state of this block. we are completely misaligned, and cannot realign ourselves.
                        // since this pattern is not optional, we need to do a little bit of extra work to load in errors before returning.
                        const nearMatchGlob: string[] = [];
                        while (!data.exhausted) {
                            nearMatchGlob.push(data.stream.find((token) => token instanceof SentinelToken).value);
                            data.next();
                        }

                        return this.pushError(element, nearMatchGlob.join(" "), data);
                    } else {
                        const nearMatchGlob: string[] = [];
                        // currentIndex must not be rolled into the for loop, or else iteration will run half as long as desired.
                        const currentIndex = data.index;

                        for (let i = 0; i < streamAnchorIndex - currentIndex; i++) {
                            // the logic here might be a little confusing. the streamAnchorIndex is our anchor to return to "normalcy".
                            // in order to provide reasonably detailed and accurate error messages, we should "glob" everything between here and one index before the stream anchor.
                            // we can then use this to provide an error message that says a required command argument was unfulfilled.
                            nearMatchGlob.push(data.stream.find((token) => token instanceof SentinelToken).value);
                            data.next();
                        }

                        nearMatchIndices.set(grammarIndex, nearMatchGlob);
                    }

                    data = this.pushError(element, nearMatchIndices.get(grammarIndex).join(" "), data);

                    grammarIndex = patternAnchorIndex;
                } else {
                    grammarIndex++;

                    if (!(element instanceof Pattern) && !(element instanceof Glob))
                        data.next();

                    finished = grammarIndex >= this.grammar.length || data.exhausted;
                }
            }

            for (const index of unmatchedIndices) {
                if (matchedIndices.has(index) || nearMatchIndices.has(index)) continue;
                element = this.grammar[index];
                if (element instanceof Constant) {
                    if (element.error !== undefined)
                        data.errors.push(element.error(data.game));
                    else
                        data.errors.push(data.errorGenerator.generateSpecifyError(`"${element.value}"`));
                }
                else if (element instanceof Multiconstant) {
                    const formatter = new Intl.ListFormat('en', { style: 'long', type: 'disjunction' })
                    const values: string[] = [];
                    element.values.forEach(v => values.push(`"${v}"`));
                    if (element.error !== undefined)
                        data.errors.push(element.error(data.game));
                    else
                        data.errors.push(data.errorGenerator.generateSpecifyError(formatter.format(values)));
                }
                else if (element instanceof Slot || element instanceof Multislot) {
                    const formatter = new Intl.ListFormat('en', { style: 'long', type: 'disjunction' });
                    let values: string[] = [];
                    if (element instanceof Slot)
                        values.push(element.type.name.replace(/([A-Z])/g, (match) => " " + match.toLowerCase()).trim());
                    else
                        for (const slot of element.slots)
                            values.push(slot.name.replace(/([A-Z])/g, (match) => " " + match.toLowerCase()).trim());

                    if (element.error !== undefined)
                        data.errors.push(element.error(data.game));
                    else
                        data.errors.push(data.errorGenerator.generateSpecifyError(formatter.format(values.map((str) => "a " + str))));
                }
                else if (element instanceof Preposition) {
                    if (element.error !== undefined)
                        data.errors.push(element.error(data.game));
                    else
                        data.errors.push(data.errorGenerator.generateSpecifyError("a preposition"));
                }
                else if (element instanceof Pocket) {
                    if (element.error !== undefined)
                        data.errors.push(element.error(data.game));
                    else
                        data.errors.push(data.errorGenerator.generateSpecifyError("a pocket"));
                }
            }

            // restrict preposition and pocket matching to only work on the root pattern
            if (root) {
                data = this.matchPrepositions(data);
                data = this.matchPockets(data);
            }

            iterations++;
            if ((iterations === 1 && data.errors.length > 0) || data.errors.length === 0 || !this.repeatable) stem = data;
            if (!this.repeatable || data.exhausted || data.errors.length > 0) iterating = false;
        }

        if (this.optional && !this.mandatory && !stem.hasConsumed.get(this) && stem.errors.length > 0) return base;
        else return stem;
    }

    /**
     * Validates that prepositions match their referred slots
     * @param base - MatchData to validate prepositions for.
     */
    private matchPrepositions(base: MatchData): MatchData {
        const data = base.clone();

        /** K is the name of the Slot that the Preposition refers to, V[0] is the Preposition element, V[1] is the array of Preposition tokens */
        const prepositions: Collection<string, [Preposition, PrepositionToken[]]> = new Collection();

        /** K is the name of the Slot or Multislot, V[0] is the Slot or Multislot, V[1] is the array of EntityTokens */
        const slots: Collection<string, [Slot | Multislot, ItemContainerToken<ItemInstance | RoomItemContainer>[]]> = new Collection();

        // re-map prepositions and (multi)slots into a format more easily accessible for matching
        data.matches.forEach((tokens, element) => {
            if (element instanceof Preposition)
                prepositions.set(element.name, [element, tokens.filter(token => token instanceof PrepositionToken)]);
            else if (element instanceof Slot || element instanceof Multislot)
                slots.set(element.name, [element, tokens.filter(token => token instanceof ItemContainerToken)]);
        });

        // if there are no prepositions or slots, this function is unnecessary, and we can return the unmodified base MatchData
        if (prepositions.size === 0) return base;
        else if (slots.size === 0) return base;

        for (const [name, [prepositionElement, prepositionTokens]] of prepositions) {
            if (!slots.has(name)) {
                // this should never appear during a normal alter ego game,
                // and is indicative of an error in the formulation of the pattern of a command.
                // this state represents a preposition being found for slot "name", but no corersponding game object.
                /**
                 * @privateRemarks
                 * this should never appear during a normal alter ego game... so, then, what ErrorMessageGenerator would be appropriate?
                 * it would be exceedingly rare for a player to see this message, after all.
                 * - AC
                 */
                data.errors.push(`Found a preposition for ${name}, but no corresponding game object?`);
                continue;
            }

            const [slotElement, slotTokens] = slots.get(name);

            // this creates a set of all prepositions used by the tokens in the slot matching this preposition
            const slotPrepositions = new Set(slotTokens.map(token => token.preposition));
            // this ensures we have the universal preposition "in" in the set
            slotPrepositions.add("in");

            // find which prepositions that got matched that are also valid for this slot
            const matches = new Set(
                prepositionTokens.map(token => token.value).filter(value => slotPrepositions.has(value)),
            );

            // narrow prepositions against the matched preposition set
            const narrowedPreps = prepositionTokens.filter(token => matches.has(token.value));

            // narrow slots against the matched preposition set UNLESS we matched "in"
            const narrowedSlots = matches.has("in")
                ? slotTokens
                : slotTokens.filter((token) => matches.has(token.preposition));

            // if either slots or prepositions were narrowed to a length of 0, then the slot has no valid preposition
            if (narrowedPreps.length === 0 || narrowedSlots.length === 0)
                data.errors.push(data.errorGenerator.generateSpecifyError(`a preposition for ${name}`));

            // write back narrowed prepositions and slots...
            prepositions.set(name, [prepositionElement, narrowedPreps]);
            slots.set(name, [slotElement, narrowedSlots]);
        }

        // write back narrowed prepositions and slots from our custom mapping
        for (const [preposition, tokens] of prepositions.values())
            data.matches.set(preposition, tokens);
        for (const [slot, tokens] of slots.values())
            data.matches.set(slot, tokens);

        return data;
    }

    /**
     * Validates that pockets match their referred slots
     * @param base - MatchData to validate pockets for.
     */
    private matchPockets(base: MatchData): MatchData {
        const data = base.clone();

        /** K is the name of the Slot that the Preposition refers to, V[0] is the Preposition element, V[1] is the array of Preposition tokens */
        const pockets: Collection<string, [Pocket, PocketToken<ItemInstance>[]]> = new Collection();

        /** K is the name of the Slot or Multislot, V[0] is the Slot or Multislot, V[1] is the array of EntityTokens */
        const slots: Collection<string, [Slot | Multislot, ItemContainerToken<ItemInstance>[]]> = new Collection();

        // re-map pockets and (multi)slots into a format more easily accessible for matching
        data.matches.forEach((tokens, element) => {
            if (element instanceof Pocket)
                pockets.set(element.id, [element, tokens.filter(token => token instanceof PocketToken)]);
            else if (element instanceof Slot || element instanceof Multislot)
                slots.set(element.name, [
                    element,
                    tokens.filter(
                        token => token instanceof ItemContainerToken && token.reference instanceof ItemInstance,
                    ) as ItemContainerToken<ItemInstance>[],
                ]);
        });

        // if there are no pockets or slots, this function is unnecessary, and we can return the unmodified base MatchData
        if (pockets.size === 0) return base;
        else if (slots.size === 0) return base;

        for (const [name, [pocketElement, pocketTokens]] of pockets) {
            if (!slots.has(name)) {
                // similarly to the identical error case in matchPrepositions(),
                // this should never appear during a normal alter ego game,
                // and is indicative of an error in the formulation of the pattern of a command.
                // this state represents a pocket being found for slot "name", but no corersponding game object.
                /**
                 * @privateRemarks
                 * similarly to the identical error case in matchPrepositions(),
                 * this should never appear during a normal alter ego game... so, then, what ErrorMessageGenerator would be appropriate?
                 * it would be exceedingly rare for a player to see this message, after all.
                 * - AC
                 */
                data.errors.push(`Found a pocket for ${name}, but no corresponding game object?`);
                continue;
            }

            const [slotElement, slotTokens] = slots.get(name);

            // this creates a set of all pockets contained in the token references in the slots matching this pocket slot
            const slotPockets: Set<InventorySlot<ItemInstance>> = new Set();
            for (const token of slotTokens)
                for (const pocket of token.reference.inventory.values())
                    slotPockets.add(pocket);

            // find which pockets that got matched that are also valid for this slot
            const matches = new Set(
                pocketTokens.map(token => token.reference).filter(value => slotPockets.has(value)),
            );

            // narrow pockets against the matched pocket set
            const narrowedPockets = pocketTokens.filter(token => matches.has(token.reference));

            // narrow slots against the matched pocket set
            const narrowedSlots = slotTokens.filter(token => {
                for (const slot of token.reference.inventory.values())
                    if (matches.has(slot)) return true;
                return false;
            });

            // if either slots or pockets were narrowed to a length of 0, then the slot has no valid pocket
            if (narrowedPockets.length === 0 || narrowedSlots.length === 0)
                data.errors.push(data.errorGenerator.generateSpecifyError(`a pocket for ${name}`));

            // write back narrowed pockets and slots...
            pockets.set(name, [pocketElement, narrowedPockets]);
            slots.set(name, [slotElement, narrowedSlots]);
        }

        // write back narrowed pockets and slots from our custom mapping
        for (const [preposition, tokens] of pockets.values())
            data.matches.set(preposition, tokens);
        for (const [slot, tokens] of slots.values())
            data.matches.set(slot, tokens);

        return data;
    }

    /**
     * Match a stream of tokens to this pattern. Returns a MatchedInvocation on success, or an InvalidInvocation on error.
     * @param streams - The stream of tokens to attempt to match to the pattern.
     */
    match(streams: Token[][], game: Game): MatchResult {
        let data = new MatchData(streams, game);
        data.hasConsumed.set(this, false);
        data = this.innerMatch(data);
        if (data.errors.length > 0)
            return new InvalidInvocation(data.errors as ArrayNonEmpty<string>);
        else {
            const args: Collection<string, ArrayNonEmpty<GameEntity>> = new Collection();
            const opts: DefaultMap<string, DefaultMap<string, boolean>> = new DefaultMap(
                () => new DefaultMap(
                    () => false
                ),
            );
            data.matches.forEach((val, key) => {
                if (key instanceof Slot || key instanceof Multislot || key instanceof Pocket)
                    args.set(
                        key.name,
                        val.map(
                            (token: EntityToken<GameEntity>) => token.reference
                        ) as ArrayNonEmpty<GameEntity>,
                    );
                else if (key instanceof Option)
                    opts.get(key.name).set(val.find((token) => token instanceof ConstantToken).value, true);
            });
            return new MatchedInvocation({ args: args, glob: data.glob, opts: opts });
        }
    }
}
