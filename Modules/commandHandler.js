const settings = include('settings.json');
const discord = require('discord.js');

module.exports.execute = async (command, bot, game, message, player) => {
    var isBot = isModerator = isPlayer = isEligible = false;
    // First, determine who is using the command.
    if (!message) isBot = true;
    else if (message.channel.id === settings.commandChannel && message.member.roles.find(role => role.id === settings.moderatorRole)) isModerator = true;
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
    if (!commandConfig) return false;
    let commandFile = bot.commands.get(commandConfig.name);
    if (!commandFile) return false;

    if (isBot) {
        commandFile.run(bot, game, commandSplit[0], args, player);
        return true;
    }
    else if (isModerator) {
        if (commandConfig.requiresGame && !game.game) {
            message.reply("There is no game currently running.");
            return false;
        }
        commandFile.run(bot, game, message, commandSplit[0], args);
        return true;
    }
    else if (isPlayer) {
        if (!game.game) {
            message.reply("There is no game currently running.");
            return false;
        }
        if (message.channel.type === "dm" || settings.roomCategories.includes(message.channel.parentID)) {
            player = null;
            for (let i = 0; i < game.players_alive.length; i++) {
                if (game.players_alive[i].id === message.author.id) {
                    player = game.players_alive[i];
                    break;
                }
            }
            if (player === null) {
                message.reply("You are not on the list of living players.");
                return false;
            }
            const status = player.getAttributeStatusEffects("disable all");
            if (status.length > 0) {
                if (player.statusString.includes("heated")) message.reply("the situation is **heated**. Moderator intervention is required.");
                else message.reply(`You cannot do that because you are **${status[0].name}**.`);
                return false;
            }

            commandFile.run(bot, game, message, commandSplit[0], args, player).then(() => { if (!settings.debug) message.delete().catch(); });
            return true;
        }
        return false;
    }
    else if (isEligible) {
        if (!game.game) {
            message.reply("There is no game currently running.");
            return false;
        }
        if ((settings.debug && message.channel.id === settings.testingChannel)
            || (!settings.debug && message.channel.id === settings.generalChannel)) {
            commandFile.run(bot, game, message, args).then(() => { if (!settings.debug) message.delete().catch(); });
            return true;
        }
        return false;
    }

    return false;
};
