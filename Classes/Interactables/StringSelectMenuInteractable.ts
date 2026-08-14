// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ActionDirectiveInteractable from "./ActionDirectiveInteractable.ts";
import StringSelectMenuOptionInteractable from "./StringSelectMenuOptionInteractable.ts";
import { InteractableType } from "../../Modules/enums.ts";
import { StringSelectMenuBuilder } from "discord.js";
import type ActionDirective from "../ActionDirective.ts";

/**
 * Represents a string select menu message component.
 */
export default class StringSelectMenuInteractable extends ActionDirectiveInteractable {
    /**
     * An array of options. Maximum size is 25.
     */
    readonly options: StringSelectMenuOptionInteractable[];
    /**
     * The placeholder to apply for the string select menu.
     */
    readonly placeholder?: string;
    /**
     * The string select menu component created from this interactable.
     */
    readonly component: StringSelectMenuBuilder;
    static readonly OPTION_LIMIT = 25;
    static readonly PLACEHOLDER_CHARACTER_LIMIT = 150;

    /**
     * @param actionDirective - The action directive of the interactable.
     * @param options - An array of options. Maximum size is 25.
     * @param placeholder - The placeholder to apply for the string select menu. Optional.
     * @param priority - The priority level of the interactable. This determines how high up it will appear in a list of interactable components. Defaults to 1 (second-highest priority).
     * @param respondWithModal - Whether to respond to an interaction with a modal. Defaults to false.
     */
    constructor(actionDirective: ActionDirective, options: StringSelectMenuOptionInteractable[], placeholder?: string, priority = 1, respondWithModal = false) {
        super(InteractableType.STRING_SELECT_MENU, actionDirective, priority, respondWithModal);
        this.options = [];
        for (let i = 0; i < options.length && i < StringSelectMenuInteractable.OPTION_LIMIT; i++)
            this.options.push(options[i]);
        this.options = options;
        this.placeholder = placeholder?.substring(0, StringSelectMenuInteractable.PLACEHOLDER_CHARACTER_LIMIT);
        this.component = new StringSelectMenuBuilder().setCustomId(this.customId).setOptions(this.options);
        if (this.placeholder)
            this.component.setPlaceholder(this.placeholder);
    }

    /**
     * Sets the interactable as disabled.
     */
    disable() {
        this.component.setDisabled(true);
    }
}
