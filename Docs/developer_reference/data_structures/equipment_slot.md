# Equipment Slot

An Equipment Slot is a data structure in the Neo World Program. It represents a part of a [Player's](player.md) body
that they can equip [Inventory Items](inventory_item.md) to.

Equipment Slots do not have a dedicated sheet on the spreadsheet. Rather, they are derived from data on the Inventory
Items sheet. If an Inventory Item has no [container name](inventory_item.md#container-name), then an Equipment Slot will
be created for it to be equipped to.

Equipment Slots are almost fully customizable. A single Player can have as many or as few Equipment Slots as desired,
and each Player can have a unique set of Equipment Slots. If
the [startgame command](../commands/moderator_commands.md#startgame) is used, then all Players will have
the [default inventory](../settings/docker_settings.md#default_inventory), but this can be edited after the data is
saved to the spreadsheet.

An Equipment Slot cannot exist without an Inventory Item equipped to it. Even in cases where Alter Ego asserts that
nothing is equipped, something is: a dummy Inventory Item with a `null` [Prefab](prefab.md) and no data except for the
name of the Equipment Slot it's equipped to. This behavior is to allow Equipment Slots to persist in a Player's
inventory without causing errors. In order to define one of these dummy Inventory Items, its Prefab on the sheet should
be listed as `NULL`.

## Table of Contents

<!-- toc -->

## Attributes

Equipment Slots have very few attributes.

### Name

* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.name`

This is the name of the Equipment Slot, which is inherited from the [Equipment Slot](inventory_item.md#equipment-slot)
attribute of the Inventory Item equipped to it. All letters should be capitalized, and spaces are allowed.

There are two predefined Equipment Slots with special behavior. If an Equipment Slot is named "RIGHT HAND" or "LEFT
HAND", then Inventory Items cannot be equipped to it or unequipped from it like other Equipment Slots. They act as a
Player's hands, allowing them to manipulate their inventory in a variety of ways. If a Player does not have these
Equipment Slots, they will be unable to use many commands. It should be noted that in every command where Alter Ego
deals with a Player's inventory, the RIGHT HAND Equipment Slot is assumed to come before that of the LEFT HAND on the
spreadsheet. Reversing their order or giving the Player a LEFT HAND with no RIGHT HAND can result in gameplay errors.

### Equipped Item

* Class attribute: [Inventory Item](inventory_item.md) `this.equippedItem`

This is the Inventory Item currently equipped to this Equipment Slot. If the Inventory Item has a `NULL` Prefab -
indicating that nothing is currently equipped, then this is `null`.

### Items

* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Inventory Item](inventory_item.md)>
  `this.items`

This is a list of Inventory Items that currently occupy this Equipment Slot. This includes the Inventory Item currently
equipped to it, any Inventory Items contained within it, any Inventory Items contained within those, and so on.

### Row

* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.row`

This is the row number of the Inventory Item equipped to this Equipment Slot.