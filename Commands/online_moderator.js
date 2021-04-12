const settings = include('settings.json');

module.exports.config = {
    name: "online_moderator",
    description: "Lists all online players.",
    details: "Lists all players who are currently online.",
    usage: `${settings.commandPrefix}online`,
    usableBy: "Moderator",
    aliases: ["online"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    var players = [];
    for (let i = 0; i < game.players_alive.length; i++) {
		if (game.players_alive[i].online)
			players.push(game.players_alive[i].name);
	}
	players.sort();
	const playerList = players.join(", ");
    game.messageHandler.addGameMechanicMessage(message.channel, `Players online:\n${playerList}`);

    return;
};
