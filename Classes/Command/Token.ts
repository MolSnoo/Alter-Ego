// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import type GameEntity from "../../Data/GameEntity.ts";
import InventorySlot from "../../Data/InventorySlot.ts";
import type ItemInstance from "../../Data/ItemInstance.ts";

export abstract class Token {
    value: string;

    protected constructor(value: string) {
        this.value = value;
    }
}

export class SentinelToken extends Token {
    constructor(value: string) {
        super(value);
    }
}

export class PrepositionToken extends Token {
    constructor(value: string) {
        super(value);
    }
}

export class ConstantToken extends Token {
    constructor(value: string) {
        super(value);
    }
}

export class EntityToken<T extends GameEntity> extends Token {
    reference: T;

    constructor(value: string, reference: T) {
        super(value);
        this.reference = reference;
    }
}

export class ItemContainerToken<T extends RoomItemContainer | ItemInstance> extends EntityToken<T> {
    preposition: string;

    constructor(value: string, reference: T) {
        super(value, reference);
        this.preposition = reference.getPreposition();
    }
}

export class PocketToken<T extends ItemInstance> extends EntityToken<InventorySlot<T>> {
    parent: T;

    constructor(value: string, reference: InventorySlot<T>, parent: T) {
        super(value, reference);
        this.parent = parent;
    }
}
