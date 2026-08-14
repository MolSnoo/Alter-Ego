// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import CollatedItem from '../Data/CollatedItem.ts';
import Description from '../Data/Description.ts';
import ItemContainer from '../Data/ItemContainer.ts';
import Player from '../Data/Player.ts';
import { MessageDisplayType } from './enums.ts';
import { default as evaluateScript } from './scriptParser.ts';
import { capitalizeFirstLetter, clamp, lowercaseFirstLetter } from './helpers.ts';
import type GameEntity from '../Data/GameEntity.ts';

export * as default from './parser.ts';

interface DescriptionDocument {
    document: Document,
    warnings: string[],
    errors: string[],
    messageDisplayType: MessageDisplayType,
    procedurals: Map<string, Set<string>>
}

interface ParsedTextWithErrors {
    text: string;
    warnings: string[];
    errors: string[];
}

// Unfortunately, the xmldom package is minimally typed.
// These abominations allow us to largely avoid dealing with the consequences of that.
interface EditableDocumentNode extends Element { data: string; }
type DocumentElement<T = Element> =
    T extends ParentNode & { tagName: string }
        ? T['tagName']
        : T extends ChildNode & { parentNode: ParentNode }
            ? T['parentNode']
            : Element;
type DocumentNode<T = Element> =
    T extends EditableDocumentNode
        ? EditableDocumentNode
        : T extends Element
            ? Element
            : T extends Node
                ? Node
                : HTMLElement;
type DocumentNodeCollection = HTMLCollectionOf<Element> | DocumentNode[];

/**
 * Represents a clause in a sentence. These are used to fill out item lists.
 */
class Clause {
    /** The node element of the clause. */
    #node: DocumentNode<EditableDocumentNode> | Text;
    /** The text content of the clause. */
    text: string;
    /** Whether or not the clause is an item clause. */
    isItem: boolean;
    /** The position in which this item appears in the list. */
    itemNo: number;
    /** The quantity of the item. */
    itemQuantity: number;
    /** The sentence this clause belongs to. */
    #sentence: Sentence;

    /**
     * @param node - The node element of the clause.
     * @param isItem - Whether or not the clause is an item clause.
     * @param itemNo - The position in which this item appears in the list.
     * @param itemQuantity - The quantity of the item.
     */
    constructor(node: DocumentNode<EditableDocumentNode> | Text, isItem: boolean = false, itemNo: number = NaN, itemQuantity: number = 0) {
        this.#node = node;
        this.text = 'data' in this.#node && typeof this.#node.data === 'string' ? this.#node.data : this.#node.textContent;
        this.isItem = isItem;
        this.itemNo = itemNo;
        this.itemQuantity = itemQuantity;
    }

    /**
     * Returns true if the clause has no node.
     */
    isNodeless(): boolean {
        return this.#node === null;
    }

    /** The parentNode of the clause's node, if it exists. */
    get parentNode(): DocumentElement<any> {
        return this.#node.parentNode;
    }

