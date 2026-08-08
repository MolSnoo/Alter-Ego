// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type Interactable from '../Classes/Interactables/Interactable.ts';
import StringSelectMenuInteractable from '../Classes/Interactables/StringSelectMenuInteractable.ts';
import type Game from '../Data/Game.ts';
import type Player from '../Data/Player.ts';
import type Room from '../Data/Room.ts';
import { InteractableType, MessageDisplayType } from './enums.ts';
import { capitalizeFirstLetter, makeCopyable } from './helpers.ts';
import {
    ActionRowBuilder,
    type BitFieldResolvable,
    ButtonBuilder,
    type Embed,
    EmbedBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder,
    SectionBuilder,
    ContainerBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    type MessageCreateOptions,
    type MessageEditOptions,
    MessageFlags,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    StringSelectMenuBuilder,
    type WebhookMessageCreateOptions,
    type Message,
    ComponentType
} from 'discord.js';

type Flags = BitFieldResolvable<"SuppressEmbeds" | "SuppressNotifications" | "IsComponentsV2" | "IsVoiceMessage", MessageFlags.SuppressEmbeds | MessageFlags.SuppressNotifications | MessageFlags.IsComponentsV2 | MessageFlags.IsVoiceMessage>
type TopLevelComponent = TextDisplayBuilder | ContainerBuilder | MediaGalleryBuilder | SeparatorBuilder | ActionRowBuilder<ButtonBuilder|StringSelectMenuBuilder>;

/**
 * Generates the message create options for a narration or notification.
 * @param messageDisplayType - The display type of the message to send.
 * @param game - The game the message is for.
 * @param messageText - The text content of the message.
 * @param player - The player the message is about. Optional.
 * @param files - An array of file URLs to send. Optional.
 * @param interactables - An array of interactables. Optional.
 * @param embeds - An array of embeds. Optional.
 */
export function generateMessageDisplayCreateOptions(messageDisplayType: MessageDisplayType, game: Game, messageText: string, player?: Player, files: string[] = [], interactables: Interactable[] = [], embeds: (Embed | EmbedBuilder)[] = []): MessageCreateOptions {
    return {
        content: messageDisplayType === MessageDisplayType.PLAIN_TEXT ? messageText : '',
        components: messageDisplayType === MessageDisplayType.PLAIN_TEXT ? generateActionRows(interactables) : createNarrateComponents(messageDisplayType, game, messageText, player, [], interactables),
        flags: generateFlags(messageDisplayType),
        files: files,
        embeds: messageDisplayType === MessageDisplayType.PLAIN_TEXT ? embeds : []
    };
}

/**
 * Generates the message create options for a narration or notification.
 * @param messageDisplayType - The display type of the message to send.
 * @param game - The game the message is for.
 * @param messageText - The text content of the message.
 * @param player - The player the message is about. Optional.
 * @param files - An array of file URLs to send. Optional.
 * @param interactables - An array of interactables. Optional.
 * @param embeds - An array of embeds. Optional.
 */
export function generateMessageDisplayEditOptions(messageDisplayType: MessageDisplayType, game: Game, messageText: string, player?: Player, files: string[] = [], interactables: Interactable[] = [], embeds: (Embed | EmbedBuilder)[] = []): MessageEditOptions {
    return {
        content: messageDisplayType === MessageDisplayType.PLAIN_TEXT ? messageText : '',
        components: messageDisplayType === MessageDisplayType.PLAIN_TEXT ? generateActionRows(interactables) : createNarrateComponents(messageDisplayType, game, messageText, player, [], interactables),
        files: files,
        embeds: messageDisplayType === MessageDisplayType.PLAIN_TEXT ? embeds : []
    };
}

/**
 * Returns the message without any of its ActionRow components.
 * @param message - The message to remove ActionRow components from.
 */
export function generateMessageEditOptionsWithoutActionRows(message: Message): MessageEditOptions {
    return { components: message.components.filter(component => component.type !== ComponentType.ActionRow) }
}

