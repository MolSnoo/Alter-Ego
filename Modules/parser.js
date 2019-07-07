const DOMParser = require('xmldom').DOMParser;
const XMLSerializer = require('xmldom').XMLSerializer;

class Clause {
    constructor(node) {
        this.node = node;
        this.text = this.node.data;
        this.isItem = false;
        this.itemNo = NaN;
        this.itemQuantity = 0;
    }

    set(string) {
        this.node.data = string;
        this.text = this.node.data;
    }

    delete() {
        let parentNode = this.node.parentNode;
        parentNode.removeChild(this.node);
        // If this is an item clause, then the parent node is an item tag. Delete the now empty item tag.
        if (this.isItem) parentNode.parentNode.removeChild(parentNode);
        this.node = null;
        this.text = "";
    }
}

class OldClause {
    constructor(text, isItem, itemNo, itemQuantity) {
        this.text = text;
        this.isItem = isItem;
        this.itemNo = itemNo;
        this.itemQuantity = itemQuantity;
    }
}

class Sentence {
    constructor(clause, itemCount) {
        this.clause = clause;
        this.itemCount = itemCount;
    }
}

class OldSentence {
    constructor(clause, itemContainer, itemCount) {
        this.clause = clause;
        this.itemContainer = itemContainer;
        this.itemCount = itemCount;
    }
}

module.exports.testParser = function (description) {
    var sentences = parseText(description);
    return assembleSentences(sentences, true);
};

