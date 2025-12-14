import GameSettings from '../Classes/GameSettings.js';
import Game from '../Data/Game.js';
import Player from '../Data/Player.js';
import * as messageHandler from '../Modules/messageHandler.js';
import { createPaginatedEmbed } from '../Modules/helpers.js';
import { Message } from "discord.js";

/** @type {CommandConfig} */
export const config = {
    name: "help_player",
    description: "Lists all commands available to you.",
    details: "Lists all commands available to the user. If a command is specified, displays the help menu for that command.",
    usableBy: "Player",
    aliases: ["help"],
    requiresGame: true
};

/**
 * @param {GameSettings} settings 
 * @returns {string} 
 */
export function usage (settings) {
    return `${settings.commandPrefix}help\n` +
        `${settings.commandPrefix}help move`;
}

/**
 * @param {Game} game - The game in which the command is being executed. 
 * @param {Message} message - The message in which the command was issued. 
 * @param {string} command - The command alias that was used. 
 * @param {string[]} args - A list of arguments passed to the command as individual words. 
 * @param {Player} player - The player who issued the command. 
 */
export async function execute (game, message, command, args, player) {
    // Get all commands available to the user and sort them alphabetically.
    let roleCommands = game.botContext.playerCommands;
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

        const embedAuthorName = `${game.guildContext.guild.members.me.displayName} Help`;
        const embedAuthorIcon = game.guildContext.guild.members.me.avatarURL() || game.guildContext.guild.members.me.user.avatarURL();
        const embedDescription = `These are the available commands for users with the ${game.guildContext.playerRole.name} role.\nSend \`${game.settings.commandPrefix}help commandname\` for more details.`
        const fieldName = (entryIndex) => pages[page][entryIndex].command;
        const fieldValue = (entryIndex) => pages[page][entryIndex].description;
        let embed = createPaginatedEmbed(game, page, pages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
        message.author.send({ embeds: [embed] }).then(msg => {
            msg.react('⏪').then(() => {
                msg.react('⏩');

                const backwardsFilter = (reaction, user) => reaction.emoji.name === '⏪' && user.id === message.author.id;
                const forwardsFilter = (reaction, user) => reaction.emoji.name === '⏩' && user.id === message.author.id;

                const backwards = msg.createReactionCollector({ filter: backwardsFilter, time: 60000 });
                const forwards = msg.createReactionCollector({ filter: forwardsFilter, time: 60000 });

                backwards.on("collect", () => {
                    if (page === 0) return;
                    page--;
                    embed = createPaginatedEmbed(game, page, pages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
                    msg.edit({ embeds: [embed] });
                });

                forwards.on("collect", () => {
                    if (page === pages.length - 1) return;
                    page++;
                    embed = createPaginatedEmbed(game, page, pages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
                    msg.edit({ embeds: [embed] });
                });
            });
        });
    }
    else {
        let command = roleCommands.find(command => command.config.aliases.includes(args[0]));
        if (!command) return messageHandler.addReply(game, message, `Couldn't find command "${args[0]}".`);
        messageHandler.addCommandHelp(game, message.author.dmChannel, command);
    }

    return;
}
