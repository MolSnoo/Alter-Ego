import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import { Message } from 'discord.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { EmbedBuilder } from 'discord.js';

/** @type {CommandConfig} */
export const config = {
    name: "help_moderator",
    description: "Lists all commands available to you.",
    details: "Lists all commands available to the user. If a command is specified, displays the help menu for that command.",
    usableBy: "Moderator",
    aliases: ["help"],
    requiresGame: false
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}help\n` +
        `${settings.commandPrefix}help status`;
}

/**
 * @param {Game} game 
 * @param {Message} message 
 * @param {string} command 
 * @param {string[]} args 
 */
export async function execute (game, message, command, args) {
    // Get all commands available to the user and sort them alphabetically.
    let roleCommands = game.botContext.moderatorCommands;
    roleCommands.sort(function (a, b) {
        if (a.config.name < b.config.name) return -1;
        if (a.config.name > b.config.name) return 1;
        return 0;
    });

    if (args.length === 0) {
        var fields = [];
        var pages = [];
        var page = 0;

        roleCommands.forEach(function (value, key, map) {
            const commandName = key.substring(0, key.indexOf('_'));
            fields.push({ command: `${game.settings.commandPrefix}${commandName}`, description: value.config.description });
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
        game.guildContext.commandChannel.send({ embeds: [embed] }).then(msg => {
            msg.react('⏪').then(() => {
                msg.react('⏩');

                const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id;
                const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id;

                const backwards = msg.createReactionCollector({ filter: backwardsFilter, time: 60000 });
                const forwards = msg.createReactionCollector({ filter: forwardsFilter, time: 60000 });

                backwards.on("collect", () => {
                    const reaction = msg.reactions.cache.find(reaction => reaction.emoji.name === '⏪');
                    if (reaction) reaction.users.cache.forEach(user => { if (user.id !== game.botContext.client.user.id) reaction.users.remove(user.id); });
                    if (page === 0) return;
                    page--;
                    embed = createEmbed(game, page, pages);
                    msg.edit({ embeds: [embed] });
                });

                forwards.on("collect", () => {
                    const reaction = msg.reactions.cache.find(reaction => reaction.emoji.name === '⏩');
                    if (reaction) reaction.users.cache.forEach(user => { if (user.id !== game.botContext.client.user.id) reaction.users.remove(user.id); });
                    if (page === pages.length - 1) return;
                    page++;
                    embed = createEmbed(game, page, pages);
                    msg.edit({ embeds: [embed] });
                });
            });
        });
    }
    else {
        let command = roleCommands.find(command => command.config.aliases.includes(args[0]));
        if (!command) return messageHandler.addReply(game, message, `Couldn't find command "${args[0]}".`);
        messageHandler.addCommandHelp(game, game.guildContext.commandChannel, command);
    }

    return;
}

function createEmbed(game, page, pages) {
    const role = game.guildContext.guild.roles.cache.get(game.guildContext.moderatorRole);
    const roleName = role ? role.name : "Moderator";
    let embed = new EmbedBuilder()
        .setColor(game.settings.embedColor)
        .setAuthor({ name: `${game.guildContext.guild.members.me.displayName} Help`, iconURL: game.guildContext.guild.members.me.avatarURL() || game.guildContext.guild.members.me.user.avatarURL() })
        .setDescription(`These are the available commands for users with the ${roleName} role.\nSend \`${game.settings.commandPrefix}help commandname\` for more details.`)
        .setFooter({ text: `Page ${page + 1}/${pages.length}` });

    let fields = [];
    // Now add the fields of the first page.
    for (let i = 0; i < pages[page].length; i++)
        fields.push({ name: pages[page][i].command, value: pages[page][i].description })
    embed.addFields(fields);

    return embed;
}
