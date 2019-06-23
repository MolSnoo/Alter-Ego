const settings = include('settings.json');

module.exports.config = {
    name: "endgame_moderator",
    description: "Ends a game.",
    details: 'Ends the game. All players will be removed from whatever room channels they were in. '
        + 'The Player and Dead roles will be removed from all players.',
    usage: `${settings.commandPrefix}endgame`,
    usableBy: "Moderator",
    aliases: ["endgame", "end"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    // Remove all living players from whatever room channel they're in.
    for (let i = 0; i < game.players_alive.length; i++) {
        const player = game.players_alive[i];
        if (player.location.channel) player.location.channel.overwritePermissions(player.member, { VIEW_CHANNEL: null });
        player.member.removeRole(settings.playerRole).catch();

        for (let j = 0; j < player.status.length; j++)
            clearInterval(player.status[j].timer);
    }

    for (let i = 0; i < game.players_dead.length; i++) {
        const player = game.players_dead[i];
        player.member.removeRole(settings.deadRole).catch();
    }

    clearTimeout(game.halfTimer);
    clearTimeout(game.endTimer);

    game.game = false;
    game.canJoin = false;
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