/**
 * Generates the message create options for a narration or notification.
 * @param messageDisplayType - The display type of the message to send.
 * @param game - The game the message is for.
 * @param messageText - The text content of the message.
 * @param username - The username of the webhook message.
 * @param avatarURL - The URL of the icon to use for the webhook message.
 * @param embeds - An array of embeds to send in the message. Optional.
 * @param files - An array of file URLs to send. Optional.
 * @param player - The player the message is about. Optional.
 */
export function generateWebhookMessageDisplayCreateOptions(messageDisplayType: MessageDisplayType, game: Game, messageText: string, username: string, avatarURL: string, embeds: Embed[] = [], files: string[] = [], player?: Player): WebhookMessageCreateOptions {
    return {
        content: messageDisplayType === MessageDisplayType.PLAIN_TEXT ? messageText : '',
        username: username,
        avatarURL: avatarURL,
        components: messageDisplayType === MessageDisplayType.PLAIN_TEXT ? [] : createNarrateComponents(messageDisplayType, game, messageText, player, files),
        flags: generateFlags(messageDisplayType),
        embeds: messageDisplayType === MessageDisplayType.PLAIN_TEXT ? embeds : [],
        files: messageDisplayType === MessageDisplayType.PLAIN_TEXT ? files : []
    };
}

/**
 * Creates a flag bit field for a message based on its display type.
 * @param messageDisplayType
 */
function generateFlags(messageDisplayType: MessageDisplayType): Flags {
    let flags: Flags;
    if (messageDisplayType === MessageDisplayType.MINOR) flags = MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications;
    else if (messageDisplayType !== MessageDisplayType.PLAIN_TEXT) flags = MessageFlags.IsComponentsV2;
    return flags;
}



/**
 * Creates an array of components for a narration.
 * @param messageDisplayType - The display type of the message to send.
 * @param game - The game the narration is for.
 * @param messageText - The text content of the narration.
 * @param player - The player the narration is about. Optional.
 * @param files - An array of file URLs to send. Optional.
 * @param interactables - An array of interactables. Optional.
 */
function createNarrateComponents(messageDisplayType: MessageDisplayType, game: Game, messageText: string, player?: Player, files?: string[], interactables: Interactable[] = []): TopLevelComponent[] {
    let mediaGalleryBuilder: MediaGalleryBuilder;
    [mediaGalleryBuilder, messageText] = getMediaGalleryComponents(messageText, files);

    let components: TopLevelComponent[] = [];
    switch (messageDisplayType) {
        case MessageDisplayType.STANDARD:
            components = createStandardNarrationComponents(game, messageText);
            break;
        case MessageDisplayType.WARNING:
            components = createWarningNarrationComponents(game, messageText);
            break;
        case MessageDisplayType.ALERT:
            components = createAlertNarrationComponents(game, messageText);
            break;
        case MessageDisplayType.MINOR:
            components = createMinorNarrationComponents(game, messageText);
            break;
        case MessageDisplayType.PLAYER:
            components = createPlayerNarrationComponents(game, messageText, player);
            break;
        case MessageDisplayType.MONOLOG:
            components = createMonologNarrationComponents(game, messageText, player);
            break;
        default:
            components = createStandardNarrationComponents(game, messageText);
            break;
    }
    if (mediaGalleryBuilder.items.length !== 0) components.push(mediaGalleryBuilder);
    if (interactables.length > 0) {
        const actionRows = generateActionRows(interactables);
        components = components.concat(actionRows);
    }

    return components;
}

/**
 * Creates the components for a standard narration.
 * @param game - The game the narration is for.
 * @param messageText - The text content of the narration.
 */
function createStandardNarrationComponents(game: Game, messageText: string): TopLevelComponent[] {
    return [
        new ContainerBuilder()
            .setAccentColor(Number(`0x${game.settings.standardMessageDisplayAccentColor}`))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(messageText),
            )
    ];
}

/**
 * Creates the components for a warning narration.
 * @param game - The game the narration is for.
 * @param messageText - The text content of the narration.
 */
function createWarningNarrationComponents(game: Game, messageText: string): TopLevelComponent[] {
    return [
        new ContainerBuilder()
            .setAccentColor(Number(`0x${game.settings.warningMessageDisplayAccentColor}`))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(messageText),
            )
    ];
}

