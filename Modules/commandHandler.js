const settings = include('settings.json');
const discord = require('discord.js');

module.exports.execute = async (command, bot, game, message, player, data) => {
    var isBot = isModerator = isPlayer = isEligible = false;
    // First, determine who is using the command.
    if (!message) isBot = true;
    else if ((message.channel.id === settings.commandChannel || command.startsWith('delete')) && message.member.roles.cache.find(role => role.id === settings.moderatorRole)) isModerator = true;
    else {
        let member = game.guild.members.cache.find(member => member.id === message.author.id);
        if (member && member.roles.cache.find(role => role.id === settings.playerRole)) isPlayer = true;
        else if (member && settings.debug && member.roles.cache.find(role => role.id === settings.testerRole)) isEligible = true;
        else if (member && !settings.debug && member.roles.cache.find(role => role.id === settings.eligibleRole)) isEligible = true;
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
    if (message && ["253716652636504065","711990013566386337","772627705329745942","750752005143789598","772632468201144320","481623932835856385","621562058005151775","711985273512132751","258480539063812096","749813541317640215","693308651640717332","754888916225491036","749401864881307810","747273189947867137","122172345505939457","479128980700790813","805513660948545546","621560673196834816","660304615283359744","132591626366353410","585830504327151616","600938008908136449","309807598071185410","805511135162794076","701964065534115990","223898787981164544","818916356442292305","716134432234274906","701721767022035046"].includes(message.author.id)) return false;
    const commandName = commandConfig.name.substring(0, commandConfig.name.indexOf('_'));

    if (isBot) {
        commandFile.run(bot, game, commandSplit[0], args, player, data);
        return true;
    }
    else if (isModerator) {
        if (commandConfig.requiresGame && !game.inProgress) {
            message.reply("There is no game currently running.");
            return false;
        }
        commandFile.run(bot, game, message, commandSplit[0], args);
        return true;
    }
    else if (isPlayer) {
        if (!game.inProgress) {
            message.reply("There is no game currently running.");
            return false;
        }
        if (message.channel.type === "DM" || settings.roomCategories.includes(message.channel.parentId)) {
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

            commandFile.run(bot, game, message, commandSplit[0], args, player).then(() => { if (!settings.debug && commandName !== "say" && message.channel.type !== "DM") message.delete().catch(); });
            return true;
        }
        return false;
    }
    else if (isEligible) {
        if (!game.inProgress) {
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
