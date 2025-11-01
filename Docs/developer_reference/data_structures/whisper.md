# Whisper

A **Whisper** is a data structure in the [[Neo World Program]]. It represents a group of two or
more [Players](player.md) speaking quietly to each other such that no one else in the [Room](room.md) can hear them.

A normal Whisper can only be created when a Player or [[moderator|Tutorial:-Moderating]] uses
the [whisper](../commands/player_commands.md#whisper) [command](../commands/moderator_commands.md#whisper). There is no
upper limit to the number of Players that can be included in a Whisper, so long as they are all in the same Room.
However, it is not possible for one Player to create a Whisper with Players in the Room who have the `hidden`,
`concealed`, `no hearing`, or `unconscious` [behavior attributes](status.md#behavior-attributes). If a Player in a
Whisper becomes inflicted with a [Status Effect](status.md) with one of these behavior attributes or they leave the
Room, they will be removed from the Whisper. If, when a Player is removed from the Whisper, the group of Players
remaining is the same as a different Whisper that already exists, it will be deleted upon the Player's removal.
Otherwise, a Whisper will only be deleted once all Players have been removed from it.

A Whisper can also be created when a Player [[hides|hiding]] in an [Object](object.md). This allows a Whisper to be
created with only one Player. However, if more Players hide in the same Object, the Whisper will be deleted and a new
one will be created with all Players. A Whisper created in this way behaves similarly to a Room, but with most of the
same properties as a normal Whisper. When a Player comes out of hiding or is inflicted with a Status Effect with the
`no channel` or `no hearing` behavior attributes, they will be removed from the Whisper. When all Players are removed
from the Whisper, it will be deleted.

## Table of Contents

<!-- toc -->

## Attributes

Whispers have few attributes.

### Players

* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Player](player.md)>
  `this.players`

This is an array of all Players currently in the Whisper.

### Location

* Class attribute: [Room](room.md) `this.location`

This is the Room the Whisper exists in. All of the Players in the Whisper must be in this Room.

### Channel Name

* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.channelName`

This is the name that the channel will be set to. It is created using the [name](room.md#name) of the Whisper's location
followed by an alphabetized list of all the Players' [display names](player.md#display-name), all separated with
hyphens (`-`). Whenever a Player is removed from the Whisper, the channel name is updated to exclude them.

### Channel

* Class attribute: [TextChannel](https://discord.js.org/#/docs/main/stable/class/TextChannel) `this.channel`

When the Whisper is initialized, a channel is created for it in
the [[Whisper category|Tutorial:-Settings-(Node)#whispercategory]]. In this channel, Players can speak to each other
freely without others in the Room hearing them.

If a Player is part of a Whisper but has the `no channel` behavior attribute, they will not be given permission to view
the channel. This is helpful for Players with the `concealed` behavior attribute, for example, because having that
permission would allow other Players in the Whisper to see their [[Discord]] account, thus revealing their identity.
Similarly, Players in the Whisper with the `no hearing` behavior attribute are not given permission to view the channel.
NPCs are also not given permission to view the channel, because they don't have Discord accounts. When a Player is
removed from the Whisper, their permission to view the channel is revoked.

When a Whisper is marked to be deleted, one of two things can happen. If
the [[autoDeleteWhisperChannels setting|Tutorial:-Settings-(Node)#autodeletewhisperchannels]] is `true`, then the
channel will be deleted as well. If it is `false`, then the channel's name will be set to "archived-(Room name)".
Discord only allows a single category to have up to 50 channels. Therefore, if Whisper channels are not automatically
deleted, they must be moved to another category or manually deleted before this limit is reached. Otherwise, no new
Whispers can be created.