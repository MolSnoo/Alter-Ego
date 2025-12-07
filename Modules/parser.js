import InventoryItem from '../Data/InventoryItem.js';
import Item from '../Data/Item.js';
import Player from '../Data/Player.js';
import * as finder from './finder.js';
import { default as evaluateScript } from './scriptParser.js';

import { DOMParser, XMLSerializer } from '@xmldom/xmldom';

export * as default from './parser.js';

class Clause {
    /**
     * @param {any} node 
     * @param {boolean} [isItem] 
     * @param {number} [itemNo] 
     * @param {number} [itemQuantity] 
     */
    constructor(node, isItem, itemNo, itemQuantity) {
        this.node = node;
        this.text = this.node.data;
        this.isItem = isItem !== null && isItem !== undefined ? isItem : false;
        this.itemNo = itemNo !== null && itemNo !== undefined ? itemNo : NaN;
        this.itemQuantity = itemQuantity !== null && itemQuantity !== undefined ? itemQuantity : 0;
    }

    /** @param {string} string */
    set(string) {
        this.node.data = string;
        this.text = this.node.data;
    }

    delete() {
        if (this.node) {
            let parentNode = this.node.parentNode;
            let grandParentNode = parentNode.parentNode;
            parentNode.removeChild(this.node);
            // If this is an item clause, then the parent node is an item tag. Delete the now empty item tag.
            if (this.isItem) grandParentNode.removeChild(parentNode);
            // If this item is contained in an if tag, remove the if tag.
            if (grandParentNode.nodeName === 'if') grandParentNode.parentNode.removeChild(grandParentNode);
            this.node = null;
        }
        this.text = "";
    }
}

class Sentence {
    /**
     * @param {Array<Clause>} clause 
     * @param {number} itemCount 
     * @param {Element} itemList 
     * @param {string} itemListName 
     */
    constructor(clause, itemCount, itemList, itemListName) {
        this.clause = clause;
        this.itemCount = itemCount;
        this.itemList = itemList;
        this.itemListName = itemListName;
    }
}

/**
 * Parses the XML of a description and evaluates it into a result object with no XML tags. Includes warnings and errors.
 * @param {string} description - The description to parse.
 * @param {*} container - The in-game entity this description belongs to.
 * @param {Player|PseudoPlayer} player - The Player currently reading the description.
 * @returns {{text: string, warnings: string[], errors: string[]}}
 */
