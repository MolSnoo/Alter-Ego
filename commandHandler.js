const discord = require("discord.js");
const settings = require("./settings.json");

Map.prototype.inspect = function () {
    return `Map(${mapEntriesToString(this.entries())})`;
};

function mapEntriesToString(entries) {
    return Array
        .from(entries, ([k, v]) => `\n  ${k}: ${v}`)
        .join("") + "\n";
}

module.exports.execute = function (command, bot, game, message) {
    var isBot = isModerator = isPlayer = false;
    // First, determine who is using the command.
    if (!message) isBot = true;
    else if (message.member.roles.find(role => role.id === settings.moderatorRole) && message.channel.id === settings.commandsChannel) isModerator = true;
    else {
        let member = game.guild.members.find(member => member.id === message.author.id);
        if (member && member.roles.find(role => role.id === settings.playerRole)) isPlayer = true;
    }

    const commandSplit = command.split(" ");
    const args = commandSplit.slice(1);

    var roleCommands;
    if (isBot) roleCommands = bot.configs.filter(config => config.usableBy === "Bot");
    else if (isModerator) roleCommands = bot.configs.filter(config => config.usableBy === "Moderator");
    else if (isPlayer) roleCommands = bot.configs.filter(config => config.usableBy === "Player");

    let commandConfig = roleCommands.find(command => command.aliases.includes(commandSplit[0]));
    if (!commandConfig) return;
    let commandFile = bot.commands.get(commandConfig.name);
    if (!commandFile) return;
    commandFile.run(bot, game, message, args).then(() => { if (!settings.debug) message.delete().catch(); });
};