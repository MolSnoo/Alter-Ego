import StringSelectMenuInteractable from '../Classes/Interactables/StringSelectMenuInteractable.ts';
import { InteractableType, MessageDisplayType } from './enums.js';
import { capitalizeFirstLetter, makeCopyable } from './helpers.ts';
import {
    ActionRowBuilder,
    ButtonBuilder,
    Embed,
    EmbedBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder,
    SectionBuilder,
    ContainerBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    StringSelectMenuBuilder
} from 'discord.js';

/**
 * @import Interactable from "../Classes/Interactables/Interactable.ts"
 * @import Game from "../Data/Game.ts"
 * @import Player from "../Data/Player.ts"
 * @import Room from "../Data/Room.ts";
 * @typedef {import('discord.js').BitFieldResolvable<"SuppressEmbeds" | "SuppressNotifications" | "IsComponentsV2", MessageFlags.SuppressEmbeds | MessageFlags.SuppressNotifications | MessageFlags.IsComponentsV2>} Flags
 */

/**
 * Generates the message create options for a narration or notification.
 * @param {MessageDisplayType} messageDisplayType - The display type of the message to send.
 * @param {Game} game - The game the message is for.
 * @param {string} messageText - The text content of the message.
 * @param {Player} [player] - The player the message is about. Optional.
 * @param {string[]} [files] - An array of file URLs to send. Optional.
 * @param {Interactable[]} [interactables] - An array of interactables. Optional.
 * @param {(Embed|EmbedBuilder)[]} [embeds] - An array of embeds. Optional.
 */
