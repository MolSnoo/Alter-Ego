const discord = require("discord.js");
const settings = require("../settings.json");

module.exports.config = {
    name: "status_moderator",
    description: 'Deals with status effects on players.\n'
        + '-**add**: Inflicts the specified player with the given status effect.That player will receive the "Message When Inflicted" message for the specified status effect.If the status effect has a timer, the player will be cured and then inflicted with the status effect in the "Develops Into" column when the timer reaches 0. If the status effect is fatal, then they will simply die when the timer reaches 0 instead.\n'
        + '-**remove**: Cures the specified player of the given status effect. That player will receive the "Message When Cured" message for the specified status effect. If the status effect develops into another effect when cured, the player will be inflicted with that status effect.'
        + '-**view**: Views all of the status effects that a player is currently afflicted with, along with the time remaining on each one, if applicable.'
        + 'See the "Effect" column on the spreadsheet for more info on each status effect.',
    usage: `${settings.commandPrefix}status add diego heated\n`
        + `${settings.commandPrefix}status remove antoine injured\n`
        + `${settings.commandPrefix}status view jordan`,
    usableBy: "Moderator",
    aliases: ["status", "inflict", "cure", "view"],
    requiresGame: false
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
    if (!player) return message.reply(`couldn't find player "${args[0]}"`);

    // Find the specified status effect.
    var status = null;
    if (command !== "view") {
        const statusName = input.substring(input.indexOf(args[1]));
        for (let i = 0; i < game.statusEffects.length; i++) {
            if (game.statusEffects[i].name.toLowerCase() === statusName.toLowerCase()) {
                status = game.statusEffects[i];
                break;
            }
        }
        if (!status) return message.reply(`couldn't find status effect "${statusName}"`);
    }

    if (command === "inflict") {
        status.inflict(player, game, true, true);
    }

    /*
    if (command === "status") {
        if (args[0] === "add" || args[0] === "inflict")
            action = "inflict";
        else if (args[0] === "remove" || args[0] === "cure")
            action = "cure";
        else if (args[0] === "view")
            action = "view";
        else {
            message.reply(`invalid argument "${args[0]}. Usage:`);
            message.channel.send(usage);
            return;
        }

        if (args[1]) player = args[1].toLowerCase();
        else {
            message.reply("you need to specify a player. Usage:");
            message.channel.send(usage);
            return;
        }

        if (args[2]) {
            status = args.join(" ");
            status = statusName.substring(statusName.indexOf(args[2])).toLowerCase();
        }

        console.log(player);

    }
    */
    return;
};
