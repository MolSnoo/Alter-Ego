const settings = include('settings.json');

module.exports.config = {
    name: "end_bot",
    description: "Ends an event.",
    details: "Ends the specified event.The event must be ongoing. If it isn't, nothing will happen. "
        + "If the event has any ended commands, they will not be run if they were passed by another event."
        + "They will be run if they were passed by anything else, however.",
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

    var doEndedCommands = false;
    if (data && !data.hasOwnProperty("ongoing")) doEndedCommands = true;

    await event.end(bot, game, doEndedCommands);

    return;
};
