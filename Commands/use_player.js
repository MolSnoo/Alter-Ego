const settings = include('settings.json');

module.exports.config = {
    name: "use_player",
    description: "Uses an item in your inventory or an object in a room.",
    details: "Uses an item from your inventory. Not all items have programmed uses. Those that do will inflict you "
        + "with or cure you of a status effect of some kind. Status effects can be good, bad, or neutral, but it "
        + "should be fairly obvious what kind of effect a particular item will have on you. For example, "
        + "sleep medicine will make you fall asleep, a first aid kit will heal injuries, etc.\n\n"
        + "Some items can be used on objects in the room you're in. For example, using a key on a locker "
        + "will unlock the locker, using a crowbar on a crate will open the crate, etc.\n\n"
        + "You can even use objects in the room without using an item. Not all objects are usable. Anything after the name of the object "
        + "will be treated as a password or combination. Passwords and combinations are case-sensitive. "
        + "If you aren't prompted to enter a password or combination, just the name of the object will work. "
        + "If the object is a lock, you can relock it using the lock command. "
        + "Other objects may require a puzzle to be solved before they do anything special.",
    usage: `${settings.commandPrefix}use first aid kit\n`
        + `${settings.commandPrefix}eat food\n`
        + `${settings.commandPrefix}use old key chest\n`
        + `${settings.commandPrefix}use lighter candle\n`
        + `${settings.commandPrefix}lock locker\n`
        + `${settings.commandPrefix}type keypad YAMA NI NOBORU\n`
        + `${settings.commandPrefix}unlock locker 1 12-22-11\n`
        + `${settings.commandPrefix}press button\n`
        + `${settings.commandPrefix}flip lever`,
    usableBy: "Player",
    aliases: ["use", "unlock", "lock", "type", "activate", "flip", "push", "press", "ingest", "consume", "swallow", "eat", "drink"]
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
    //parsedInput = parsedInput.replace(/\'/g, "");

    // First find the item in the player's inventory, if applicable.
    var item = null;
    for (let i = 0; i < player.inventory.length; i++) {
        if (parsedInput.startsWith(player.inventory[i].name + ' ') || player.inventory[i].name === parsedInput) {
            item = player.inventory[i];
            parsedInput = parsedInput.substring(item.name.length).trim();
            input = input.substring(item.name.length).trim();
            break;
        }
    }

    // Now check to see if the player is trying to solve a puzzle.
    var puzzle = null;
    var password = "";
    if (parsedInput !== "" && (command !== "ingest" && command !== "consume" && command !== "swallow" && command !== "eat" && command !== "drink")) {
        var puzzles = game.puzzles.filter(puzzle => puzzle.location === player.location.name);
        if (command === "lock" || command === "unlock") puzzles = puzzles.filter(puzzle => puzzle.type === "combination lock" || puzzle.type === "key lock");
        else if (command === "type") puzzles = puzzles.filter(puzzle => puzzle.type === "password");
        else if (command === "push" || command === "press" || command === "activate" || command === "flip") puzzles = puzzles.filter(puzzle => puzzle.type === "interact" || puzzle.type === "toggle");
        for (let i = 0; i < puzzles.length; i++) {
            if (puzzles[i].parentObject !== "" && parsedInput.startsWith(puzzles[i].parentObject)) {
                puzzle = puzzles[i];
                parsedInput = parsedInput.substring(puzzle.parentObject.length).trim();
                input = input.substring(puzzle.parentObject.length).trim();
                break;
            }
            else if (parsedInput.startsWith(puzzles[i].name)) {
                puzzle = puzzles[i];
                parsedInput = parsedInput.substring(puzzle.name.length).trim();
                input = input.substring(puzzle.name.length).trim();
                break;
            }
        }
        if (puzzle === null) return message.reply(`couldn't find "${input}" to ${command}. Try using a different command?`);
        password = input;
    }

    // If there is a puzzle, do the required behavior.
    if (puzzle !== null) {
        const misc = {
            command: command,
            input: args.join(" "),
            message: message
        };
        const response = player.attemptPuzzle(bot, game, puzzle, item, password, command, misc);
        if (response === "" || !response) return;
        else return message.reply(response);
    }
    // Otherwise, the player must be trying to use an item on themselves.
    else if (item !== null && (command === "use" || command === "ingest" || command === "consume" || command === "swallow" || command === "eat" || command === "drink")) {
        const response = player.use(game, item);
        if (response === "" || !response) {
            // Post log message.
            const time = new Date().toLocaleTimeString();
            game.logChannel.send(`${time} - ${player.name} used ${item.name} from their inventory in ${player.location.channel}`);
            return;
        }
        else return message.reply(response);
    }
    else return message.reply(`couldn't find "${input}" to ${command}. Try using a different command?`);
};
