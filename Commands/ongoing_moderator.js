import settings from '../Configs/settings.json' with { type: 'json' };

module.exports.config = {
    name: "ongoing_moderator",
    description: "Lists all ongoing events.",
    details: "Lists all events which are currently ongoing, along with the time remaining on each one, if applicable.",
    usage: `${settings.commandPrefix}ongoing\n`
        + `${settings.commandPrefix}events`,
    usableBy: "Moderator",
    aliases: ["ongoing", "events"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    var events = [];
    for (let i = 0; i < game.events.length; i++) {
        if (game.events[i].ongoing) {
            if (game.events[i].remaining === null)
                events.push(game.events[i].name);
            else
                events.push(game.events[i].name + ` (${game.events[i].remainingString})`);
        }
    }
    const eventList = events.join(", ");
    game.messageHandler.addGameMechanicMessage(message.channel, `Ongoing events:\n${eventList}`);

    return;
};