/**
 * Creates the components for an alert narration.
 * @param game - The game the narration is for.
 * @param messageText - The text content of the narration.
 */
function createAlertNarrationComponents(game: Game, messageText: string): TopLevelComponent[] {
    return [
        new ContainerBuilder()
            .setAccentColor(Number(`0x${game.settings.alertMessageDisplayAccentColor}`))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(messageText),
            )
    ];
}

/**
 * Creates the components for a minor narration.
 * @param game - The game the narration is for.
 * @param messageText - The text content of the narration.
 */
function createMinorNarrationComponents(game: Game, messageText: string): TopLevelComponent[] {
    const indent = `> `;
    const smallHeader = `-# `;
    let messageLines = messageText.split('\n');
    for (let i = 0; i < messageLines.length; i++) {
        if (!messageLines[i].startsWith(smallHeader)) messageLines[i] = `${smallHeader}${messageLines[i]}`;
        if (!messageLines[i].startsWith(indent)) messageLines[i] = `${indent}${messageLines[i]}`;
    }
    return [
        new TextDisplayBuilder().setContent(messageLines.join('\n'))
    ];
}

/**
 * Creates the components for a player narration.
 * @param game - The game the narration is for.
 * @param messageText - The text content of the narration.
 * @param player - The player the narration is about.
 */
function createPlayerNarrationComponents(game: Game, messageText: string, player: Player): TopLevelComponent[] {
    return [
        new ContainerBuilder()
            .setAccentColor(Number(`0x${game.settings.standardMessageDisplayAccentColor}`))
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(messageText),
            )
    ];
}

/**
 * Creates the components for a player monolog.
 * @param game - The game the narration is for.
 * @param messageText - The text content of the narration.
 * @param player - The player the narration is about.
 */
function createMonologNarrationComponents(game: Game, messageText: string, player: Player): TopLevelComponent[] {
    return [
        new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(messageText),
            )
    ];
}

/**
 * Creates an array of components for a room description.
 * @param location - The room to be displayed.
 * @param descriptionText - The description of the room to send.
 * @param occupantsString - The list of occupants in the room.
 * @param defaultDropFixtureText - The description of the default drop fixture in this room.
 * @param color - The color as a hex code.
 * @param interactables - An array of interactables.
 */
export function createRoomDescriptionComponents(location: Room, descriptionText: string, occupantsString: string, defaultDropFixtureText: string, color: string, interactables: Interactable[] = []): TopLevelComponent[] {
    let mediaGalleryBuilder: MediaGalleryBuilder;
    [mediaGalleryBuilder, descriptionText] = getMediaGalleryComponents(descriptionText);

    let components: TopLevelComponent[] = [];

    const containerComponent = new ContainerBuilder().setAccentColor(Number(`0x${color}`));
    const inlineComponents: TextDisplayBuilder[] = [
        new TextDisplayBuilder().setContent("_ _"),
        new TextDisplayBuilder().setContent(`**${location.displayName}**`),
        new TextDisplayBuilder().setContent("_ _")
    ];
    const iconUrl = location.getIconURL();
    if (iconUrl) {
        const sectionBuilder = new SectionBuilder()
            .setThumbnailAccessory(new ThumbnailBuilder().setURL(iconUrl))
            .addTextDisplayComponents(inlineComponents);
        containerComponent.addSectionComponents(sectionBuilder);
    }
    else
        containerComponent.addTextDisplayComponents(inlineComponents);
    components.push(containerComponent);

    components.push(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false));
    components.push(new TextDisplayBuilder().setContent(descriptionText));
    if (mediaGalleryBuilder.items.length !== 0) components.push(mediaGalleryBuilder);
    components.push(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(false));
    components.push(new TextDisplayBuilder().setContent("**Occupants**"));
    components.push(new TextDisplayBuilder().setContent(occupantsString));
    components.push(new TextDisplayBuilder().setContent(`**${capitalizeFirstLetter(location.getGame().settings.defaultDropFixture.toLocaleLowerCase())}**`));
    components.push(new TextDisplayBuilder().setContent(defaultDropFixtureText));
    components.push(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    if (interactables.length > 0) {
        const actionRows = generateActionRows(interactables);
        components = components.concat(actionRows);
    }
    return components;
}

