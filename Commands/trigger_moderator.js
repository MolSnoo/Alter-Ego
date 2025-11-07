const settings = require('../Configs/settings.json');

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
    if (event.ongoing) return game.messageHandler.addReply(message, `${event.name} is already ongoing.`);

    await event.trigger(bot, game, true);
    game.messageHandler.addGameMechanicMessage(message.channel, `Successfully triggered ${event.name}.`);

    return;
};
