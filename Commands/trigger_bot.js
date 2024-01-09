module.exports.config = {
    name: "trigger_bot",
    description: "Triggers an event.",
    details: "Triggers the specified event. The event must not already be ongoing. If it is, nothing will happen. "
        + "If the event has any triggered commands, they will not be run if they were passed by another event. "
        + "They will be run if they were passed by anything else, however.",
    usage: `trigger rain\n`
        + `trigger explosion`,
    usableBy: "Bot",
    aliases: ["trigger"]
};

module.exports.run = async (bot, game, command, args, player, data) => {
    const cmdString = command + " " + args.join(" ");
    if (args.length === 0) {
        game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". No event was given.`);
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
    if (event === null) return game.messageHandler.addGameMechanicMessage(game.commandChannel, `Error: Couldn't execute command "${cmdString}". Couldn't find event "${input}".`);
    if (event.ongoing) return;

    var doTriggeredCommands = false;
    if (data && !data.hasOwnProperty("ongoing")) doTriggeredCommands = true;

    await event.trigger(bot, game, doTriggeredCommands);

    return;
};