export function generateMessageDisplayCreateOptions(messageDisplayType, game, messageText, player, files = [], interactables = [], embeds = []) {
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
 * @param {MessageDisplayType} messageDisplayType - The display type of the message to send.
 * @param {Game} game - The game the message is for.
 * @param {string} messageText - The text content of the message.
 * @param {string} username - The username of the webhook message.
 * @param {string} avatarURL - The URL of the icon to use for the webhook message.
 * @param {Embed[]} [embeds] - An array of embeds to send in the message. Optional.
 * @param {string[]} [files] - An array of file URLs to send. Optional.
 * @param {Player} [player] - The player the message is about. Optional.
 *
 */
export function generateWebhookMessageDisplayCreateOptions(messageDisplayType, game, messageText, username, avatarURL, embeds = [], files = [], player) {
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
 * @param {MessageDisplayType} messageDisplayType
 */
function generateFlags(messageDisplayType) {
    /** @type {Flags} */
    let flags;
    if (messageDisplayType === MessageDisplayType.MINOR) flags = MessageFlags.IsComponentsV2 | MessageFlags.SuppressNotifications;
    else if (messageDisplayType !== MessageDisplayType.PLAIN_TEXT) flags = MessageFlags.IsComponentsV2;
    return flags;
}

/**
 * Creates an array of components for a narration.
 * @param {MessageDisplayType} messageDisplayType - The display type of the message to send.
 * @param {Game} game - The game the narration is for.
 * @param {string} messageText - The text content of the narration.
 * @param {Player} [player] - The player the narration is about. Optional.
 * @param {string[]} [files] - An array of file URLs to send. Optional.
 * @param {Interactable[]} [interactables] - An array of interactables. Optional.
 */
function createNarrateComponents(messageDisplayType, game, messageText, player, files, interactables = []) {
    /** @type {MediaGalleryBuilder} */
    let mediaGalleryBuilder;
    [mediaGalleryBuilder, messageText] = getMediaGalleryComponents(messageText, files);

    /** @type {(TextDisplayBuilder | ContainerBuilder | MediaGalleryBuilder | ActionRowBuilder<ButtonBuilder|StringSelectMenuBuilder>)[]} */
    let components = [];
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
 * @param {Game} game - The game the narration is for.
 * @param {string} messageText - The text content of the narration.
 */
function createStandardNarrationComponents(game, messageText) {
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
 * @param {Game} game - The game the narration is for.
 * @param {string} messageText - The text content of the narration.
 */
function createWarningNarrationComponents(game, messageText) {
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
 * @param {Game} game - The game the narration is for.
 * @param {string} messageText - The text content of the narration.
 */
function createAlertNarrationComponents(game, messageText) {
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
 * @param {Game} game - The game the narration is for.
 * @param {string} messageText - The text content of the narration.
 */
function createMinorNarrationComponents(game, messageText) {
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
 * @param {Game} game - The game the narration is for.
 * @param {string} messageText - The text content of the narration.
 * @param {Player} player - The player the narration is about.
 */
function createPlayerNarrationComponents(game, messageText, player) {
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
 * @param {Game} game - The game the narration is for.
 * @param {string} messageText - The text content of the narration.
 * @param {Player} player - The player the narration is about.
 */
function createMonologNarrationComponents(game, messageText, player) {
    return [
		new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(messageText),
        )
	];
}

/**
 * Creates an array of components for a room description.
 * @param {Room} location - The room to be displayed.
 * @param {string} descriptionText - The description of the room to send.
 * @param {string} occupantsString - The list of occupants in the room.
 * @param {string} defaultDropFixtureText - The description of the default drop fixture in this room.
 * @param {string} color - The color as a hex code.
 * @param {Interactable[]} interactables - An array of interactables.
 */
export function createRoomDescriptionComponents(location, descriptionText, occupantsString, defaultDropFixtureText, color, interactables = []) {
    /** @type {MediaGalleryBuilder} */
    let mediaGalleryBuilder;
    [mediaGalleryBuilder, descriptionText] = getMediaGalleryComponents(descriptionText);

    /** @type {(TextDisplayBuilder | ContainerBuilder | MediaGalleryBuilder | SeparatorBuilder | ActionRowBuilder<ButtonBuilder|StringSelectMenuBuilder>)[]} */
    let components = [];

    const containerComponent = new ContainerBuilder().setAccentColor(Number(`0x${color}`));
    /** @type {TextDisplayBuilder[]} */
    const inlineComponents = [
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
 * @param {string} originalMessageText - The original text of the message.
 * @param {string[]} [fileURLs] - An array of file URLs to send. Optional.
 * @returns {[MediaGalleryBuilder, string]} - A media gallery builder and the message text after removing links that have been inserted into it.
 */
function getMediaGalleryComponents(originalMessageText, fileURLs = []) {
    const mediaGalleryBuilder = new MediaGalleryBuilder();
    const imageURLRegex = /(http(s?):\/\/.*?\.(jpg|jpeg|png|gif|webp|avif|mp4|webm))(?:\?[^#\s]*)?/g;
    let match;
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

/**
 * Returns an array of action row components to attach to the message.
 * @param {Interactable[]} interactables - An array of interactables.
 * @param {number} [componentCount] - The number of components already in the message. Defaults to 0.
 */
function generateActionRows(interactables, componentCount = 0) {
    /** @typedef {{actionRow: ActionRowBuilder<ButtonBuilder|StringSelectMenuBuilder>, priority: number}} ActionRowIntermediary */
    /** @typedef {{button: ButtonBuilder, priority: number}} ButtonIntermediary */

    const maxComponentCount = 40;
    const buttonInteractables = interactables.filter(interactable => interactable.type === InteractableType.BUTTON);
    const stringSelectInteractables = interactables.filter(interactable => interactable.type === InteractableType.STRING_SELECT_MENU);

    /** @type {ActionRowIntermediary[]} */
    const actionRows = [];
    /** @type {Set<string>} */
    const includedInteractables = new Set();
    /** @type {ButtonIntermediary[]} */
    let buttons = [];
    for (let i = 0; i < buttonInteractables.length && includedInteractables.size < 25; i++) {
        const interactable = buttonInteractables[i];
        if (componentCount < maxComponentCount && !includedInteractables.has(interactable.customId) && (interactable.component instanceof ButtonBuilder)) {
            buttons.push({ button: interactable.component, priority: interactable.priority });
            includedInteractables.add(interactable.customId);
            componentCount++;
        }
        if (i === buttonInteractables.length - 1 || buttons.length === 5 || componentCount === 40) {
            buttons.sort((a, b) => a.priority - b.priority);
            /** @type {ActionRowBuilder<ButtonBuilder>} */
            const actionRow = new ActionRowBuilder();
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
            /** @type {ActionRowBuilder<StringSelectMenuBuilder>} */
            const actionRow = new ActionRowBuilder();
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
 * @param {string} title - The title of the help display. Should include the name of the command.
 * @param {string} description - The description of the command.
 * @param {string} aliasString - A comma-separated list of aliases for the command.
 * @param {string} usage - A newline-separated list of examples of the command's usage.
 * @param {string} details - Details about the command's usage.
 * @param {string} thumbnailURL - The URL of an image to use as the thumbnail of the display.
 * @param {string} color - The color as a hex code.
 */
export function createCommandHelpComponents(title, description, aliasString, usage, details, thumbnailURL, color) {
    return [
        new ContainerBuilder()
            .setAccentColor(Number(`0x${color}`))
            .addSectionComponents(
                new SectionBuilder()
                    .setThumbnailAccessory(
                        new ThumbnailBuilder().setURL(thumbnailURL)
                    )
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(title),
                        new TextDisplayBuilder().setContent(description)
                    )
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("**Aliases**")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(aliasString)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("**Examples**")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(usage)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("**Details**")
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(details)
            )
    ];
}

/**
 * Creates an array of components for an entity view display.
 * @param {PersistentGameEntityName} entityType - The type of entity this view is for.
 * @param {number} entityRow - The row number of this entity.
 * @param {ViewField[]} fields - An array of view fields to convert into components.
 * @param {string} color - The color as a hex code.
 * @param {Interactable[]} [interactables] - An array of interactables. Optional.
 */
export function createEntityViewComponents(entityType, entityRow, fields, color, interactables) {
    /** @type {(TextDisplayBuilder | ContainerBuilder | ActionRowBuilder<ButtonBuilder|StringSelectMenuBuilder>)[]} */
    let components = [];
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

/**
 * Creates a page of an embed.
 * @param {Game} game - The game context.
 * @param {number} page - The current page number.
 * @param {*[][]} pages - All of the entries, divided into pages.
 * @param {string} authorName - The title of the embed.
 * @param {string} authorIcon - The thumbnail URL to display for the embed.
 * @param {string} description - The description of the embed.
 * @param {(entryIndex: number) => string} getFieldName - A function to generate the name of each field in the embed.
 * @param {(entryIndex: number) => string} getFieldValue - A function to generate the value of each field in the embed.
 */
export function createPaginatedEmbed(game, page, pages, authorName, authorIcon, description, getFieldName, getFieldValue) {
	let embed = new EmbedBuilder()
		.setColor(Number(`0x${game.settings.embedAccentColor}`))
		.setAuthor({ name: authorName, iconURL: authorIcon })
		.setDescription(description)
		.setFooter({ text: `Page ${page + 1}/${pages.length}` });
	let fields = [];
	for (let entryIndex = 0; entryIndex < pages[page].length; entryIndex++)
		fields.push({ name: getFieldName(entryIndex), value: getFieldValue(entryIndex) });
	embed.addFields(fields);
	return embed;
}
