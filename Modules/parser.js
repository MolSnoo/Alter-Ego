const DOMParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;

class Clause {
    constructor(node, isItem, itemNo, itemQuantity) {
        this.node = node;
        this.text = this.node.data;
        this.isItem = isItem !== null && isItem !== undefined ? isItem : false;
        this.itemNo = itemNo !== null && itemNo !== undefined ? itemNo : NaN;
        this.itemQuantity = itemQuantity !== null && itemQuantity !== undefined ? itemQuantity : 0;
    }

    set(string) {
        this.node.data = string;
        this.text = this.node.data;
    }

    delete() {
        if (this.node) {
            let parentNode = this.node.parentNode;
            parentNode.removeChild(this.node);
            // If this is an item clause, then the parent node is an item tag. Delete the now empty item tag.
            if (this.isItem) parentNode.parentNode.removeChild(parentNode);
            // If this item is contained in an if tag, remove the if tag.
            if (parentNode.parentNode.nodeName === 'if') parentNode.parentNode.parentNode.removeChild(parentNode.parentNode);
            this.node = null;
        }
        this.text = "";
    }
}

class Sentence {
    constructor(clause, itemCount, itemList, itemListName) {
        this.clause = clause;
        this.itemCount = itemCount;
        this.itemList = itemList;
        this.itemListName = itemListName;
    }
}

class Item {
    constructor(name, quantity, singleContainingPhrase, pluralContainingPhrase) {
        this.name = name;
        this.pluralName = pluralContainingPhrase;
        this.quantity = quantity;
        this.singleContainingPhrase = singleContainingPhrase;
        this.pluralContainingPhrase = pluralContainingPhrase;
    }
}

module.exports.parseDescription = function (description, container, player, doErrorChecking) {
    // First, split the description into a DOMParser document.
    var document = createDocument(description);
    // Check for any warnings and errors. If they exist, store them.
    var warnings = [];
    var errors = [];
    if (document.warnings.length !== 0) warnings = document.warnings;
    if (document.errors.length !== 0) errors = document.errors;
    // Now we just need the document.
    document = document.document;

    // Include game data for variable functionality.
    var game = include('game.json');
    // Find any conditionals.
    var conditionals = document.getElementsByTagName('if');
    let conditionalsToRemove = [];
    for (let i = 0; i < conditionals.length; i++) {
        let conditional = conditionals[i].getAttribute('cond');
        if (conditional !== null && conditional !== undefined) {
            conditional = conditional.replace(/this/g, "container");
            if (eval(conditional) === false)
                conditionalsToRemove.push(conditionals[i]);
        }
    }
    for (let i = 0; i < conditionalsToRemove.length; i++) {
        if (conditionalsToRemove[i].childNodes[0].tagName === 'item') {
            let itemElement = conditionalsToRemove[i].childNodes[0].childNodes[0];
            let item = new Item("", 0, itemElement.data, itemElement.data);
            document = this.removeItem(description, item, "", document);
        }
        else if (conditionalsToRemove[i].parentNode) conditionalsToRemove[i].parentNode.removeChild(conditionalsToRemove[i]);
        else document.removeChild(conditionalsToRemove[i]);
    }

    // Check if there's an item list in the document.
    var itemListSentences = getItemListSentences(document);
    if (itemListSentences.length > 0) {
        for (let i = 0; i < itemListSentences.length; i++) {
            const sentence = itemListSentences[i];
            var itemList = sentence.getElementsByTagName('il').item(0);
            // If the item list is empty, remove the sentence from the document.
            if (itemList.childNodes.length === 0 || itemList.childNodes.length === 1 && itemList.childNodes.item(0).tagName && itemList.childNodes.item(0).tagName === 'null') {
                if (sentence.parentNode) sentence.parentNode.removeChild(sentence);
                else document.removeChild(sentence);
            }
        }
    }

    // Replace any var tags.
    var variables = document.getElementsByTagName('var');
    var variableStrings = [];
    for (let i = 0; i < variables.length; i++) {
        let varAttribute = variables[i].getAttribute('v');
        if (varAttribute !== null && varAttribute !== undefined) {
            varAttribute = varAttribute.replace(/this/g, "container");
            try {
                let variableText = eval(varAttribute);
                if (variableText === undefined || variableText === "undefined")
                    errors.push('"' + varAttribute.replace(/container/g, "this") + '" is undefined.');
                variableStrings.push({ element: variables[i], attribute: variableText });
            } catch (err) {
                    errors.push(err);
            }
            if (typeof variableStrings[variableStrings.length - 1].attribute === 'string' && variableStrings[variableStrings.length - 1].attribute.includes('<desc>'))
                variableStrings[variableStrings.length - 1].attribute = this.parseDescription(variableStrings[variableStrings.length - 1].attribute, this, player);
        }
    }
    for (let i = 0; i < variableStrings.length; i++) {
        let newNode = document.createTextNode(variableStrings[i].attribute);
        variableStrings[i].element.parentNode.replaceChild(newNode, variableStrings[i].element);
    }

    // Convert the document to a string.
    var newDescription = stringify(document);
    // Strip XML tags from the string, as well as all duplicate spaces.
    newDescription = newDescription.replace(/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g, '').replace(/&amp;/g, '&').trim();

    if (doErrorChecking === null || doErrorChecking === undefined)
        doErrorChecking = false;

    if (doErrorChecking)
        return { text: newDescription, warnings: warnings, errors: errors };
    else
        return newDescription;
};

