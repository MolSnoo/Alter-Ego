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
    if (args.length === 0) {
        message.reply("you need to specify an event. Usage:");
        message.channel.send(exports.config.usage);
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
    if (event === null) return message.reply(`couldn't find event "${input}".`);
    if (!event.ongoing) return message.reply(`${event.name} is not currently ongoing.`);

    await event.end(bot, game, true);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.logChannel.send(`${time} - ${event.name} was ended.`);

    message.channel.send(`Successfully ended ${event.name}.`);

    return;
};
