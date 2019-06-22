const settings = include('settings.json');

module.exports.config = {
    name: "status_moderator",
    description: "Deals with status effects on players.",
    details: 'Deals with status effects on players.\n'
        + '-**add**/**inflict**: Inflicts the specified player with the given status effect. '
        + 'That player will receive the "Message When Inflicted" message for the specified status effect. '
        + 'If the status effect has a timer, the player will be cured and then inflicted with the status effect '
        + 'in the "Develops Into" column when the timer reaches 0. If the status effect is fatal, '
        + 'then they will simply die when the timer reaches 0 instead.\n'
        + '-**remove**/**cure**: Cures the specified player of the given status effect. '
        + 'That player will receive the "Message When Cured" message for the specified status effect. '
        + 'If the status effect develops into another effect when cured, the player will be inflicted with that status effect.\n'
        + '-**view**: Views all of the status effects that a player is currently afflicted with, along with the time remaining on each one, if applicable.'
        + 'See the "Effect" column on the spreadsheet for more info on each status effect.',
    usage: `${settings.commandPrefix}status add diego heated\n`
        + `${settings.commandPrefix}inflict diego heated\n`
        + `${settings.commandPrefix}status remove antoine injured\n`
        + `${settings.commandPrefix}cure antoine injured\n`
        + `${settings.commandPrefix}status view jordan\n`
        + `${settings.commandPrefix}view jordan`,
    usableBy: "Moderator",
    aliases: ["status", "inflict", "cure", "view"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    var input = command + " " + args.join(" ");
    if (command === "status") {
        if (args[0] === "add" || args[0] === "inflict") command = "inflict";
        else if (args[0] === "remove" || args[0] === "cure") command = "cure";
        else if (args[0] === "view") {
            command = "view";
            if (!args[1]) {
                args[1] = null;
                input += " null";
            }
        }
        args = input.substring(input.indexOf(args[1])).split(" ");
    }

    if (args.length === 0) {
        message.reply("you need to input all required arguments. Usage:");
        message.channel.send(exports.config.usage);
        return;
    }

    // Find the specified player.
    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            player = game.players_alive[i];
            break;
        }
    }
    if (player === null) return message.reply(`couldn't find player "${args[0]}".`);

    if (command === "inflict") {
        const response = player.inflict(game, input.substring(input.indexOf(args[1])).toLowerCase(), true, true, true, true);
        message.channel.send(response);
    }
    else if (command === "cure") {
        const response = player.cure(game, input.substring(input.indexOf(args[1])).toLowerCase(), true, true, true, true);
        message.channel.send(response);
    }
    else if (command === "view") {
        const response = player.viewStatus_moderator();
        message.channel.send(response);
    }

    return;
};
