// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Token } from "./Token.ts";

/** TrieNodes holding an array of Tokens, and a map of other TrieNodes. */
export default class TrieNode {
    /** Map of all Children of this TrieNode, corresponding to their relevant word. */
    children: Map<string, TrieNode>;

    /** Array of all Tokens at this TrieNode. */
    value: Token[];

    constructor() {
        this.children = new Map();
        this.value = [];
    }

    /**
     * Store a Token within the TrieNode.
     * @param value - The Token to store within this TrieNode.
     */
    storeToken(value: Token): void {
        this.value.push(value);
    }

    /**
     * Return a child TrieNode at the given string, creating one if necessary.
     * @param word - The string to use when looking up and optionally creating the TrieNode on this TrieNode.
     */
    getOrCreateNode(word: string): TrieNode {
        if (!this.children.has(word)) {
            this.children.set(word, new TrieNode());
        }
        return this.children.get(word);
    }

    /** Return the number of all TrieNodes attached to this TrieNode, including itself. */
    size(): number {
        let i = 1;
        for (const child of this.children.values()) {
            i += child.size();
        }
        return i;
    }
}
