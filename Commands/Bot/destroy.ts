// SPDX-FileCopyrightText: 2019 Alter Ego Contributors
// SPDX-FileCopyrightText: 2026 LavCorps <lavcorps@protonmail.com>
// SPDX-FileCopyrightText: 2026 Ms. VBLANK <alteregomolly@pm.me>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { InvalidInvocation, ValidatedInvocation, type MatchedInvocation } from "../../Classes/Command/Invocation.ts";
import { Pattern, Slot, Constant, Preposition, Pocket, Option, Multislot } from "../../Classes/Command/Pattern.ts";
import InventoryItem from "../../Data/InventoryItem.ts";
import BotCommand from "../../Classes/Command/BotCommand.ts";
import type BotContext from "../../Classes/Command/BotContext.ts";
import Player from "../../Data/Player.ts";
import RoomItem from "../../Data/RoomItem.ts";
import Room from "../../Data/Room.ts";
import Fixture from "../../Data/Fixture.ts";
import EquipmentSlot from "../../Data/EquipmentSlot.ts";


const command = new BotCommand({
    config: {
        name: "destroy_bot",
        description: "Destroys an item.",
        details: `Destroys an item in the specified location or in the player's inventory. `
            + `The prefab ID or container identifier of the item must be given.\n\n`
            + `To destroy a room item, the display name or ID of the room it's in must be given at the end of the command, following "at". `
            + `To destroy an inventory item, the name of the player must be given followed by \`'s\` before the item's identifier.\n\n`
            + `If, when destroying an inventory item, "player" is supplied instead of a player's name, then the given item will be `
            + `destroyed from the inventory of the player who caused this command to be executed. If "room" is supplied instead, then `
            + `the command will be executed on all players in the room as the initiating player. If "all" is supplied instead, then `
            + `the command will be executed on all living players, including NPCs and players with the Free Movement role.\n\n`
            + `It is possible to specify the container from which to destroy the item. To do so, add the container's preposition or "in" `
            + `after the item's identifier, followed by the container's name. If the container is another item, its identifier or prefab `
            + `ID must be used. The ID of the inventory slot to destroy the item from can also be specified, followed by "of". `
            + `If you enter "all" in place of an item's identifier and specify a container, all items in that container will be destroyed.\n\n`
            + `It is also possible to destroy an inventory item by specifying only the ID of the equipment slot it's equipped to `
            + `instead of the item's identifier. This will destroy whatever is equipped to that equipment slot.\n\n`
            + `Note that if you destroy an inventory item, the player will be notified if it is an item they have equipped, and its `
            + `unequipped commands will be executed. The player will not be notified if it is an item they have stashed.`,
        usableBy: "Bot",
        aliases: ["destroy", "ds"],
        requiresGame: true,
        possessivePlayer: true
    },

    usage: () => {
        return `destroy VOLLEYBALL at beach\n`
            + `ds CAN OF GASOLINE on SHELVES at Warehouse\n`
            + `destroy NOTE in LOCKER 1 at Men's Locker Room\n`
            + `ds WRENCH in TOOL BOX 1 at beach-house\n`
            + `destroy WHITE GLOVES in BREAST POCKET of TUXEDO at dressing room\n`
            + `ds all in TRASH CAN at lounge\n`
            + `destroy player BLUE BIRD MUSIC BOX\n`
            + `ds all FACE\n`
            + `destroy room NUMBERED BRACELET`
            + `ds Vivian's VIVIANS LAPTOP in VIVIANS SATCHEL\n`
            + `destroy SHOTPUT BALL in Cassie's MAIN POCKET of LARGE BACKPACK 1\n`
            + `ds all in Hitoshi's HITOSHIS TROUSERS\n`
            + `destroy all in Evad's FRONT POCKET of DENIM OVERALLS 6`;
    },

    patterns: [
        new Pattern([
            new Slot(RoomItem, "target"),
            new Constant("at"),
            new Slot(Room, "destination")
        ]),
        new Pattern([
            new Slot(RoomItem, "target"),
            new Preposition("intermediate"),
            new Multislot([Fixture, RoomItem], "intermediate"),
            new Constant("at"),
            new Slot(Room, "destination")
        ]),
        new Pattern([
            new Slot(RoomItem, "target"),
            new Constant("in"),
            new Pocket("intermediate", "pocket"),
            new Constant("of"),
            new Slot(RoomItem, "intermediate"),
            new Constant("at"),
            new Slot(Room, "destination")
        ]),
        new Pattern([
            new Option("target", ["all"]),
            new Preposition("intermediate"),
            new Multislot([Fixture, RoomItem], "intermediate"),
            new Constant("at"),
            new Slot(Room, "destination")
        ]),
        new Pattern([
            new Option("callee", ["player"]),
            new Slot(InventoryItem, "target")
        ]),
        new Pattern([
            new Option("target", ["all"]),
            new Slot(EquipmentSlot, "target")
        ]),
        new Pattern([
            new Option("callee", ["room"]),
            new Slot(RoomItem, "target")
        ]),
        new Pattern([
            new Slot(Player, "player"),
            new Slot(InventoryItem, "target"),
            new Preposition("intermediate"),
            new Slot(InventoryItem, "intermediate")
        ]),
        new Pattern([
            new Slot(InventoryItem, "target"),
            new Constant("in"),
            new Slot(Player, "player"),
            new Pocket("destination", "pocket"),
            new Constant("of"),
            new Slot(InventoryItem, "destination")
        ]),
        new Pattern([
            new Option("target", ["all"]),
            new Preposition("destination"),
            new Slot(Player, "player"),
            new Slot(InventoryItem, "destination")
        ]),
        new Pattern([
            new Option("target", ["all"]),
            new Constant("in"),
            new Slot(Player, "player"),
            new Pocket("destination", "pocket"),
            new Constant("of"),
            new Slot(InventoryItem, "destination")
        ]),
    ],

    validate: async (ctx: BotContext, inv: MatchedInvocation) => {
        return new InvalidInvocation(["NOT YET IMPLEMENTED"])
    },

    execute: async (ctx: BotContext, inv: ValidatedInvocation) => {

    },
});

export default command;
