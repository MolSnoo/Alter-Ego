const settings = include('Configs/settings.json');
const serverconfig = include('Configs/serverconfig.json');

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
        if (player.talent !== "NPC") {
            if (player.location.channel) player.location.channel.permissionOverwrites.create(player.member, { ViewChannel: null });
            player.removeFromWhispers(game);
            player.member.roles.remove(serverconfig.playerRole).catch();

            for (let j = 0; j < player.status.length; j++) {
                if (player.status[j].hasOwnProperty("timer") && player.status[j].timer !== null)
                    player.status[j].timer.stop();
            }
        }
    }

    for (let i = 0; i < game.players_dead.length; i++) {
        const player = game.players_dead[i];
        if (player.talent !== "NPC") player.member.roles.remove(serverconfig.deadRole).catch();
    }

    clearTimeout(game.halfTimer);
    clearTimeout(game.endTimer);

    game.inProgress = false;
    game.canJoin = false;
    game.messageHandler.clearQueue();
    if (!settings.debug) {
        bot.user.setActivity("Future Foundation HQ", { type: 'LISTENING' });
        bot.user.setStatus("online");
    }
    game.players = [];
    game.players_by_name.clear();
    game.players_by_snowflake.clear();
    game.players_alive = [];
    game.players_alive_by_name.clear();
    game.players_alive_by_snowflake.clear();
    game.players_dead = [];
    game.players_dead_by_name.clear();
    game.players_dead_by_snowflake.clear();

    var channel;
    if (settings.debug) channel = game.guild.channels.cache.get(serverconfig.testingChannel);
    else channel = game.guild.channels.cache.get(serverconfig.generalChannel);
    channel.send(`${message.member.displayName} ended the game!`);

    return;
};
