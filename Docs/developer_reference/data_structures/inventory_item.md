# Inventory Item

An **Inventory Item** is a data structure in the [[Neo World Program]]. It represents an item that is currently
possessed by a [[Player|Data-Structure:-Player]]. It is an instance of a [[Prefab|Data-Structure:-Prefab]], and is
similar to an [[Item|Data-Structure:-Item]].

## Table of Contents

<!-- toc -->

## Attributes

Inventory Items themselves have relatively few attributes. However, being instances of Prefabs, they inherit many
attributes as a result. Note that if an attribute is _internal_, that means it only exists within
the [InventoryItem class](https://github.com/MolSnoo/Alter-Ego/blob/master/Data/InventoryItem.js). Internal attributes
will be given in the "Class attribute" bullet point, preceded by their data type. If an attribute is _external_, it only
exists on the [[spreadsheet]]. External attributes will be given in the "Spreadsheet label" bullet point.

### Player

* Spreadsheet label: **Player Name**
* Class attribute: [[Player|Data-Structure:-Player]] `this.player`

This is the name of the Player whose inventory this Inventory Item is in. This must match the Player's name exactly on
the spreadsheet.

### Prefab

* Spreadsheet label: **Prefab**
* Class attribute: [[Prefab|Data-Structure:-Prefab]] `this.prefab`

This is the ID of the Prefab this Inventory Item is an instance of. It gives the Inventory Item most of its properties.
The class attribute, `this.prefab` is a reference to the actual Prefab object underlying the Inventory Item, making all
of that Prefab's attributes accessible.

This cell can never be left blank, even for empty [[Equipment Slots|Data-Structure:-EquipmentSlot]]. If the Inventory
Item is an Equipment Slot with nothing equipped to it, this should be `NULL`.

### Identifier

* Spreadsheet label: **Container Identifier**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.identifier`

This is a unique name given to the Inventory Item if it is capable of containing other Inventory Items. This is
necessary when loading Inventory Items in order for Alter Ego to determine which container the child Inventory Items
belong to, in case there are multiple container Inventory Items with the same Prefab. Typically, this is the Prefab ID
followed by a number (the standard followed by
the [itemManager module](https://github.com/MolSnoo/Alter-Ego/blob/master/Modules/itemManager.js)), but there are no
naming rules for identifiers. No two Items or Inventory Items can have the same identifier. For an example of how this
looks, see the following table:

| Player Name | Prefab ID   | Container Identifier | Equipment Slot | Container                  | Quantity |
|-------------|-------------|----------------------|----------------|----------------------------|----------|
| Astrid      | BLACK PARKA | BLACK PARKA 1        | RIGHT HAND     |                            | 1        |
| Astrid      | BLACK PARKA | BLACK PARKA 2        | JACKET         |                            | 1        |
| Astrid      | COIN        |                      | RIGHT HAND     | BLACK PARKA 1/RIGHT POCKET | 10       |
| Astrid      | COIN        |                      | JACKET         | BLACK PARKA 2/RIGHT POCKET | 10       |

For Inventory Items that are not capable of containing Inventory Items, this can be left blank.

### Single Name

* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.name`

This is an internal attribute which is a copy of the Prefab's single name. Its purpose is to make accessing the Prefab's
single name slightly easier.

### Plural Name

* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.pluralName`

This is an internal attribute which is a copy of the Prefab's plural name. Its purpose is to make accessing the Prefab's
plural name slightly easier.

### Single Containing Phrase

* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.singleContainingPhrase`

This is an internal attribute which is a copy of the Prefab's single containing phrase. Its purpose is to make accessing
the Prefab's single containing phrase slightly easier.

### Plural Containing Phrase

* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.pluralContainingPhrase`

This is an internal attribute which is a copy of the Prefab's plural containing phrase. Its purpose is to make accessing
the Prefab's plural containing phrase slightly easier.

### Equipment Slot

* Spreadsheet label: **Equipment Slot**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.equipmentSlot`

This is the name of the Equipment Slot that this Inventory Item belongs to, whether it is equipped to it or contained in
another Inventory Item that is. This cell can never be left blank. For more information, see the article
on [[Equipment Slots|Data-Structure:-EquipmentSlot]].

### Found Equipment Slot

* Class attribute: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)
  `this.foundEquipmentSlot`

This is an internal attribute which is only used during the process of loading data from the spreadsheet to check if the
Equipment Slot given for an Inventory Item contained within another Inventory Item actually exists.

### Container Name

