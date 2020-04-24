const settings = include('settings.json');

module.exports.config = {
    name: "endgame_moderator",
    description: "Ends a game.",
    details: 'Ends the game. All players will be removed from whatever room channels they were in. '
        + 'The Player and Dead roles will be removed from all players.',
    usage: `${settings.commandPrefix}endgame`,
    usableBy: "Moderator",
    aliases: ["endgame"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    // Remove all living players from whatever room channel they're in.
    for (let i = 0; i < game.players_alive.length; i++) {
        const player = game.players_alive[i];
        if (player.location.channel) player.location.channel.overwritePermissions(player.member, { VIEW_CHANNEL: null });
        player.removeFromWhispers(game);
        player.member.removeRole(settings.playerRole).catch();

        for (let j = 0; j < player.status.length; j++) {
            if (player.status[j].hasOwnProperty("timer") && player.status[j].timer !== null)
                player.status[j].timer.stop();
        }
    }

    for (let i = 0; i < game.players_dead.length; i++) {
        const player = game.players_dead[i];
        player.member.removeRole(settings.deadRole).catch();
    }

    clearTimeout(game.halfTimer);
    clearTimeout(game.endTimer);

    game.game = false;
    game.canJoin = false;
    game.messageHandler.clearQueue();
    if (!settings.debug) {
        bot.user.setActivity("Future Foundation HQ", { type: 'LISTENING' });
        bot.user.setStatus("online");
    }
    game.players = [];
    game.players_alive = [];
    game.players_dead = [];

    var channel;
    if (settings.debug) channel = game.guild.channels.get(settings.testingChannel);
    else channel = game.guild.channels.get(settings.generalChannel);
    channel.send(`${message.member.displayName} ended the game!`);

    return;
};
