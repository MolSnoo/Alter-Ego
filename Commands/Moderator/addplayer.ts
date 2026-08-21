// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { InvalidInvocation, ValidatedInvocation, type MatchedInvocation, type ValidationResult } from "../../Classes/Command/Invocation.ts";
import { Pattern, Glob } from "../../Classes/Command/Pattern.ts";
import type GameSettings from "../../Classes/GameSettings.ts";
import ModeratorCommand from "../../Classes/Command/ModeratorCommand.ts";
import type ModeratorContext from "../../Classes/Command/ModeratorContext.ts";
import Player from "../../Data/Player.ts";
import { Collection, type GuildMember } from "discord.js";
import Room from "../../Data/Room.ts";
import { loadPlayerDefaults } from "../../Modules/settingsLoader.ts";
import Game from "../../Data/Game.ts";
import { appendRowsToSheet } from "../../Modules/sheets.js";

class AddPlayerInvocation extends ValidatedInvocation {
    static readonly targetRegex = /(?:<@!?)?(\d{17,20})(?:>)?/;

    /**
     * The guild member to be added to the game as a player.
     */
    readonly member: GuildMember;

    /**
     * The name to use for the player.
     */
    readonly name: string;

    /**
     * The notification channel to use for the player.
     */
    readonly notificationChannel: Messageable;

    /**
     * @param member - The guild member to be added to the game as a player.
     * @param name - The name to use for the new player.
     * @param notificationChannel - The notification channel to use for the player.
     */
    constructor(member: GuildMember, name: string, notificationChannel: Messageable) {
        super();
        this.member = member;
        this.name = name;
        this.notificationChannel = notificationChannel;
    }
}

const command = new ModeratorCommand({
    config: {
        name: "addplayer_moderator",
        description: "Adds a player to the game.",
        details: "Adds a user to the list of players for the current game. This command will give the specified user the "
            + "Player role and add their data to the Players and Inventory Items spreadsheets. This will be generated "
            + "using the data in the \`Player Defaults\` section of your \`.env\` file. However, their name will be set as "
            + "whatever their current nickname is in the server. So, you should set their nickname to their character's "
            + "name before using this command. Note that edit mode must be turned on in order to use this command. "
            + "After using this command, you may edit the new player's data. Then, the Players sheet must be loaded, "
            + "otherwise the new player will not be created correctly, and their data may be overwritten.",
        usableBy: "Moderator",
        aliases: ["addplayer"],
        requiresGame: false
    },

    usage: (settings: GameSettings) => {
        return `${settings.commandPrefix}addplayer @cella`;
    },

    patterns: [
        new Pattern([new Glob()]),
    ],

    validate: async (ctx: ModeratorContext, inv: MatchedInvocation): Promise<ValidationResult<AddPlayerInvocation>> => {
        if (ctx.game.inProgress && !ctx.game.editMode)
            return new InvalidInvocation([`You cannot add a player to the spreadsheet while edit mode is disabled. Please turn edit mode on before using this command.`]);

        if (inv.glob.length !== 0)
            return new InvalidInvocation([`You need to mention a user to add. Usage:\n${command.usage(ctx.game.settings)}`]);

        const match = inv.glob[0].match(AddPlayerInvocation.targetRegex);
        if (match[0] === null)
            return new InvalidInvocation([`You need to mention a user to add. Usage:\n${command.usage(ctx.game.settings)}`]);

        const snowflake = match[0];
        const member = await ctx.game.guildContext.guild.members.fetch(snowflake);
        if (!member)
            return new InvalidInvocation([`Couldn't find <@${snowflake}> in the server. If the user you want isn't appearing in Discord's suggestions, type @ and enter their full username.`]);

        for (const player of ctx.game.players.values())
            if (member.id === player.id)
                return new InvalidInvocation(["That user is already playing."]);

        const playerName = Player.generateValidName(member.displayName);
        if (!playerName || playerName === "")
            return new InvalidInvocation([`<@${member.id}>'s username consists entirely of invalid characters. Please set their nickname first, preferably without any spaces or special characters.`]);

        let notificationChannel: Messageable | undefined;
        try {
            notificationChannel = await ctx.game.guildContext.createDM(member);
        } catch (error) {
            console.error(error);
            return new InvalidInvocation([`Couldn't create a DM channel with <@${member.id}>. Please ask them to allow direct messages from server members in their privacy settings for this server.`])
        }

        return new AddPlayerInvocation(member, playerName, notificationChannel);
    },

    execute: async (ctx: ModeratorContext, inv: AddPlayerInvocation) => {
        const spectateChannel = await ctx.game.guildContext.getOrCreateSpectateChannel(Room.generateValidId(inv.name));

        const [playerdefaults] = loadPlayerDefaults();
        const player = new Player(
            inv.member.id,
            inv.member,
            inv.name,
            "",
            "neutral",
            "an average voice",
            playerdefaults.defaultStats,
            true,
            playerdefaults.defaultLocation,
            "",
            [],
            playerdefaults.defaultDescription,
            new Collection(),
            inv.notificationChannel,
            spectateChannel,
            0,
            ctx.game
        );

        // Only add them to the player collections if an actual game isn't currently ongoing.
        const addPlayer = !ctx.game.inProgress || ctx.game.canJoin;
        if (addPlayer) {
            ctx.game.players.set(Game.generateValidEntityName(player.name), player);
            ctx.game.livingPlayers.set(Game.generateValidEntityName(player.name), player);
        }
        inv.member.roles.add(ctx.game.guildContext.playerRole);

        const playerCells = [];
        const inventoryCells = [];
        playerCells.push([
            player.id,
            player.name,
            player.title,
            player.pronounString,
            player.originalVoiceString,
            String(player.defaultStrength),
            String(player.defaultPerception),
            String(player.defaultDexterity),
            String(player.defaultSpeed),
            String(player.defaultStamina),
            player.alive ? "TRUE" : "FALSE",
            player.locationDisplayName,
            player.hidingSpot,
            playerdefaults.defaultStatusEffects,
            player.description.text
        ]);

        for (let i = 0; i < playerdefaults.defaultInventory.length; i++) {
            let row = [player.name];
            row = row.concat(playerdefaults.defaultInventory[i]);
            for (let j = 0; j < row.length; j++) {
                if (row[j].includes('#'))
                    row[j] = row[j].replace(/#/g, String(ctx.game.players.size + (addPlayer ? 0 : 1)));
            }
            inventoryCells.push(row);
        }

        try {
            await appendRowsToSheet(ctx.game.constants.playerSheetDataCells, playerCells, ctx.game.settings.spreadsheetID, true);
            await appendRowsToSheet(ctx.game.constants.inventorySheetDataCells, inventoryCells, ctx.game.settings.spreadsheetID, true);
            ctx.game.loadedEntitiesWithErrors.add("Players");
    
            const successMessage = `<@${inv.member.id}> has been added to the game. `
                + "After making any desired changes to the players and inventory items sheets, be sure to load players before disabling edit mode.";
            ctx.game.communicationHandler.sendToCommandChannel(successMessage);
        }
        catch (err) {
            const errorMessage = `<@${inv.member.id}> has been added to the game, but there was an error saving the data to the spreadsheet. `
                + "It is recommended that you add their data to the spreadsheet manually, then load it before proceeding. Error:\n```" + err + "```";
            ctx.game.communicationHandler.sendToCommandChannel(errorMessage);
        }
    },
});

export default command;