module.exports.addItem = function (description, item, slot) {
    // First, split the description into a DOMParser document.
    var document = createDocument(description).document;

    // Parse all of the sentences.
    var sentenceElements = document.getElementsByTagName('s');
    var sentences = new Array();
    for (let i = 0; i < sentenceElements.length; i++)
        sentences.push(createSentence(sentenceElements[i]));

    var itemAlreadyExists = false;
    for (let j = 0; j < sentences.length; j++) {
        var sentence = sentences[j];
        // Determine if the item is already mentioned in the sentence.
        var i;
        for (i = 0; i < sentence.clause.length; i++) {
            var text = sentence.clause[i].node.data.toLowerCase();
            if (text.includes(item.singleContainingPhrase.toLowerCase())
                || item.pluralContainingPhrase && text.includes(item.pluralContainingPhrase.toLowerCase())
                || text.includes(item.name.toLowerCase())
                || item.pluralName && text.includes(item.pluralName.toLowerCase())) {
                itemAlreadyExists = true;
                break;
            }
        }
        if (itemAlreadyExists) break;
    }

    // This item already exists within the description.
    if (itemAlreadyExists && sentence.clause[i].isItem) {
        // If there's only 1 of this item, we need only use the plural containing phrase.
        if (sentence.clause[i].itemQuantity === 1) {
            if ("AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz".includes(sentence.clause[i].text.charAt(sentence.clause[i].text.length - 1)))
                sentence.clause[i].set(`2 ${item.pluralContainingPhrase}`);
            else
                sentence.clause[i].set(`2 ${item.pluralContainingPhrase + sentence.clause[i].text.charAt(sentence.clause[i].text.length - 1)}`);
        }
        else {
            let start = sentence.clause[i].text.search(/\d/);
            if (start !== -1) {
                let end;
                for (end = start; end < text.length; end++) {
                    if (isNaN(text.charAt(end + 1)))
                        break;
                }
                const quantity = parseInt(text.substring(start, end));
                sentence.clause[i].set(sentence.clause[i].text.replace(quantity, quantity + 1));
            }
        }
    }
    // The sentence doesn't already contain this item.
    else if (!itemAlreadyExists) {
        if (slot === null || slot === undefined) slot = "";
        // We need to find the location of the beginning of the item list.
        var containsItemList = false;
        for (i = 0; i < sentences.length; i++) {
            if (sentences[i].itemList !== null && sentences[i].itemListName === slot) {
                containsItemList = true;
                break;
            }
        }

        // Add the clause to the sentence.
        if (containsItemList) {
            let result = addClause(sentences[i], item.singleContainingPhrase);
            //console.log(result);
        }
    }

    return stringify(document);
};