/**
 * Creates a media gallery builder using linked images and videos in the message. Can only contain up to 3 gallery items.
 * @param originalMessageText - The original text of the message.
 * @param fileURLs - An array of file URLs to send. Optional.
 * @returns A media gallery builder and the message text after removing links that have been inserted into it.
 */
function getMediaGalleryComponents(originalMessageText: string, fileURLs: string[] = []): [MediaGalleryBuilder, string] {
    const mediaGalleryBuilder = new MediaGalleryBuilder();
    const imageURLRegex = /(http(s?):\/\/.*?\.(jpg|jpeg|png|gif|webp|avif|mp4|webm))(?:\?[^#\s]*)?/g;
    let match: RegExpExecArray;
    let messageText = originalMessageText;
    while (match = imageURLRegex.exec(originalMessageText)) {
        fileURLs.push(match[0]);
    }
    for (const fileURL of fileURLs) {
        if (mediaGalleryBuilder.items.length < 3) {
            mediaGalleryBuilder.addItems(new MediaGalleryItemBuilder().setURL(fileURL));
            const newMessageText = messageText.replace(fileURL, '');
            if (newMessageText !== "") messageText = newMessageText;
        }
    }
    return [mediaGalleryBuilder, messageText];
}

interface ActionRowIntermediary {
    actionRow: ActionRowBuilder<ButtonBuilder|StringSelectMenuBuilder>,
    priority: number
}

interface ButtonIntermediary {
    button: ButtonBuilder,
    priority: number
}

/**
 * Returns an array of action row components to attach to the message.
 * @param interactables - An array of interactables.
 * @param componentCount - The number of components already in the message. Defaults to 0.
 */
function generateActionRows(interactables: Interactable[], componentCount: number = 0): ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] {
    const maxComponentCount = 40;
    const buttonInteractables = interactables.filter(interactable => interactable.type === InteractableType.BUTTON);
    const stringSelectInteractables = interactables.filter(interactable => interactable.type === InteractableType.STRING_SELECT_MENU);

    const actionRows: ActionRowIntermediary[] = [];
    const includedInteractables: Set<string> = new Set();
    let buttons: ButtonIntermediary[] = [];
    for (let i = 0; i < buttonInteractables.length && includedInteractables.size < 25; i++) {
        const interactable = buttonInteractables[i];
        if (componentCount < maxComponentCount && !includedInteractables.has(interactable.customId) && (interactable.component instanceof ButtonBuilder)) {
            buttons.push({ button: interactable.component, priority: interactable.priority });
            includedInteractables.add(interactable.customId);
            componentCount++;
        }
        if (i === buttonInteractables.length - 1 || buttons.length === 5 || componentCount === 40) {
            buttons.sort((a, b) => a.priority - b.priority);
            const actionRow = new ActionRowBuilder<ButtonBuilder>();
            let priority = buttons.reduce((value, button) => value + button.priority, 0) / buttons.length;
            actionRow.addComponents(buttons.map((button) => button.button));
            actionRows.push({ actionRow: actionRow, priority: priority });
            buttons = [];
            if (actionRows.length === 5) break;
        }
    }
    for (let i = 0; i < stringSelectInteractables.length && actionRows.length < 5 && includedInteractables.size < 25 && componentCount + 2 < maxComponentCount; i++) {
        const interactable = stringSelectInteractables[i];
        if (!includedInteractables.has(interactable.customId) && interactable instanceof StringSelectMenuInteractable) {
            // If this would exceed the maximum number of components, remove excess options.
            if (componentCount + 1 + interactable.component.options.length >= maxComponentCount) {
                const excess = maxComponentCount - componentCount - 1;
                interactable.component.options.splice(excess);
            }
            const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>();
            actionRow.addComponents(interactable.component);
            componentCount += 1 + interactable.component.options.length;
            includedInteractables.add(interactable.customId);
            actionRows.push({ actionRow: actionRow, priority: interactable.priority });
        }
    }
    actionRows.sort((a, b) => a.priority - b.priority);
    return actionRows.map((actionRow) => actionRow.actionRow);
}

/**
 * Creates an array of components for a command help display.
 * @param title - The title of the help display. Should include the name of the command.
 * @param description - The description of the command.
 * @param aliasString - A comma-separated list of aliases for the command.
 * @param usage - A newline-separated list of examples of the command's usage.
 * @param details - Details about the command's usage.
 * @param thumbnailURL - The URL of an image to use as the thumbnail of the display.
 * @param color - The color as a hex code.
 */
export function createCommandHelpComponents(title: string, description: string, aliasString: string, usage: string, details: string, thumbnailURL: string, color: string) {
    const containerComponent = new ContainerBuilder().setAccentColor(Number(`0x${color}`));
    /** @type {TextDisplayBuilder[]} */
    const inlineComponents = [
        new TextDisplayBuilder().setContent(title),
        new TextDisplayBuilder().setContent(description)
    ];
    if (thumbnailURL && thumbnailURL !== "null") {
        const sectionBuilder = new SectionBuilder()
            .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailURL))
            .addTextDisplayComponents(inlineComponents);
        containerComponent.addSectionComponents(sectionBuilder);
    }
    else
        containerComponent.addTextDisplayComponents(inlineComponents);
    containerComponent.addTextDisplayComponents(new TextDisplayBuilder().setContent("**Aliases**"))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(aliasString))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("**Examples**"))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(usage))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("**Details**"))
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(details))

    return [containerComponent];
}