export function parseDescriptionWithErrors (description, container, player) {
    // First, split the description into a DOMParser document.
    let document = createDocument(description);
    // Check for any warnings and errors. If they exist, store them.
    let warnings = [];
    let errors = [];
    if (document.warnings.length !== 0) warnings = document.warnings;
    if (document.errors.length !== 0) errors = document.errors;
    // Now we just need the document.
    let documentElement = document.document;

    if (documentElement) {
        // Find any conditionals.
        let conditionals = documentElement.getElementsByTagName('if');
        /** @type {Array<Element>} */
        let conditionalsToRemove = [];
        for (let i = 0; i < conditionals.length; i++) {
            let conditional = conditionals[i].getAttribute('cond');
            if (conditional !== null && conditional !== undefined) {
                try {
                    if (evaluateScript(conditional, container, player) === false)
                        conditionalsToRemove.push(conditionals[i]);
                }
                catch (err) {
                    errors.push(err.toString());
                }
            }
        }
        for (let conditionalToRemove of conditionalsToRemove) {
            const childNode = conditionalToRemove.firstChild;
            if ('tagName' in childNode && childNode.tagName === 'item') {
                let itemElement = childNode.firstChild;
                /** @type {PseudoItem} */
                let item = { name: '', pluralName: '', quantity: 0, singleContainingPhrase: itemElement.textContent, pluralContainingPhrase: itemElement.textContent };
                documentElement = removeItemWithDocument(description, item, '', NaN, documentElement);
            }
            else if (conditionalToRemove.parentNode) conditionalToRemove.parentNode.removeChild(conditionalToRemove);
            else documentElement.removeChild(conditionalToRemove);
        }

        // Check if there's an item list in the document.
        const itemListSentences = getItemListSentences(documentElement);
        for (const sentence of itemListSentences) {
            const itemList = sentence.getElementsByTagName('il').item(0);
            // If the item list is empty, remove the sentence from the documentElement.
            const childNode = itemList.childNodes.item(0);
            if (itemList.childNodes.length === 0 || itemList.childNodes.length === 1 && 'tagName' in childNode && childNode.tagName === 'null') {
                if (sentence.parentNode) sentence.parentNode.removeChild(sentence);
                else documentElement.removeChild(sentence);
            }
        }

        // Replace any var tags.
        const variables = documentElement.getElementsByTagName('var');
        let variableStrings = [];
        for (let i = 0; i < variables.length; i++) {
            const varAttribute = variables[i].getAttribute('v');
            if (varAttribute !== null && varAttribute !== undefined) {
                try {
                    const variableText = evaluateScript(varAttribute, container, player);
                    if (variableText === undefined || variableText === "undefined")
                        errors.push('"' + varAttribute.replace(/container/g, "this") + '" is undefined.');
                    variableStrings.push({ element: variables[i], attribute: variableText });
                    if (typeof variableStrings[variableStrings.length - 1].attribute === 'string' && variableStrings[variableStrings.length - 1].attribute.includes('<desc>'))
                        variableStrings[variableStrings.length - 1].attribute = this.parseDescription(variableStrings[variableStrings.length - 1].attribute, this, player);
                } catch (err) {
                    errors.push(err.toString());
                }
            }
        }
        for (let i = 0; i < variableStrings.length; i++) {
            const newNode = documentElement.createTextNode(variableStrings[i].attribute);
            variableStrings[i].element.parentNode.replaceChild(newNode, variableStrings[i].element);
        }

        // Replace any br tags.
        const breakTags = documentElement.getElementsByTagName('br');
        let breaks = [];
        for (let i = 0; i < breakTags.length; i++)
            breaks.push(breakTags[i]);
        for (let i = 0; i < breaks.length; i++) {
            let newNode = documentElement.createTextNode('\n');
            breaks[i].parentNode.replaceChild(newNode, breaks[i]);
        }
    }

    // Convert the document to a string.
    let newDescription = stringify(documentElement);
    // Strip XML tags from the string, as well as all duplicate spaces.
    newDescription = newDescription.replace(/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    return { text: newDescription, warnings: warnings, errors: errors };
}

/**
 * Parses the XML of a description and evaluates it into a result with no XML tags. Returns only the resulting text.
 * @param {string} description - The description to parse.
 * @param {*} container - The in-game entity this description belongs to.
 * @param {Player|PseudoPlayer} player - The Player currently reading the description.
 * @returns {string}
 */
export function parseDescription(description, container, player) {
    const parsedDescription = parseDescriptionWithErrors(description, container, player);
    return parsedDescription.text;
}

/**
 * Adds an item to an item list in an XML description. If the item already exists, increases its quantity.
 * @param {string} description - The description to add an item to.
 * @param {Item|InventoryItem|PseudoItem} item - The item to add.
 * @param {string} [slot] - The name of the il tag to update.
 * @param {number} [addedQuantity=1] - The quantity of this item to add. If none is provided, defaults to 1.
 * @returns {string}
 */
export function addItem (description, item, slot, addedQuantity = 1) {
    // First, split the description into a DOMParser document.
    let documentElement = createDocument(description).document;

    if (documentElement) {
        // Parse all of the sentences.
        let sentenceElements = documentElement.getElementsByTagName('s');
        /** @type {Array<Sentence>} */
        let sentences = [];
        for (let i = 0; i < sentenceElements.length; i++)
            sentences.push(createSentence(sentenceElements[i]));

        let itemAlreadyExists = false;
        /** @type {Sentence} */
        let sentence
        /** @type {string} */
        let text;
        let i = 0;
        for (let j = 0; j < sentences.length; j++) {
            sentence = sentences[j];
            // Determine if the item is already mentioned in the sentence.
            for (i = 0; i < sentence.clause.length; i++) {
                text = sentence.clause[i].node.data.toLowerCase();
                if ((sentence.itemListName === slot || slot !== "" && sentence.itemListName === "" && description.split("<il").length - 1 === 1) &&
                    sentence.itemList !== null &&
                    (text === item.singleContainingPhrase.toLowerCase() || item.pluralContainingPhrase && text.includes(item.pluralContainingPhrase.toLowerCase()))) {
                    itemAlreadyExists = true;
                    break;
                }
            }
            if (itemAlreadyExists) break;
        }

        // This item already exists within the description.
        if (itemAlreadyExists && sentence.clause[i].isItem) {
            // If there's only 1 of this item, we need only use the plural containing phrase.
            if (sentence.clause[i].itemQuantity === 1)
                sentence.clause[i].set(`${1 + addedQuantity} ${item.pluralContainingPhrase}`);
            else {
                let start = sentence.clause[i].text.search(/\d/);
                if (start !== -1) {
                    let end;
                    for (end = start; end < text.length; end++) {
                        if (isNaN(Number(text.charAt(end + 1))))
                            break;
                    }
                    const quantity = parseInt(text.substring(start, end));
                    sentence.clause[i].set(sentence.clause[i].text.replace(quantity, quantity + addedQuantity));
                }
            }
        }
        // The sentence doesn't already contain this item.
        else if (!itemAlreadyExists) {
            if (slot === null || slot === undefined) slot = "";
            // We need to find the location of the beginning of the item list.
            let containsItemList = false;
            for (i = 0; i < sentences.length; i++) {
                if (sentences[i].itemList !== null &&
                    (sentences[i].itemListName === slot || slot !== "" && sentence.itemListName === "" && description.split("<il").length - 1 === 1)) {
                    containsItemList = true;
                    break;
                }
            }

            // Add the clause to the sentence.
            if (containsItemList) {
                const phrase = addedQuantity === 1 ? item.singleContainingPhrase : `${addedQuantity} ${item.pluralContainingPhrase}`;
                let result = addClause(sentences[i], phrase);
                //console.log(result);
            }
        }
    }

    return stringify(documentElement).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

/**
 * Removes an item clause from an il tag within a description. If the item's quantity is greater than 1, decreases it. Returns a Document.
 * @param {string} description - The description to remove an item from.
 * @param {Item|InventoryItem|PseudoItem} item - The item to remove.
 * @param {string} [slot] - The name of the il tag to update.
 * @param {number} [removedQuantity=1] - The quantity of this item to remove. If none is provided, defaults to 1.
 * @param {Document} [document] - An already existing document. If this is present, the function returns an unparsed document.
 * @returns {Document}
 */
function removeItemWithDocument (description, item, slot, removedQuantity = 1, document) {
    // Parse all of the sentences.
    let sentenceElements = document.getElementsByTagName('s');
    /** @type {Array<Sentence>} */
    let sentences = [];
    for (let i = 0; i < sentenceElements.length; i++)
        sentences.push(createSentence(sentenceElements[i]));

    let removeItem = false;
    /** @type {Sentence} */
    let sentence;
    /** @type {string} */
    let text;
    let i = 0;
    for (let j = 0; j < sentences.length; j++) {
        sentence = sentences[j];
        if ((slot === null || slot === undefined || slot === "") && sentence.itemListName === ""
            || slot !== null && slot !== undefined && slot !== "" && sentence.itemListName === "" && description.split("<il").length - 1 < 2
            || sentence.itemListName === slot) {
            // Determine if an item needs to be removed from the sentence.
            for (i = 0; i < sentence.clause.length; i++) {
                if (sentence.clause[i].isItem) {
                    text = sentence.clause[i].node.data.toLowerCase();
                    if (text === item.singleContainingPhrase.toLowerCase()
                        || item.pluralContainingPhrase && text.includes(item.pluralContainingPhrase.toLowerCase())) {
                        removeItem = true;
                        break;
                    }
                }
            }
            if (removeItem) break;
        }
    }

    if (removeItem) {
        // If removedQuantity argument is NaN, remove the item clause regardless of its quantity.
        if (!isNaN(removedQuantity)) removeItem = false;

        // First make sure there aren't multiple of that item.
        let start = text.search(/\d/);
        if (start !== -1) {
            let end;
            for (end = start; end < text.length; end++) {
                if (isNaN(Number(text.charAt(end + 1))) || text.charAt(end) === ' ')
                    break;
            }
            const regex = new RegExp(text.substring(start, end) + "([^$]*)" + item.pluralContainingPhrase, 'i');
            const hasQuantity = regex.test(text) && item.pluralContainingPhrase !== "";
            const quantity = parseInt(text.substring(start, end));
            if (hasQuantity && quantity - removedQuantity === 1) sentence.clause[i].set(item.singleContainingPhrase);
            else if (hasQuantity && quantity - removedQuantity > 1) sentence.clause[i].set(sentence.clause[i].text.replace(quantity, quantity - removedQuantity));
            else removeItem = true;
        }
        else removeItem = true;

        // Remove the item from the sentence.
        if (removeItem) {
            let result = removeClause(sentence, i);
            //console.log(result);
        }
    }

    return document;
}

/**
 * Removes an item clause from an il tag within a description. If the item's quantity is greater than 1, decreases it.
 * @param {string} description - The description to remove an item from.
 * @param {Item|InventoryItem|PseudoItem} item - The item to remove.
 * @param {string} [slot] - The name of the il tag to update.
 * @param {number} [removedQuantity=1] - The quantity of this item to remove. If none is provided, defaults to 1.
 * @returns {string}
 */
export function removeItem (description, item, slot, removedQuantity = 1) {
    let document = createDocument(description).document;
    document = removeItemWithDocument(description, item, slot, removedQuantity, document);
    return stringify(document).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

/**
 * Evaluates all of the procedural and poss tags in a description and randomly selects which ones to keep.
 * @param {string} description - The description with procedurals.
 * @param {Map<string, string>} proceduralSelections - A Map of manually selected names of poss tags to keep.
 * @param {Player|PseudoPlayer} [player] - The player who caused these procedurals to be evaluated, if applicable.
 * @returns {string}
 */
export function generateProceduralOutput (description, proceduralSelections, player) {
    let document = createDocument(description).document;

    if (document) {
        // Find all procedurals.
        let procedurals = document.getElementsByTagName('procedural');
        /** @type {Array<Node>} */
        let proceduralsToRemove = [];
        for (let i = 0; i < procedurals.length; i++) {
            const proceduralName = procedurals[i].getAttribute('name').toLowerCase().trim();
            let proceduralAssigned = false;
            if (proceduralName !== '' && proceduralSelections.has(proceduralName))
                proceduralAssigned = true;
            else {
                let parentProcedural = procedurals[i].parentNode;
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
            let possibilities = procedurals[i].getElementsByTagName('poss');
            /** @type {Array<Possibility>} */
            let possibilityArr = [];
            /** @type {Array<Element>} */
            let possibilitiesToRemove = [];
            /** @type {number} */
            let winningPossibilityIndex;
            for (let j = 0; j < possibilities.length; j++) {
                // Skip possibilities that belong to nested procedurals.
                if (possibilities[j].parentNode !== procedurals[i]) continue;
                const possibilityName = possibilities[j].getAttribute('name').toLowerCase();
                if (proceduralAssigned && proceduralSelections.get(proceduralName) === possibilityName)
                    winningPossibilityIndex = j;
                let possibilityChance = parseFloat(possibilities[j].getAttribute('chance'));
                // This will be handled in the rolling function, if a possibility chance was not provided or invalid, set it to null.
                if (isNaN(possibilityChance) || possibilityChance < 0 || possibilityChance > 100)
                    possibilityChance = null;
                possibilityArr.push({ index: j, chance: possibilityChance });
            }
            if (!winningPossibilityIndex) {
                /** @type {number} */
                let statValue;
                const proceduralStat = procedurals[i].getAttribute('stat').toLowerCase();
                if (proceduralStat !== '' && player !== null) {
                    if (proceduralStat === "strength" || proceduralStat === "str") statValue = player.strength;
                    else if (proceduralStat === "intelligence" || proceduralStat === "int") statValue = player.intelligence;
                    else if (proceduralStat === "dexterity" || proceduralStat === "dex") statValue = player.dexterity;
                    else if (proceduralStat === "speed" || proceduralStat === "spd") statValue = player.speed;
                    else if (proceduralStat === "stamina" || proceduralStat === "sta") statValue = player.stamina;
                }
                possibilityArr = calculateModifiedPossbilityArr(possibilityArr, statValue);
                winningPossibilityIndex = choosePossibilityIndex(possibilityArr);
            }
            for (let possibility of possibilityArr) {
                if (possibility.index !== winningPossibilityIndex)
                    possibilitiesToRemove.push(possibilities[possibility.index]);
            }
            // Remove poss tags that failed the roll.
            for (let j = 0; j < possibilitiesToRemove.length; j++)
                procedurals[i].removeChild(possibilitiesToRemove[j]);
        }
        // Remove procedurals that failed the roll.
        for (let i = 0; i < proceduralsToRemove.length; i++) {
            if (proceduralsToRemove[i].parentNode) proceduralsToRemove[i].parentNode.removeChild(proceduralsToRemove[i]);
            else document.removeChild(proceduralsToRemove[i]);
        }
    }

    return stringify(document).replace(/<\/?procedural\s?[^>]*>/g, '').replace(/<\/?poss\s?[^>]*>/g, '').replace(/<s>\s*<\/s>/g, '').replace(/<\/([^>]+?)> +<\/desc>/g, "</$1></desc>").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

/** @param {number} chance */
function keepProcedural(chance) {
    return Math.random() * 100 < chance;
}

/**
 * @param {Array<Possibility>} possibilityArr 
 * @param {number} statValue 
 * @returns {Array<Possibility>}
 */
function calculateModifiedPossbilityArr(possibilityArr, statValue) {
    // If any of the given possibilities are null, assign their chances equally so that all chances add up to 100.
    // Clamp the sum of non-null possibilities between 0 and 100.
    /** @type {number} */
    let possibilitySum = Math.min(Math.max(possibilityArr.reduce((accumulator, possibility) => accumulator + (possibility.chance === null ? 0 : possibility.chance), 0), 0), 100);
    /** @type {number} */
    let nullCount = possibilityArr.reduce((accumulator, possibility) => accumulator + (possibility.chance === null ? 1 : 0), 0);
    if (nullCount > 0) {
        let dividedRemainder = (100.0 - possibilitySum) / nullCount; 
        for (let possibility of possibilityArr) {
            if (possibility.chance === null)
                possibility.chance = dividedRemainder;
        }
    }

    // Generate modified percentages based on the supplied stat value.
    if (statValue !== null && possibilityArr.length > 1) {
        const modifierMax = statValue - 5;
        const modifierMin = -1 * modifierMax;
        for (let i = 0; i < possibilityArr.length; i++) {
            const percentageModifier = (modifierMin + (modifierMax - modifierMin) / (possibilityArr.length - 1) * i) * 10;
            possibilityArr[i].chance = possibilityArr[i].chance + percentageModifier;
        }
    }

    // Sort by highest to lowest chance.
    possibilityArr = possibilityArr.sort((a,b) => b.chance - a.chance);

    return possibilityArr;
}

/**
 * @param {Array<Possibility>} possibilityArr 
 * @returns {number}
 */
function choosePossibilityIndex(possibilityArr) {
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
 * @param {string} description 
 * @returns {{document: Document, warnings: string[], errors: string[]}}
 */
function createDocument(description) {
    description = description.replace(/<il><\/il>/g, "<il><null /></il>");

    let warnings = [];
    let errors = [];
    /** @type {Document} */
    let document = new DOMParser({
        // locator is always need for error position info
        locator: {},
        // you can override the errorHandler for xml parser
        errorHandler: {
            warning: function (w) { warnings.push(w); },
            error: function (err) { errors.push(err); }
        }
    }).parseFromString(description, 'text/xml');
    return { document: document, warnings: warnings, errors: errors };
}

/**
 * @param {Element} sentenceNode 
 * @returns {Sentence}
 */
function createSentence(sentenceNode) {
    /** @type {Array<Clause>} */
    let clauses = [];
    parseNodes(clauses, sentenceNode);
    let itemCount = 0;
    for (const clause of clauses) {
        if (clause.node.parentNode.tagName === 'item') {
            clause.isItem = true;
            itemCount++;
            clause.itemNo = itemCount;
            // Get item quantity.
            let text = clause.node.data;
            let start = text.search(/\d/);
            if (start === 0) {
                let end;
                for (end = start; end < text.length; end++) {
                    if (isNaN(text.charAt(end + 1)))
                        break;
                }
                const quantity = parseInt(text.substring(start, end));
                clause.itemQuantity = quantity;
            }
            else clause.itemQuantity = 1;
        }
    }
    let itemList = null;
    let itemListName = "";
    let itemLists = sentenceNode.getElementsByTagName('il');
    if (itemLists.length > 0) {
        itemList = itemLists[0];
        itemListName = itemList.getAttribute('name');
    }

    let sentence = new Sentence(clauses, itemCount, itemList, itemListName);
    return sentence;
}

/**
 * @param {Array<Clause>} clauses 
 * @param {Node} node 
 * @returns {Array<Clause>}
 */
function parseNodes(clauses, node) {
    for (let i = 0; i < node.childNodes.length; i++) {
        if ('data' in node.childNodes[i])
            clauses.push(new Clause(node.childNodes[i]));
        else if ('tagName' in node.childNodes[i])
            parseNodes(clauses, node.childNodes[i]);
    }
    return clauses;
}

/**
 * Gets all s tag elements containing an il tag element.
 * @param {Document} document 
 * @returns {Array<Element>}
 */
function getItemListSentences(document) {
    // Get a list of sentences in the document.
    const sentences = document.getElementsByTagName('s');
    // Find the sentence containing an item list, if there is one.
    let itemListSentences = [];
    for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].getElementsByTagName('il').length > 0)
            itemListSentences.push(sentences[i]);
    }

    return itemListSentences;
}

/**
 * @param {Node} document 
 * @returns {string}
 */
function stringify(document) {
    let description = new XMLSerializer().serializeToString(document);
    description = description.replace(/<il\/>/g, "<il></il>").replace(/(<(il)\s[^>]+?)\/>/g, "$1></$2>").replace(/<s\/>/g, "").replace(/<null\/>/g, "").replace(/<\/([^>]+?)> +<\/desc>/g, "</$1></desc>").replace(/ {2,}/g, " ").trim();
    return description;
}

/**
 * @param {Sentence} sentence 
 * @param {string} phrase 
 * @returns {number} i - The index of the new Clause within the Sentence.
 */
function initializeNewClause(sentence, phrase) {
    let document = sentence.itemList.ownerDocument;
    let firstChild = sentence.itemList.firstChild;
    let tempNode;
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
    let i;
    for (i = 0; i < sentence.clause.length; i++) {
        if ('data' in firstChild && sentence.clause[i].text === firstChild.data)
            break;
    }

    let textNode = document.createTextNode(phrase);
    let itemNode = document.createElement('item');
    itemNode.appendChild(textNode);
    sentence.itemList.insertBefore(itemNode, sentence.itemList.firstChild);

    let separatorNode = document.createTextNode(" ");
    sentence.itemList.insertBefore(separatorNode, itemNode.nextSibling);

    const itemClause = new Clause(textNode, true, 0, 1);
    sentence.clause.splice(i, 0, itemClause);

    const separatorClause = new Clause(separatorNode);
    sentence.clause.splice(i + 1, 0, separatorClause);

    if (tempNode !== undefined)
        tempNode.parentNode.removeChild(tempNode);

    return i;
}

/**
 * @param {Sentence} sentence 
 * @param {string} phrase 
 * @returns {number} case - A number to indicate which condition was met for debugging purposes.
 */
function addClause(sentence, phrase) {
    // This function properly edits a sentence after an Item clause has been added.
    // In this function, sentence is the sentence containing an Item list.
    const clause = sentence.clause;

    // First, create the new Item clause and get its index in the sentence.
    // Note: clause[i + 1] is the separator clause where a comma, space, "and", etc. will go.
    const i = initializeNewClause(sentence, phrase);

    // If this is the beginning of the sentence, capitalize the first letter of the new clause.
    // Then, fix the capitalization of the next clause, if applicable.
    if (i === 0) {
        clause[i].set(clause[i].text.charAt(0).toUpperCase() + clause[i].text.substring(1));
        const capitals = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (capitals.includes(clause[i + 2].text.charAt(0)) && !capitals.includes(clause[i + 2].text.charAt(1)))
            clause[i + 2].set(clause[i + 2].text.charAt(0).toLowerCase() + clause[i + 2].text.substring(1));
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
        if (clause[i + 2].isItem && clause[i + 2].node.parentNode === sentence.itemList.lastChild) {
            // If the clause before/after the item list has "is" and there are no commas after "is", change "is" to "are".
            if (clause[i - 1] && clause[i - 1].text.includes(" is ") && clause[i - 1].text.substring(clause[i - 1].text.lastIndexOf(" is ")).split(',').length - 1 === 0)
                clause[i - 1].set(clause[i - 1].text.substring(0, clause[i - 1].text.lastIndexOf(" is ")) + " are " + clause[i - 1].text.substring(clause[i - 1].text.lastIndexOf(" is ") + 4));
            else if (clause[i + 3] && clause[i + 3].text.includes(" is ") && clause[i + 3].text.substring(0, clause[i + 3].text.indexOf(" is ")).split(',').length - 1 === 0)
                clause[i + 3].set(clause[i + 3].text.substring(0, clause[i + 3].text.indexOf(" is ")) + " are " + clause[i + 3].text.substring(clause[i + 3].text.indexOf(" is ") + 4));
            clause[i + 1].set(" and ");
            return 4;
        }
        // BEFORE: "<desc><s>There are <il><item>3 CLARINETS</item>, a PIANO, and some SNARE DRUMS</il>.</s></desc>"
        // INSERT: "DRUM STICKS"
        // AFTER:  "<desc><s>There are <il><item>a set of DRUM STICKS</item>, <item>3 CLARINETS</item>, a PIANO, and some SNARE DRUMS</il>.</s></desc>"
        else if (clause[i + 2].isItem
            && !clause[i + 3].isItem && clause[i + 3].text.startsWith(", ") && clause[i + 3].text.includes(", and")) {
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
        if (clause[i + 2] && clause[i + 2].text.includes(", and ") && clause[i + 2].node === sentence.itemList.lastChild) {
            clause[i + 1].set(", ");
            return 8;
        }
        // BEFORE: "<desc><s>There are <il>SOCCER BALLS and BASEBALLS</il>.</s></desc>"
        // INSERT: "TENNIS BALL"
        // AFTER:  "<desc><s>There are <il><item>a TENNIS BALL</item>, SOCCER BALLS, and BASEBALLS</il>.</s></desc>"
        else if (clause[i + 2] && clause[i + 2].text.includes(" and ") && clause[i + 2].node === sentence.itemList.lastChild) {
            clause[i + 1].set(", ");
            clause[i + 2].set(clause[i + 2].text.replace(" and ", ", and "));
            return 9;
        }
        // BEFORE: "<desc><s>However, you do find <il>a wooden ruler</il>.</s></desc>"
        // INSERT: "KEYBOARD"
        // AFTER:  "<desc><s>However, you do find <il><item>a KEYBOARD</item> and a wooden ruler</il>.</s></desc>"
        else if (clause[i + 2] && !clause[i + 2].isItem && clause[i + 2].node === sentence.itemList.lastChild) {
            clause[i + 1].set(" and ");
            return 10;
        }
        // BEFORE: "<desc><s>Looking under the beds, you find <il></il>.</s></desc>"
        // INSERT: "BASKETBALL"
        // AFTER:  "<desc><s>Looking under the beds, you find <il><item>a BASKETBALL</item></il>.</s></desc>"
        else if (clause[i + 1].node === sentence.itemList.lastChild) {
            clause[i + 1].set("");
            return 11;
        }
        else return 12;
    }
}

/**
 * @param {Sentence} sentence 
 * @param {number} i 
 * @returns {number} case - A number to indicate which condition was met for debugging purposes.
 */
function removeClause(sentence, i) {
    // This function removes an Item clause from a sentence.
    // In this function, sentence is the sentence containing mention of the item.
    // i is the index of the clause mentioning that item.
    const clause = sentence.clause;

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
                clause[i - 3].set(clause[i - 1].text.replace(",", " "));
                clause[i - 1].delete();
                return 1;
            }
            // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>3 bottles of ZZZQUIL</item></il>.</s></desc>"
            // REMOVE: "ZZZQUIL"
            // AFTER:  "<desc><s>On these shelves is <il><item>a bottle of PAINKILLERS</item></il>.</s></desc>"
            else {
                // If the clause before the item list has "are" and there's only going to be 1 item left with a quantity of 1 and there are no commas after "are", change "are" to "is".
                if (clause[i - 3].text.includes(" are ") && clause[i - 2].itemQuantity === 1 && clause[i - 3].text.substring(clause[i - 3].text.lastIndexOf(" are ")).split(',').length - 1 === 0)
                    clause[i - 3].set(clause[i - 3].text.substring(0, clause[i - 3].text.lastIndexOf(" are ")) + " is " + clause[i - 3].text.substring(clause[i - 3].text.lastIndexOf(" are ") + 5));
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

// The functions below are included to provide shorthand for using the finder module in descriptions.
function findRoom(name) {
    return finder.findRoom(name);
}
function findObject(name, location) {
    return finder.findObject(name, location);
}
function findPrefab(id) {
    return finder.findPrefab(id);
}
function findItem(identifier, location, containerName) {
    return finder.findItem(identifier, location, containerName);
}
function findPuzzle(name, location) {
    return finder.findPuzzle(name, location);
}
function findEvent(name) {
    return finder.findEvent(name);
}
function findStatusEffect(name) {
    return finder.findStatusEffect(name);
}
function findPlayer(name) {
    return finder.findPlayer(name);
}
function findLivingPlayer(name) {
    return finder.findLivingPlayer(name);
}
function findDeadPlayer(name) {
    return finder.findDeadPlayer(name);
}
function findInventoryItem(identifier, player, containerName, equipmentSlot) {
    return finder.findInventoryItem(identifier, player, containerName, equipmentSlot);
}
function findFlag(id, evaluate) {
    return finder.findFlag(id, evaluate);
}
