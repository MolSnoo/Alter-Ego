const settings = include('settings.json');

module.exports.config = {
    name: "status_moderator",
    description: "Deals with status effects on players.",
    details: 'Deals with status effects on players.\n\n'
        + '-**add**/**inflict**: Inflicts the specified players with the given status effect. '
        + 'Those players will receive the "Message When Inflicted" message for the specified status effect. '
        + 'If the status effect has a timer, the players will be cured and then inflicted with the status effect '
        + 'in the "Develops Into" column when the timer reaches 0. If the status effect is fatal, '
        + 'then they will simply die when the timer reaches 0 instead.\n\n'
        + '-**remove**/**cure**: Cures the specified players of the given status effect. '
        + 'Those players will receive the "Message When Cured" message for the specified status effect. '
        + 'If the status effect develops into another effect when cured, the players will be inflicted with that status effect.\n\n'
        + '-**view**: Views all of the status effects that a player is currently afflicted with, along with the time remaining on each one, if applicable.',
    usage: `${settings.commandPrefix}status add mari heated\n`
        + `${settings.commandPrefix}inflict yume heated\n`
        + `${settings.commandPrefix}status add aki saay yuko haru asleep\n`
        + `${settings.commandPrefix}inflict all deafened\n`
        + `${settings.commandPrefix}status remove flint injured\n`
        + `${settings.commandPrefix}cure elijah injured\n`
        + `${settings.commandPrefix}status remove astrid ryou juneau drunk\n`
        + `${settings.commandPrefix}cure living asleep\n`
        + `${settings.commandPrefix}status view jordan\n`
        + `${settings.commandPrefix}view jordan`,
    usableBy: "Moderator",
    aliases: ["status", "inflict", "cure", "view"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (command === "status") {
        if (args[0] === "add" || args[0] === "inflict") command = "inflict";
        else if (args[0] === "remove" || args[0] === "cure") command = "cure";
        else if (args[0] === "view") {
            command = "view";
            if (!args[1])
                return game.messageHandler.addReply(message, `you need to input a player. Usage:\n${exports.config.usage}`);
        }
        args.splice(0, 1);
    }

    if (args.length === 0)
        return game.messageHandler.addReply(message, `you need to input all required arguments. Usage:\n${exports.config.usage}`);

    // Get all listed players first.
    var players = [];
    if (args[0] === "all" || args[0] === "living") {
        for (let i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].talent !== "NPC" && !game.players_alive[i].member.roles.find(role => role.id === settings.headmasterRole))
                players.push(game.players_alive[i]);
        }
        args.splice(0, 1);
    }
    else {
        for (let i = 0; i < game.players_alive.length; i++) {
            for (let j = 0; j < args.length; j++) {
                if (args[j].toLowerCase() === game.players_alive[i].name.toLowerCase()) {
                    players.push(game.players_alive[i]);
                    args.splice(j, 1);
                    break;
                }
            }
        }
    }
    if (players.length === 0) return game.messageHandler.addReply(message, "you need to specify at least one player.");
    if (players.length > 1 && command === "view") return game.messageHandler.addReply(message, "cannot view status of more than one player at a time.");
    const input = args.join(" ");
    if (input === "" && command !== "view") return game.messageHandler.addReply(message, "you need to specify a status effect.");

    if (command === "inflict") {
        if (players.length > 1) {
            let success = true;
            for (let i = 0; i < players.length; i++) {
                const response = players[i].inflict(game, input.toLowerCase(), true, true, true);
                if (response.startsWith("Couldn't find status effect")) {
                    game.messageHandler.addGameMechanicMessage(message.channel, response);
                    success = false;
                    break;
                }
            }
            if (success) game.messageHandler.addGameMechanicMessage(message.channel, "Status successfully added to the listed players.");
        }
        else {
            const response = players[0].inflict(game, input.toLowerCase(), true, true, true);
            game.messageHandler.addGameMechanicMessage(message.channel, response);
        }
    }
    else if (command === "cure") {
        if (players.length > 1) {
            for (let i = 0; i < players.length; i++)
                players[i].cure(game, input.toLowerCase(), true, true, true);
            game.messageHandler.addGameMechanicMessage(message.channel, "Successfully removed status effect from the listed players.");
        }
        else {
            const response = players[0].cure(game, input.toLowerCase(), true, true, true);
            game.messageHandler.addGameMechanicMessage(message.channel, response);
        }
    }
    else if (command === "view") {
        const response = `${players[0].name}'s status:\n${players[0].generate_statusList(true, true)}`;
        game.messageHandler.addGameMechanicMessage(message.channel, response);
    }

    return;
};
