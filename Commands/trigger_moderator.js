const settings = include('settings.json');

module.exports.config = {
    name: "trigger_moderator",
    description: "Triggers an event.",
    details: "Triggers the specified event. The event must not already be ongoing. If the event has any triggered commands, they will be run.",
    usage: `${settings.commandPrefix}trigger rain\n`
        + `${settings.commandPrefix}trigger explosion`,
    usableBy: "Moderator",
    aliases: ["trigger"],
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
    if (event.ongoing) return message.reply(`${event.name} is already ongoing.`);

    await event.trigger(bot, game, true);
    // Post log message.
    const time = new Date().toLocaleTimeString();
    game.logChannel.send(`${time} - ${event.name} was triggered.`);

    message.channel.send(`Successfully triggered ${event.name}.`);

    return;
};
