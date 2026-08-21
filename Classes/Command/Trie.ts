// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Command from "./Command.ts";
import type Context from "./Context.ts";
import type { ValidatedInvocation } from "./Invocation.ts";
import type { Pattern } from "./Pattern.ts";
import { SentinelToken, type Token } from "./Token.ts";
import TrieNode from "./TrieNode.ts";

type Word = {
    /** Cleaned word, with all letters converted to locale lower case. */
    clean: string;

    /** Original word. */
    original: string;
};

export default class Trie {
    /** The root TrieNode on this Trie. Contains all other TrieNodes, or their ancestors. */
    root: TrieNode;

    constructor() {
        this.root = new TrieNode();
    }

    /**
     * Construct and return a new Trie from the given Context and Patterns.
     * @param ctx - Command context to get lexicon from.
     * @param pat - Patterns to use when gathering lexicon.
     */
    static buildFromCommandAndPatterns<T extends Context, I extends ValidatedInvocation>(ctx: T, cmd: Command<T, I>): Trie {
        const trie = new Trie();
        const tokens = ctx.getLexicon(cmd.patterns, cmd.config);
        for (const token of tokens)
            trie.insert(token.value, token);
        return trie;
    }

    /**
     * Insert a new phrase into the Trie, with the value of the given token.
     * @param phrase - Phrase to insert into the Trie. Can be arbitrary, and will be split according to the regex `[^\S\n]`.
     * @param value - Token to insert into the Trie. Not deduplicated.
     */
    insert(phrase: string, value: Token): void {
        const words = phrase.toLocaleLowerCase().trim().split(/[^\S\n]/);
        let node = this.root;

        for (const word of words) {
            node = node.getOrCreateNode(word);
        }

        node.storeToken(value);
    }

    /**
     * Tokenize an array of strings into an array of token arrays, representing the possibilities represented by the input. Tokenization is done on the basis of longest match.
     * @param words - The input to tokenize. Should be split according to the regex `[^\S\n]`.
     */
    tokenize(words: string[]): Token[][] {
        const input: Word[] = words.map((word) => {
            return { clean: word.toLocaleLowerCase().replace(/'/g, ""), original: word };
        });
        const output: Token[][] = [];
        let i = 0;

        while (i < input.length) {
            let node = this.root;
            let longestMatch: Token[] | null = null;
            let longestLen = 0;
            let j = i;
            while (j < input.length && node.children.has(input[j].clean)) {
                node = node.children.get(input[j].clean);
                j++;
                if (node.value.length !== 0) {
                    longestMatch = node.value;
                    longestLen = j - i;
                }
            }
            if (longestMatch !== null) {
                output.push(
                    longestMatch.concat(
                        new SentinelToken(
                            input.slice(i, j).map((word) => word.original).join(" "),
                        ),
                    ),
                );
                i += longestLen;
            } else {
                output.push([new SentinelToken(input[i].original)]);
                i++;
            }
        }
        return output;
    }

    size(): number {
        return this.root.size();
    }
}
