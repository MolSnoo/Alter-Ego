// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Action from "../Action.ts";
import Gesture from "../Gesture.ts";
import { addPages } from "../../Modules/helpers.ts";
import { createPaginatedEmbed } from "../../Modules/discordUtils.ts";
import type { ButtonInteraction } from "discord.js";

/**
 * Represents a gesture action.
 *
 * @see https://msvblank.github.io/Alter-Ego/reference/data_structures/action.html#gesture-action
 */
export default class GestureAction extends Action {
    /**
     * Performs a gesture action.
     *
     * @param gesture - The gesture to perform.
     * @param targetType - The type of entity to target.
     * @param target - The entity to target.
     */
    performGesture(gesture: Gesture, targetType: string, target: GestureTarget | null): void {
        if (this.performed) return;
        super.perform();
        let newGesture = new Gesture(gesture.id, [...gesture.requires], [...gesture.disabledStatusesStrings], gesture.description, gesture.narration.text, gesture.row, this.getGame());
        newGesture.targetType = targetType;
        newGesture.target = target;
        this.getGame().narrationHandler.narrateGesture(this, newGesture, this.player);
        this.getGame().logHandler.logGesture(gesture, target, this.player, this.forced);
        this.successMessage = `Successfully made ${this.player.name} perform gesture ${gesture.id}.`;
    }

    /**
     * Performs a gesture list action.
     */
    performGestureList(): void {
        if (this.performed) return;
        super.perform();
        const gestures = this.getGame().entityFinder.getGestures().filter(gesture => gesture.disabledStatuses.every(status => this.player === undefined || !this.player.hasStatus(status.id)));
        const pages: Gesture[][] = [];
        addPages(pages, gestures, 15);
        let page = 0;
        const embedAuthorName = `Gestures List`;
        const embedAuthorIcon = this.getGame().guildContext.guild.members.me.avatarURL() || this.getGame().guildContext.guild.members.me.user.avatarURL();
        const playerAppendString = this.player ? ` ${this.forced ? this.player.name : `you`} can currently perform` : ``;
        const embedDescription = `These are all of the gestures${playerAppendString}.\n`
            + `For more information on the gesture command, send \`${this.getGame().settings.commandPrefix}help gesture\`.`;
        const fieldName = (entryIndex: number) => pages[page][entryIndex].id;
        const fieldValue = (entryIndex: number) => pages[page][entryIndex].description;
        let embed = createPaginatedEmbed(this.getGame(), page, pages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
        const prevPageCallback = (interaction: BotInteraction) => {
            if (!interaction.isButton()) return;
            if (page > 0)
                page--;
            embed = createPaginatedEmbed(this.getGame(), page, pages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
            interaction.update({ embeds: [embed] });
        };
        const nextPageCallback = (interaction: BotInteraction) => {
            if (!interaction.isButton()) return;
            if (page < pages.length - 1)
                page++;
            embed = createPaginatedEmbed(this.getGame(), page, pages, embedAuthorName, embedAuthorIcon, embedDescription, fieldName, fieldValue);
            interaction.update({ embeds: [embed] });
        };
        let interactables = this.getGame().clientContext.interactableManager.createPaginationInteractables(this, prevPageCallback, nextPageCallback);
        const channel = this.forced ? this.getGame().guildContext.commandChannel : this.player.notificationChannel;
        this.getGame().communicationHandler.sendToChannel(channel, undefined, [embed], interactables);
    }
}
