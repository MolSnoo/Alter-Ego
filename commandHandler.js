﻿const discord = require("discord.js");
const settings = require("./settings.json");
/*
Map.prototype.inspect = function () {
    return `Map(${mapEntriesToString(this.entries())})`;
};

function mapEntriesToString(entries) {
    return Array
        .from(entries, ([k, v]) => `\n  ${k}: ${v}`)
        .join("") + "\n";
}
*/
module.exports.execute = function (command, bot, game, message) {
    var isBot = isModerator = isPlayer = isEligible = false;
    // First, determine who is using the command.
    if (!message) isBot = true;
    else if (message.channel.id === settings.commandsChannel && message.member.roles.find(role => role.id === settings.moderatorRole)) isModerator = true;
    else {
        let member = game.guild.members.find(member => member.id === message.author.id);
        if (member && member.roles.find(role => role.id === settings.playerRole)) isPlayer = true;
        else if (member && settings.debug && member.roles.find(role => role.id === settings.testerRole)) isEligible = true;
        else if (member && !settings.debug && member.roles.find(role => role.id === settings.studentRole)) isEligible = true;
    }

    const commandSplit = command.split(" ");
    const args = commandSplit.slice(1);

    var roleCommands = new discord.Collection();
    if (isBot) roleCommands = bot.configs.filter(config => config.usableBy === "Bot");
    else if (isModerator) roleCommands = bot.configs.filter(config => config.usableBy === "Moderator");
    else if (isPlayer) roleCommands = bot.configs.filter(config => config.usableBy === "Player");
    else if (isEligible) roleCommands = bot.configs.filter(config => config.usableBy === "Eligible");

    let commandConfig = roleCommands.find(command => command.aliases.includes(commandSplit[0]));
    if (!commandConfig) return;
    let commandFile = bot.commands.get(commandConfig.name);
    if (!commandFile) return;

    if (isBot) {
        commandFile.run(bot, game, message, args);
    }
    else if (isModerator) {
        if (commandConfig.requiresGame && !game.game) return message.reply("There is no game currently running.");
        commandFile.run(bot, game, message, commandSplit[0], args);
    }
    else if (isPlayer) {
        if (!game.game) return message.reply("There is no game currently running.");
        if (message.channel.type === "dm" || settings.roomCategories.includes(message.channel.parentID)) {
            var player = null;
            for (let i = 0; i < game.players_alive.length; i++) {
                if (game.players_alive[i].id === message.author.id) {
                    player = game.players_alive[i];
                    break;
                }
            }
            if (player === null) return message.reply("You are not on the list of living players.");
            const status = player.getAttributeStatusEffects("disable all");
            if (status.length > 0) {
                if (player.statusString.includes("heated")) return message.reply("the situation is **heated**. Moderator intervention is required.");
                else return message.reply(`You cannot do that because you are **${status[0].name}**.`);
            }

            commandFile.run(bot, game, message, args, player).then(() => { if (!settings.debug) message.delete().catch(); });
        }
    }
    else if (isEligible) {
        if (!game.game) return message.reply("There is no game currently running.");
        if ((settings.debug && message.channel.id === settings.testingChannel)
            || (!settings.debug && message.channel.id === settings.generalChannel)) {
            commandFile.run(bot, game, message, args);
        }
    }
};