module.exports.parseDescription = function (description, player) {
    // First, split the description into a DOMParser document.
    var document = createDocument(description);

    // Check if there's an item list in the document.
    var sentence = getItemListSentence(document);
    if (sentence !== null) {
        var itemList = sentence.getElementsByTagName('il').item(0);
        // If the item list is empty, remove the sentence from the document.
        if (itemList.childNodes.length === 1 && itemList.childNodes.item(0).tagName && itemList.childNodes.item(0).tagName === 'null') {
            if (sentence.parentNode) sentence.parentNode.removeChild(sentence);
            else document.removeChild(sentence);
        }
    }

    // Find any conditionals.
    var conditionals = document.getElementsByTagName('if');
    for (let i = 0; i < conditionals.length; i++) {
        let removeConditional = true;
        let conditional = conditionals[i].getAttribute('cond');
        if (conditional !== null && conditional !== undefined) {
            if (eval(conditional) === true)
                removeConditional = false;
        }
        if (removeConditional) {
            if (conditionals[i].parentNode) conditionals[i].parentNode.removeChild(conditionals[i]);
            else document.removeChild(conditionals[i]);
        }
    }

    // Convert the document to a string.
    var newDescription = stringify(document);
    // Strip XML tags from the string, as well as all duplicate spaces.
    newDescription = newDescription.replace(/<\/?\w+((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>/g, '').trim();

    return newDescription;
};

module.exports.addItem = function (description, item) {
    var sentences = parseText(description);

    // Determine if the item is already mentioned in the sentence.
    var itemAlreadyExists = false;
    var i;
    var j;
    for (i = 0; i < sentences.length; i++) {
        for (j = 0; j < sentences[i].clause.length; j++) {
            if (sentences[i].clause[j].text.includes(item.name)
                || (item.pluralName !== "" && sentences[i].clause[j].text.includes(item.pluralName))) {
                itemAlreadyExists = true;
                break;
            }
        }
        if (itemAlreadyExists) break;
    }

    // This item already exists within the description.
    if (itemAlreadyExists && sentences[i].clause[j].isItem) {
        // If there's only 1 of this item, we need only use the plural containing phrase.
        if (sentences[i].clause[j].itemQuantity === 1) {
            if ("AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz".includes(sentences[i].clause[j].text.charAt(sentences[i].clause[j].text.length - 1)))
                sentences[i].clause[j].text = "2 " + item.pluralContainingPhrase;
            else
                sentences[i].clause[j].text = "2 " + item.pluralContainingPhrase + sentences[i].clause[j].text.charAt(sentences[i].clause[j].text.length - 1);
        }
        else {
            var start = sentences[i].clause[j].text.search(/\d/);
            if (start !== -1) {
                var end;
                for (end = start; end < sentences[i].clause[j].text.length; end++) {
                    if (isNaN(sentences[i].clause[j].text.charAt(end + 1)))
                        break;
                }
                const quantity = parseInt(sentences[i].clause[j].text.substring(start, end));
                sentences[i].clause[j].text = sentences[i].clause[j].text.replace(quantity, quantity + 1);
            }
        }
    }

    // The sentence doesn't already contain this item.
    else if (!itemAlreadyExists) {
        // We need to find the location of the beginning of the item list.
        var containsItemList = false;
        for (i = 0; i < sentences.length; i++) {
            for (j = 0; j < sentences[i].clause.length; j++) {
                if (sentences[i].clause[j].text === "<") {
                    containsItemList = true;
                    break;
                }
            }
            if (containsItemList) break;
        }

        // Add the clause to the sentence.
        if (containsItemList) {
            const clause = new Clause(item.singleContainingPhrase, true, 0, 1);
            sentences[i] = addClause(sentences[i], clause, j);
        }
    }

    // If we're adding an item to the formatted description, then we're going to be uploading the parsed version too.
    // It would be a waste to have to disassemble it again, so we'll return both versions.
    const descriptions = [assembleSentences(sentences, true), assembleSentences(sentences, false).replace(/{/g, '').replace(/}/g, '').replace(/</g, '').replace(/>/g, '')];
    return descriptions;
};

module.exports.removeItem = function (description, item) {
    // First, split the description into a DOMParser document.
    var document = createDocument(description);
    
    // Check if there's an item list in the document.
    var sentenceNode = getItemListSentence(document);
    if (sentenceNode !== null) {
        var sentence = createSentence(sentenceNode);

        // Determine if an item needs to be removed from the sentence.
        var removeItem = false;
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

        if (removeItem) {
            // First make sure there aren't multiple of that item.
            if (item.quantity > 0) {
                if (item.quantity === 1)
                    sentence.clause[i].node.data = item.singleContainingPhrase;
                else {
                    let start = text.search(/\d/);
                    if (start !== -1) {
                        let end;
                        for (end = start; end < text.length; end++) {
                            if (isNaN(text.charAt(end + 1)))
                                break;
                        }
                        const quantity = parseInt(text.substring(start, end));
                        sentence.clause[i].node.data = sentence.clause[i].node.data.replace(quantity, quantity - 1);
                    }
                }
            }

            // Remove the item from the sentence.
            else {
                let result = removeClause(sentence, i);
                //console.log(result);
            }
        }
    }

    return stringify(document).replace(/<il\/>/g, "<il></il>");
};

module.exports.convert = function (description) {
    var sentences = parseText(description);
    var newDescription = "<desc>";
    for (let i = 0; i < sentences.length; i++) {
        let sentence = "<s>";
        for (let j = 0; j < sentences[i].clause.length; j++) {
            let clause = sentences[i].clause;
            if (clause[j].text === "<")
                sentence += " <il>";
            else if (clause[j].text === ">" && j === clause.length - 1)
                sentence += "</il>";
            else if (clause[j].isItem) {
                if (clause[j - 1] && clause[j - 1].text !== "<")
                    sentence += " ";
                if (clause[j].text.endsWith(",")) {
                    //clause.splice(j + 1, 0, new OldClause(", ", false, NaN, 0));
                    sentence += `<item>${clause[j].text.substring(0, clause[j].text.length - 1)}</item>, `;
                }
                else if (clause[j].text.endsWith(".")) {
                    clause.splice(j + 1, 0, new OldClause(".", false, NaN, 0));
                    sentence += `<item>${clause[j].text.substring(0, clause[j].text.length - 1)}</item>`;
                }
                else
                    sentence += `<item>${clause[j].text}</item>`;
            }     
            else if (clause[j].text === ">")
                sentence += "</il> ";
            else
                sentence += `${clause[j].text}`;
        }
        sentence += "</s> ";
        newDescription += sentence;
    }
    newDescription = newDescription.replace(/\.<\/il>/g, "</il>.").replace(/ {2,}/g, " ").trim();
    newDescription += "</desc>";
    return newDescription;
};

function createDocument(description) {
    // Ensure the description is suitable to be parsed as a DOM tree.
    if (!description.startsWith("<desc>")) description = "<desc>" + description;
    if (!description.endsWith("</desc>")) description += "</desc>";
    description = description.replace(/<il><\/il>/g, "<il><null /></il>");

    return new DOMParser().parseFromString(description, 'text/xml');
}

function createSentence(sentenceNode) {
    var clauses = new Array();
    searchNodes(clauses, sentenceNode);
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
    let sentence = new Sentence(clauses, itemCount);
    return sentence;
}

function searchNodes(clauses, node) {
    for (let i = 0; i < node.childNodes.length; i++) {
        if (node.childNodes[i].data)
            clauses.push(new Clause(node.childNodes[i]));
        else if (node.childNodes[i].tagName)
            searchNodes(clauses, node.childNodes[i]);
    }
    return clauses;
}

function getItemListSentence(document) {
    // Get a list of sentences in the document.
    var sentences = document.getElementsByTagName('s');
    // Find the sentence containing an item list, if there is one.
    var sentence = null;
    for (let i = 0; i < sentences.length; i++) {
        if (sentences[i].getElementsByTagName('il').length > 0) {
            sentence = sentences[i];
            break;
        }
    }

    return sentence;
}

function stringify(document) {
    var description = new XMLSerializer().serializeToString(document);
    description = description.replace(/ {2,}/g, ' ').trim();

    return description;
}

function parseText(description) {
    // This function disassembles a description into sentences, which are themselves divided into clauses.
    // Text enclosed in {} braces become Item clauses.
    // Text enclosed in <> angle brackets become a list of Item clauses.
    // During disassembly, {} braces will be removed from the sentence and all clauses, while <> angle brackets will become their own clauses which surround a sequence of Item clauses.
    var sentences = new Array();
    var start = 0;
    var end = 0;
    var newSentence = false;
    var itemListStarted = false;
    for (var i = 0; i < description.length; i++) {
        var clauses = new Array();
        while (!newSentence) {
            if (description.charAt(i) === '<') {
                end = i;
                clauses.push(new OldClause(description.substring(start, end).trim(), false));

                start = i;
                end = i + 1;
                clauses.push(new OldClause(description.substring(start, end).trim(), false));
                start = i + 1;
                itemListStarted = true;
            }
            else if (description.charAt(i) === '{') {
                end = i;
                i++;
                clauses.push(new OldClause(description.substring(start, end).trim(), false));
                start = i;
            }
            else if (description.charAt(i) === '}') {
                end = i;
                clauses.push(new OldClause(description.substring(start, end).trim(), true));
                start = i + 1;
                if (description.charAt(i + 1) === '>' && (description.charAt(i - 1) === '.' || description.charAt(i - 1) === '!' || description.charAt(i - 1) === '?')) {
                    end = i + 2;
                    clauses.push(new OldClause(description.substring(start, end).trim(), false));
                    start = i + 2;
                    newSentence = true;
                }
                else if (description.charAt(i - 1) === '.' || description.charAt(i - 1) === '!' || description.charAt(i - 1) === '?') {
                    end = i + 1;
                    clauses.push(new OldClause(description.substring(start, end).trim(), true));
                    start = i + 1;
                    newSentence = true;
                }
            }
            else if (description.charAt(i) === '>' && itemListStarted) {
                end = i;
                clauses.push(new OldClause(description.substring(start, end).trim(), false));

                start = i;
                end = i + 1;
                clauses.push(new OldClause(description.substring(start, end).trim(), false));
                start = i + 1;
                if (description.charAt(i - 1) === '.' || description.charAt(i - 1) === '!' || description.charAt(i - 1) === '?')
                    newSentence = true;
            }
            else if ((description.charAt(i) === '.' || description.charAt(i) === '!' || description.charAt(i) === '?')
                && (description.charAt(i + 1) !== '.')
                && (description.charAt(i + 1) !== '!')
                && (description.charAt(i + 1) !== '?')
                && (description.charAt(i + 1) !== '}')
                && (description.charAt(i + 1) !== '>')
                && (description.charAt(i + 1) !== '"')
                && (!("AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789").includes(description.charAt(i + 1)))) {
                end = i + 1;
                clauses.push(new OldClause(description.substring(start, end).trim(), false));
                start = i + 1;
                newSentence = true;
            }

            if (i === description.length - 1) {
                clauses.push(new OldClause(description.substring(start, description.length).trim(), false));
            }

            if (i >= description.length) {
                break;
            }

            i++;
        }
        // Form clauses together to make a sentence. This will be passed into the parser function.
        clauses = clauses.filter(element => (element.text !== "" && element.text !== " "));

        var itemContainer = false;
        var itemCount = 0;
        for (var j = 0; j < clauses.length; j++) {
            if (clauses[j].text === '<' || clauses[j].text === '>')
                itemContainer = true;
            else if (clauses[j].isItem) {
                itemCount++;
                clauses[j].itemNo = itemCount;

                var numStart = clauses[j].text.search(/\d/);
                if (numStart !== -1) {
                    var numEnd;
                    for (numEnd = numStart; numEnd < clauses[j].text.length; numEnd++) {
                        if (isNaN(clauses[j].text.charAt(numEnd + 1)))
                            break;
                    }
                    const quantity = parseInt(clauses[j].text.substring(numStart, numEnd));
                    clauses[j].itemQuantity = quantity;
                }
                else clauses[j].itemQuantity = 1;
            }
        }
        sentences.push(new OldSentence(clauses, itemContainer, itemCount));
        //console.log(sentences[sentences.length - 1]);
        newSentence = false;
    }

    return sentences;
}

function assembleSentences(sentences, includeEmptyItemLists) {
    // This function reassembles all of the sentences into a description.
    // In this function, sentences is the array of all sentence.
    // If includeEmptyItemLists is true, then sentences which contain empty item lists will be retained. This should always be true when the return value will be uploaded to the sheet.
    // If includeEmptyItemLists is false, then sentences which contain empty item lists will be removed. This should only be done when sending a description to a player.
    var newDescription = "";
    for (i = 0; i < sentences.length; i++) {
        sentences[i].clause = sentences[i].clause.filter(clause => (clause.text !== "" && clause.text !== " "));
        var sentence = "";

        var j = 0;
        while (sentences[i].clause[j] !== undefined) {
            if (!includeEmptyItemLists) {
                if ((sentences[i].clause[j].text === '<')
                    && (sentences[i].clause[j + 1].text === '' || sentences[i].clause[j + 1].text === ' ' || sentences[i].clause[j + 1].text === '.')
                    && (sentences[i].clause[j + 2].text === '>')) {
                    sentence = "";
                    break;
                }
                else if (sentences[i].clause[j].text === '<' && sentences[i].clause[j + 1].text === '>') {
                    sentence = "";
                    break;
                }
            }

            if (sentences[i].clause[j].isItem) {
                if (sentences[i].clause[j - 1] && sentences[i].clause[j - 1].text === '<')
                    sentence = sentence + "{" + sentences[i].clause[j].text + "}";
                else
                    sentence = sentence + " {" + sentences[i].clause[j].text + "}";
            }
            else if (sentences[i].clause[j - 1] && sentences[i].clause[j - 1].text === '<')
                sentence = sentence + sentences[i].clause[j].text;
            else if (sentences[i].clause[j].text === '>')
                sentence = sentence + sentences[i].clause[j].text;
            else
                sentence = sentence + " " + sentences[i].clause[j].text;
            j++;
        }
        newDescription = newDescription + sentence;
    }
    newDescription = newDescription.trim();

    return newDescription;
}

function addClause(sentence, itemClause, i) {
    // This function adds an Item clause to a sentence.
    // In this function, sentence is the sentence containing an Item list.
    // itemClause is the clause to be added.
    // i is the index of the opening "<" clause which marks the beginning of an Item list.
    const clause = sentence.clause;

    // If this is the beginning of the sentence, capitalize the first letter of the new clause.
    // Then, fix the capitalization of the next clause, if applicable.
    if (i === 0) {
        itemClause.text = itemClause.text.charAt(0).toUpperCase() + itemClause.text.substring(1);
        const capitals = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (capitals.includes(clause[i + 1].text.charAt(0)) && !capitals.includes(clause[i + 1].text.charAt(1)))
            clause[i + 1].text = clause[i + 1].text.charAt(0).toLowerCase() + clause[i + 1].text.substring(1);
    }

    // BEFORE: "On these shelves are <{3 bottles of ZZZQUIL,} {a bottle of LAXATIVES,} and {a bottle of ISOPROPYL ALCOHOL.}>"
    // ADD: "PAINKILLERS"
    // AFTER: "On these shelves are <{a bottle of PAINKILLERS,} {3 bottles of ZZZQUIL,} {a bottle of LAXATIVES,} and {a bottle of ISOPROPYL ALCOHOL.}>"
    if (sentence.itemCount >= 3) {
        itemClause.text += ',';
        clause.splice(i + 1, 0, itemClause);
        //clause.push(new Clause("1", false));
        return sentence;
    }
    else if (sentence.itemCount === 2) {
        // BEFORE: "On these shelves are <{a bottle of LAXATIVES} and {a bottle of ISOPROPYL ALCOHOL.}>"
        // ADD: "PAINKILLERS"
        // AFTER: "On these shelves are <{a bottle of PAINKILLERS,} {a bottle of LAXATIVES,} and {a bottle of ISOPROPYL ALCOHOL.}>"
        if (clause[i + 1].isItem && clause[i + 2].text === "and" && clause[i + 3].isItem) {
            itemClause.text += ',';
            clause[i + 1].text += ',';
            clause.splice(i + 1, 0, itemClause);
            //clause.push(new Clause("2", false));
            return sentence;
        }
        // BEFORE: "However, you do find <{a MOUSE,} a wooden ruler, and {a KEYBOARD.}>"
        // ADD: "FLASH DRIVE"
        // AFTER: "However, you do find <{a FLASH DRIVE,} {a MOUSE,} a wooden ruler, and {a KEYBOARD.}>"
        else {
            itemClause.text += ',';
            clause.splice(i + 1, 0, itemClause);
            //clause.push(new Clause("3", false));
            return sentence;
        }
    }
    else if (sentence.itemCount === 1) {
        // BEFORE: "On these shelves is <{a bottle of ISOPROPYL ALCOHOL.}>"
        // ADD: "PAINKILLERS"
        // AFTER: "On these shelves are <{a bottle of PAINKILLERS} and {a bottle of ISOPROPYL ALCOHOL.}>"
        if (clause[i + 1].isItem && clause[i + 2].text === ">") {
            if (clause[i - 1] && clause[i - 1].text.endsWith("is"))
                clause[i - 1].text = clause[i - 1].text.substring(0, clause[i - 1].text.length - 2) + "are";
            else if (clause[i + 3] && clause[i + 3].text.startsWith("is")) {
                clause[i + 3].text = "are" + clause[i + 3].text.substring(2);
            }
            clause.splice(i + 1, 0, new Clause("and", false));
            clause.splice(i + 1, 0, itemClause);
            //clause.push(new Clause("4", false));
            return sentence;
        }
        // BEFORE: "There are <{3 CLARINETS,} a PIANO, and some SNARE DRUMS.>"
        // ADD: "DRUM STICKS"
        // AFTER: "There are <{a set of DRUM STICKS,} {3 CLARINETS,} a PIANO, and some SNARE DRUMS.>"
        else if (clause[i + 1].isItem && clause[i + 1].text.endsWith(',')
            && !clause[i + 2].isItem && clause[i + 2].text.includes(", and")) {
            itemClause.text += ',';
            clause.splice(i + 1, 0, itemClause);
            //clause.push(new Clause("5", false));
            return sentence;
        }
        // BEFORE: "There are <{3 CLARINETS} and a PIANO.>"
        // ADD: "DRUM STICKS"
        // AFTER: "There are <{a set of DRUM STICKS,} {3 CLARINETS,} and a PIANO.>"
        else if (clause[i + 1].isItem && !clause[i + 1].text.endsWith(',')
            && !clause[i + 2].isItem && clause[i + 2].text.startsWith("and")) {
            itemClause.text += ',';
            clause[i + 1].text += ',';
            clause.splice(i + 1, 0, itemClause);
            //clause.push(new Clause("6", false));
            return sentence;
        }
        // BEFORE: "However, you do find <a wooden ruler and {a KEYBOARD.}>"
        // ADD: "MOUSE"
        // AFTER: "However, you do find <{a MOUSE,} a wooden ruler, and {a KEYBOARD.}>
        else if (!clause[i + 1].isItem && clause[i + 1].text.endsWith(" and") && clause[i + 2].isItem) {
            itemClause.text += ',';
            clause[i + 1].text = clause[i + 1].text.replace(" and", ", and");
            clause.splice(i + 1, 0, itemClause);
            //clause.push(new Clause("7", false));
            return sentence;
        }
    }
    else {
        // BEFORE: "There are <BASKETBALLS, SOCCER BALLS, and BASEBALLS.>"
        // ADD: "TENNIS BALL"
        // AFTER: "There are <{a TENNIS BALL,} BASKETBALLS, SOCCER BALLS, and BASEBALLS.>"
        if (clause[i + 1].text.includes(", and ") && clause[i + 2].text === ">") {
            itemClause.text += ",";
            clause.splice(i + 1, 0, itemClause);
            //clause.push(new Clause("8", false));
            return sentence;
        }
        // BEFORE: "There are <SOCCER BALLS and BASEBALLS.>"
        // ADD: "TENNIS BALL"
        // AFTER: "There are <{a TENNIS BALL,} SOCCER BALLS, and BASEBALLS.>"
        else if (clause[i + 1].text.includes(" and ") && clause[i + 2].text === ">") {
            itemClause.text += ",";
            clause[i + 1].text = clause[i + 1].text.replace(" and ", ", and ");
            clause.splice(i + 1, 0, itemClause);
            //clause.push(new Clause("9", false));
            return sentence;
        }
        // BEFORE: "Looking under the beds, you find <.>"
        // ADD: "BASKETBALL"
        // AFTER: "Looking under the beds, you find <{a BASKETBALL.}>"
        else if (clause[i + 1].text === ".") {
            itemClause.text += ".";
            clause[i + 1] = itemClause;
            //clause.push(new Clause("10", false));
            return sentence;
        }
        // BEFORE: "However, you do find <a wooden ruler.>"
        // ADD: "KEYBOARD"
        // AFTER: "However, you do find <{a KEYBOARD} and a wooden ruler.>"
        else if (!clause[i + 1].isItem && clause[i + 2].text === ">") {
            clause[i + 1].text = "and " + clause[i + 1].text;
            clause.splice(i + 1, 0, itemClause);
            //clause.push(new Clause("11", false));
            return sentence;
        }
        // BEFORE: "You find <> haphazardly placed on it."
        // ADD: "TOWEL"
        // AFTER: "You find <{a TOWEL}> haphazardly placed on it."
        else if (clause[i + 1].text === ">") {
            clause.splice(i + 1, 0, itemClause);
            //clause.push(new Clause("12", false));
            return sentence;
        }
        else {
            clause.splice(i + 1, 0, itemClause);
            //clause.push(new Clause("13", false));
            return sentence;
        }
    }

    clause.splice(i + 1, 0, itemClause);
    //clause.push(new Clause("14", false));
    return sentence;
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
                if (clause[i - 3].text.endsWith("are ") && clause[i - 2].itemQuantity === 1)
                    clause[i - 3].set(clause[i - 3].text.substring(0, clause[i - 3].text.lastIndexOf("are ")) + "is ");
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
                if (clause[i - 1].text.endsWith("are ") && clause[i + 2].itemQuantity === 1)
                    clause[i - 1].set(clause[i - 1].text.replace("are ", "is "));
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
        else {
            clause[i].delete();
            if (clause[i + 1] && clause[i + 1].text === ", ") clause[i + 1].delete();
            return 13;
        }
    }
    // BEFORE: "<desc><s>A few grab your attention though: <il>ROSE OF SHARON, PINK LACEFLOWER, and <item>a MIRACLE FLOWER</item></il>.</s></desc>"
    // REMOVE: "MIRACLE FLOWER"
    // AFTER:  
    else if (clause[i - 1] && !clause[i - 1].isItem && clause[i - 1].text.endsWith(", and ") && clause[i - 1].text.split(',').length - 1 === 2) {
        clause[i].delete();
        clause[i - 1].set(clause[i - 1].text.replace(", and ", "").replace(", ", " and "));
        return 14;
    }
    // BEFORE: "<desc><s>However, you do find <il>a wooden ruler and <item>a KEYBOARD</item></il>.</s></desc>"
    // REMOVE: "KEYBOARD"
    // AFTER:  "<desc><s>However, you do find <il>a wooden ruler</il>.</s></desc>"
    else if (clause[i - 1] && !clause[i - 1].isItem && clause[i - 1].text.endsWith(" and ")) {
        clause[i].delete();
        clause[i - 1].set(clause[i - 1].text.replace(" and ", ""));
        return 15;
    }
    // BEFORE: "<desc><s><il><item>On one of the desks is a FIRST AID KIT</item> and hung on the wall behind the desks is a MEDICINE CABINET</il>.</s></desc>"
    // REMOVE: "FIRST AID KIT"
    // AFTER:  "<desc><s><il>Hung on the wall behind the desks is a MEDICINE CABINET</il>.</s></desc>"
    else if (!clause[i - 1] && clause[i + 1] && clause[i + 1].text.startsWith(" and ")) {
        clause[i].delete();
        clause[i + 1].set(clause[i + 1].text.replace(" and ", ""));
        clause[i + 1].set(clause[i + 1].text.charAt(0).toUpperCase() + clause[i + 1].text.substring(1));
        return 16;
    }
    // BEFORE: "<desc><s>However, you do find <il><item>a KEYBOARD</item> and a wooden ruler</il>.</s></desc>"
    // REMOVE: "KEYBOARD"
    // AFTER:  "<desc><s>However, you do find <il>a wooden ruler</il>.</s></desc>"
    else if (clause[i + 1] && clause[i + 1].text.startsWith(" and ")) {
        clause[i].delete();
        clause[i + 1].set(clause[i + 1].text.replace(" and ", ""));
        return 17;
    }
    // BEFORE: "<desc><s>There are <il><item>CLARINETS</item>, a PIANO, and some SNARE DRUMS</il>.</s></desc>"
    // REMOVE: "CLARINETS"
    // AFTER:  "<desc><s>There are <il>a PIANO and some SNARE DRUMS</il>.</s></desc>"
    else if (clause[i + 1] && clause[i + 1].text.includes(", and ") && clause[i + 1].text.split(',').length - 1 === 2) {
        clause[i].delete();
        clause[i + 1].set(clause[i + 1].text.replace(", ", "").replace(", and ", " and "));
        return 18;
    }

    // If all else fails, just remove the item clause.
    clause[i].delete();
    return 19;
}
