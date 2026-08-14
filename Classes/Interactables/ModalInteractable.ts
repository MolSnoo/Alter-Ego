// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ActionDirectiveInteractable from "./ActionDirectiveInteractable.ts";
import type ModalComponentInteractable from "./ModalComponentInteractable.ts";
import type ActionDirective from "../ActionDirective.ts";
import { ModalBuilder, TextDisplayBuilder } from "discord.js";
import { InteractableType } from "../../Modules/enums.ts";

/**
 * Represents a modal message component.
 */
export default class ModalInteractable extends ActionDirectiveInteractable {
    /**
     * The title of the modal. Max length is 45 characters.
     */
    readonly title: string;
    /**
     * The description of the modal. Supports markdown. Maximum number of characters is 4000.
     */
    readonly description?: string;
    /**
     * The modal component created from this interactable.
     */
    readonly component: ModalBuilder;
    /**
     * The sub-components for this modal.
     */
    readonly subComponents: ModalComponentInteractable[];
    static readonly TITLE_CHARACTER_LIMIT = 45;
    static readonly SUB_COMPONENT_LIMIT_WITHOUT_DESCRIPTION = 5;
    static readonly SUB_COMPONENT_LIMIT_WITH_DESCRIPTION = 4;
    static readonly DESCRIPTION_CHARACTER_LIMIT = 4000;

    /**
     * @param actionDirective - The action directive of the interactable.
     * @param title - The title of the modal. Max length is 45 characters.
     * @param subComponents - The sub-components for this modal. Max length is 5.
     * @param priority - The priority level of the interactable. This determines how high up it will appear in a list of interactable components. Defaults to 1 (second-highest priority).
     * @param description - The description of the modal. Supports markdown. Maximum number of characters is 4000. If this is given, reduces the number of allowed sub-components to 4.
     */
    constructor(actionDirective: ActionDirective, title: string, subComponents: ModalComponentInteractable[], priority = 1, description?: string) {
        super(InteractableType.MODAL, actionDirective, priority);
        this.title = title?.substring(0, ModalInteractable.TITLE_CHARACTER_LIMIT);
        this.subComponents = [];
        this.description = description?.substring(0, ModalInteractable.DESCRIPTION_CHARACTER_LIMIT);
        const maxSubComponentsSize = this.description ? ModalInteractable.SUB_COMPONENT_LIMIT_WITH_DESCRIPTION : ModalInteractable.SUB_COMPONENT_LIMIT_WITHOUT_DESCRIPTION;
        for (let i = 0; i < subComponents.length && i < maxSubComponentsSize; i++)
            this.subComponents.push(subComponents[i]);
        this.component = new ModalBuilder().setTitle(this.title).setCustomId(this.customId);
        if (this.description)
            this.component.addTextDisplayComponents(new TextDisplayBuilder().setContent(this.description));
        this.component.addLabelComponents(this.subComponents.map(subComponent => subComponent.component));
    }

    disable() {}
}
