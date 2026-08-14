// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Interactable from "./Interactable.ts";
import { InteractableType } from "../../Modules/enums.ts";
import { ButtonBuilder, ButtonStyle } from "discord.js";

/**
 * Represents a button message component to change the page of a menu.
 */
export default abstract class PaginationInteractable extends Interactable {
    /**
     * The callback function to execute when this button is pressed.
     */
    readonly callback: (interaction: BotInteraction) => void;
    /**
     * The label of the component.
     */
    readonly label: string;
    /**
     * The style to apply to the button.
     */
    readonly style: ButtonStyle;
    /**
     * The emoji to apply to the button.
     */
    readonly emoji: string | undefined;
    /**
     * The button component created from this interactable.
     */
    readonly component: ButtonBuilder;

    /**
     * @param customId - The custom ID of the interactable.
     * @param callback - The callback function to execute when this button is pressed.
     * @param label - The label of the component.
     * @param style - The style to apply to the button, if applicable. Defaults to Secondary.
     * @param emoji - The emoji to apply to the button, if applicable.
     * @param priority - The priority level of the interactable. This determines how high up it will appear in a list of interactable components. Defaults to 0 (highest priority).
     * @param respondWithModal - Whether to respond to an interaction with a modal. Defaults to false.
     */
    protected constructor(customId: string, callback: (interaction: BotInteraction) => void, label: string, style = ButtonStyle.Secondary, emoji?: string, priority = 0, respondWithModal = false) {
        super(InteractableType.BUTTON, customId, priority, respondWithModal);
        this.callback = callback;
        this.label = label;
        this.style = style;
        this.emoji = emoji;
        this.component = new ButtonBuilder().setCustomId(this.customId).setLabel(this.label).setStyle(this.style);
        if (this.emoji)
            this.component.setEmoji(this.emoji);
    }

    /**
     * Sets the interactable as disabled.
     */
    disable() {
        this.component.setDisabled(true);
    }
}
