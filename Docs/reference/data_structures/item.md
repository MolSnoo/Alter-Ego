# Item

An Item is a data structure in the Neo World Program. It represents an item in a [Room](room.md)
that a [Player](player.md) can take with them. It is an instance of a [Prefab](prefab.md), and is similar to
an [Inventory Item](inventory_item.md).

## Attributes

Items themselves have relatively few attributes. However. being instances of Prefabs, they inherit many attributes as a
result. Note that if an attribute is _internal_, that means it only exists within
the [Item class](https://github.com/MolSnoo/Alter-Ego/blob/master/Data/Item.js). Internal attributes will be given in
the "Class attribute" bullet point, preceded by their data type. If an attribute is _external_, it only exists on the
spreadsheet. External attributes will be given in the "Spreadsheet label" bullet point.

### Prefab

- Spreadsheet label: **Prefab**
- Class attribute: [Prefab](prefab.md) `this.prefab`

This is the ID of the Prefab this Item is an instance of. It gives the Item most of its properties. The class attribute,
`this.prefab` is a reference to the actual Prefab object underlying the Item, making all of that Prefab's attributes
accessible.

### Identifier

- Spreadsheet label: **Container Identifier**
- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.identifier`

This is a unique name given to the Item if it is capable of containing other Items. This is necessary when loading Items
in order for Alter Ego to determine which container the child Items belong to, in case there are multiple container
Items with the same Prefab. Typically, this is the Prefab ID followed by a number (the standard followed by
the [itemManager module](https://github.com/MolSnoo/Alter-Ego/blob/master/Modules/itemManager.js)), but there are no
naming rules for identifiers. No two Items or Inventory Items can have the same identifier. For an example of how this
looks, see the following table:

| Prefab ID       | Container Identifier | Location | Container                               | Quantity |
| --------------- | -------------------- | -------- | --------------------------------------- | -------- |
| VINYL GLOVE BOX | VINYL GLOVE BOX 1    | kitchen  | Object: HAND WASH STATION 1             | 1        |
| VINYL GLOVE BOX | VINYL GLOVE BOX 2    | kitchen  | Object: HAND WASH STATION 2             | 1        |
| VINYL GLOVES    |                      | kitchen  | Item: VINYL GLOVE BOX 1/VINYL GLOVE BOX | 10       |
| VINYL GLOVES    |                      | kitchen  | Item: VINYL GLOVE BOX 2/VINYL GLOVE BOX | 10       |

For Items that are not capable of containing Items, this can be left blank.

### Single Name

- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.name`

This is an internal attribute which is a copy of the Prefab's single name. Its purpose is to make accessing the Prefab's
single name slightly easier.

### Plural Name

- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.pluralName`

This is an internal attribute which is a copy of the Prefab's plural name. Its purpose is to make accessing the Prefab's
plural name slightly easier.

### Single Containing Phrase

- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.singleContainingPhrase`

This is an internal attribute which is a copy of the Prefab's single containing phrase. Its purpose is to make accessing
the Prefab's single containing phrase slightly easier.

### Plural Containing Phrase

- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.pluralContainingPhrase`

This is an internal attribute which is a copy of the Prefab's plural containing phrase. Its purpose is to make accessing
the Prefab's plural containing phrase slightly easier.

### Location

- Spreadsheet label: **Location**
- Class attribute: [Room](room.md) `this.location`

This is the Room the Item can be found in. This must match the Room's name exactly on the spreadsheet.

### Accessible

- Spreadsheet label: **Accessible?**
- Class attribute: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)
  `this.accessible`

This is a simple Boolean value indicating whether the Item can currently be interacted with or not. If this is `true`,
then players can inspect and take the Item. If it is `false`, Alter Ego will act as if the Item doesn't exist when a
player tries to interact with it in any way.

### Container Name

- Spreadsheet label: **Container**
- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.containerName`

This is a type and name of the container the Item can be found in. An Item's container is the data structure whose
description contains a mention of the Item in an [item list](../../moderator_guide/writing_descriptions.md#il). When the
Item is taken, mention of the Item will be removed from the item list in its container. Note that the Item's container
must be in the same Room as the Item itself.

In order to properly specify an Item's container, the type of the container must be specified, then a colon, then the
container's name. However, if the container is another Item, then its identifier must be given instead of its name, and
the [inventory slot](prefab.md#inventory) this Item is in, with both separated by a forward slash (`/`). For some
examples of correct container names, see the following table:

| Type   | Name / Identifier | Inventory Slot | Container Name                      |
| ------ | ----------------- | -------------- | ----------------------------------- |
| Object | SHELF             |                | Object: SHELF                       |
| Puzzle | LOCKER 1          |                | Puzzle: LOCKER 1                    |
| Item   | KAEDES BACKPACK 1 | MAIN POCKET    | Item: KAEDES BACKPACK 1/MAIN POCKET |

### Container

- Class attribute: [Object](object.md)|[Puzzle](puzzle.md)|[Item](item.md)
  `this.container`

This is an internal attribute which simply contains a reference to the actual Object, Puzzle, or Item object whose name
matches `this.containerName` and whose location is the same as the Item.

### Slot

- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.slot`

This is an internal attribute which simply contains the name of the inventory slot of the container Item that this Item
is in.

### Quantity

- Spreadsheet label: **Quantity**
- Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.quantity`

This is a whole number indicating how many instances of this Item there are in the given container. So long as its
quantity is greater than 0, this Item can be inspected and taken from its container. If no quantity is given, the Item
will be treated as though it has an infinite quantity. Items capable of containing other Items cannot have a quantity
greater than 1.

### Uses

- Spreadsheet label: **Uses**
- Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.uses`

This is a whole number indicating how many times this Item can be used. Although this number is derived from an Item's
Prefab, it can be manually set to differ on the spreadsheet. If no number of uses is given, the Item can be used
infinitely. Note that Items cannot be used by a Player, so this attribute primarily denotes how many times an Item can
be used if it is turned into an Inventory Item by being taken. For more details, see the section
about [Inventory Item uses](inventory_item.md#uses).

Alter Ego uses this attribute when processing this Item as part of a [Recipe](recipe.md). If this Item is used as an
ingredient and its Prefab is listed as a product in the Recipe, and it has a limited number of uses, its uses will be
decreased by 1 every time the Recipe is finished processing. If this happens and its uses is decreased to 0, one of two
things will happen:

- If the Item's Prefab has a [next stage](prefab.md#next-stage), then it will be destroyed and its next stage will be
  instantiated.
- If the Item's Prefab has no next stage, it will simply be destroyed.

### Weight

- Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.weight`

This is an internal attribute. It is a whole number inherited from the weight of Item's Prefab. If the Item is capable
of containing Items, the Items inside will add to the weight of the parent Item.

### Inventory

- Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>
  `this.inventory`

This is a list of inventory slot objects that the Item has. It is inherited from its Prefab. For more details, see the
section about [Prefab inventories](prefab.md#inventory).

### Description

- Spreadsheet label: **Description**
- Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.description`

This is the description of the Item. Note that this can be completely different from the description of the Item's
Prefab. When a Player inspects this Item, they will receive a parsed version of this string. See the article
on [writing descriptions](../../moderator_guide/writing_descriptions.md) for more information.

### Row

- Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.row`

This is an internal attribute, but it can also be found on the spreadsheet. This is the row number of the Item.
