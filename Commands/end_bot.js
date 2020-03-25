const settings = include('settings.json');

module.exports.config = {
    name: "end_bot",
    description: "Ends an event.",
    details: "Ends the specified event.The event must be ongoing. If it isn't, nothing will happen. If the event has any ended commands, they will **not** be run.",
    usage: `${settings.commandPrefix}end rain\n`
        + `${settings.commandPrefix}end explosion`,
    usableBy: "Bot",
    aliases: ["end"]
};

module.exports.run = async (bot, game, command, args, player, data) => {
    const cmdString = command + " " + args.join(" ");
    if (args.length === 0) {
        game.commandChannel.send(`Error: Couldn't execute command "${cmdString}". No event was given.`);
        return;
    }

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var event = null;
    for (let i = 0; i < game.events.length; i++) {
        if (game.events[i].name === parsedInput) {
            event = game.events[i];
            break;
        }
    }
    if (event === null) return game.commandChannel.send(`Error: Couldn't execute command "${cmdString}". Couldn't find event "${input}".`);
    if (!event.ongoing) return;

    await event.end(bot, game, false);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.logChannel.send(`${time} - ${event.name} was ended.`);

    return;
};
