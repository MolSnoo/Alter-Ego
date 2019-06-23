class Clause {
    constructor(text, isItem, itemNo, itemQuantity) {
        this.text = text;
        this.isItem = isItem;
        this.itemNo = itemNo;
        this.itemQuantity = itemQuantity;
    }
}

class Sentence {
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

module.exports.parseDescription = function (description) {
    var sentences = parseText(description);
    const newDescription = assembleSentences(sentences, false);
    return newDescription.replace(/{/g, '').replace(/}/g, '').replace(/</g, '').replace(/>/g, '');
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
    var sentences = parseText(description);

    // Determine if an item needs to be removed from the sentence.
    var removeItem = false;
    var i;
    var j;
    for (i = 0; i < sentences.length; i++) {
        for (j = 0; j < sentences[i].clause.length; j++) {
            if (sentences[i].clause[j].text.includes(item.singleContainingPhrase)
                || (j === 1 && sentences[i].clause[j].text.startsWith("A ") && sentences[i].clause[j].text.includes('A' + item.singleContainingPhrase.substring(1)))
                || (item.pluralContainingPhrase !== "" && sentences[i].clause[j].text.includes(item.pluralContainingPhrase))) {
                removeItem = true;
                break;
            }
        }
        if (removeItem) break;
    }

    if (removeItem && sentences[i].clause[j].isItem) {
        // First make sure that there aren't multiple of that item.
        if (item.quantity > 0) {
            if (item.quantity === 1) {
                if ("AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz".includes(sentences[i].clause[j].text.charAt(sentences[i].clause[j].text.length - 1)))
                    sentences[i].clause[j].text = item.singleContainingPhrase;
                else
                    sentences[i].clause[j].text = item.singleContainingPhrase + sentences[i].clause[j].text.charAt(sentences[i].clause[j].text.length - 1);
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
                    sentences[i].clause[j].text = sentences[i].clause[j].text.replace(quantity, quantity - 1);
                }
            }
        }

        // Remove clause from the sentence.
        else {
            sentences[i].clause[j].itemQuantity = item.quantity;
            sentences[i] = removeClause(sentences[i], j);
        }
    }

