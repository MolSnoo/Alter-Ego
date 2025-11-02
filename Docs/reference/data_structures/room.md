# Room

A **Room** is a data structure in the Neo World Program. It represents a room that [Players](player.md) can move to.

## Table of Contents

<!-- toc -->

## Attributes

Despite being the basis of the Neo World Program game, Rooms have relatively few attributes. Note that if an attribute
is _internal_, that means it only exists within
the [Room class](https://github.com/MolSnoo/Alter-Ego/blob/master/Data/Room.js). Internal attributes will be given in
the "Class attribute" bullet point, preceded by their data type. If an attribute is _external_, it only exists on
the spreadsheet. External attributes will be given in the "Spreadsheet label" bullet point.

### Name

* Spreadsheet label: **Room Name**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.name`

This is the name of the Room. Unlike the name attribute in most other data structures, this must be in all lowercase
letters, with no spaces (though hyphens are allowed) or special characters. The reason for this is that the Room name
must be exactly the same as the corresponding [Discord](../../about/discord.md) channel.

### Channel

* Class attribute: [TextChannel](https://discord.js.org/docs/packages/discord.js/main/TextChannel:Class) `this.channel`

This is an internal attribute. When the Room data is loaded, Alter Ego will attempt to find the channel whose name
matches the name of the Room. By making the channel a persistent internal attribute, Alter Ego can perform many
operations more easily, such as adding a Player to the Room's channel. It should be noted that even if a Room's channel
is not part of a [room category](../settings/docker_settings.md#room_categories), Players will still be added to the channel
when moving to its associated Room and  [Narrations](narration.md) will still be sent to the channel, but [commands](../commands/player_commands.md)
and [dialog]() sent to that channel will not be passed through
the [commandHandler](https://github.com/MolSnoo/Alter-Ego/blob/master/Modules/commandHandler.js)
and [dialogHandler](https://github.com/MolSnoo/Alter-Ego/blob/master/Modules/dialogHandler.js) modules, respectively.

### Tags

* Spreadsheet label: **Tags**
* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.tags`

This is a comma-separated list of keywords or phrases assigned to a Room that allows that Room, and others with shared
tags, to be affected by [Events](event.md). There are no rules for how tags must be named, and there is no theoretical
limit on the number of tags a single Room can have. Some tags have predefined behavior. Here, each predefined tag will
be listed, and their behavior will be detailed.

#### `soundproof`
* All dialog spoken inside the Room will not be narrated in adjacent Rooms, even if it is shouted or if Players in
  adjacent Rooms have the [`acute hearing` behavior attribute](status.md#acute-hearing).
* Players in the Room will not hear dialog from adjacent Rooms, regardless of the same circumstances.
#### `audio surveilled`
* All non-Whispered dialog sent to the Room will be narrated in all Rooms with the `audio monitoring` tag with an
  indication of which Room the dialog originated in.
* While there is no limit to how many Rooms can have this tag, applying it to too many could negatively affect Alter
  Ego's performance.
#### `audio monitoring`
* All non-Whispered dialog sent to any Room with the `audio surveilled` tag will be sent to the Room with an
  indication of which Room the dialog originated in.
  * Example: `[break-room] Someone with a crisp voice says "Are you listening to me?".`
* All shouted dialog sent to Rooms adjacent to a Room with the `audio surveilled` tag will be narrated in the Room
  with the `audio monitoring` tag, as long as there is at least one Player in the Room with the `audio surveilled`
  tag.
  * Example: `[break-room] Someone in a nearby room with an obnoxious voice shouts "SOMEONE HELP!".`
#### `video surveilled`
* All [Narrations](narration.md) sent to the Room will be narrated in all Rooms with the
  `video monitoring` tag with an indication of which Room the Narration originated in.
* While there is no limit to how many Rooms can have this tag, applying it to too many could negatively affect Alter
  Ego's performance.
#### `video monitoring`
* All Narrations sent to any Room with the `video surveilled` tag will be sent to the Room with an indication of
  which Room the Narration originated in.
  * Example: `[break-room] Kyra begins inspecting the DESK.`
* If the Room also has the `audio monitoring` tag, then all non-Whispered dialog spoken in any Room with the
  `video surveilled` and `audio surveilled` tags will appear as a more natural dialog message, with the
  speaker's [display name](player.md#display-name)
  and [display icon](player.md#display-icon) alongside the name of the Room the dialog originated in.
#### `secret`
* If the Room also has the `audio surveilled` or `video surveilled` tag, then its name will be obscured when dialog
  and Narrations are transmitted to Rooms with the `audio monitoring` or `video monitoring` tags.
  * Example: `[Intercom] Someone with a crisp voice says "Are you listening to me?".`
  * Example: `[Surveillance feed] Kyra begins inspecting the DESK.`

### Icon URL

* Spreadsheet label: **Icon URL**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.iconURL`

This is an optional image URL that will accompany a Room's description. The URL must end in `.jpg`, `.png`, or `.gif`.

### Exits

* Spreadsheet labels: **Exits**, **X**, **Y**, **Z**, **Unlocked?**, **Leads To**, **From**, **Room Description**
* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Exit](exit.md)>
  `this.exit`

This is a list of Exits in the Room. All Rooms that can be accessed via a given Room's Exits are considered **adjacent**
to the given Room, meaning a Player can freely travel to them. For more information, see the article
on [Exits](exit.md).

### Room Description

* Spreadsheet label: **Room Description**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.description`

This is the default description of a Room. The default description will always be the description for the first Exit in
the Room. When a Player enters or inspects a Room, they will receive a parsed version of this string. The Player will
not be sent the Room's description by itself. Instead, they will be sent
a [Discord Embed](https://discord.js.org/docs/packages/discord.js/main/Embed:Class) containing:

* The name of the Room.
* The Room's default description, or the description of the Exit they entered from.
* The Room's occupants, excluding the Player themself.
* The description of the Room's [default drop Object](../settings/docker_settings.md#default_drop_object). If the Room doesn't
  have one, "You don't see any items." will be sent instead.
* The Room's icon URL. If the Room does not have one, then
  the [default Room icon URL](../settings/docker_settings.md#default_room_icon_url) will be used instead. If no default Room
  icon URL is set, then Alter Ego will use the server icon instead. If the server icon is not set, then no image will be
  sent in the MessageEmbed.

![An example of a Room description MessageEmbed.](https://i.imgur.com/6fY2HKd.png)

See the article on [writing descriptions](../../moderator_guide/writing_descriptions.md) for more information.

### Row

* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.row`

This is an internal attribute, but it can also be found on the spreadsheet. This is the row number of the first Exit in
a Room. Alter Ego uses this data to determine which row of the Rooms spreadsheet contains the default description for a
Room.

### Occupants

* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Player](player.md)>
  `this.occupants`

This is an internal attribute. It is an array of all Players currently in the Room.

### Occupants String

* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.occupantsString`

This is an internal attribute. It is a string listing all of the Room's
occupants' [display names](player.md#display-name) in alphabetical order, however any Players with the
[`hidden` behavior attribute](status.md#hidden) are omitted.