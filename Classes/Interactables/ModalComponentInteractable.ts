// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import Interactable from "./Interactable.ts";
import type { InteractableType } from "../../Modules/enums.ts";
import { LabelBuilder } from "discord.js";

export default abstract class ModalComponentInteractable extends Interactable {
    /**
     * The label for the component. Max length is 45 characters.
     */
    readonly label: string;
    /**
     * The description for the component. Optional. Max length is 100 characters.
     */
    readonly description?: string;
    /**
     * The component created from this interactable.
     */
    readonly component: LabelBuilder;
    static readonly LABEL_CHARACTER_LIMIT = 45;
    static readonly DESCRIPTION_CHARACTER_LIMIT = 100;

    /**
     * @param type - The type of interactive message component to create.
     * @param customId - The custom ID of the interactable.
     * @param label - The label for the component. Max length is 45 characters.
     * @param description - The description for the component. Optional. Max length is 100 characters.
     * @param priority - The priority level of the interactable. This determines how high up it will appear in a list of interactable components. Defaults to 1 (second-highest priority).
     */
    protected constructor(type: InteractableType, customId: string, label: string, description?: string, priority: number = 1) {
        super(type, customId, priority);
        this.label = label?.substring(0, ModalComponentInteractable.LABEL_CHARACTER_LIMIT);
        this.description = description?.substring(0, ModalComponentInteractable.DESCRIPTION_CHARACTER_LIMIT) ?? "";
        this.component = new LabelBuilder().setLabel(this.label);
        if (this.description)
            this.component.setDescription(this.description);
    }
}