/**
 * Creates an array of components for an entity view display.
 * @param entityType - The type of entity this view is for.
 * @param entityRow - The row number of this entity.
 * @param fields - An array of view fields to convert into components.
 * @param color - The color as a hex code.
 * @param interactables - An array of interactables. Optional.
 */
export function createEntityViewComponents(entityType: PersistentGameEntityName, entityRow: number, fields: ViewField[], color: string, interactables?: Interactable[]): TopLevelComponent[] {
    let components: TopLevelComponent[] = [];
    components.push(new ContainerBuilder()
        .setAccentColor(Number(`0x${color}`))
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`### ${entityType} on row ${entityRow}`)
        )
    );
    for (const field of fields) {
        let fieldContent = "";
        const fieldValueTooLong = field.value && field.value.length > 3000;
        if (field.label) fieldContent += `${field.label}${fieldValueTooLong ? ` (TRIMMED)` : ``}: `;
        if (fieldValueTooLong) field.value = field.value.substring(0, 3000) + '…';
        if (field.value) fieldContent += makeCopyable(field.value);
        if (fieldContent) components.push(new TextDisplayBuilder().setContent(fieldContent));
    }
    if (interactables.length > 0) {
        const actionRows = generateActionRows(interactables);
        components = components.concat(actionRows);
    }
    return components;
}

type GetFieldFunction = (entryIndex: number) => string;

/**
 * Creates a page of an embed.
 * @param game - The game context.
 * @param page - The current page number.
 * @param pages - All of the entries, divided into pages.
 * @param authorName - The title of the embed.
 * @param authorIcon - The thumbnail URL to display for the embed.
 * @param description - The description of the embed.
 * @param getFieldName - A function to generate the name of each field in the embed.
 * @param getFieldValue - A function to generate the value of each field in the embed.
 */
export function createPaginatedEmbed(game: Game, page: number, pages: any[][], authorName: string, authorIcon: string, description: string, getFieldName: GetFieldFunction, getFieldValue: GetFieldFunction): EmbedBuilder {
    let embed = new EmbedBuilder()
        .setColor(Number(`0x${game.settings.embedAccentColor}`))
        .setDescription(description)
        .setFooter({ text: `Page ${page + 1}/${pages.length}` });
    if (authorIcon && authorIcon !== "null")
        embed.setAuthor({ name: authorName, iconURL: authorIcon });
    let fields = [];
    for (let entryIndex = 0; entryIndex < pages[page].length; entryIndex++)
        fields.push({ name: getFieldName(entryIndex), value: getFieldValue(entryIndex) });
    embed.addFields(fields);
    return embed;
}
