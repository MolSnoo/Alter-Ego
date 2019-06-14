const settings = require("../settings.json");
const sheets = require("../House-Data/sheets.js");

const Narration = require("../House-Data/Narration.js");

module.exports.config = {
    name: "use_player",
    description: "Uses an object in a room.",
    details: "Uses an object in a room. Not all objects are usable. Anything after the name of the object "
        + "will be treated as a password or combination. If you aren't prompted to enter a password or combination, "
        + "just the name of the object will work. If the object is a combination lock, "
        + 'you can relock it by entering the wrong combination. If it is a key lock, you can relock it by entering "lock". '
        + "Some objects may require an item to be used. In this case, you need the required item in your inventory. "
        + "Other objects may require a puzzle to be solved before they do anything special.",
    usage: `${settings.commandPrefix}use computer 4782\n`
        + `${settings.commandPrefix}use locker 20-17-5\n`
        + `${settings.commandPrefix}use snare drums`,
    usableBy: "Player",
    aliases: ["use"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0) {
        message.reply("you need to specify an object. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    const status = player.getAttributeStatusEffects("disable use");
    if (status.length > 0) return message.reply(`You cannot do that because you are **${status[0].name}**.`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase();
    parsedInput = parsedInput.replace(/\'/g, "");

    // First find the item in the player's inventory, if applicable.
    var item = null;
    for (let i = 0; i < player.inventory.length; i++) {
        if (parsedInput.startsWith(player.inventory[i].name)) {
            item = player.inventory[i];
            parsedInput = parsedInput.substring(item.name.length).trim();
            break;
        }
    }

    // First check to see if the player is trying to solve a puzzle.
    var puzzle = null;
    if (parsedInput !== "") {
        var puzzles;
        puzzles = game.puzzles.filter(puzzle => puzzle.location === player.location.name);
        for (let i = 0; i < puzzles.length; i++) {
            if (puzzles[i].parentObject !== "" && parsedInput.startsWith(puzzles[i].parentObject)) {
                puzzle = puzzles[i];
                parsedInput = parsedInput.substring(puzzle.parentObject.length);
                break;
            }
            else if (parsedInput.startsWith(puzzles[i].name)) {
                puzzle = puzzles[i];
                parsedInput = parsedInput.substring(puzzle.name.length).trim();
                break;
            }
        }
    }
    console.log(item);
    console.log(puzzle);
    console.log(parsedInput);

    // If there is a puzzle, do the required behavior.
    if (puzzle !== null) {
        const response = player.attemptPuzzle(bot, game, puzzle, item);
        if (response === "" || !response) return;
        else if (response === "not found") return message.reply(`couldn't find "${parsedInput}".`);
        else return message.reply(response);
    }
    // Otherwise, the player must be trying to use an item on themselves.
    else if (item !== null) {
        const response = player.use(game, item);
        if (response === "" || !response) return;
        else return message.reply(response);
    }
    return;
};
