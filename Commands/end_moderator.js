const settings = include('settings.json');

module.exports.config = {
    name: "end_moderator",
    description: "Ends an event.",
    details: "Ends the specified event. The event must be ongoing. If the event has any ended commands, they will be run.",
    usage: `${settings.commandPrefix}end rain\n`
        + `${settings.commandPrefix}end explosion`,
    usableBy: "Moderator",
    aliases: ["end"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify an event. Usage:\n${exports.config.usage}`);

    var input = args.join(" ");
    var parsedInput = input.toUpperCase().replace(/\'/g, "");

    var event = null;
    for (let i = 0; i < game.events.length; i++) {
        if (game.events[i].name === parsedInput) {
            event = game.events[i];
            break;
        }
    }
    if (event === null) return game.messageHandler.addReply(message, `Couldn't find event "${input}".`);
    if (!event.ongoing) return game.messageHandler.addReply(message, `${event.name} is not currently ongoing.`);

    await event.end(bot, game, true);
    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully ended ${event.name}.`);

    return;
};
