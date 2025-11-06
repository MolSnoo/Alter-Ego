# Gesture

A Gesture is a data structure in the Neo World Program. It represents a form of body language that a
[Player](player.md) can use to communicate with other Players nonverbally.

Gestures are static; once loaded from the spreadsheet, they do not change in any way. Thus,
the [saver module](https://github.com/MolSnoo/Alter-Ego/blob/master/Modules/saver.js) will never make changes to the
Gestures sheet. As a result, the Gestures sheet can be freely edited
without [edit mode](../../moderator_guide/edit_mode.md) being enabled.

## Table of Contents

<!-- toc -->

## Attributes

Gestures have very few attributes. Note that if an attribute is _internal_, that means it only exists within
the [Gesture class](https://github.com/MolSnoo/Alter-Ego/blob/master/Data/Gesture.js). Internal attributes will be given
in the "Class attribute" bullet point, preceded by their data type. If an attribute is _external_, it only exists on the
spreadsheet. External attributes will be given in the "Spreadsheet label" bullet point.

### Name

* Spreadsheet label: **Gesture Name**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.name`

This is a name of the Gesture. This is what a Player must input in order to perform this Gesture. There are no rules for
how Gestures must be named, although they are conventionally named with all lowercase letters. Each Gesture must have a
unique name. Additionally, a Gesture cannot be named "list", as attempting to perform a Gesture with that name would
instead bring up the list of all Gestures.

### Requires

* Spreadsheet label: **Requires**
* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.requires`

This is a comma-separated list of data types the Gesture can take as a target. Accepted data types are:

* [Exit](exit.md)
* [Object](object.md)
* [Item](item.md)
* [Player](player.md)
* [Inventory Item](inventory_item.md)

If this is not blank, then a Player who attempts to perform this Gesture must supply something in the [Room](room.md)
they're in of one of the accepted data types as a target. For example, if the Gesture requires an Object, then the
Player must give the name of an Object in the Room in order to perform this Gesture. If the Gesture requires an Item or
an Inventory Item, then the Player must give the name of an Item in the Room they're in or an Inventory Item in their
RIGHT HAND or LEFT HAND. If this is blank, then the Player can perform this Gesture without specifying a target.

### Disabled Statuses Strings

* Spreadsheet label: **Don't Allow If**
* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.disabledStatusesStrings`

This is a comma-separated list of [Status Effects](status.md) that prevent this Gesture from being performed. If a
Player who is inflicted with any of the Status Effects listed here attempts to use this Gesture, they will be unable to
do so.

### Disabled Statuses

* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Status Effects](status.md)>
  `this.disabledStatuses`

This is an internal attribute which contains references to each of the Status Effect objects whose names are listed in
`this.disabledStatusesStrings`.

### Description

* Spreadsheet label: **Description**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.description`

This is a plain string that describes what the Player will do when they perform this Gesture. This appears in the
Gesture list. It does not use XML tags - it must be plain text. An ideal Gesture description should be in second person
and use as few words as possible.

### Narration

* Spreadsheet label: **Narration**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.narration`

This is the [Narration]() that will be parsed and then sent to the Player's Room channel when this Gesture is performed.
See the article on [writing descriptions](../../moderator_guide/writing_descriptions.md) for more information.

### Row

* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.row`

This is an internal attribute, but it can also be found on the spreadsheet. This is the row number of the Gesture.

### Target Type

* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.targetType`

This is an internal attribute which is only assigned when a Gesture is instantiated in
the [gesture Player method](https://github.com/MolSnoo/Alter-Ego/blob/master/Data/Player.js#L1761). It indicates the
data type of the Gesture's target. This allows the Gesture's Narration to
contain [conditional formatting](../../moderator_guide/writing_descriptions.md#if) based on the data type of the target.

### Target

* Class
  attribute: [Exit](exit.md)|[Object](object.md)|[Item](item.md)|[Player](player.md)|[Inventory Item](inventory_item.md)
  `this.target`

This is an internal attribute which is only assigned when a Gesture is instantiated in the gesture Player method. It
contains a reference to the target object. This allows the Gesture's Narration
to [make use of the target's class attributes](../../moderator_guide/writing_descriptions.md#var). For example, if a
Gesture requires an Object as a target, then the tag `<var v="this.target.name" />` can be used to insert
the [name](object.md#name) of the Object in the Narration; if a Gesture requires an Item as a target, then the tag
`<var v="this.target.singleContainingPhrase" />` can be used to insert
the [single containing phrase](item.md#single-containing-phrase) of the Item in the Narration; and so on.