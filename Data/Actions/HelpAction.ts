// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import type Command from "../../Classes/Command.ts";
import { createPaginatedEmbed } from "../../Modules/discordUtils.ts";
import { addPages } from "../../Modules/helpers.ts";
import type { ButtonInteraction, Collection } from "discord.js";
type CommandHelp = { command: string, description: string };

/**
 * Represents a help action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#help-action
 */
export default class HelpAction extends Action {
    #roleName: string;
    #channel: Messageable;
    readonly #clientDisplayName = this.getGame().guildContext.guild.members.me.displayName;
    readonly #clientAvatar = this.getGame().guildContext.guild.members.me.avatarURL() || this.getGame().guildContext.guild.members.me.user.avatarURL();

    /**
     * Performs a help action.
     *
     * @param role - The role of the user.
     * @param commandAlias - An alias of the command to get help for, if applicable.
     */
    async performHelp(role: "Bot" | "Moderator" | "Player" | "Eligible", commandAlias?: string): Promise<void> {
        if (this.performed) return;
        super.perform();
        if (!this.message) return;
        const roleCommands = await this.#getRoleCommands(role);
        if (commandAlias) {
            if (commandAlias.startsWith(this.getGame().settings.commandPrefix))
                commandAlias = commandAlias.substring(this.getGame().settings.commandPrefix.length);
            commandAlias = commandAlias.toLowerCase();
            const command = roleCommands.find(command => command.config.aliases.includes(commandAlias));
            if (!command) return this.getGame().communicationHandler.reply(this.message, `Couldn't find command "${commandAlias}".`);
            this.getGame().communicationHandler.sendCommandHelp(this.#channel, command);
        }
        else {
            const commandListEntries = this.#createCommandList(roleCommands);
            const commandListPages = this.#paginateCommandList(commandListEntries);
            this.#sendHelpListMessage(commandListPages);
        }
    }

    /**
     * Get all commands available to the user and sort them alphabetically.
     * Also sets the roleName and channel based on the given role.
     * @param role - The role of the user.
     */
    async #getRoleCommands(role: "Bot" | "Moderator" | "Player" | "Eligible"): Promise<Collection<string, Command>> {
        let roleCommands: Collection<string, Command>;
        if (role === "Bot") {
            roleCommands = this.getGame().clientContext.botCommands;
            this.#roleName = "Bot";
            this.#channel = this.getGame().guildContext.commandChannel;
        }
        else if (role === "Moderator") {
            roleCommands = this.getGame().clientContext.moderatorCommands;
            this.#roleName = this.getGame().guildContext.moderatorRole.name;
            this.#channel = this.getGame().guildContext.commandChannel;
        }
        else if (role === "Player") {
            roleCommands = this.getGame().clientContext.playerCommands;
            this.#roleName = this.getGame().guildContext.playerRole.name;
            this.#channel = this.player ? this.player.notificationChannel : await this.message.author.createDM();
        }
        else if (role === "Eligible") {
            roleCommands = this.getGame().clientContext.eligibleCommands;
            this.#roleName = this.getGame().settings.debug ? this.getGame().guildContext.testerRole.name : this.getGame().guildContext.eligibleRole.name;
            this.#channel = await this.message.author.createDM();
        }
        roleCommands.sort(function (a, b) {
            if (a.config.name < b.config.name) return -1;
            if (a.config.name > b.config.name) return 1;
            return 0;
        });
        return roleCommands;
    }

    /**
     * Creates a list of command help entries.
     * @param roleCommands - The available commands.
     */
    #createCommandList(roleCommands: Collection<string, Command>): CommandHelp[] {
        const commandListEntries: CommandHelp[] = [];
        roleCommands.forEach((command, key) => {
            const commandName = key.substring(0, key.indexOf('_'));
            commandListEntries.push({ command: `${this.getGame().settings.commandPrefix}${commandName}`, description: command.config.description });
        });
        return commandListEntries;
    }

    /**
     * Divides the command list into pages.
     * @param commandList - The list of command help entries to paginate.
     */
    #paginateCommandList(commandList: CommandHelp[]): CommandHelp[][] {
        const pages: CommandHelp[][] = [];
        addPages(pages, commandList, 10);
        return pages;
    }

    /**
     * Sends the help list message and edits it when the user requests the next or previous page.
     * @param commandListPages - A list of commands available to the user, separated into pages.
     */
    #sendHelpListMessage(commandListPages: CommandHelp[][]): void {
        let page = 0;
        const embedAuthorName = `${this.#clientDisplayName} Help`;
        const embedAuthorIcon = `${this.#clientAvatar}`;
        const embedDescription = `These are the available commands for users with the ${this.#roleName} role.\n`
            + `Send \`${this.getGame().settings.commandPrefix}help commandname\` for more details.`;
        const fieldName = (entryIndex: number) => commandListPages[page][entryIndex].command;
        const fieldValue = (entryIndex: number) => commandListPages[page][entryIndex].description;
        let embed = createPaginatedEmbed(this.getGame(), page, commandListPages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
        const prevPageCallback = (interaction: ButtonInteraction) => {
            if (page > 0)
                page--;
            embed = createPaginatedEmbed(this.getGame(), page, commandListPages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
            interaction.update({ embeds: [embed] });
        };
        const nextPageCallback = (interaction: ButtonInteraction) => {
            if (page < commandListPages.length - 1)
                page++;
            embed = createPaginatedEmbed(this.getGame(), page, commandListPages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
            interaction.update({ embeds: [embed] });
        };
        let interactables = this.getGame().clientContext.interactableManager.createPaginationInteractables(this, prevPageCallback, nextPageCallback);
        this.getGame().communicationHandler.sendToChannel(this.#channel, undefined, [embed], interactables);
    }
}
