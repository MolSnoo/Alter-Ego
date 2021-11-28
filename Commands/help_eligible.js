const settings = include('settings.json');
const discord = require('discord.js');

module.exports.config = {
    name: "help_eligible",
    description: "Lists all commands available to you.",
    details: "Lists all commands available to the user. If a command is specified, displays the help menu for that command.",
    usage: `${settings.commandPrefix}help\n` +
        `${settings.commandPrefix}help play`,
    usableBy: "Eligible",
    aliases: ["help"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, args, player) => {
    // Get all commands available to the user and sort them alphabetically.
    var roleCommands = new discord.Collection();
    roleCommands = bot.configs.filter(config => config.usableBy === "Eligible");
    roleCommands.sort(function (a, b) {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });

    if (args.length === 0) {
        var fields = [];
        var pages = [];
        var page = 0;

        roleCommands.forEach(function (value, key, map) {
            const commandName = key.substring(0, key.indexOf('_'));
            fields.push({ command: `${settings.commandPrefix}${commandName}`, description: value.description });
        });

        // Divide the fields into pages.
        for (let i = 0, pageNo = 0; i < fields.length; i++) {
            // Divide the menu into groups of 10.
            if (i % 10 === 0) {
                pages.push([]);
                if (i !== 0) pageNo++;
            }
            pages[pageNo].push(fields[i]);
        }

        let embed = createEmbed(game, page, pages);
        message.channel.send({ embeds: [embed] }).then(msg => {
            msg.react('⏪').then(() => {
                msg.react('⏩');

                const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id;
                const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id;

                const backwards = msg.createReactionCollector({ filter: backwardsFilter, time: 60000 });
                const forwards = msg.createReactionCollector({ filter: forwardsFilter, time: 60000 });

                backwards.on("collect", () => {
                    const reaction = msg.reactions.cache.find(reaction => reaction.emoji.name === '⏪');
                    if (reaction) reaction.users.cache.forEach(user => { if (user.id !== bot.user.id) reaction.users.remove(user.id); });
                    if (page === 0) return;
                    page--;
                    embed = createEmbed(game, page, pages);
                    msg.edit({ embeds: [embed] });
                });

                forwards.on("collect", () => {
                    const reaction = msg.reactions.cache.find(reaction => reaction.emoji.name === '⏩');
                    if (reaction) reaction.users.cache.forEach(user => { if (user.id !== bot.user.id) reaction.users.remove(user.id); });
                    if (page === pages.length - 1) return;
                    page++;
                    embed = createEmbed(game, page, pages);
                    msg.edit({ embeds: [embed] });
                });
            });
        });
    }
    else {
        let command = roleCommands.find(command => command.aliases.includes(args[0]));
        if (!command) return message.reply(`couldn't find command "${args[0]}".`);

        const commandName = command.name.charAt(0).toUpperCase() + command.name.substring(1, command.name.indexOf('_'));
        let embed = new discord.MessageEmbed()
            .setColor('1F8B4C')
            .setAuthor(`${commandName} Command Help`, game.guild.iconURL())
            .setDescription(command.description);

        let aliasString = "";
        for (let i = 0; i < command.aliases.length; i++)
            aliasString += `\`${settings.commandPrefix}${command.aliases[i]}\` `;
        embed.addField("Aliases", aliasString);
        embed.addField("Examples", command.usage);
        embed.addField("Description", command.details);

        message.channel.send({ embeds: [embed] });
    }

    return;
};

function createEmbed(game, page, pages) {
    const roleId = settings.debug ? settings.testerRole : settings.eligibleRole;
    const role = game.guild.roles.cache.get(roleId);
    const roleName = role ? role.name : "Eligible";
    let embed = new discord.MessageEmbed()
        .setColor('1F8B4C')
        .setAuthor(`${game.guild.me.displayName} Help`, game.guild.iconURL())
        .setDescription(`These are the available commands for users with the ${roleName} role.\nSend \`${settings.commandPrefix}help commandname\` for more details.`)
        .setFooter(`Page ${page + 1}/${pages.length}`);

    // Now add the fields of the first page.
    for (let i = 0; i < pages[page].length; i++)
        embed.addField(pages[page][i].command, pages[page][i].description);

    return embed;
}