    /**
     * Returns true if the given clause is the last child of its sentence's item list.
     */
    isLastChildInItemList(): boolean {
        if (!this.#sentence || !this.#sentence.itemList) return false;
        return this.#sentence.itemList.lastChild === this.#node;
    }

    /**
     * Returns true if the first character of the clause is an uppercase letter, and the second character is not.
     */
    firstLetterIsUppercase(): boolean {
        if (this.text.length < 2) return false;
        return /^[A-Z][^A-Z]/.test(this.text);
    }

    /**
     * Returns true if the text of the clause starts with the given word.
     */
    startsWith(word: string): boolean {
        return this.text.includes(` ${word} `) && this.text.substring(0, this.text.indexOf(` ${word} `)).split(',').length - 1 === 0;
    }

    /**
     * Returns true if the text of the clause ends with the given word.
     */
    endsWith(word: string): boolean {
        return this.text.includes(` ${word} `) && this.text.substring(this.text.lastIndexOf(` ${word} `)).split(',').length - 1 === 0;
    }

    /**
     * Replaces the given first word with a new word.
     */
    replaceFirstWord(word: string, newWord: string): void {
        this.set(this.text.substring(0, this.text.indexOf(` ${word} `)) + ` ${newWord} ` + this.text.substring(this.text.indexOf(` ${word} `) + ` ${word} `.length));
    }

    /**
     * Replaces the given ending word with a new word.
     */
    replaceLastWord(word: string, newWord: string): void {
        this.set(this.text.substring(0, this.text.lastIndexOf(` ${word} `)) + ` ${newWord} ` + this.text.substring(this.text.lastIndexOf(` ${word} `) + ` ${word} `.length));
    }

    /**
     * Sets the text of the clause.
     */
    set(string: string): void {
        this.#node.data = string;
        this.text = this.#node.data;
    }

    /**
     * Sets the sentence the clause belongs to.
     */
    setSentence(sentence: Sentence): void {
        this.#sentence = sentence;
    }

    /**
     * Deletes the clause from the sentence.
     */
    delete(): void {
        if (this.#node) {
            let parentNode = this.#node.parentNode;
            let grandParentNode = parentNode.parentNode;
            parentNode.removeChild(this.#node);
            // If this is an item clause, then the parent node is an item tag. Delete the now empty item tag.
            if (this.isItem) grandParentNode.removeChild(parentNode);
            // If this item is contained in an if tag, remove the if tag.
            if (grandParentNode.nodeName === 'if') grandParentNode.parentNode.removeChild(grandParentNode);
            this.#node = null;
        }
        this.text = "";
    }
}

/**
 * Represents a string of text contained within sentence tags, divided into clauses.
 */
class Sentence {
    /** The clauses making up the sentence. */
    clauses: Clause[];
    /** A count of how many items are in the sentence. */
    itemCount: number;
    /** The item list node. This is what is created from item list tags. */
    itemList: DocumentNode;
    /** The name of the item list, if one is provided. */
    itemListName: string;

    /**
     * @param clauses - The clauses making up the sentence.
     * @param itemCount - A count of how many items are in the sentence.
     * @param itemList - The item list node. This is what is created from item list tags.
     * @param itemListName - The name of the item list, if one is provided.
     */
    constructor(clauses: Clause[], itemCount: number, itemList: DocumentNode, itemListName: string) {
        this.clauses = clauses;
        this.itemCount = itemCount;
        this.itemList = itemList;
        this.itemListName = itemListName;
        for (const clause of this.clauses)
            clause.setSentence(this);
    }

    /**
     * Adds the clause to the sentence at the given index.
     * @param i - The index at which to add the clause.
     * @param clause - The clause to add.
     */
    addClause(i: number, clause: Clause): void {
        clause.setSentence(this);
        this.clauses.splice(i, 0, clause);
    }

    /**
     * Deletes the clause at the given index.
     * @param i - The index of the clause to delete.
     */
    deleteClause(i: number): void {
        this.clauses.splice(i, 1);
    }
}

/**
 * Converts a description from plain-text to a document, with warnings and errors.
 * @param descriptionText - The text of the description.
 * @param removeItems - Whether or not to remove item tags from the description. Defaults to true.
 */
export function createDocument(descriptionText: string, removeItems: boolean = true): DescriptionDocument {
    const description = createDescriptionDocumentFromString(descriptionText);
    if (removeItems && description.warnings.length === 0 && description.errors.length === 0) {
        // Check if there's an item list in the document.
        const itemListSentences: DocumentNode[] = getItemListSentences(description.document);
        for (const sentenceElement of itemListSentences) {
            const sentence: Sentence = createSentence(sentenceElement);
            description.document = removeAllItemsFromItemList(description.document, sentence);
        }
    }
    return description;
}

/**
 * Parses the XML of a description and evaluates it into a result object with no XML tags. Includes warnings and errors.
 * @param description - The description to parse.
 * @param container - The in-game entity this description belongs to.
 * @param player - The Player currently reading the description.
 */
export function parseDescriptionWithErrors(description: Description, container: GameEntity, player: Player): ParsedTextWithErrors {
    const descriptionCopy = new Description(description.text, container, description.getGame());
    let documentElement: Document = descriptionCopy.document;

    // Find any conditionals.
    let conditionals: DocumentNodeCollection = documentElement.getElementsByTagName('if');
    let conditionalsToRemove: DocumentNode[] = [];
    for (let i = 0; i < conditionals.length; i++) {
        let conditional: string = conditionals[i].getAttribute('cond');
        if (conditional !== null && conditional !== undefined) {
            try {
                if (evaluateScript(conditional, container, player) === false)
                    conditionalsToRemove.push(conditionals[i]);
            }
            catch (err) {
                description.getErrors().push(err.toString());
            }
        }
    }
    for (let conditionalToRemove of conditionalsToRemove) {
        if (conditionalToRemove.parentNode) conditionalToRemove.parentNode.removeChild(conditionalToRemove);
        else documentElement.removeChild(conditionalToRemove);
    }

    // Check if there's an item list in the document.
    const itemListSentences: DocumentNode[] = getItemListSentences(documentElement);
    for (const sentenceElement of itemListSentences) {
        const itemList: DocumentNode = sentenceElement.getElementsByTagName('il').item(0);
        if (container instanceof ItemContainer) {
            const sentence: Sentence = createSentence(sentenceElement);
            documentElement = addItemsToItemList(documentElement, sentence, container, player);
        }
        // If the item list is empty, remove the sentence from the documentElement.
        const childNode = itemList.childNodes.item(0);
        if (itemList.childNodes.length === 0 || itemList.childNodes.length === 1 && 'tagName' in childNode && childNode.tagName === 'null') {
            if (sentenceElement.parentNode) sentenceElement.parentNode.removeChild(sentenceElement);
            else documentElement.removeChild(sentenceElement);
        }
    }

    // Replace any var tags.
    const variables: DocumentNodeCollection = documentElement.getElementsByTagName('var');
    let variableStrings: { element: DocumentNode, attribute: string }[] = [];
    for (let i = 0; i < variables.length; i++) {
        const varScript: string = variables[i].getAttribute('v');
        if (varScript !== null && varScript !== undefined) {
            try {
                const evaluatedVariable = evaluateScript(varScript, container, player);
                if (evaluatedVariable === undefined || evaluatedVariable === "undefined")
                    description.getErrors().push('"' + varScript.replace(/container/g, "this") + '" is undefined.');
                variableStrings.push({ element: variables[i], attribute: String(evaluatedVariable) });
            }
            catch (err) {
                description.getErrors().push(err.toString());
            }
        }
    }
    for (let i = 0; i < variableStrings.length; i++) {
        const newNode = documentElement.createTextNode(variableStrings[i].attribute);
        variableStrings[i].element.parentNode.replaceChild(newNode, variableStrings[i].element);
    }

    // Replace any br tags.
    const breakTags: DocumentNodeCollection = documentElement.getElementsByTagName('br');
    let breaks: DocumentNode[] = [];
    for (let i = 0; i < breakTags.length; i++)
        breaks.push(breakTags[i]);
    for (let i = 0; i < breaks.length; i++) {
        let newNode = documentElement.createTextNode('\n');
        breaks[i].parentNode.replaceChild(newNode, breaks[i]);
    }

    // Convert the document to a string.
    let parsedDescription = stringify(documentElement);
    // Strip XML tags from the string, as well as all duplicate spaces.
    parsedDescription = parsedDescription.replace(/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    return { text: parsedDescription, warnings: description.getWarnings(), errors: description.getErrors() };
}

/**
 * Parses the XML of a description and evaluates it into a result with no XML tags. Returns only the resulting text.
 * @param description - The description to parse.
 * @param container - The in-game entity this description belongs to.
 * @param player - The Player currently reading the description.
 */
export function parseDescription(description: Description, container: GameEntity, player: Player): string {
    const parsedDescription = parseDescriptionWithErrors(description, container, player);
    return parsedDescription.text;
}

/**
 * Adds items to an item list.
 * @param document - The document containing sentences with item lists.
 * @param sentence - The sentence containing an item list.
 * @param container - The item container entity this item list belongs to.
 * @param player - The Player currently reading the description.
 */
function addItemsToItemList(document: Document, sentence: Sentence, container: ItemContainer, player: Player) {
    const items = CollatedItem.collateForItemList(container.getContainedItemsForItemList(sentence.itemListName, player)).reverse();
    for (const item of items) {
        const singleContainingPhrase = item.singleContainingPhrase.toLocaleUpperCase();
        const pluralContainingPhrase = item.pluralContainingPhrase?.toLocaleUpperCase();
        let itemAlreadyExists = false;
        for (const clause of sentence.clauses) {
            const clauseText = clause.text.toLocaleUpperCase();
            if (isNaN(item.quantity) && (pluralContainingPhrase && clauseText.includes(pluralContainingPhrase) || item.pluralName && clauseText.includes(item.pluralName) || clauseText.includes(item.name))) {
                itemAlreadyExists = true;
                break;
            }
            else if (!isNaN(item.quantity) && clause.isItem
                && (clauseText === singleContainingPhrase
                    // Ensure that the clause is exactly a set of digits followed by the plural containing phrase, and nothing else.
                    || pluralContainingPhrase && clauseText.endsWith(pluralContainingPhrase) && clauseText.substring(0, clauseText.lastIndexOf(pluralContainingPhrase)).trim().match(/^\d+$/))) {
                itemAlreadyExists = true;
                if (clauseText === singleContainingPhrase)
                    clause.set(`${1 + item.quantity} ${item.pluralContainingPhrase}`);
                else if (pluralContainingPhrase && clauseText.includes(pluralContainingPhrase)) {
                    const quantityMatch = clauseText.match(/\d+/);
                    if (quantityMatch) {
                        const oldQuantity = parseInt(quantityMatch[0]);
                        clause.set(clause.text.replace(String(oldQuantity), String(oldQuantity + item.quantity)));
                    }
                }
                break;
            }
        }
        if (itemAlreadyExists) continue;
        addItemClauseToItemList(sentence, item.toSingleOrPluralContainingPhrase(), item.quantity);
        sentence.itemCount++;
    }
    return document;
}

/**
 * Removes all items from an item list.
 * @param document - The document containing at least one sentence with an item list.
 * @param sentence - The sentence containing an item list.
 * @returns The document with items removed from the given sentence.
 */
function removeAllItemsFromItemList(document: Document, sentence: Sentence): Document {
    const childNode = sentence.itemList.childNodes.item(0);
    // If the item list has no children, or its only child is a null tag, there are no items to be removed.
    if (sentence.itemList.childNodes.length === 0 || sentence.itemList.childNodes.length === 1 && 'tagName' in childNode && childNode.tagName === 'null')
        return document;
    for (let i = sentence.clauses.length - 1; i >= 0; i--) {
        if (!sentence.clauses[i].isItem) continue;
        removeItemClauseFromItemList(sentence, i);
        // Remove any deleted nodes from the sentence and adjust the current index if needed.
        for (let j = sentence.clauses.length - 1; j >= i; j--) {
            if (sentence.clauses[j].isNodeless())
                sentence.deleteClause(j);
        }
        for (let j = i - 1; j >= 0; j--) {
            if (sentence.clauses[j].isNodeless()) {
                sentence.deleteClause(j);
                i--;
            }
        }
        sentence.itemCount--;
    }
    return document;
}

/**
 * Evaluates all of the procedural and poss tags in a description and randomly selects which ones to keep.
 * @param description - The description with procedurals.
 * @param proceduralSelections - A Map of manually selected names of poss tags to keep.
 * @param player - The player who caused these procedurals to be evaluated, if applicable.
 */
export function generateProceduralOutput(description: Description, proceduralSelections: Map<string, string>, player?: Player): string {
    const descriptionCopy = new Description(description.text, description.getContainer(), description.getGame());
    let document = descriptionCopy.document;
    // Find all procedurals.
    let procedurals: DocumentNodeCollection = document.getElementsByTagName('procedural');
    let proceduralsToRemove: DocumentNode<ParentNode>[] = [];
    const attributesToRemove = ['chance', 'stat'];
    for (let i = 0; i < procedurals.length; i++) {
        const proceduralName = procedurals[i].getAttribute('name').toLowerCase().trim();
        let proceduralAssigned = false;
        if (proceduralName !== '' && proceduralSelections.has(proceduralName))
            proceduralAssigned = true;
        else {
            let parentProcedural = procedurals[i].parentNode as DocumentNode<ParentNode>;
            // If this procedural is nested, find its parent procedural.
            while (!parentProcedural.hasOwnProperty("documentElement") && 'tagName' in parentProcedural && parentProcedural.tagName !== "procedural")
                parentProcedural = parentProcedural.parentNode;
            let proceduralChance = parseFloat(procedurals[i].getAttribute('chance'));
            // If a procedural chance was not provided or it is invalid, assume the chance is 100%.
            if (isNaN(proceduralChance) || proceduralChance < 0 || proceduralChance > 100)
                proceduralChance = 100;
            // Roll to determine if this procedural will be kept. If the probability check fails, remove the tag entirely and skip to the next one.
            if (!keepProcedural(proceduralChance) || proceduralsToRemove.includes(parentProcedural)) {
                proceduralsToRemove.push(procedurals[i]);
                continue;
            }
        }

        // Determine which poss tag within this procedural to keep.
        let possibilities: DocumentNodeCollection = procedurals[i].getElementsByTagName('poss');
        let possibilityArr: Possibility[] = [];
        let possibilitiesToRemove: DocumentNode[] = [];
        let winningPossibilityIndex: number;
        for (let j = 0; j < possibilities.length; j++) {
            // Skip possibilities that belong to nested procedurals.
            let parentNode = possibilities[j].parentNode;
            while (parentNode.parentNode && 'tagName' in parentNode && parentNode.tagName !== 'procedural')
                parentNode = parentNode.parentNode;
            if (parentNode !== procedurals[i]) continue;
            const possibilityName = possibilities[j].getAttribute('name').toLowerCase();
            if (proceduralAssigned && proceduralSelections.get(proceduralName) === possibilityName)
                winningPossibilityIndex = j;
            let possibilityChance = parseFloat(possibilities[j].getAttribute('chance'));
            // This will be handled in the rolling function, if a possibility chance was not provided or invalid, set it to null.
            if (isNaN(possibilityChance) || possibilityChance < 0 || possibilityChance > 100)
                possibilityChance = null;
            possibilityArr.push({ index: j, chance: possibilityChance, name: possibilityName });
        }
        if (winningPossibilityIndex === undefined) {
            let statValue: number;
            const proceduralStat = Player.abbreviateStatName(procedurals[i].getAttribute('stat'));
            if (proceduralStat !== '' && player) {
                if (proceduralStat === "str") statValue = player.strength;
                else if (proceduralStat === "per") statValue = player.perception;
                else if (proceduralStat === "dex") statValue = player.dexterity;
                else if (proceduralStat === "spd") statValue = player.speed;
                else if (proceduralStat === "sta") statValue = player.stamina;
            }
            possibilityArr = calculateModifiedPossibilityArr(possibilityArr, statValue);
            winningPossibilityIndex = choosePossibilityIndex(possibilityArr);
            if (!proceduralSelections.has(proceduralName)) {
                for (const possibility of possibilityArr) {
                    if (possibility.index === winningPossibilityIndex && possibility.name)
                        proceduralSelections.set(proceduralName, possibility.name);
                    if (possibility.index === winningPossibilityIndex) break;
                }
            }
        }
        for (let possibility of possibilityArr) {
            if (possibility.index !== winningPossibilityIndex || !!proceduralSelections.get(proceduralName) && proceduralSelections.get(proceduralName) !== possibility.name)
                possibilitiesToRemove.push(possibilities[possibility.index]);
        }
        // Remove poss tags that failed the roll.
        for (let j = 0; j < possibilitiesToRemove.length; j++)
            possibilitiesToRemove[j].parentNode.removeChild(possibilitiesToRemove[j]);
        // Remove unneeded attributes from the remaining possibilities.
        for (let i = 0; i < possibilities.length; i++) {
            for (const attribute of attributesToRemove) {
                possibilities[i].removeAttribute(attribute);
            }
        }
    }
    // Remove procedurals that failed the roll.
    for (let i = 0; i < proceduralsToRemove.length; i++) {
        if (proceduralsToRemove[i].parentNode) proceduralsToRemove[i].parentNode.removeChild(proceduralsToRemove[i]);
        else document.removeChild(proceduralsToRemove[i]);
    }
    // Remove unneeded attributes from the remaining procedurals.
    for (let i = 0; i < procedurals.length; i++) {
        for (const attribute of attributesToRemove) {
            procedurals[i].removeAttribute(attribute);
        }
    }

    return stringify(document).replace(/<procedural\s?[^>]*>\s*<\/procedural>/g, '').replace(/<procedural\s?[^>]*\/>/g, '').replace(/<s>\s*<\/s>/g, '').replace(/<\/([^>]+?)> +<\/desc>/g, "</$1></desc>").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

/**
 * Randomly decides whether or not to keep the procedural based on the given chance.
 * @param chance - The percent chance.
 */
function keepProcedural(chance: number): boolean {
    return Math.random() * 100 < chance;
}

/**
 * Creates a possibility array based on the one given with the chances modified by the given stat value.
 * @param possibilityArr - The unmodified possibility array to modify.
 * @param statValue - The stat value to use as a weight for the possibilities.
 */
function calculateModifiedPossibilityArr(possibilityArr: Possibility[], statValue: number): Possibility[] {
    // If any of the given possibilities are null, assign their chances equally so that all chances add up to 100.
    // Clamp the sum of non-null possibilities between 0 and 100.
    let possibilitySum = clamp(
        possibilityArr.reduce((accumulator, possibility) => accumulator + (possibility.chance === null ? 0 : possibility.chance), 0),
        0,
        100
    );
    let nullCount = possibilityArr.reduce((accumulator, possibility) => accumulator + (possibility.chance === null ? 1 : 0), 0);
    if (nullCount > 0) {
        let dividedRemainder = (100.0 - possibilitySum) / nullCount;
        for (let possibility of possibilityArr) {
            if (possibility.chance === null)
                possibility.chance = dividedRemainder;
        }
    }

    // Generate modified percentages based on the supplied stat value.
    if (!isNaN(statValue) && possibilityArr.length > 1) {
        const modifierMax = statValue - 5;
        const modifierMin = -1 * modifierMax;
        for (let i = 0; i < possibilityArr.length; i++) {
            const percentageModifier = (modifierMin + (modifierMax - modifierMin) / (possibilityArr.length - 1) * i) * 10;
            possibilityArr[i].chance = possibilityArr[i].chance + percentageModifier;
        }
    }

    // Sort by highest to lowest chance.
    possibilityArr = possibilityArr.sort((a, b) => b.chance - a.chance);

    return possibilityArr;
}

/**
 * Randomly chooses a possibility to keep.
 * @param possibilityArr - An array of possibilities, with their indexes.
 * @returns The index of the possibility to keep.
 */
function choosePossibilityIndex(possibilityArr: Possibility[]): number {
    // Roll a random number and find the winner.
    const rand = Math.random() * 100;
    let gachaValue = 0;
    for (let possibility of possibilityArr) {
        gachaValue += possibility.chance;
        if (rand < gachaValue) {
            return possibility.index;
        }
    }
}

/**
 * Converts the given description string into a description document
 */
function createDescriptionDocumentFromString(descriptionString: string): DescriptionDocument {
    descriptionString = descriptionString.replace(/<il><\/il>/g, "<il><null /></il>");

    let warnings: string[] = [];
    let errors: string[] = [];
    let document: Document = new DOMParser({
        // Locator is always need for error position info.
        locator: {},
        // We can override the errorHandler for DOMParser.
        errorHandler: {
            warning: function (warning) { warnings.push(warning); },
            error: function (error) { errors.push(error); }
        }
    }).parseFromString(descriptionString, 'text/xml');

    // Get message display type.
    const messageDisplayTypeString = document?.getElementsByTagName('desc').item(0)?.getAttribute('type')?.toUpperCase();
    const messageDisplayType = getMessageDisplayType(messageDisplayTypeString);
    // Get procedurals.
    const procedurals = getProcedurals(document);

    return { document: document, warnings: warnings, errors: errors, messageDisplayType: messageDisplayType, procedurals: procedurals };
}

/**
 * Returns a message display type based on the given string.
 */
function getMessageDisplayType(messageDisplayTypeString: string): MessageDisplayType {
    switch (messageDisplayTypeString) {
        case 'STANDARD':
            return MessageDisplayType.STANDARD;
        case 'WARNING':
            return MessageDisplayType.WARNING;
        case 'ALERT':
            return MessageDisplayType.ALERT;
        case 'MINOR':
            return MessageDisplayType.MINOR;
        case 'PLAIN_TEXT':
            return MessageDisplayType.PLAIN_TEXT;
    }
}

/**
 * Creates a sentence object from the given node.
 * @param sentenceNode - The node to create a sentence from.
 */
function createSentence(sentenceNode: DocumentNode): Sentence {
    const clauses: Clause[] = createClauses(sentenceNode);
    let itemCount = 0;
    for (const clause of clauses) {
        if (clause.parentNode.tagName === 'item') {
            clause.isItem = true;
            itemCount++;
            clause.itemNo = itemCount;
            // Get item quantity.
            let text = clause.text;
            let start = text.search(/\d/);
            if (start === 0) {
                let end: number;
                for (end = start; end < text.length; end++) {
                    if (isNaN(parseInt(text.charAt(end + 1))))
                        break;
                }
                clause.itemQuantity = parseInt(text.substring(start, end));
            }
            else clause.itemQuantity = 1;
        }
    }
    let itemList: DocumentNode = null;
    let itemListName = "";
    let itemLists: DocumentNodeCollection = sentenceNode.getElementsByTagName('il');
    if (itemLists.length > 0) {
        itemList = itemLists[0];
        itemListName = itemList.getAttribute('name');
    }

    return new Sentence(clauses, itemCount, itemList, itemListName);
}

/**
 * Creates clauses from the given node.
 * @param node - The node to create clauses from.
 * @param clauses - An array of clauses that already exist. Optional.
 */
function createClauses(node: DocumentNode, clauses: Clause[] = []): Clause[] {
    for (let i = 0; i < node.childNodes.length; i++) {
        const childNode = node.childNodes[i] as DocumentNode;
        if ('data' in childNode)
            clauses.push(new Clause(childNode as EditableDocumentNode));
        else if ('tagName' in childNode)
            createClauses(childNode, clauses);
    }
    return clauses;
}

/**
 * Gets all s tag elements containing an il tag element.
 */
function getItemListSentences(document: Document): DocumentNode[] {
    // Get a list of sentences in the document.
    const sentences: DocumentNodeCollection = document.getElementsByTagName('s');
    // Find the sentence containing an item list, if there is one.
    let itemListSentences: DocumentNode[] = [];
    for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].getElementsByTagName('il').length > 0)
            itemListSentences.push(sentences[i]);
    }

    return itemListSentences;
}

/**
 * Gets all procedurals contained in the document.
 * @returns A map of procedurals and the set of possibilities contained within them.
 */
function getProcedurals(document: Document): Map<string, Set<string>> {
    const procedurals: Map<string, Set<string>> = new Map();
    // Get a list of all procedural tags in the document.
    const proceduralElements: DocumentNodeCollection = document?.getElementsByTagName('procedural') ?? [];
    for (let i = 0; i < proceduralElements.length; i++) {
        const proceduralName = proceduralElements[i].getAttribute('name').toLowerCase().trim();
        if (!procedurals.has(proceduralName)) procedurals.set(proceduralName, new Set());
        const procedural = procedurals.get(proceduralName);
        const possibilityElements: DocumentNodeCollection = proceduralElements[i].getElementsByTagName('poss');
        for (let j = 0; j < possibilityElements.length; j++) {
            // Skip possibilities that belong to nested procedurals.
            let parentNode = possibilityElements[j].parentNode;
            while (parentNode.parentNode && 'tagName' in parentNode && parentNode.tagName !== 'procedural')
                parentNode = parentNode.parentNode;
            if (parentNode !== proceduralElements[i]) continue;
            const possibilityName = possibilityElements[j].getAttribute('name').toLowerCase();
            procedural.add(possibilityName);
        }
    }
    return procedurals;
}

/**
 * Converts the given document to a string with all XML tags removed.
 * @param document - The document to convert to a string.
 */
export function stringify(document: Document): string {
    let description = new XMLSerializer().serializeToString(document);
    description = description.replace(/<il\/>/g, "<il></il>").replace(/(<(il)\s[^>]+?)\/>/g, "$1></$2>").replace(/<s\/>/g, "").replace(/<null\/>/g, "").replace(/<\/([^>]+?)> +<\/desc>/g, "</$1></desc>").replace(/ {2,}/g, " ").trim();
    return description;
}

/**
 * Creates an item clause and inserts it into the sentence.
 * @param sentence - Creates a new clause in the sentence.
 * @param clauseText - The text to set as the clause's contents.
 * @param itemQuantity - The quantity of the item to set.
 * @returns The index of the new Clause within the Sentence.
 */
function insertNewItemClause(sentence: Sentence, clauseText: string, itemQuantity: number): number {
    let document = sentence.itemList.ownerDocument;
    let firstChild = sentence.itemList.firstChild;
    let tempNode: Text;
    if (firstChild === null || firstChild === undefined) {
        if (sentence.itemList.nextSibling !== null && sentence.itemList.nextSibling !== undefined)
            firstChild = sentence.itemList.nextSibling;
        else {
            tempNode = document.createTextNode("");
            sentence.itemList.appendChild(tempNode);
            firstChild = sentence.itemList.firstChild;
        }
    }
    else if ('tagName' in firstChild && firstChild.tagName === 'null') {
        firstChild.parentNode.removeChild(firstChild);
        firstChild = sentence.itemList.nextSibling;
    }
    while (!firstChild.hasOwnProperty("data"))
        firstChild = firstChild.firstChild;
    let i: number;
    for (i = 0; i < sentence.clauses.length; i++) {
        if ('data' in firstChild && sentence.clauses[i].text === firstChild.data)
            break;
    }

    let textNode: Text = document.createTextNode(clauseText);
    let itemNode: DocumentNode = document.createElement('item');
    itemNode.appendChild(textNode);
    sentence.itemList.insertBefore(itemNode, sentence.itemList.firstChild);

    let separatorNode: Text = document.createTextNode(" ");
    sentence.itemList.insertBefore(separatorNode, itemNode.nextSibling);

    const itemClause = new Clause(textNode, true, 0, itemQuantity);
    sentence.addClause(i, itemClause);

    const separatorClause = new Clause(separatorNode);
    sentence.addClause(i + 1, separatorClause);

    if (tempNode !== undefined)
        tempNode.parentNode.removeChild(tempNode);

    return i;
}

/**
 * Adds an item clause to the sentence's item list and modifies the sentence to accommodate it.
 * @param sentence - The sentence to add an item clause to.
 * @param clauseText - The text to set as the clause's contents.
 * @param itemQuantity - The quantity of the item to set. Defaults to 1.
 * @returns A number to indicate which condition was met for debugging purposes.
 */
function addItemClauseToItemList(sentence: Sentence, clauseText: string, itemQuantity = 1): number {
    // This function properly edits a sentence after an Item clause has been added.
    // In this function, sentence is the sentence containing an Item list.
    const clause: Clause[] = sentence.clauses;

    // First, create the new Item clause and get its index in the sentence.
    // Note: clause[i + 1] is the separator clause where a comma, space, "and", etc. will go.
    const i = insertNewItemClause(sentence, clauseText, itemQuantity);

    // If this is the beginning of the sentence, capitalize the first letter of the new clause.
    // Then, fix the capitalization of the next clause, if applicable.
    if (i === 0) {
        clause[i].set(capitalizeFirstLetter(clause[i].text));
        if (clause[i + 2].firstLetterIsUppercase())
            clause[i + 2].set(lowercaseFirstLetter(clause[i + 2].text));
    }

    // BEFORE: "<desc><s>On these shelves are <il><item>3 bottles of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
    // INSERT: "PAINKILLERS"
    // AFTER:  "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
    if (sentence.itemCount >= 3) {
        clause[i + 1].set(", ");
        return 1;
    }
    else if (sentence.itemCount === 2) {
        // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of LAXATIVES</item> and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
        // INSERT: "PAINKILLERS"
        // AFTER:  "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
        if (clause[i + 2].isItem && !clause[i + 3].text.includes(", and ") && clause[i + 3].text.includes(" and ")) {
            clause[i + 1].set(", ");
            clause[i + 3].set(clause[i + 3].text.replace(" and ", ", and "));
            return 2;
        }
        // BEFORE: "<desc><s>However, you do find <il><item>a MOUSE</item>, a wooden ruler, and <item>a KEYBOARD</item></il>.</s></desc>"
        // INSERT: "FLASH DRIVE"
        // AFTER:  "<desc><s>However, you do find <il><item>a FLASH DRIVE</item>, <item>a MOUSE</item>, a wooden ruler, and <item>a KEYBOARD</item></il>.</s></desc>"
        else {
            clause[i + 1].set(", ");
            return 3;
        }
    }
    else if (sentence.itemCount === 1) {
        // BEFORE: "<desc><s>On these shelves is <il><item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
        // INSERT: "PAINKILLERS"
        // AFTER:  "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
        if (clause[i + 2].isItem && clause[i + 2].parentNode === sentence.itemList.lastChild) {
            // If the clause before/after the item list has "is" and there are no commas after "is", change "is" to "are".
            if (clause[i - 1] && clause[i - 1].endsWith("is"))
                clause[i - 1].replaceLastWord("is", "are");
            else if (clause[i + 3] && clause[i + 3].startsWith("is"))
                clause[i + 3].replaceFirstWord("is", "are");
            clause[i + 1].set(" and ");
            return 4;
        }
        // BEFORE: "<desc><s>There are <il><item>3 CLARINETS</item>, a PIANO, and some SNARE DRUMS</il>.</s></desc>"
        // INSERT: "DRUM STICKS"
        // AFTER:  "<desc><s>There are <il><item>a set of DRUM STICKS</item>, <item>3 CLARINETS</item>, a PIANO, and some SNARE DRUMS</il>.</s></desc>"
        else if (clause[i + 2].isItem
            && (!clause[i + 3].isItem && clause[i + 3].text.startsWith(", ") && clause[i + 3].text.includes(", and")
            || (clause[i + 3].text === ", " && clause[i + 4] && !clause[i + 4].isItem && clause[i + 4].text.includes(", and")))) {
            clause[i + 1].set(", ");
            return 5;
        }
        // BEFORE: "<desc><s>There are <il><item>3 CLARINETS</item> and a PIANO</il>.</s></desc>"
        // INSERT: "DRUM STICKS"
        // AFTER:  "<desc><s>There are <il><item>a set of DRUM STICKS</item>, <item>3 CLARINETS</item>, and a PIANO</il>.</s></desc>"
        else if (clause[i + 2].isItem && clause[i + 3] && !clause[i + 3].isItem && clause[i + 3].text.startsWith(" and ")) {
            clause[i + 1].set(", ");
            clause[i + 3].set(`,${clause[i + 3].text}`);
            return 6;
        }
        // BEFORE: "<desc><s>However, you do find <il>a wooden ruler and <item>a KEYBOARD</item></il>.</s></desc>"
        // INSERT: "MOUSE"
        // AFTER:  "<desc><s>However, you do find <il><item>a MOUSE</item>, a wooden ruler, and <item>a KEYBOARD</item></il>.</s></desc>"
        else if (!clause[i + 2].isItem && clause[i + 2].text.endsWith(" and ") && clause[i + 3].isItem) {
            clause[i + 1].set(", ");
            clause[i + 2].set(clause[i + 2].text.substring(0, clause[i + 2].text.lastIndexOf(" and ")) + ", and ");
            return 7;
        }
    }
    else {
        // BEFORE: "<desc><s>There are <il>BASKETBALLS, SOCCER BALLS, and BASEBALLS</il>.</s></desc>"
        // INSERT: "TENNIS BALL"
        // AFTER:  "<desc><s>There are <il><item>a TENNIS BALL</item>, BASKETBALLS, SOCCER BALLS, and BASEBALLS</il>.</s></desc>"
        if (clause[i + 2] && clause[i + 2].text.includes(", and ") && clause[i + 2].isLastChildInItemList()) {
            clause[i + 1].set(", ");
            return 8;
        }
        // BEFORE: "<desc><s>There are <il>SOCCER BALLS and BASEBALLS</il>.</s></desc>"
        // INSERT: "TENNIS BALL"
        // AFTER:  "<desc><s>There are <il><item>a TENNIS BALL</item>, SOCCER BALLS, and BASEBALLS</il>.</s></desc>"
        else if (clause[i + 2] && clause[i + 2].text.includes(" and ") && clause[i + 2].isLastChildInItemList()) {
            clause[i + 1].set(", ");
            clause[i + 2].set(clause[i + 2].text.replace(" and ", ", and "));
            return 9;
        }
        // BEFORE: "<desc><s>However, you do find <il>a wooden ruler</il>.</s></desc>"
        // INSERT: "KEYBOARD"
        // AFTER:  "<desc><s>However, you do find <il><item>a KEYBOARD</item> and a wooden ruler</il>.</s></desc>"
        else if (clause[i + 2] && !clause[i + 2].isItem && clause[i + 2].isLastChildInItemList()) {
            clause[i + 1].set(" and ");
            return 10;
        }
        // BEFORE: "<desc><s>Looking under the beds, you find <il></il>.</s></desc>"
        // INSERT: "BASKETBALL"
        // AFTER:  "<desc><s>Looking under the beds, you find <il><item>a BASKETBALL</item></il>.</s></desc>"
        else if (clause[i + 1].isLastChildInItemList()) {
            clause[i + 1].delete();
            sentence.deleteClause(i + 1);
            // If the clause before or after the item list has "are" or "is" and that wouldn't be grammatically correct with the given item quantity, replace it.
            if (clause[i - 1] && clause[i - 1].endsWith("are") && clause[i].itemQuantity === 1)
                clause[i - 1].replaceLastWord("are", "is");
            else if (clause[i - 1] && clause[i - 1].endsWith("is") && clause[i].itemQuantity !== 1)
                clause[i - 1].replaceLastWord("is", "are");
            else if (clause[i + 1] && clause[i + 1].startsWith("are") && clause[i].itemQuantity === 1)
                clause[i + 1].replaceFirstWord("are", "is");
            else if (clause[i + 1] && clause[i + 1].startsWith("is") && clause[i].itemQuantity !== 1)
                clause[i + 1].replaceFirstWord("is", "are");
            return 11;
        }
        else return 12;
    }
}

/**
 * Removes an item clause from the sentence's item list and modifies the sentence to be grammatically correct.
 * @param sentence - The sentence to add an item clause to.
 * @param i - The index of the item clause in the sentence.
 * @returns A number to indicate which condition was met for debugging purposes.
 */
function removeItemClauseFromItemList(sentence: Sentence, i: number): number {
    // This function removes an Item clause from a sentence.
    // In this function, sentence is the sentence containing mention of the item.
    // i is the index of the clause mentioning that item.
    const clause: Clause[] = sentence.clauses;

    if (sentence.itemCount > 1) {
        // Handle removing the last item from a list of items. The if/else if conditionals go by decreasing number of items in the list.
        if (clause[i - 1] && (clause[i - 1].text === ", and " || clause[i - 1].text === " and ") && clause[i].itemNo === sentence.itemCount) {
            clause[i].delete();

            // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
            // REMOVE: "ISOPROPYL ALCOHOL"
            // AFTER:  "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il>.</s></desc>"
            if (sentence.itemCount > 3) {
                // clause[i - 3] will be the comma preceding the second-to-last item. Change it to the string preceding the last item.
                clause[i - 3].set(clause[i - 1].text);
                clause[i - 1].delete();
                return 0;
            }
            // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il>.</s></desc>"
            // REMOVE: "LAXATIVES"
            // AFTER:  "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>3 bottles of ZZZQUIL</item></il>.</s></desc>"
            else if (sentence.itemCount === 3) {
                clause[i - 3].set(clause[i - 1].text.replace(/, */, " "));
                clause[i - 1].delete();
                return 1;
            }
            // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>3 bottles of ZZZQUIL</item></il>.</s></desc>"
            // REMOVE: "ZZZQUIL"
            // AFTER:  "<desc><s>On these shelves is <il><item>a bottle of PAINKILLERS</item></il>.</s></desc>"
            else {
                // If the clause before or after the item list has "are" and there's only going to be 1 item left with a quantity of 1 and there are no commas after "are", change "are" to "is".
                if (i >= 3 && clause[i - 3].text.includes(" are ") && clause[i - 2].itemQuantity === 1 && clause[i - 3].text.substring(clause[i - 3].text.lastIndexOf(" are ")).split(',').length - 1 === 0)
                    clause[i - 3].set(clause[i - 3].text.substring(0, clause[i - 3].text.lastIndexOf(" are ")) + " is " + clause[i - 3].text.substring(clause[i - 3].text.lastIndexOf(" are ") + 5));
                else if (clause[i + 1] && clause[i + 1].text.startsWith(" are ") && clause[i].itemQuantity === 1)
                    clause[i + 1].set(" is " + clause[i + 1].text.substring(clause[i + 1].text.indexOf(" are ") + 5));
                clause[i - 1].delete();
                return 2;
            }
        }
        // Handle removing the first item from a list of items when the first item is the beginning of the sentence. The if/else if conditionals go by increasing number of items in the list.
        else if (clause[i].itemNo === 1 && !clause[i - 1]) {
            clause[i].delete();
            // BEFORE: "<desc><s><il><item>A bottle of PAINKILLERS</item> and <item>a bottle of LAXATIVES</item></il> are on these shelves.</s></desc>"
            // REMOVE: "PAINKILLERS"
            // AFTER:  "<desc><s><il><item>A bottle of LAXATIVES</item></il> is on these shelves.</s></desc>"
            if (clause[i + 1].text.includes(" and ")) {
                clause[i + 1].delete();
                clause[i + 2].set(clause[i + 2].text.charAt(0).toUpperCase() + clause[i + 2].text.substring(1));
                if (clause[i + 3].text.startsWith(" are") && clause[i + 2].itemQuantity === 1)
                    clause[i + 3].set(clause[i + 3].text.replace(" are", " is"));
                return 3;
            }
            // BEFORE: "<desc><s><il><item>A bottle of PAINKILLERS</item>, <item>a bottle of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il> are on these shelves.</s></desc>"
            // REMOVE: "PAINKILLERS"
            // AFTER:  "<desc><s><il><item>A bottle of ZZZQUIL</item> and <item>a bottle of LAXATIVES</item></il> are on these shelves.</s></desc>"
            else if (clause[i + 1].text.startsWith(", ") && clause[i + 3].text.startsWith(", and ")) {
                clause[i + 1].delete();
                clause[i + 2].set(clause[i + 2].text.charAt(0).toUpperCase() + clause[i + 2].text.substring(1));
                clause[i + 3].set(clause[i + 3].text.replace(", and ", " and "));
                return 4;
            }
        }
        // Handle removing the second to last item from a list of items. The if/else if conditionals go by increasing number of items in the list.
        else if ((clause[i + 1].text === ", and " || clause[i + 1].text === " and ") && clause[i].itemNo === sentence.itemCount - 1) {
            clause[i].delete();
            // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>a bottle of LAXATIVES</item></il>.</s></desc>"
            // REMOVE: "PAINKILLERS"
            // AFTER:  "<desc><s>On these shelves is <il><item>a bottle of LAXATIVES</item></il>.</s></desc>"
            if (sentence.itemCount === 2) {
                clause[i + 1].delete();
                // If the clause before the item list has "are" and there's only going to be 1 item left with a quantity of 1 and there are no commas after "are", change "are" to "is".
                if (clause[i - 1].text.includes(" are ") && clause[i + 2].itemQuantity === 1 && clause[i - 1].text.substring(clause[i - 1].text.lastIndexOf(" are ")).split(',').length - 1 === 0)
                    clause[i - 1].set(clause[i - 1].text.substring(0, clause[i - 1].text.lastIndexOf(" are ")) + " is " + clause[i - 1].text.substring(clause[i - 1].text.lastIndexOf(" are ") + 5));
                return 5;
            }
            // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il>.</s></desc>"
            // REMOVE: "ZZZQUIL"
            // AFTER:  "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>a bottle of LAXATIVES</item></il>.</s></desc>"
            else if (sentence.itemCount === 3) {
                clause[i + 1].delete();
                clause[i - 1].set(" and ");
                return 6;
            }
            // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
            // REMOVE: "LAXATIVES":
            // AFTER:  "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
            else if (sentence.itemCount > 3) {
                clause[i - 1].delete();
                return 7;
            }
        }
        // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>a bottle of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il>.</s></desc>"
        // REMOVE: "PAINKILLERS"
        // AFTER:  "<desc><s>On these shelves are <il><item>a bottle of ZZZQUIL</item> and <item>a bottle of LAXATIVES</item></il>.</s></desc>"
        else if (sentence.itemCount === 3 && clause[i].itemNo === 1
            && clause[i + 1].text === ", " && clause[i + 3].text.startsWith(", and ")) {
            clause[i].delete();
            clause[i + 1].delete();
            clause[i + 3].set(clause[i + 3].text.replace(", and ", " and "));
            return 8;
        }
        // BEFORE: "<desc><s>On the counters, you can see <il><item>a few KNIVES</item>, <item>a BUTCHERS KNIFE</item>, and <item>a RACK of skewers</item></il>.</s></desc>"
        // REMOVE: "KNIFE"
        // AFTER:  "<desc><s>On the counters, you can see <il><item>a BUTCHERS KNIFE</item> and <item>a RACK of skewers</item></il>.</s></desc>"
        else if (sentence.itemCount === 2
            && clause[i + 1] && clause[i + 1].text === ", "
            && clause[i + 2] && clause[i + 2].isItem
            && clause[i + 3] && clause[i + 3].text.startsWith(", and ") && !clause[i + 3].isItem) {
            clause[i].delete();
            clause[i + 1].delete();
            clause[i + 3].set(clause[i + 3].text.replace(", and ", " and "));
            return 9;
        }
        // BEFORE: "<desc><s>On the counters, you can see <il><item>a few KNIVES</item>, <item>a BUTCHERS KNIFE</item>, and <item>a RACK of skewers</item></il>.</s></desc>"
        // REMOVE: "BUTCHERS KNIFE"
        // AFTER:  "<desc><s>On the counters, you can see <il><item>a few KNIVES</item> and a RACK of skewers</il>.</s></desc>"
        else if (sentence.itemCount === 2 && clause[i].itemNo === 2
            && clause[i - 1].text === ", "
            && clause[i + 1] && clause[i + 1].text.startsWith(", and") && !clause[i + 1].isItem) {
            clause[i - 1].delete();
            clause[i].delete();
            clause[i + 1].set(clause[i + 1].text.replace(", and ", " and "));
            return 10;
        }
        // BEFORE: "<desc><s>However, you do find <il><item>a MOUSE</item>, a wooden ruler, and <item>a KEYBOARD</item></il>.</s></desc>"
        // REMOVE: "MOUSE"
        // AFTER:  "<desc><s>However, you do find <il>a wooden ruler and <item>a KEYBOARD</item></il>.</s></desc>"
        else if (sentence.itemCount === 2
            && clause[i + 1] && !clause[i + 1].isItem && clause[i + 1].text.startsWith(", ") && clause[i + 1].text.endsWith(", and ")
            && clause[i + 2] && clause[i + 2].isItem) {
            clause[i].delete();
            clause[i + 1].set(clause[i + 1].text.replace(", ", "").replace(", and ", " and "));
            return 11;
        }
        // BEFORE: "<desc><s>However, you do find <il><item>a MOUSE</item>, a wooden ruler, and <item>a KEYBOARD</item></il>.</s></desc>"
        // REMOVE: "KEYBOARD"
        // AFTER:  "<desc><s>However, you do find <il><item>a MOUSE</item> and a wooden ruler</il>.</s></desc>"
        else if (clause[i - 1] && !clause[i - 1].isItem && clause[i - 1].text.startsWith(", ") && clause[i - 1].text.endsWith(", and ")
            && clause[i - 2] && clause[i - 2].isItem) {
            clause[i].delete();
            clause[i - 1].set(clause[i - 1].text.replace(", ", " and ").replace(", and ", ""));
            return 12;
        }
        // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
        // REMOVE: "LAXATIVES":
        // AFTER:  "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
        else if (sentence.itemCount >= 3 && clause[i].itemNo === sentence.itemCount && clause[i + 1] && clause[i + 1].text.startsWith(", and ")) {
            clause[i].delete();
            clause[i - 1].delete();
            return 13;
        }
        // BEFORE: "<desc><s>The shelves are lined with <il><item>2 bags of POTATOES</item>, <item>2 bags of RICE</item>, different ingredients for baking, and dough mixes</il>.</s></desc>"
        // REMOVE: RICE
        // AFTER: "<desc><s>The shelves are lined with <il><item>2 bags of POTATOES</item>, different ingredients for baking, and dough mixes</il>.</s></desc>"
        else if (sentence.itemCount >= 2 && clause[i].itemNo === sentence.itemCount
            && clause[i + 1] && clause[i + 1].text.includes(", and ") && !clause[i + 1].text.startsWith(", and ") && clause[i + 1].text.startsWith(", ")) {
            clause[i].delete();
            clause[i + 1].set(clause[i + 1].text.substring(2));
            return 14;
        }
        else {
            clause[i].delete();
            if (clause[i + 1] && clause[i + 1].text === ", ") clause[i + 1].delete();
            return 15;
        }
    }
    // BEFORE: "<desc><s>A few grab your attention though: <il>ROSE OF SHARON, PINK LACEFLOWER, and <item>a MIRACLE FLOWER</item></il>.</s></desc>"
    // REMOVE: "MIRACLE FLOWER"
    // AFTER:
    else if (clause[i - 1] && !clause[i - 1].isItem && clause[i - 1].text.endsWith(", and ") && clause[i - 1].text.split(',').length - 1 === 2) {
        clause[i].delete();
        clause[i - 1].set(clause[i - 1].text.replace(", and ", "").replace(", ", " and "));
        return 16;
    }
    // BEFORE: "<desc><s>However, you do find <il>a wooden ruler and <item>a KEYBOARD</item></il>.</s></desc>"
    // REMOVE: "KEYBOARD"
    // AFTER:  "<desc><s>However, you do find <il>a wooden ruler</il>.</s></desc>"
    else if (clause[i - 1] && !clause[i - 1].isItem && clause[i - 1].text.endsWith(" and ")) {
        clause[i].delete();
        clause[i - 1].set(clause[i - 1].text.replace(" and ", ""));
        return 17;
    }
    // BEFORE: "<desc><s>However, you do find <il><item>a KEYBOARD</item> and a wooden ruler</il>.</s></desc>"
    // REMOVE: "KEYBOARD"
    // AFTER:  "<desc><s>However, you do find <il>a wooden ruler</il>.</s></desc>"
    else if (clause[i + 1] && clause[i + 1].text.startsWith(" and ")) {
        clause[i].delete();
        clause[i + 1].set(clause[i + 1].text.replace(" and ", ""));
        return 18;
    }
    // BEFORE: "<desc><s>In and around the bushes, you find <il><item>an EASTER EGG</item>, RED BERRIES, PURPLE BERRIES, and MUSHROOMS</il>.</s></desc>"
    // REMOVE: "EASTER EGG"
    // AFTER:  "<desc><s>In and around the bushes, you find <il>RED BERRIES, PURPLE BERRIES, and MUSHROOMS</il>.</s></desc>"
    else if (clause[i + 1] && clause[i + 1].text.includes(", and ") && clause[i + 1].text.split(',').length - 1 > 2) {
        clause[i].delete();
        clause[i + 1].set(clause[i + 1].text.replace(", ", ""));
        return 19;
    }
    // BEFORE: "<desc><s>There are <il><item>CLARINETS</item>, a PIANO, and some SNARE DRUMS</il>.</s></desc>"
    // REMOVE: "CLARINETS"
    // AFTER:  "<desc><s>There are <il>a PIANO and some SNARE DRUMS</il>.</s></desc>"
    else if (clause[i + 1] && clause[i + 1].text.includes(", and ") && clause[i + 1].text.split(',').length - 1 === 2) {
        clause[i].delete();
        clause[i + 1].set(clause[i + 1].text.replace(", ", "").replace(", and ", " and "));
        return 20;
    }
    else if (!clause[i - 1] && clause[i + 1] && clause[i + 1].text === ".") {
        clause[i].delete();
        clause[i + 1].delete();
        return 21;
    }

    // If all else fails, just remove the item clause.
    clause[i].delete();
    return 22;
}
