const settings = include('Configs/settings.json');
const serverconfig = include('Configs/serverconfig.json');
const discord = require('discord.js');
const { ChannelType } = require('../node_modules/discord-api-types/v10');

module.exports.execute = async (command, bot, game, message, player, data) => {
    var isBot = isModerator = isPlayer = isEligible = false;
    // First, determine who is using the command.
    if (!message) isBot = true;
    else if ((message.channel.id === serverconfig.commandChannel || command.startsWith('delete')) && message.member.roles.cache.find(role => role.id === serverconfig.moderatorRole)) isModerator = true;
    else {
        // Don't attempt to find the member who sent this message if it was sent by a webhook.
        if (message.webhookId !== null) return;
        let member = await game.guild.members.fetch(message.author.id);
        if (member && member.roles.cache.find(role => role.id === serverconfig.playerRole)) isPlayer = true;
        else if (member && settings.debug && member.roles.cache.find(role => role.id === serverconfig.testerRole)) isEligible = true;
        else if (member && !settings.debug && member.roles.cache.find(role => role.id === serverconfig.eligibleRole)) isEligible = true;
    }

    const commandSplit = command.split(" ");
    const args = commandSplit.slice(1);

    var roleCommands = new discord.Collection();
    if (isBot) roleCommands = bot.configs.filter(config => config.usableBy === "Bot");
    else if (isModerator) roleCommands = bot.configs.filter(config => config.usableBy === "Moderator");
    else if (isPlayer) roleCommands = bot.configs.filter(config => config.usableBy === "Player");
    else if (isEligible) roleCommands = bot.configs.filter(config => config.usableBy === "Eligible");

    let commandConfig = roleCommands.find(command => command.aliases.includes(commandSplit[0].toLowerCase()));
    if (!commandConfig) return false;
    let commandFile = bot.commands.get(commandConfig.name);
    if (!commandFile) return false;
    const commandName = commandConfig.name.substring(0, commandConfig.name.indexOf('_'));

    var entry = null;
    if (bot.commandLog.length >= 10000) {
        bot.commandLog.shift();
    }

    if (isBot) {
        commandFile.run(bot, game, commandSplit[0], args, player, data);
        entry = {
            timestamp: new Date(),
            author: bot.user.username,
            content: command
        };
        bot.commandLog.push(entry);
        return true;
    }
    else if (isModerator) {
        if (commandConfig.requiresGame && !game.inProgress) {
            message.reply("There is no game currently running.");
            return false;
        }
        commandFile.run(bot, game, message, commandSplit[0], args);
        entry = {
            timestamp: new Date(),
            author: message.author.username,
            content: message.content
        };
        bot.commandLog.push(entry);
        return true;
    }
    else if (isPlayer) {
        if (!game.inProgress) {
            message.reply("There is no game currently running.");
            return false;
        }
        if (message.channel.type === ChannelType.DM || serverconfig.roomCategories.includes(message.channel.parentId)) {
            player = null;
            for (let i = 0; i < game.players_alive.length; i++) {
                if (game.players_alive[i].id === message.author.id) {
                    player = game.players_alive[i];
                    break;
                }
            }
            if (player === null) {
                game.messageHandler.addReply(message, "You are not on the list of living players.");
                return false;
            }
            const status = player.getAttributeStatusEffects("disable all");
            if (status.length > 0 && !player.hasAttribute(`enable ${commandName}`)) {
                if (player.statusString.includes("heated")) game.messageHandler.addReply(message, "The situation is **heated**. Moderator intervention is required.");
                else game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);
                return false;
            }
            if (game.editMode && commandName !== "say") {
                game.messageHandler.addReply(message, "You cannot do that because edit mode is currently enabled.");
                return false;
            }

            player.setOnline();

            commandFile.run(bot, game, message, commandSplit[0], args, player).then(() => { if (!settings.debug && commandName !== "say" && message.channel.type !== ChannelType.DM) message.delete().catch(); });
            
            entry = {
                timestamp: new Date(),
                author: player.name,
                content: message.content
            };
            bot.commandLog.push(entry);
            return true;
        }
        return false;
    }
    else if (isEligible) {
        if (!game.inProgress) {
            message.reply("There is no game currently running.");
            return false;
        }
        if ((settings.debug && message.channel.id === serverconfig.testingChannel)
            || (!settings.debug && message.channel.id === serverconfig.generalChannel)) {
            commandFile.run(bot, game, message, args).then(() => { if (!settings.debug) message.delete().catch(); });
            entry = {
                timestamp: new Date(),
                author: message.author.username,
                content: message.content
            };
            bot.commandLog.push(entry);
            return true;
        }
        return false;
    }

    return false;
};
