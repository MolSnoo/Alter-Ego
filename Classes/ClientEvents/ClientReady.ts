// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Client, Collection, Events, PermissionFlagsBits } from "discord.js";
import { readFileSync } from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ClientContext from "../ClientContext.ts";
import ClientEvent from "../ClientEvent.ts";
import type GuildContext from "../GuildContext.ts";
import Game from "../../Data/Game.ts";
import type GameSettings from "../GameSettings.ts";
import { createGuildContext } from "../../Modules/serverManager.ts";
import autoUpdate from "../../Modules/updateHandler.js";
import { loadGameSettingsAndPlayerDefaults } from "../../Modules/settingsLoader.ts";
import ModeratorContext from "../Command/ModeratorContext.ts";
import { MatchedInvocation, ValidatedInvocation } from "../Command/Invocation.ts";

export default new ClientEvent({
    name: Events.ClientReady,
    once: true,
    execute: async (client: Client) => {
        const [guildContext, doSendFirstBootMessage] = await createGuildContext(client);
        const gameSettings = loadGameSettingsAndPlayerDefaults();
        console.log(`${client.user.username} is online in ${client.guilds.cache.first().name}. Initializing...`);
        await checkVersion(guildContext);
        await autoUpdate(gameSettings);
        const game = new Game(guildContext, gameSettings);
        const clientContext = ClientContext.Instance(client, game);
        await clientContext.loadCommands();
        game.setClientContext();
        clientContext.updatePresence();
        if (doSendFirstBootMessage) await sendFirstBootMessage(guildContext, gameSettings);

        // Synchronize the guild with the READ_MESSAGE_HISTORY setting.
        const everyone = guildContext.guild.roles.everyone;
        if (everyone.permissions.has(PermissionFlagsBits.ReadMessageHistory) !== game.settings.readMessageHistory) {
            if (game.settings.readMessageHistory) {
                await everyone.setPermissions(everyone.permissions.add(PermissionFlagsBits.ReadMessageHistory));
            } else {
                await everyone.setPermissions(everyone.permissions.remove(PermissionFlagsBits.ReadMessageHistory));
            }
        }

        // If the AUTO_LOAD setting is true, load all game data now.
        if (gameSettings.autoLoad) {
            console.log("The AUTO_LOAD setting is enabled. Loading and resuming game...");
            let loadCommand = clientContext.getCommand("Moderator", "load");
            if (loadCommand) {
                const context = new ModeratorContext(game, "lar", undefined, undefined);
                const invocation = (await loadCommand.validate(context, new MatchedInvocation())) as ValidatedInvocation;
                await loadCommand.execute(context, invocation);
            }
        }

        // Set the bot as finished initializing.
        clientContext.initialize();
    }
});

/**
 * Checks the version of the program the user is running.
 * If a new version is available, sends a message to the guild's command channel.
 * @param guildContext - The guild to send the update notification to.
 */
async function checkVersion(guildContext: GuildContext): Promise<void> {
    const masterPackageSource = "https://raw.githubusercontent.com/MsVBLANK/Alter-Ego/master/package.json";
    const masterPackage = await fetch(masterPackageSource).then(response => response.json()).catch();
    const localPackagePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json");
    const localPackage = JSON.parse(readFileSync(localPackagePath).toString());
    const repoUrl = "https://github.com/MsVBLANK/Alter-Ego";
    if (masterPackage.version !== localPackage.version && !localPackage.version.endsWith("d")) {
        await guildContext.commandChannel.send(
            `This version of Alter Ego is out of date. `
            + `Please update using Docker or download the latest version from ${repoUrl} at your earliest convenience.`
        );
    }
}

/**
 * Sends a first-time boot message to the guild's command channel.
 * @param guildContext - The guild context to send the message to.
 * @param settings - The game's settings.
 */
async function sendFirstBootMessage(guildContext: GuildContext, settings: GameSettings): Promise<void> {
    let moderatorRole = guildContext.guild.roles.resolve(guildContext.moderatorRole);
    await guildContext.commandChannel.send(
        `Alter Ego is now ready for use. To get started, give yourself the <@&${moderatorRole.id}> role and use the `
        + `\`${settings.commandPrefix}help\` command to learn what you can do. You can issue commands in this channel.\n\n`
        + `If this is your first time using Alter Ego, use the \`${settings.commandPrefix}setupdemo\` command to generate `
        + `a demo environment on the spreadsheet you supplied in your \`.env\` file. Then, you can invite another account `
        + `to the server and use the \`${settings.commandPrefix}addplayer\` or \`${settings.commandPrefix}startgame\` `
        + `command to add them as a player so that you can get a feel for gameplay.\n\n`
        + `For documentation and tutorials on how to use Alter Ego, check out the official docs:\n`
        + `https://msvblank.github.io/Alter-Ego/\n\n`
        + `Good luck, and have fun!`
    );
}
