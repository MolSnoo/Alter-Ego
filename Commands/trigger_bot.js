const settings = include('settings.json');

module.exports.config = {
    name: "trigger_bot",
    description: "Triggers an event.",
    details: "Triggers the specified event. The event must not already be ongoing. If it is, nothing will happen. If the event has any triggered commands, they will **not** be run.",
    usage: `${settings.commandPrefix}trigger rain\n`
        + `${settings.commandPrefix}trigger explosion`,
    usableBy: "Bot",
    aliases: ["trigger"]
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
    if (event.ongoing) return;

    await event.trigger(bot, game, false);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.logChannel.send(`${time} - ${event.name} was triggered.`);

    return;
};
