// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { InvalidInvocation, ValidatedInvocation, type MatchedInvocation, type ValidationResult } from "../../Classes/Command/Invocation.ts";
import { Pattern, Glob } from "../../Classes/Command/Pattern.ts";
import type GameSettings from "../../Classes/GameSettings.ts";
import ModeratorCommand from "../../Classes/Command/ModeratorCommand.ts";
import type ModeratorContext from "../../Classes/Command/ModeratorContext.ts";
import { createCategory, registerRoomCategory } from "../../Modules/serverManager.ts";

const command = new ModeratorCommand({
    config: {
        name: "createroomcategory_moderator",
        description: "Creates a room category.",
        details: `Creates a room category channel with the given name. The ID of the new category channel will automatically be `
            + `added to the \`roomCategories\` setting in your \`serverconfig.json\` file. If a room category with the given name `
            + `already exists, but its ID hasn't been registered in the \`roomCategories\` setting, it will automatically be added.\n\n`
            + `Keep in mind that if \`ROOM_CATEGORIES\` is set in your \`.env\` file, room categories registered with this command `
            + `will not persist when the bot is rebooted. For that reason, the \`ROOM_CATEGORIES\` setting should not be set `
            + `unless you plan to manage room category IDs manually. To do this, you will have to create a category channel in `
            + `Discord without using this command, and add its ID to the \`ROOM_CATEGORIES\` setting manually, then reboot the bot.`,
        usableBy: "Moderator",
        aliases: ["createroomcategory", "register"],
        requiresGame: false
    },

    usage: (settings: GameSettings) => {
        return `${settings.commandPrefix}createroomcategory Floor 1\n`
            + `${settings.commandPrefix}register Floor 2`;
    },

    patterns: [
        new Pattern([new Glob()]),
    ],

    validate: async (ctx: ModeratorContext, inv: MatchedInvocation): Promise<ValidationResult<ValidatedInvocation>> => {
        if (inv.glob.length === 0)
            return new InvalidInvocation([`You need to give a name to the new room category. Usage:\n${command.usage(ctx.game.settings)}`]);

        return new ValidatedInvocation({ glob: inv.glob });
    },

    execute: async (ctx: ModeratorContext, inv: ValidatedInvocation) => {
        const input = inv.glob.join(" ");
        let channel = ctx.game.guildContext.guild.channels.cache.find(channel => channel.name.toLowerCase() === input.toLowerCase() && channel.parentId === null);
        if (channel) {
            const response = await registerRoomCategory(ctx.game, channel);
            ctx.game.communicationHandler.sendToCommandChannel(response);
        }
        else {
            try {
                channel = await createCategory(ctx.game.guildContext.guild, input);
                const response = await registerRoomCategory(ctx.game, channel);
                ctx.game.communicationHandler.sendToCommandChannel(response);
            }
            catch (err) {
                ctx.game.communicationHandler.sendToCommandChannel(String(err));
            }
        }
    },
});

export default command;
