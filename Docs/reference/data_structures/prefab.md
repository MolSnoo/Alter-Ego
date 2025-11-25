# Prefab

A **Prefab** is a data structure in the Neo World Program. It represents the concept of an item, and is the underlying
data structure which gives [Items](item.md)
and [Inventory Items](inventory_item.md) their properties.

Prefabs are static; once loaded from the [spreadsheet](index.md), they do not change in any way. Thus,
the [saver module](https://github.com/MolSnoo/Alter-Ego/blob/master/Modules/saver.js) will never make changes to the
Prefabs sheet. As a result, the Prefabs sheet can be freely edited
without [edit mode](../../moderator_guide/edit_mode.md) being enabled.

## Attributes

Due to the versatility of functions that different items can have, Prefabs have many attributes. Note that if an
attribute is _internal_, that means it only exists within
the [Prefab class](https://github.com/MolSnoo/Alter-Ego/blob/master/Data/Prefab.js). Internal attributes will be given
in the "Class attribute" bullet point, preceded by their data type. If an attribute is _external_, it only exists on the
spreadsheet. External attributes will be given in the "Spreadsheet label" bullet point.

### ID

- Spreadsheet label: **Prefab ID**
- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.id`

This is a unique identifier for the Prefab. All letters should be capitalized, and spaces are allowed. Though different
Prefabs can have many attributes in common, no two Prefabs can have the same ID.

### Single Name

- Spreadsheet label: **Prefab Name**
- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.name`

This is the name used to refer to a singular instance of an Item or Inventory Item using this Prefab.
When [Players](player.md) use a command to interact with an Item or Inventory Item using this Prefab, this string is
what they will need to enter to refer to it. All letters should be capitalized, and spaces are allowed.

### Plural Name

- Spreadsheet label: **Prefab Name**
- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.pluralName`

This is the optional name used to refer to plural instances of Items or Inventory Items using this Prefab. Note that
this shares the same spreadsheet cell as the Prefab's single name, with both separated by a comma. If only one instance
of a Prefab is intended to exist, it does not need a plural name. Additionally, it does not need a plural name if it
would be the same as its single name.

### Single Containing Phrase

- Spreadsheet label: **Containing Phrase**
- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.singleContainingPhrase`

This is the phrase that will be inserted in/removed from [item tags](../../moderator_guide/writing_descriptions.md#item)
when an Item or Inventory Item using this Prefab is added to/removed from
an [item list](../../moderator_guide/writing_descriptions.md#il). It is also the phrase that will be used when a
non-discreet Item is inspected, taken, or dropped; when a non-discreet Inventory Item is inspected, stashed, unstashed,
or carried from one [Room](room.md) to another; and when an Inventory Item (whether discreet or non-discreet) is
equipped or unequipped. No restrictions are placed on the content of this string, however it should generally contain
the Prefab's single name.

### Plural Containing Phrase

- Spreadsheet label: **Containing Phrase**
- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.pluralContainingPhrase`

This is the optional phrase that will be used in an item list when it contains multiple instances of Prefabs with the
same single containing phrase. Note that this shares the same spreadsheet cell as the Prefab's single containing phrase,
with both separated by a comma. If only one instance of a Prefab with a given single containing phrase is intended to
exist, it does not need a plural containing phrase. However, if multiple instances are intended to exist, even if its
plural containing phrase would be the same as its single containing phrase, one does need to be given.

### Discreet

- Spreadsheet label: **Discreet?**
- Class attribute: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)
  `this.discreet`

This is a simple Boolean value indicating whether interactions with Items and Inventory Items using this Prefab will
be [narrated](narration.md) or not. Specifically, if this is `false`, then Alter Ego will notify the Room if a Player
inspects, takes, or drops an Item using this Prefab; or inspects, stashes, unstashes, or moves to another Room carrying
an Inventory Item using this Prefab. Additionally, if this is `false`, then when an Inventory Item using this Prefab is
moved to either of the Player's hands, it will be added to the "hands" item list in that Player's description.

### Size

- Spreadsheet label: **Size**
- Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.size`

This is a whole number representing how large the Prefab is. It is not associated with any particular unit of
measurement, but instead represents relative sizes. For example, an ID card may have a size of 1 whereas a gun may have
a size of 2 and a ladder may have a size of 10. There are no rules to determine what size a Prefab should have, however
it should be non-negative.

### Weight

- Spreadsheet label: **Weight**
- Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.weight`

This is a whole number representing roughly how much the Prefab weighs in kilograms. This number determines whether a
Player is capable of taking an Item using this Prefab with their [strength stat](player.md#strength). For more details,
see the sections about [Item](item.md#weight)
and [Inventory Item](inventory_item.md#weight) weights.

### Usable

- Spreadsheet label: **Usable?**
- Class attribute: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)
  `this.usable`

This is another Boolean value indicating whether Inventory Items using this Prefab can be used to inflict/cure one or
more [Status Effects](status.md) on the Player using it. If this is `false`, the Player will be told the Inventory Item
has no programmed use. Additionally, if a Player already has all of the Status Effects the Prefab inflicts and doesn't
have any of the Status Effects it cures, the Player will not be able to use the Inventory Item and will instead be told
that it has no effect.

### Use Verb

- Spreadsheet label: **Use Verb**
- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.verb`

This is the phrase that will be used in the Narration when a Player uses an Inventory Item with this Prefab. Usage of an
Inventory Item will always be narrated, and will use the following format:

`[Player displayName] [this.verb] [this.singleContainingPhrase].`

See the following table for some examples of the resulting Narration:

| Player displayName           | Single Containing Phrase | Use Verb             | Narration                                            |
| ---------------------------- | ------------------------ | -------------------- | ---------------------------------------------------- |
| Veronica                     | FOOD                     | eats                 | Veronica eats FOOD.                                  |
| Faye                         | a bottle of WATER        | drinks               | Faye drinks a bottle of WATER.                       |
| An individual wearing a MASK | a TOWEL                  | dries off with       | An individual wearing a MASK dries off with a TOWEL. |
| Colin                        | a bottle of PAINKILLERS  | swallows a pill from | Colin swallows a pill from a bottle of PAINKILLERS.  |

### Uses

- Spreadsheet label: **Uses**
- Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.uses`

This is a whole number indicating how many times a single instance of this Prefab can be used. For more details, see the
sections about [Item uses](item.md#uses) and [Inventory Item uses](inventory_item.md#uses).

### Effects Strings

- Spreadsheet label: **Gives Status Effect(s)**
- Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.effectsStrings`

This is a comma-separated list of Status Effects that Inventory Items using this Prefab will inflict the Player with
when used.

### Effects

- Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Status Effect](status.md)>
  `this.effects`

This is an internal attribute which contains references to each of the Status Effect objects whose names are listed in
`this.effectsStrings`.

### Cures Strings

- Spreadsheet label: **Cures Status Effect(s)**
- Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.curesStrings`

This is a comma-separated list of Status Effects that Inventory Items using this Prefab will cure the Player of when
used. Status Effects will turn into their [cured condition](status.md#cured-condition), if applicable. Note that it will
attempt to cure them in the order given. As a consequence, if the next Status Effect in the list is the current Status
Effect's cured condition, it will immediately be cured after being inflicted, turning into _its_ cured condition, and so
on. For example, imagine the following series of Status Effects, where each one's cured condition follows the `->`
symbol:

`starving->famished->hungry->satisfied->full`

If a Player with the `starving` Status Effect uses an Inventory Item whose Prefab has the cures string
`starving, famished, hungry, satisfied`, then the Player will be cured of `starving` and inflicted with `famished`, then
cured of `famished` and inflicted with `hungry`, and so on until the Player is eventually inflicted with `full`.

In order to avoid this behavior, if a Prefab's cures string is meant to contain a list of Status Effects in a series,
they should be listed in reverse order. In the above example, the cures string should be
`satisfied, hungry, famished, starving`. That way, the Player will only be cured of `starving` and inflicted with
`famished`.

### Cures

- Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Status Effect](status.md)>
  `this.cures`

This is an internal attribute which contains references to each of the Status Effect objects whose names are listed in
`this.curesStrings`.

### Next Stage Name

- Spreadsheet label: **Turns Into**
- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.nextStageName`

This is the ID of the Prefab Inventory Items using this Prefab will turn into once its number of uses reaches 0. Prefabs
with infinite uses will never access this attribute. When an Inventory Item turns into its next stage, all of its
attributes will be replaced with that of the new Prefab. Note that if the Prefab has a limited number of uses and this
is blank, Inventory Items using it will simply disappear from the Player's inventory once they run out of uses.

### Next Stage

- Class attribute: [Prefab](prefab.md) `this.nextStage`

This is an internal attribute which simply contains a reference to the actual Prefab object whose ID matches
`this.nextStageName`. If no next stage name is given, this will be `null` instead.

### Equippable

- Spreadsheet label: **Equippable?**
- Class attribute: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)
  `this.equippable`

This is another Boolean value indicating whether Inventory Items using this Prefab can be equipped to one of the
player's [Equipment Slots](equipment_slot.md). If this is `true`, then Players will be able to equip it to one of the
Equipment Slots that it's restricted to. If this is `false`, they will simply be told that the item is unequippable.
Additionally, if this is `false`, Players will be unable to unequip the Inventory Item if it's already equipped. Note
that a [moderator](../../moderator_guide/moderating.md) can forcibly equip and unequip Inventory Items for a Player
regardless of whether this is `true` or `false`. Note that when an Inventory Item is equipped or unequipped, a Narration
will always be sent to the Room the Player is in.

### Equipment Slots

- Spreadsheet label: **Restrict to Equip. Slots**
- Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.equipmentSlots`

This is a list of Equipment Slots that Inventory Items using this Prefab can be equipped to. This should be a
comma-separated list. If a Player or a moderator attempts to equip an Inventory Item without specifying an Equipment
Slot to equip it to, Alter Ego will attempt to equip it to the first Equipment Slot listed here. If something is already
equipped to that Equipment Slot, another one will have to be manually specified. Note that if no Equipment Slots are
given here, Players will be unable to equip Inventory Items using this Prefab, even if its equippable attribute is set
to `true`. However, moderators can forcibly equip Inventory Items to _any_ of a Player's Equipment Slots, regardless of
whether or not it is listed here.

### Covered Equipment Slots

- Spreadsheet label: **Covers Equip. Slots**
- Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.coveredEquipmentSlots`

This is a list of Equipment Slots that this Prefab will cover when it is equipped. When an Equipment Slot is covered by
another equipped Inventory Item, the single containing phrase of whatever Inventory Item is equipped to it will be
removed from the equipment item list in the [Player's description](player.md#description). Only when the Player unequips
all Inventory Items whose Prefabs cover that Equipment Slot will the single containing phrase of that Inventory Item be
added to the Player description's equipment item list again.

### Equipped Commands

- Spreadsheet label: **When Equipped / Unequipped**
- Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.equipCommands`

This is a comma-separated list of [bot commands](../commands/bot_commands.md) that will be executed when an Inventory
Item using this Prefab is equipped. Note that this shares the same spreadsheet cell as the Prefab's unequipped commands,
with both sets of commands separated by a forward slash (`/`). If no unequipped commands are desired, the forward slash
can be omitted from the cell.

### Unequipped Commands

- Spreadsheet label: **When Equipped / Unequipped**
- Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.unequipCommands`

This is a comma-separated list of bot commands that will be executed when an Inventory Item using this Prefab is
unequipped. Note that this shares the same spreadsheet cell as the Prefab's equipped commands, with both sets of
commands separated by a forward slash (`/`). If no equipped commands are desired, the forward slash should be the first
character in the cell, with the unequipped commands following it.

### Inventory

- Spreadsheet label: **Contains Inventory Slots**
- Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>
  `this.inventory`

This is a list of inventory slot objects that instances of this Prefab will have. Items and Inventory Items with
inventory slots are capable of containing other Items/Inventory Items. Inventory slot objects have the following
structure:

`{ String name, Number capacity, Number takenSpace, Number weight, Array item }`

In order to define an inventory slot for a Prefab, the name of the inventory slot and its capacity should be given,
separated by a colon (`:`). For example, a Prefab with the ID "PANTS" might have two inventory slots, named "LEFT
POCKET" and "RIGHT POCKET", each with a capacity of 3. In this case, the cell for the "PANTS" Prefab's inventory slots
would be `LEFT POCKET: 3, RIGHT POCKET: 3`. There is no theoretical limit to the amount of inventory slots a single item
can have.

The size of every Item/Inventory Item placed into a single inventory slot is added to that inventory slot's takenSpace
value. If the quantity of that Item/Inventory Item is higher than 1, its size will be multiplied by its quantity before
being added. If inserting an Item/Inventory Item would cause the inventory slot's takenSpace value to exceed its
capacity, it cannot be inserted into that inventory slot. Additionally, every Item/Inventory Item inserted adds its own
weight to the inventory slot's weight. Lastly, the Item/Inventory Item itself will be inserted into the inventory slot's
item array.

When inventory slots are initialized, their takenSpace and weight attributes are set to 0. Their item arrays are
initially empty. Prefab inventory slots will always retain this initialized state. That is, even if an Item/Inventory
Item contains other Items/Inventory Items in one of its inventory slots, the corresponding inventory slots of its
associated Prefab will remain in its initialized, empty state. **Prefabs cannot contain Items/Inventory Items. The
inventory attribute of Prefabs is merely a template for _instances_ of those Prefabs to use so that _they_ can contain
Items/Inventory Items.**

### Preposition

- Spreadsheet label: **Preposition**
- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.preposition`

This attribute is similar to the [preposition attribute in the Object class](object.md#preposition). However, it does
not determine whether instances of this Prefab can contain Items/Inventory Items. That function is taken care of by the
inventory attribute of the Prefab. Otherwise, it functions the same. When a Player drops/stashes a non-discreet
Item/Inventory Item into an instance of this Prefab, Alter Ego will narrate them doing so using this preposition. For
example, if the player Seamus stashes an Inventory Item named MALLET into another Inventory Item named GUITAR CASE whose
Prefab has the preposition "in", Alter Ego will send "Seamus stashes a MALLET in his GUITAR CASE." to the Room channel
Seamus is currently in. If, however, Seamus drops the MALLET Inventory Item into a GUITAR CASE Item in the room, Alter
Ego will send "Seamus puts a MALLET in the GUITAR CASE."

### Description

- Spreadsheet label: **Description**
- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.description`

This is the description of the Prefab. When a Player inspects an instance of this Prefab, they will receive a parsed
version of this string. Any item lists in a Prefab's description _must_ be blank. Note that when a Player inspects an
Inventory Item that is equipped to one of another Player's Equipment Slots, all sentences containing item lists will be
removed from the description before it is parsed, effectively making it so that Players cannot see what is stashed in
that Inventory Item. See the article on [writing descriptions](../../moderator_guide/writing_descriptions.md) for more
information.

### Row

- Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.row`

This is an internal attribute, but it can also be found on the spreadsheet. This is the row number of the Prefab.
