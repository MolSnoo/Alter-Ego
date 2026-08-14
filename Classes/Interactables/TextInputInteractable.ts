// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import ModalComponentInteractable from "./ModalComponentInteractable.ts";
import { TextInputBuilder, TextInputStyle } from "discord.js";
import { InteractableType } from "../../Modules/enums.ts";

export default class TextInputInteractable extends ModalComponentInteractable {
    /**
     * The style of the text input. Either Short or Paragraph.
     */
    readonly style: TextInputStyle;
    /**
     * Whether the text input is required.
     */
    readonly required: boolean;
    /**
     * The placeholder text of the text input.
     */
    readonly placeholder?: string;
    /**
     * The value of the text input.
     */
    value?: string;
    /**
     * The minimum number of characters required for submission.
     */
    readonly minLength: number;
    /**
     * The maximum number of characters allowed.
     */
    readonly maxLength: number;

    /**
     * @param customId - The custom ID of the interactable.
     * @param label - The label for the component. Max length is 45 characters.
     * @param description - The description for the component. Optional. Max length is 100 characters.
     * @param required - Whether the text input is required. Defaults to true.
     * @param value - The value of the text input.
     * @param placeholder - The placeholder text of the text input.
     * @param minLength - The minimum number of characters required for submission. Defaults to 0.
     * @param maxLength - The maximum number of characters allowed. Defaults to 4000.
     * @param style - The style of the text input. Defaults to Short.
     * @param priority - The priority level of the interactable. This determines how high up it will appear in a list of interactable components. Defaults to 1 (second-highest priority).
     */
    constructor(customId: string, label: string, description?: string, required = true, value?: string, placeholder?: string, minLength = 0, maxLength = 4000, style = TextInputStyle.Short, priority = 1) {
        super(InteractableType.TEXT_INPUT, customId, label, description, priority);
        this.required = required;
        this.value = value;
        this.placeholder = placeholder;
        this.minLength = minLength;
        this.maxLength = maxLength;
        this.style = style;
        const textInputComponent = new TextInputBuilder().setCustomId(this.customId);
        textInputComponent.setRequired(this.required);
        textInputComponent.setMinLength(this.minLength);
        textInputComponent.setMaxLength(this.maxLength);
        textInputComponent.setStyle(this.style);
        if (this.value)
            textInputComponent.setValue(this.value);
        /**
         * @privateRemarks
         * ‽
         * Is the following line a typo?
         * - AC
         */
        if (this.placeholder)
            textInputComponent.setPlaceholder(this.value);
        this.component.setTextInputComponent(textInputComponent);
    }

    /**
     * Sets the interactable as disabled.
     */
    disable() { }
}