module.exports.removeItem = function (description, item, slot, document) {
    var returnDocument = false;
    if (document)
        returnDocument = true;
    else {
        // First, split the description into a DOMParser document.
        document = createDocument(description).document;
    }

    // Parse all of the sentences.
    var sentenceElements = document.getElementsByTagName('s');
    var sentences = new Array();
    for (let i = 0; i < sentenceElements.length; i++)
        sentences.push(createSentence(sentenceElements[i]));

    var removeItem = false;
    for (let j = 0; j < sentences.length; j++) {
        var sentence = sentences[j];
        if ((slot === null || slot === undefined || slot === "") && sentence.itemListName === ""
            || slot !== null && slot !== undefined && slot !== "" && sentence.itemListName === "" && description.split("<il").length - 1 < 2
            || sentence.itemListName === slot) {
            // Determine if an item needs to be removed from the sentence.
            var i;
            for (i = 0; i < sentence.clause.length; i++) {
                if (sentence.clause[i].isItem) {
                    var text = sentence.clause[i].node.data.toLowerCase();
                    if (text.includes(item.singleContainingPhrase.toLowerCase())
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
        // First make sure there aren't multiple of that item.
        if (item.quantity > 0) {
            if (item.quantity === 1)
                sentence.clause[i].set(item.singleContainingPhrase);
            else {
                let start = text.search(/\d/);
                if (start !== -1) {
                    let end;
                    for (end = start; end < text.length; end++) {
                        if (isNaN(text.charAt(end + 1)))
                            break;
                    }
                    const quantity = parseInt(text.substring(start, end));
                    sentence.clause[i].set(sentence.clause[i].text.replace(quantity, quantity - 1));
                }
            }
        }

        // Remove the item from the sentence.
        else {
            let result = removeClause(sentence, i);
            //console.log(result);
        }
    }

    if (returnDocument) return document;
    else return stringify(document);
};

function createDocument(description) {
    // Ensure the description is suitable to be parsed as a DOM tree.
    //if (!description.startsWith("<desc>")) description = "<desc>" + description;
    //if (!description.endsWith("</desc>")) description += "</desc>";
    description = description.replace(/<il><\/il>/g, "<il><null /></il>");

    var warnings = [];
    var errors = [];
    var document = new DOMParser({
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

function createSentence(sentenceNode) {
    var clauses = new Array();
    parseNodes(clauses, sentenceNode);
    var itemCount = 0;
    for (let i = 0; i < clauses.length; i++) {
        if (clauses[i].node.parentNode.tagName === 'item') {
            clauses[i].isItem = true;
            itemCount++;
            clauses[i].itemNo = itemCount;
            // Get item quantity.
            let text = clauses[i].node.data;
            let start = text.search(/\d/);
            if (start !== -1) {
                let end;
                for (end = start; end < text.length; end++) {
                    if (isNaN(text.charAt(end + 1)))
                        break;
                }
                const quantity = parseInt(text.substring(start, end));
                clauses[i].itemQuantity = quantity;
            }
            else clauses[i].itemQuantity = 1;
        }
    }
    var itemList = null;
    var itemListName = "";
    let itemLists = sentenceNode.getElementsByTagName('il');
    if (itemLists.length > 0) {
        itemList = itemLists[0];
        itemListName = itemList.getAttribute('name');
    }

    let sentence = new Sentence(clauses, itemCount, itemList, itemListName);
    return sentence;
}

function parseNodes(clauses, node) {
    for (let i = 0; i < node.childNodes.length; i++) {
        if (node.childNodes[i].data)
            clauses.push(new Clause(node.childNodes[i]));
        else if (node.childNodes[i].tagName)
            parseNodes(clauses, node.childNodes[i]);
    }
    return clauses;
}

function getItemListSentences(document) {
    // Get a list of sentences in the document.
    var sentences = document.getElementsByTagName('s');
    // Find the sentence containing an item list, if there is one.
    var itemListSentences = [];
    for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].getElementsByTagName('il').length > 0)
            itemListSentences.push(sentences[i]);
    }

    return itemListSentences;
}

function stringify(document) {
    var description = new XMLSerializer().serializeToString(document);
    description = description.replace(/<il\/>/g, "<il></il>").replace(/(<(il)\s[^>]+?)\/>/g, "$1></$2>").replace(/<s\/>/g, "").replace(/<null\/>/g, "").replace(/<\/s> <\/desc>/g, "</s></desc>").replace(/ {2,}/g, " ").trim();
    return description;
}

function initializeNewClause(sentence, phrase) {
    var document = sentence.itemList.ownerDocument;
    let firstChild = sentence.itemList.firstChild;
    if (firstChild === null || firstChild === undefined)
        firstChild = sentence.itemList.nextSibling;
    else if (firstChild.tagName === 'null') {
        firstChild.parentNode.removeChild(firstChild);
        firstChild = sentence.itemList.nextSibling;
    }
    while (!firstChild.data)
        firstChild = firstChild.firstChild;
    var i;
    for (i = 0; i < sentence.clause.length; i++) {
        if (sentence.clause[i].text === firstChild.data)
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

    return i;
}

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
        if (clause[i + 2].text.includes(", and ") && clause[i + 2].node === sentence.itemList.lastChild) {
            clause[i + 1].set(", ");
            return 8;
        }
        // BEFORE: "<desc><s>There are <il>SOCCER BALLS and BASEBALLS</il>.</s></desc>"
        // INSERT: "TENNIS BALL"
        // AFTER:  "<desc><s>There are <il><item>a TENNIS BALL</item>, SOCCER BALLS, and BASEBALLS</il>.</s></desc>"
        else if (clause[i + 2].text.includes(" and ") && clause[i + 2].node === sentence.itemList.lastChild) {
            clause[i + 1].set(", ");
            clause[i + 2].set(clause[i + 2].text.replace(" and ", ", and "));
            return 9;
        }
        // BEFORE: "<desc><s>However, you do find <il>a wooden ruler</il>.</s></desc>"
        // INSERT: "KEYBOARD"
        // AFTER:  "<desc><s>However, you do find <il><item>a KEYBOARD</item> and a wooden ruler</il>.</s></desc>"
        else if (!clause[i + 2].isItem && clause[i + 2].node === sentence.itemList.lastChild) {
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

function removeClause(sentence, i) {
    // This function removes an Item clause from a sentence.
    // In this function, sentence is the sentence containing mention of the item.
    // i is the index of the clause mentioning that item.
    const clause = sentence.clause;

    // BEFORE: "<desc><s><il><item>On one of the desks is a FIRST AID KIT</item> and <item>hung on the wall behind the desks is a MEDICINE CABINET</item></il>.</s></desc>"
    // REMOVE: "FIRST AID KIT"
    // AFTER:  "<desc><s><il><item>Hung on the wall behind the desks is a MEDICINE CABINET</item></il>.</s></desc>"
    if (i === 0
        && clause[i + 1] && clause[i + 2]
        && clause[i + 1].text === "and" && clause[i + 2].isItem) {
        clause[i].delete();
        clause[i + 1].delete();
        // Capitalize the first letter of the next item clause.
        clause[i + 2].set(clause[i + 2].text.substring(0, 1).toUpperCase() + clause[i + 2].text.substring(1));
        return 0;
    }

    else if (sentence.itemCount > 1) {
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
                return 1;
            }
            // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il>.</s></desc>"
            // REMOVE: "LAXATIVES"
            // AFTER:  "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>3 bottles of ZZZQUIL</item></il>.</s></desc>"
            else if (sentence.itemCount === 3) {
                clause[i - 3].set(clause[i - 1].text.replace(",", " "));
                clause[i - 1].delete();
                return 2;
            }
            // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>3 bottles of ZZZQUIL</item></il>.</s></desc>"
            // REMOVE: "ZZZQUIL"
            // AFTER:  "<desc><s>On these shelves is <il><item>a bottle of PAINKILLERS</item></il>.</s></desc>"
            else {
                // If the clause before the item list has "are" and there's only going to be 1 item left with a quantity of 1 and there are no commas after "are", change "are" to "is".
                if (clause[i - 3].text.includes(" are ") && clause[i - 2].itemQuantity === 1 && clause[i - 3].text.substring(clause[i - 3].text.lastIndexOf(" are ")).split(',').length - 1 === 0)
                    clause[i - 3].set(clause[i - 3].text.substring(0, clause[i - 3].text.lastIndexOf(" are ")) + " is " + clause[i - 3].text.substring(clause[i - 3].text.lastIndexOf(" are ") + 5));
                clause[i - 1].delete();
                return 3;
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
                return 4;
            }
            // BEFORE: "<desc><s><il><item>A bottle of PAINKILLERS</item>, <item>a bottle of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il> are on these shelves.</s></desc>"
            // REMOVE: "PAINKILLERS"
            // AFTER:  "<desc><s><il><item>A bottle of ZZZQUIL</item> and <item>a bottle of LAXATIVES</item></il> are on these shelves.</s></desc>"
            else if (clause[i + 1].text.startsWith(", ") && clause[i + 3].text.startsWith(", and ")) {
                clause[i + 1].delete();
                clause[i + 2].set(clause[i + 2].text.charAt(0).toUpperCase() + clause[i + 2].text.substring(1));
                clause[i + 3].set(clause[i + 3].text.replace(", and ", " and "));
                return 5;
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
                return 6;
            }
            // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of LAXATIVES</item></il>.</s></desc>"
            // REMOVE: "ZZZQUIL"
            // AFTER:  "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item> and <item>a bottle of LAXATIVES</item></il>.</s></desc>"
            else if (sentence.itemCount === 3) {
                clause[i + 1].delete();
                clause[i - 1].set(" and ");
                return 7;
            }
            // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
            // REMOVE: "LAXATIVES":
            // AFTER:  "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
            else if (sentence.itemCount > 3) {
                clause[i - 1].delete();
                return 8;
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
            return 9;
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
            return 10;
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
            return 11;
        }
        // BEFORE: "<desc><s>However, you do find <il><item>a MOUSE</item>, a wooden ruler, and <item>a KEYBOARD</item></il>.</s></desc>"
        // REMOVE: "MOUSE"
        // AFTER:  "<desc><s>However, you do find <il>a wooden ruler and <item>a KEYBOARD</item></il>.</s></desc>"
        else if (sentence.itemCount === 2
            && clause[i + 1] && !clause[i + 1].isItem && clause[i + 1].text.startsWith(", ") && clause[i + 1].text.endsWith(", and ")
            && clause[i + 2] && clause[i + 2].isItem) {
            clause[i].delete();
            clause[i + 1].set(clause[i + 1].text.replace(", ", "").replace(", and ", " and "));
            return 12;
        }
        // BEFORE: "<desc><s>However, you do find <il><item>a MOUSE</item>, a wooden ruler, and <item>a KEYBOARD</item></il>.</s></desc>"
        // REMOVE: "KEYBOARD"
        // AFTER:  "<desc><s>However, you do find <il><item>a MOUSE</item> and a wooden ruler</il>.</s></desc>"
        else if (clause[i - 1] && !clause[i - 1].isItem && clause[i - 1].text.startsWith(", ") && clause[i - 1].text.endsWith(", and ")
            && clause[i - 2] && clause[i - 2].isItem) {
            clause[i].delete();
            clause[i - 1].set(clause[i - 1].text.replace(", ", " and ").replace(", and ", ""));
            return 13;
        }
        // BEFORE: "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, <item>a bottle of LAXATIVES</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
        // REMOVE: "LAXATIVES":
        // AFTER:  "<desc><s>On these shelves are <il><item>a bottle of PAINKILLERS</item>, <item>3 bottles of ZZZQUIL</item>, and <item>a bottle of ISOPROPYL ALCOHOL</item></il>.</s></desc>"
        else if (sentence.itemCount >= 3 && clause[i].itemNo === sentence.itemCount && clause[i + 1] && clause[i + 1].text.startsWith(", and ")) {
            clause[i].delete();
            clause[i - 1].delete();
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
    // BEFORE: "<desc><s><il><item>On one of the desks is a FIRST AID KIT</item> and hung on the wall behind the desks is a MEDICINE CABINET</il>.</s></desc>"
    // REMOVE: "FIRST AID KIT"
    // AFTER:  "<desc><s><il>Hung on the wall behind the desks is a MEDICINE CABINET</il>.</s></desc>"
    else if (!clause[i - 1] && clause[i + 1] && clause[i + 1].text.startsWith(" and ")) {
        clause[i].delete();
        clause[i + 1].set(clause[i + 1].text.replace(" and ", ""));
        clause[i + 1].set(clause[i + 1].text.charAt(0).toUpperCase() + clause[i + 1].text.substring(1));
        return 18;
    }
    // BEFORE: "<desc><s>However, you do find <il><item>a KEYBOARD</item> and a wooden ruler</il>.</s></desc>"
    // REMOVE: "KEYBOARD"
    // AFTER:  "<desc><s>However, you do find <il>a wooden ruler</il>.</s></desc>"
    else if (clause[i + 1] && clause[i + 1].text.startsWith(" and ")) {
        clause[i].delete();
        clause[i + 1].set(clause[i + 1].text.replace(" and ", ""));
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