* Spreadsheet label: **Container**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.containerName`

This is a container identifier and slot of the container the Inventory Item can be found in. Unlike Items, Inventory
Items cannot have containers of different types; they can only be other Inventory Items. An Inventory Item's container
will have a description that contains a mention of the Inventory Item in
an [[item list|Tutorial:-Writing-descriptions#il]]. When the Inventory Item is unstashed, mention of the Inventory Item
will be removed from the item list in its container. Note that the Inventory Item's container must belong to the same
Player and Equipment Slot as the Inventory Item itself.

In order to properly specify an Inventory Item's container, the container's identifier must be given, as well as
the [[inventory slot|Data-Structure:-Prefab#inventory]] this Inventory Item is in, with both separated by a forward
slash (`/`). The following are some examples of correct container names:

* LAB COAT 1/RIGHT POCKET
* LAB COAT 2/LEFT POCKET
* PLASTIC BAG 34/PLASTIC BAG

If no container name is supplied, then this Inventory Item is equipped to the listed Equipment Slot.

### Container

* Class attribute: [[InventoryItem|Data-Structure:-InventoryItem]] `this.container`

This is an internal attribute which simply contains a reference to the actual Inventory Item object in the Player's
inventory whose container identifier matches that of `this.containerName`. If this Inventory Item is equipped to an
Equipment Slot (and thus doesn't have a container name) or the container it belongs to no longer exists in the Player's
inventory, then this is `null`.

### Slot

* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.slot`

This is an internal attribute which simply contains the name of the inventory slot of the container Inventory Item that
this Inventory Item is in.

### Quantity

* Spreadsheet label: **Quantity**
* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.quantity`

This is a whole number indicating how many instances of this Inventory Item there are in the given container. So long as
its quantity is greater than 0, this Inventory Item can be inspected and unstashed from its container. Unlike Items,
Inventory Items cannot have an infinite quantity; a value must be provided. Inventory Items capable of containing other
Inventory Items cannot have a quantity greater than 1. Equipped Inventory Items cannot have a quantity other than 1,
unless they have the `NULL` Prefab - in that case, their quantity should be left blank.

### Uses

* Spreadsheet label: **Uses**
* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.uses`

This is a whole number indicating how many times this Inventory Item can be used with
the [[use command|Commands#use-player-command]]. Although this number is derived from an Inventory Item's Prefab, it can
be manually set to differ on the spreadsheet. If no number of uses is given, the Inventory Item can be used infinitely.
If the Inventory Item is dropped, its uses will be retained when it's converted into an Item. This number can then be
used when the subsequent Item is processed as part of a [[Recipe|Data-Structure:-Recipe]]. For more details, see the
section about [[Item uses|Data-Structure:-Item#uses]].

When this Inventory Item is used (assuming its Prefab is [[usable|Data-Structure:-Prefab#usable]]), different things
will happen depending on certain factors. First, it will inflict the Player with all of
the [[Status Effects|Data-Structure:-Status]] listed in its
Prefab's [[effects strings|Data-Structure:-Prefab#effects-strings]] and cure the Player of all of the Status Effects
listed in its Prefab's [[cures strings|Data-Structure:-Prefab#cures-strings]]. Then, if it has a limited number of uses,
its uses will be decreased by 1. If this happens and its uses is decreased to 0, one of two things will happen:

* If the Inventory Item's Prefab has a [[next stage|Data-Structure:-Prefab#next-stage]], then it will be destroyed and
  its next stage will be instantiated in its place.
* If the Inventory Item's Prefab has no next stage, it will simply be destroyed.

### Weight

* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.weight`

This is an internal attribute. It is a whole number inherited from the weight of Inventory Item's Prefab. If the
Inventory Item is capable of containing Inventory Items, the Inventory Items inside will add to the weight of the parent
Inventory Item. This will also be added to the Player's [[carry weight|Data-Structure:-Player#carry-weight]].

### Inventory

* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>
  `this.inventory`

This is a list of inventory slot objects that the Inventory Item has. It is inherited from its Prefab. For more details,
see the section about [[Prefab inventories|Data-Structure:-Prefab#Inventory]].

### Description

* Spreadsheet label: **Description**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.description`

This is the description of the Inventory Item. Note that this can be completely different from the description of the
Inventory Item's Prefab. When a Player inspects this Inventory Item, they will receive a parsed version of this string.
See the article on [[writing descriptions|Tutorial:-Writing-descriptions]] for more information. Note that when an
Inventory Item is inspected by a different Player than the one who possesses it, all sentences containing item list tags
will be removed.

### Row

* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.row`

This is an internal attribute, but it can also be found on the spreadsheet. This is the row number of the Inventory
Item.