// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export const MessageDisplayType = {
    STANDARD: 0,
    WARNING: 1,
    ALERT: 2,
    MINOR: 3,
    PLAYER: 4,
    MONOLOG: 5,
    PLAIN_TEXT: 6
} as const;

export type MessageDisplayType = typeof MessageDisplayType[keyof typeof MessageDisplayType];

export const InteractableType = {
    BUTTON: 0,
    STRING_SELECT_MENU: 1,
    STRING_SELECT_MENU_OPTION: 2,
    MODAL: 3,
    TEXT_INPUT: 4
} as const;

export type InteractableType = valueof<typeof InteractableType>

export const ActionPriority = {
    VIEW_FIELD: 1,
    VIEW: 2,
    FIND: 3,
    INSTANTIATE: 4,
    DESTROY: 5,
    QUEUE_MOVE: 7,
    QUEUE_RUN: 8,
    STASH: 10,
    UNSTASH: 11,
    CRAFT: 12,
    UNCRAFT: 13,
    INSPECT: 14,
    FOLLOW: 15,
    LEAD: 16,
    STOP: 17,
    TAKE: 20,
    EQUIP: 25,
    USE: 30,
    UNEQUIP: 35,
    DROP: 40,
    ATTEMPT: 41,
    HIDE: 42,
    EMERGE: 43,
    ACTIVATE: 45,
    DEACTIVATE: 46,
    VIEW_PARTY: 50,
    DISMISS: 51,
    DISBAND: 52,
    VIEW_INVENTORY: 60
} as const;

export type ActionPriority = valueof<typeof ActionPriority>

export const WhisperType = {
    STANDALONE: 0,
    HIDING_SPOT: 1,
    PARTY: 2
} as const;

export type WhisperType = valueof<typeof WhisperType>
