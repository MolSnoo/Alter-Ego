const settings = include('Configs/settings.json');
const serverconfig = include('Configs/serverconfig.json');
const discord = require('discord.js');
const {localizeFormat} = require("../crates/localize");

module.exports.config = {
    name: "help_player",
    description: "Lists all commands available to you.",
    details: "Lists all commands available to the user. If a command is specified, displays the help menu for that command.",
    usage: `${settings.commandPrefix}help\n` +
        `${settings.commandPrefix}help move`,
    usableBy: "Player",
    aliases: ["help"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    // Get all commands available to the user and sort them alphabetically.
    var roleCommands = new discord.Collection();
    roleCommands = bot.configs.filter(config => config.usableBy === "Player");
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
            fields.push({command: `${settings.commandPrefix}${commandName}`, description: value.description});
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
        message.author.send({embeds: [embed]}).then(msg => {
            msg.react('⏪').then(() => {
                msg.react('⏩');

                const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id;
                const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id;

                const backwards = msg.createReactionCollector({filter: backwardsFilter, time: 60000});
                const forwards = msg.createReactionCollector({filter: forwardsFilter, time: 60000});

                backwards.on("collect", () => {
                    if (page === 0) return;
                    page--;
                    embed = createEmbed(game, page, pages);
                    msg.edit({embeds: [embed]});
                });

                forwards.on("collect", () => {
                    if (page === pages.length - 1) return;
                    page++;
                    embed = createEmbed(game, page, pages);
                    msg.edit({embeds: [embed]});
                });
            });
        });
    } else {
        let command = roleCommands.find(command => command.aliases.includes(args[0]));
        if (!command) return game.messageHandler.addReply(message, `Couldn't find command "${args[0]}".`);

        const commandName = command.name.charAt(0).toUpperCase() + command.name.substring(1, command.name.indexOf('_'));
        let embed = new discord.EmbedBuilder()
            .setColor('1F8B4C')
            .setAuthor({name: `${commandName} Command Help`, iconURL: game.guild.iconURL()})
            .setDescription(command.description);

        let aliasString = "";
        for (let i = 0; i < command.aliases.length; i++)
            aliasString += `\`${settings.commandPrefix}${command.aliases[i]}\` `;
        embed.addFields([
            {name: "Aliases", value: aliasString},
            {name: "Examples", value: command.usage},
            {name: "Description", value: command.details}
        ]);

        message.channel.send({embeds: [embed]});
    }

    return;
};

function createEmbed(game, page, pages) {
    const role = game.guild.roles.cache.get(serverconfig.playerRole);
    const roleName = role ? role.name : "Player";
    let embed = new discord.EmbedBuilder()
        .setColor('1F8B4C')
        .setAuthor({
            name: localizeFormat("helpAuthor", [game.guild.members.me.displayName]),
            iconURL: game.guild.iconURL()
        })
        .setDescription(localizeFormat("helpDescription", [roleName, settings.commandPrefix]))
        .setFooter({text: `Page ${page + 1}/${pages.length}`});

    let fields = [];
    // Now add the fields of the first page.
    for (let i = 0; i < pages[page].length; i++)
        fields.push({name: pages[page][i].command, value: pages[page][i].description})
    embed.addFields(fields);

    return embed;
}