    // If we're removing an item from the formatted description, then we're going to be uploading the parsed version too.
    // It would be a waste to have to disassemble it again, so we'll return both versions.
    const descriptions = [assembleSentences(sentences, true), assembleSentences(sentences, false).replace(/{/g, '').replace(/}/g, '').replace(/</g, '').replace(/>/g, '')];
    return descriptions;
};

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
                clauses.push(new Clause(description.substring(start, end).trim(), false));

                start = i;
                end = i + 1;
                clauses.push(new Clause(description.substring(start, end).trim(), false));
                start = i + 1;
                itemListStarted = true;
            }
            else if (description.charAt(i) === '{') {
                end = i;
                i++;
                clauses.push(new Clause(description.substring(start, end).trim(), false));
                start = i;
            }
            else if (description.charAt(i) === '}') {
                end = i;
                clauses.push(new Clause(description.substring(start, end).trim(), true));
                start = i + 1;
                if (description.charAt(i + 1) === '>' && (description.charAt(i - 1) === '.' || description.charAt(i - 1) === '!' || description.charAt(i - 1) === '?')) {
                    end = i + 2;
                    clauses.push(new Clause(description.substring(start, end).trim(), false));
                    start = i + 2;
                    newSentence = true;
                }
                else if (description.charAt(i - 1) === '.' || description.charAt(i - 1) === '!' || description.charAt(i - 1) === '?') {
                    end = i + 1;
                    clauses.push(new Clause(description.substring(start, end).trim(), true));
                    start = i + 1;
                    newSentence = true;
                }
            }
            else if (description.charAt(i) === '>' && itemListStarted) {
                end = i;
                clauses.push(new Clause(description.substring(start, end).trim(), false));

                start = i;
                end = i + 1;
                clauses.push(new Clause(description.substring(start, end).trim(), false));
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
                clauses.push(new Clause(description.substring(start, end).trim(), false));
                start = i + 1;
                newSentence = true;
            }

            if (i === description.length - 1) {
                clauses.push(new Clause(description.substring(start, description.length).trim(), false));
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
        sentences.push(new Sentence(clauses, itemContainer, itemCount));
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

    // BEFORE: "{On one of the desks is a FIRST AID KIT} and {hung on the wall behind the desks is a MEDICINE CABINET.}"
    // REMOVE: "FIRST AID KIT"
    // AFTER: "{Hung on the wall behind the desks is a MEDICINE CABINET.}"
    if ((i === 0)
        && (clause[i + 1] && clause[i + 2])
        && (clause[i + 1].text === "and" && clause[i + 2].isItem)) {

        clause[i].text = "";
        clause[i + 1].text = "";
        clause[i + 2].text = clause[i + 2].text.substring(0, 1).toUpperCase() + clause[i + 2].text.substring(1);
        //clause.push(new Clause("1", false));
        return sentence;
    }
    
    else if (sentence.itemCount > 1) {
        // Handle removing the last item from a list of items. The if/else if conditionals go by decreasing number of items in the list.
        if ((clause[i - 1].text === "and") && (clause[i].itemNo === sentence.itemCount)) {
            clause[i].text = "";
            clause[i - 1].text = "";
            // BEFORE: "On these shelves are <{a bottle of PAINKILLERS,} {3 bottles of ZZZQUIL,} {a bottle of LAXATIVES,} and {a bottle of ISOPROPYL ALCOHOL.}>"
            // REMOVE: "ISOPROPYL ALCOHOL"
            // AFTER: "On these shelves are <{a bottle of PAINKILLERS,} {3 bottles of ZZZQUIL,} and {a bottle of LAXATIVES.}>"
            if (sentence.itemCount > 3) {
                if (clause[i + 2]) clause[i - 1] = new Clause(clause[i - 2].text.substring(0, clause[i - 2].text.length - 1), true);
                else clause[i - 1] = new Clause(clause[i - 2].text.substring(0, clause[i - 2].text.length - 1) + '.', true);
                clause[i - 2] = new Clause("and", false);
                //clause.push(new Clause("2", false));
                return sentence;
            }
            // BEFORE: "On these shelves are <{a bottle of PAINKILLERS,} {3 bottles of ZZZQUIL,} and {a bottle of LAXATIVES.}>"
            // REMOVE: "LAXATIVES"
            // AFTER: "On these shelves are <{a bottle of PAINKILLERS} and {3 bottles of ZZZQUIL.}>"
            else if (sentence.itemCount === 3) {
                if (clause[i + 2]) clause[i - 1] = new Clause(clause[i - 2].text.substring(0, clause[i - 2].text.length - 1), true);
                else clause[i - 1] = new Clause(clause[i - 2].text.substring(0, clause[i - 2].text.length - 1) + '.', true);
                clause[i - 2] = new Clause("and", false);
                clause[i - 3].text = clause[i - 3].text.substring(0, clause[i - 3].text.length - 1);
                //clause.push(new Clause("3", false));
                return sentence;
            }
            // BEFORE: "On these shelves are <{a bottle of PAINKILLERS} and {3 bottles of ZZZQUIL.}>"
            // REMOVE: "ZZZQUIL"
            // AFTER: "On these shelves is <{a bottle of PAINKILLERS.}>"
            else {
                if (!clause[i + 2]) clause[i - 2].text = clause[i - 2].text + '.';
                if (clause[i - 4].text.endsWith("are") && clause[i - 2].itemQuantity === 1)
                    clause[i - 4].text = clause[i - 4].text.substring(0, clause[i - 4].text.length - 3) + "is";
                //clause.push(new Clause("4", false));
                return sentence;
            }
        }
        // Handle removing the first item from a list of items. The if/else if conditionals go by increasing number of items in the list.
        else if (clause[i].itemNo === 1 && !clause[i - 2]) {
            clause[i].text = "";
            // BEFORE: "<{A bottle of PAINKILLERS} and {a bottle of LAXATIVES}> are on these shelves."
            // REMOVE: "PAINKILLERS"
            // AFTER: "<{A bottle of LAXATIVES}> is on these shelves."
            if (clause[i + 1].text === "and") {
                clause[i + 1].text = "";
                clause[i + 2].text = clause[i + 2].text.charAt(0).toUpperCase() + clause[i + 2].text.substring(1);
                if (clause[i + 4].text.startsWith("are") && clause[i + 2].itemQuantity === 1)
                    clause[i + 4].text = "is" + clause[i + 4].text.substring(3);
                //clause.push(new Clause("5", false));
                return sentence;
            }
            // BEFORE: "<{A bottle of PAINKILLERS,} {a bottle of ZZZQUIL,} and {a bottle of LAXATIVES}> are on these shelves."
            // REMOVE: "PAINKILLERS"
            // AFTER: "<{A bottle of ZZZQUIL} and {a bottle of LAXATIVES}> are on these shelves."
            else if (clause[i + 1].text.endsWith(',') && clause[i + 2].text === "and") {
                clause[i + 1].text = clause[i + 1].text.charAt(0).toUpperCase() + clause[i + 1].text.substring(1, clause[i + 1].text.length - 1);
                //clause.push(new Clause("6", false));
                return sentence;
            }
        }
        // Handle removing the second to last item from a list of items. The if/else if conditionals go by increasing number of items in the list.
        else if ((clause[i + 1].text === "and") && (clause[i].itemNo === sentence.itemCount - 1)) {
            clause[i].text = "";
            // BEFORE: "On these shelves are <{a bottle of PAINKILLERS} and {a bottle of LAXATIVES.}>"
            // REMOVE: "PAINKILLERS"
            // AFTER: "On these shelves is <{a bottle of LAXATIVES.}>"
            if (!clause[i - 1].isItem && clause[i - 2] && !clause[i - 2].isItem) {
                clause[i + 1].text = "";
                if (clause[i - 2].text.endsWith("are") && clause[i + 2].itemQuantity === 1)
                    clause[i - 2].text = clause[i - 2].text.substring(0, clause[i - 2].text.length - 3) + "is";
                //clause.push(new Clause("7", false));
                return sentence;
            }
            // BEFORE: "On these shelves are <{a bottle of PAINKILLERS,} {3 bottles of ZZZQUIL,} and {a bottle of LAXATIVES.}>"
            // REMOVE: "ZZZQUIL"
            // AFTER: "On these shelves are <{a bottle of PAINKILLERS} and {a bottle of LAXATIVES.}>"
            else if (clause[i - 2] && !clause[i - 2].isItem && clause[i - 1].text.endsWith(',') && clause[i + 2].isItem) {
                clause[i - 1].text = clause[i - 1].text.substring(0, clause[i - 1].text.length - 1);
                //clause.push(new Clause("8", false));
                return sentence;
            }
        }
        // BEFORE: "On these shelves are <{a bottle of PAINKILLERS,} {a bottle of ZZZQUIL,} and {a bottle of LAXATIVES.}>"
        // REMOVE: "PAINKILLERS"
        // AFTER: "On these shelves are <{a bottle of ZZZQUIL} and {a bottle of LAXATIVES.}>"
        else if (clause[i + 1].text.endsWith(',') && clause[i + 2].text === "and" && clause[i].itemNo === 1) {
            clause[i].text = "";
            clause[i + 1].text = clause[i + 1].text.substring(0, clause[i + 1].text.length - 1);
            //clause.push(new Clause("9", false));
            return sentence;
        }
        // BEFORE: "On the counters, you can see <{a few KNIVES,} {a BUTCHERS KNIFE,} and a RACK of skewers.>"
        // REMOVE: "KNIVES"
        // AFTER: "On the counters, you can see <{a BUTCHERS KNIFE} and a RACK of skewers.>"
        else if ((sentence.itemCount === 2)
            && (clause[i + 1] && clause[i + 1].text.endsWith(',') && clause[i + 1].isItem)
            && (clause[i + 2] && clause[i + 2].text.startsWith("and") && !clause[i + 2].isItem)) {
            clause[i].text = "";
            clause[i + 1].text = clause[i + 1].text.substring(0, clause[i + 1].text.length - 1);
            //clause.push(new Clause("10", false));
            return sentence;
        }
        // BEFORE: "On the counters, you can see <{a few KNIVES,} {a BUTCHERS KNIFE,} and a RACK of skewers.>"
        // REMOVE: "BUTCHERS KNIFE"
        // AFTER: "On the counters, you can see <{a few KNIVES} and a RACK of skewers.>"
        else if ((sentence.itemCount === 2)
            && (clause[i - 1] && clause[i - 1].text.endsWith(',') && clause[i - 1].isItem)
            && (clause[i + 1] && clause[i + 1].text.startsWith("and") && !clause[i + 1].isItem)) {
            clause[i].text = "";
            clause[i - 1].text = clause[i - 1].text.substring(0, clause[i - 1].text.length - 1);
            //clause.push(new Clause("11", false));
            return sentence;
        }
        // BEFORE: "However, you do find <{a MOUSE,} a wooden ruler, and {a KEYBOARD.}>"
        // REMOVE: "MOUSE"
        // AFTER: "However, you do find <a wooden ruler and {a KEYBOARD.}>"
        else if ((sentence.itemCount === 2)
            && (clause[i + 1] && !clause[i + 1].isItem && clause[i + 1].text.endsWith(", and"))
            && (clause[i + 2] && clause[i + 2].isItem)) {
            clause[i].text = "";
            clause[i + 1].text = clause[i + 1].text.replace(", and", " and");
            //clause.push(new Clause("12", false));
            return sentence;
        }
        // BEFORE: "However, you do find <{a MOUSE,} a wooden ruler, and {a KEYBOARD.}>"
        // REMOVE: "KEYBOARD"
        // AFTER: "However, you do find <{a MOUSE} and a wooden ruler.>"
        else if ((clause[i - 1] && !clause[i - 1].isItem && clause[i - 1].text.endsWith(", and"))
            && (clause[i - 2] && clause[i - 2].isItem && clause[i - 2].text.endsWith(','))) {
            clause[i].text = "";
            clause[i - 1].text = "and " + clause[i - 1].text.replace(", and", ".");
            if (clause[i - 3].text === "<")
                clause[i - 2].text = clause[i - 2].text.substring(0, clause[i - 2].text.length - 1);
            //clause.push(new Clause("13", false));
            return sentence;
        }
        else {
            clause[i].text = "";
            //clause.push(new Clause("14", false));
            return sentence;
        }
    }
    // BEFORE: "However, you do find <a wooden ruler and {a KEYBOARD.}>"
    // REMOVE: "KEYBOARD"
    // AFTER: "However, you do find <a wooden ruler.>"
    else if (clause[i - 1] && clause[i - 1].text.endsWith("and") && !clause[i - 1].isItem) {
        clause[i].text = "";
        clause[i - 1].text = clause[i - 1].text.substring(0, clause[i - 1].text.length - 4) + ".";
        //clause.push(new Clause("15", false));
        return sentence;
    }
    // BEFORE: "{On one of the desks is a FIRST AID KIT} and hung on the wall behind the desks is a MEDICINE CABINET."
    // REMOVE: "FIRST AID KIT"
    // AFTER: "Hung on the wall behind the desks is a MEDICINE CABINET."
    else if (!clause[i - 1] && clause[i + 1] && clause[i + 1].text.startsWith("and") && !clause[i + 1].isItem) {
        clause[i].text = "";
        clause[i + 1].text = clause[i + 1].text.substring(4, clause[i + 1].text.length);
        clause[i + 1].text = clause[i + 1].text.charAt(0).toUpperCase() + clause[i + 1].text.substring(1);
        //clause.push(new Clause("16", false));
        return sentence;
    }
    // BEFORE: "However, you do find <{a KEYBOARD} and a wooden ruler.>"
    // REMOVE: "KEYBOARD"
    // AFTER: "However, you do find <a wooden ruler.>"
    else if (clause[i + 1] && clause[i + 1].text.startsWith("and") && !clause[i + 1].isItem) {
        clause[i].text = "";
        clause[i + 1].text = clause[i + 1].text.substring(4, clause[i + 1].text.length);
        //clause.push(new Clause("17", false));
        return sentence;
    }
    // BEFORE: "There are <{CLARINETS,} a PIANO, and some SNARE DRUMS.>"
    // REMOVE: "CLARINETS"
    // AFTER: "There are <a PIANO and some SNARE DRUMS.>"
    else if ((clause[i - 1] && clause[i + 1])
        && (clause[i - 2].text.endsWith("are"))
        && (clause[i + 1].text.includes(", and"))
        && (clause[i + 1].text.split(',').length - 1 === 1)) {
        clause[i].text = "";
        clause[i + 1].text = clause[i + 1].text.replace(", and", " and");
        //clause.push(new Clause("18", false));
        return sentence;
    }

    // BEFORE: "A few grab your attention though: <{a MIRACLE FLOWER,} ROSE OF SHARON, and PINK LACEFLOWER.>"
    // REMOVE: "MIRACLE FLOWER"
    // AFTER: "A few grab your attention though: <ROSE OF SHARON and PINK LACEFLOWER.>"
    else if (clause[i + 1]
        && (!clause[i + 1].isItem)
        && (clause[i + 1].text.includes(", and"))
        && (clause[i + 1].text.split(',').length - 1 === 1)) {
        clause[i].text = "";
        clause[i + 1].text = clause[i + 1].text.replace(", and", " and");
        //clause.push(new Clause("19", false));
        return sentence;
    }
      
    // BEFORE: "The second one from the bottom has <{a WALKIE TALKIE.}>"
    // REMOVE: "WALKIE TALKIE"
    // AFTER: "The second one from the bottom has <.>"
    else if (clause[i + 1] && clause[i + 1].text === '>' && !clause[i + 2]) {
        clause[i].text = ".";
        clause[i].isItem = false;
        //clause.push(new Clause("20", false));
        return sentence;
    }

    clause[i].text = "";
    //clause.push(new Clause("21", false));
    return sentence;
}
