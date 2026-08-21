// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { InvalidInvocation, MatchedInvocation, ValidatedInvocation, type ValidationResult } from "../../Classes/Command/Invocation.ts";
import { Pattern, Glob } from "../../Classes/Command/Pattern.ts";
import type GameSettings from "../../Classes/GameSettings.ts";
import ModeratorCommand from "../../Classes/Command/ModeratorCommand.ts";
import type ModeratorContext from "../../Classes/Command/ModeratorContext.ts";
import { ChannelType, NewsChannel, StageChannel, TextChannel, VoiceChannel, type PartialDMChannel, type PrivateThreadChannel, type PublicThreadChannel, type User } from "discord.js";
import { getErrorStack } from "../../Modules/errorHandler.ts";
import { sleep } from "../../Modules/helpers.ts";

class DeleteInvocation extends ValidatedInvocation {
    static readonly targetRegex = /(?:<@!?)?(\d{17,20})(?:>)?/;

    /**
     * The user to delete messages from. May be undefined.
     */
    readonly user: User | undefined;

    /**
     * The number of messages to delete.
     */
    readonly count: number;

    /**
     * @param user - The user to delete messages from. May be undefined.
     * @param count - The number of messages to delete.
     */
    constructor(user: User | undefined, count: number) {
        super();
        this.user = user;
        this.count = count;
    }
}

const command = new ModeratorCommand({
    config: {
        name: "delete_moderator",
        description: "Deletes multiple messages at once.",
        details: "Deletes multiple messages at once. You can delete up to 100 messages at a time. Only messages from the past "
            + "2 weeks can be deleted. You can also choose to only delete messages from a certain user. Note that if you "
            + "specify a user and for example, 5 messages, it will not delete that user's last 5 messages. Rather, it will search "
            + "through the past 5 messages, and if any of those 5 messages were sent by the given user, they wil be deleted.\n\n"
            + "This command can be used in any channel in the server.",
        usableBy: "Moderator",
        aliases: ["delete"],
        requiresGame: false
    },

    usage: (settings: GameSettings) => {
        return `${settings.commandPrefix}delete 3\n`
            + `${settings.commandPrefix}delete 100\n`
            + `${settings.commandPrefix}delete @Alter Ego 5\n`
            + `${settings.commandPrefix}delete @tobyp4904 75`;
    },

    patterns: [
        new Pattern([new Glob()]),
    ],

    validate: async (ctx: ModeratorContext, inv: MatchedInvocation): Promise<ValidationResult<DeleteInvocation>> => {
        if (inv.glob.length === 0)
            return new InvalidInvocation([`You need to specify an amount of messages to delete. Usage:\n${command.usage(ctx.game.settings)}`]);
        const match = inv.glob[0].match(DeleteInvocation.targetRegex);
        const user = match ? await ctx.game.clientContext.client.users.fetch(match[0]) : null;
        const amount = parseInt(inv.glob[inv.glob.length - 1]);
        if (isNaN(amount))
            return new InvalidInvocation([`Invalid amount specified.`]);
        if (amount < 1)
            return new InvalidInvocation([`At least one message must be deleted.`]);
        if (amount > 100)
            return new InvalidInvocation([`Only 100 messages can be deleted at a time.`]);
        if (ctx.message.channel.type === ChannelType.DM)
            return new InvalidInvocation([`This command can only be used in a server channel.`])

        return new DeleteInvocation(user, amount);
    },

    execute: async (ctx: ModeratorContext, inv: DeleteInvocation) => {
        // DM channels are filtered out during validation; assert that the channel here is not a DM channel.
        const channel = ctx.message.channel as NewsChannel | PrivateThreadChannel | PublicThreadChannel<boolean> | StageChannel | TextChannel | VoiceChannel;
        let messages = await channel.messages.fetch({ limit: inv.count });
        let size = messages.size;
        if (inv.user) {
            /**
             * @privateRemarks
             * The third operand is unreachable, because `inv.user` will always be truthy in this scope?
             * - AC
             */
            const filterBy = inv.user ? inv.user.id : ctx.game.clientContext.client.user.id;
            messages = messages.filter(message => message.author.id === filterBy);
            const actualMessages = [...messages.values()].slice(0, inv.count);
            size = actualMessages.length;
        }
        try {
            await channel.bulkDelete(messages, true);
            const ephemeral = await channel.send(`Deleted ${size} messages.`);
            await sleep(3000);
            await ephemeral.delete();
        } catch (error) {
            console.log(getErrorStack(error));
        }
    },
});

export default command;
