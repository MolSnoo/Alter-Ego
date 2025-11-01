# Moderator commands

Moderator commands are usable by users with
the [Moderator role](../../appendix/manual_installation/channel_and_role_creation.md#moderator). These commands
allow [moderators](../../moderator_guide/moderating.md) to control the game world and Players. They allow many built-in
restrictions placed on Players' actions to be bypassed.

Most moderator commands can only be used when a game is in progress, but some are able to be used when this isn't the
case. With the exception of the delete command, all moderator commands must be sent to the [bot commands channel](
../../appendix/manual_installation/channel_and_role_creation.md#channel-bot-commands).

## Table of Contents

<!-- toc -->

## clean

Cleans the items and inventory items sheets.

#### Aliases

`.clean` `.autoclean`

#### Examples

    .clean
    .autoclean

#### Description

Combs through all items and inventory items and deletes any whose quantity is 0. All game data will then be saved to the
spreadsheet, not just items and inventory items. This process will effectively clean the spreadsheet of items and
inventory items that no longer exist, reducing the size of both sheets. Note that edit mode must be turned on in order
to use this command. The items and inventory items sheets must be loaded after this command finishes executing,
otherwise data may be overwritten on the sheet during gameplay.

## craft

Crafts two items in a player's inventory together.

#### Aliases

`.craft` `.combine` `.mix`

#### Examples

    .craft chris drain cleaner and plastic bottle
    .combine keiko's bread and cheese
    .mix finn red vial with blue vial
    .craft dayne's soap with knife

#### Description

Creates a new item using the two items in the given player's hand. The names of the items must be separated by "with"
or "and". If no recipe for those two items exists, the items cannot be crafted together. Note that this command can also
be used to use one item on another item, which may produce something new.

## createroomcategory

Creates a room category.

#### Aliases

`.createroomcategory` `.register`

#### Examples

    .createroomcategory Floor 1
    .register Floor 2

#### Description

Creates a room category channel with the given name. The ID of the new category channel will automatically be added to
the roomCategories setting in the serverconfig file. If a room category with the given name already exists, but its ID
hasn't been registered in the roomCategories setting, it will automatically be added. Note that if you create a room
category in Discord without using this command, you will have to add its ID to the roomCategories setting manually.

## dead

Lists all dead players.

#### Aliases

`.dead` `.died`

#### Examples

    .dead
    .died

#### Description

Lists all dead players.

## delete

Deletes multiple messages at once.

#### Aliases

`.delete`

#### Examples

    .delete 3
    .delete 100
    .delete @Alter Ego 5
    .delete @MolSno 75

#### Description

Deletes multiple messages at once. You can delete up to 100 messages at a time. Only messages from the past 2 weeks can
be deleted. You can also choose to only delete messages from a certain user. Note that if you specify a user and for
example, 5 messages, it will not delete that user's last 5 messages. Rather, it will search through the past 5 messages,
and if any of those 5 messages were sent by the given user, they wil be deleted.

## destroy

Destroys an item.

#### Aliases

`.destroy`

#### Examples

    .destroy volleyball at beach
    .destroy gasoline on shelves at warehouse
    .destroy note in locker 1 at mens locker room
    .destroy wrench in tool box at beach house
    .destroy gloves in breast pocket of tuxedo at dressing room
    .destroy all in trash can at lounge
    .destroy nero's katana
    .destroy yuda's glasses
    .destroy vivians laptop in vivian's vivians satchel
    .destroy shotput ball in cassie's main pocket of large backpack
    .destroy all in hitoshi's trousers
    .destroy all in charlotte's right pocket of dress

#### Description

Destroys an item in the specified location or in the player's inventory. The prefab ID or container identifier of the
item must be given. In order to destroy an item, the name of the room must be given, following "at". The name of the
container it belongs to can also be specified. If the container is another item, the identifier of the item or its
prefab ID must be used. The name of the inventory slot to destroy the item from can also be specified.

To destroy an inventory item, the name of the player must be given followed by "'s". A container item can also be
specified, as well as which slot to delete the item from. The player will not be notified if a container item is
specified. An equipment slot can also be specified instead of a container item. This will destroy whatever item is
equipped to it. The player will be notified in this case, and the item's unequipped commands will be run.

Note that using the "all" argument with a container will destroy all items in that container.

## dress

Takes and equips all items from a container for a player.

#### Aliases

`.dress` `.redress`

#### Examples

    .dress ezekiel wardrobe
    .dress kelly laundry basket
    .redress luna main pocket of backpack

#### Description

Takes all items from a container of your choosing and equips them for the given player, if possible. They must have a
free hand to take an item. Items will be equipped in the order in which they appear on the spreadsheet. If an item is
equippable to an equipment slot, but the player already has something equipped to that slot, it will not be equipped,
and they will not be notified when this happens. If the container you choose has multiple inventory slots, you can
specify which slot to dress from. Otherwise, the player will dress from all slots.

## drop

Drops the given item from a player's inventory.

#### Aliases

`.drop` `.discard` `.d`

#### Examples

    .drop emily's knife
    .drop veronica knife on counter
    .drop colin's fish sticks in oven
    .drop aria yellow key in large purse
    .drop devyn wrench on top rack of tool box

#### Description

Forcibly drops an item for a player. The item must be in either of the player's hands. You can specify where in the room
to drop the item into by putting the name of an object or item in the room after the item. If you want to discard the
item in an item with multiple inventory slots, you can specify which slot to put it in. If no object or item is
specified, they will drop it on the FLOOR. This can be changed in the settings file. Only objects and item in the same
room as the player can be specified.

## editmode

Toggles edit mode for editing the spreadsheet.

#### Aliases

`.editmode`

#### Examples

    .editmode
    .editmode on
    .editmode off

#### Description

Toggles edit mode on or off, allowing you to make edits to the spreadsheet. When edit mode is turned on, Alter Ego will
no longer save the game to the spreadsheet automatically. Additionally, all player activity, aside from speaking in room
channels or in whispers, will be disabled. Players will be notified when edit mode is enabled, so use it sparingly. Data
will be saved to the spreadsheet before edit mode is enabled, so be sure to wait until the confirmation message has been
sent before making any edits. When you are finished making edits, be sure to load the updated spreadsheet data before
disabling edit mode.

## end

Ends an event.

#### Aliases

`.end`

#### Examples

    .end rain
    .end explosion

#### Description

Ends the specified event. The event must be ongoing. If the event has any ended commands, they will be run.

## endgame

Ends a game.

#### Aliases

`.endgame`

#### Examples

    .endgame

#### Description

Ends the game. All players will be removed from whatever room channels they were in. The Player and Dead roles will be
removed from all players.

## equip

Equips an item for a player.

#### Aliases

`.equip` `.wear` `.e`

#### Examples

    .equip lavris's mask
    .equip keiko lab coat
    .equip cara's sweater to shirt
    .equip aria large purse to glasses

#### Description

Equips an item currently in the given player's hand. You can specify which equipment slot you want the item to be
equipped to, if you want. Any item (whether equippable or not) can be equipped to any slot using this command. People in
the room will see the player equip an item, regardless of its size.

## exit

Locks or unlocks an exit.

#### Aliases

`.exit` `.room` `.lock` `.unlock`

#### Examples

    .exit lock carousel door
    .exit unlock headmasters quarters door
    .lock warehouse door 3
    .unlock trial grounds elevator

#### Description

Locks or unlocks an exit in the specified room. The corresponding entrance in the room the exit leads to will also be
locked, so that it goes both ways. When an exit is locked, players will be unable to enter the room that exit leads to,
and will be unable to enter through the exit from another room. If the exit can also be locked or unlocked via a puzzle,
you should NOT lock/unlock it with this command. Instead, use the puzzle command to solve/unsolve it.

## gesture

Performs a gesture for the given player.

#### Aliases

`.gesture`

#### Examples

    .gesture astrid smile
    .gesture akira point at door 1
    .gesture holly wave johnny

#### Description

Makes the given player perform one of a set of predefined gestures. Everybody in the room with them will see them do
this gesture. Certain gestures may require a target to perform them. For example, a gesture might require you specify an
Exit, an Object, another Player, etc. A gesture can only be performed with one target at a time. Gestures can be made
impossible if the given player is inflicted with certain Status Effects. For example, if they are concealed, they cannot
smile, frown, etc. as nobody would be able to see it. To see a list of all possible gestures, send `.gesture list`.

## give

Gives a player's item to another player.

#### Aliases

`.give` `.g`

#### Examples

    .give vivian's yellow key to aria
    .give natalie night vision goggles to shiori

#### Description

Transfers an item from the first player's inventory to the second player's inventory. Both players must be in the same
room. The item selected must be in one of the first player's hands. The receiving player must also have a free hand, or
else they will not be able to receive the item. If a particularly large item (a chainsaw, for example) is given, people
in the room with you will see the player giving it to the recipient.

## help

Lists all commands available to you.

#### Aliases

`.help`

#### Examples

    .help
    .help status

#### Description

Lists all commands available to the user. If a command is specified, displays the help menu for that command.

## hide

Hides a player in the given object.

#### Aliases

`.hide` `.unhide`

#### Examples

    .hide nero beds
    .hide cleo bleachers
    .unhide scarlet

#### Description

Forcibly hides a player in the specified object. They will be able to hide in the specified object even if it is
attached to a lock-type puzzle that is unsolved, and even if the hiding spot is beyond its capacity. To force them out
of hiding, use the unhide command.

## inspect

Inspects something for a player.

#### Aliases

`.inspect` `.investigate` `.examine` `.look` `.x`

#### Examples

    .inspect akio desk
    .examine florian knife
    .investigate blake blake's knife
    .look jun amadeus
    .examine nestor jae-seong
    .look roma lain's glasses
    .x haruka binita's shirt
    .inspect ambrosia room

#### Description

Inspect something for the given player. The target must be the "room" argument, an object, an item, a player, or an
inventory item, and it must be in the same room as the given player. The description will be parsed and sent to the
player in DMs. If the target is an object, or a non-discreet item or inventory item, a narration will be sent about the
player inspecting it to the room channel. Items and inventory items should generally use the prefab ID or container
identifier. The player can be forced to inspect items and inventory items belonging to a specific player (including
themself) using the player's name followed by "'s". If inspecting a different player's inventory items, a narration will
not be sent.

## instantiate

Generates an item.

#### Aliases

`.instantiate` `.create` `.generate`

#### Examples

    .instantiate raw fish on floor at beach
    .create pickaxe in locker 1 at mining hub
    .generate 3 empty drain cleaner in cupboards at kitchen
    .instantiate green book in main pocket of large backpack 1 at dorm library
    .create 4 screwdriver in tool box at beach house

To instantiate an inventory item, the name of the player must be given followed by "'s". A container item can be
specified, as well as which slot to instantiate the item into. The player will not be notified if a container item is
specified. An equipment slot can also be specified instead of a container item. The player will be notified of obtaining
the item in this case, and the prefab's equipped commands will be run.

## inventory

Lists a given player's inventory.

#### Aliases

`.inventory` `.i`

#### Examples

    .inventory nero

#### Description

Lists the given player's inventory.

## kill

Makes a player dead.

#### Aliases

`.kill` `.die`

#### Examples

    .kill chris
    .die micah joshua amber devyn veronica

#### Description

Moves the listed players from the living list to the dead list. The player will be removed from whatever room channel
they're in as well as any whispers. A dead player will retain any items they had in their inventory, but they will not
be accessible unless they are manually added to the spreadsheet. A dead player will retain the Player role. When a dead
player's body is officially discovered, use the reveal command to remove the Player role and give them the Dead role.

## knock

Knocks on a door for a player.

#### Aliases

`.knock`

#### Examples

    .knock kanda door 1

#### Description

Knocks on a door for the given player

## living

Lists all living players.

#### Aliases

`.living` `.alive`

#### Examples

    .living
    .alive

#### Description

Lists all living players.

## load

Loads game data.

#### Aliases

`.load` `.reload` `.gethousedata`

#### Examples

    .load all start
    .load all resume
    .load all
    .load rooms
    .load objects
    .load prefabs
    .load recipes
    .load items
    .load puzzles
    .load events
    .load status effects
    .load players
    .load inventories
    .load gestures

#### Description

Gathers the game data by reading it off the spreadsheet. Can specify what data to collect. "all start" must be used at
the beginning of the game after the startgame timer is over, as it will gather all the data and send the room
description of the room they start in to each player. If at any point you restart the bot, use "all resume". Any data
that was previously gathered will be updated. Any data you edit manually, including descriptions, will require use of
this command.

## location

Tells you a player's location.

#### Aliases

`.location`

#### Examples

    .location faye

#### Description

Tells you the given player's location, with a link to the channel.

## move

Moves the given player(s) to the specified room or exit.

#### Aliases

`.move` `.go` `.enter` `.walk` `.m`

#### Examples

    .move joshua door 2
    .move val amber devyn trial grounds
    .move living diner
    .move all elevator

#### Description

Forcibly moves the specified players to the specified room or exit. If you use "living" or "all" in place of the
players, it will move all living players to the specified room (skipping over players who are already in that room as
well as players with the Headmaster role). All of the same things that happen when a player moves to a room of their own
volition apply, however you can move players to non-adjacent rooms this way. The bot will not announce which exit the
player leaves through or which entrance they enter from when a player is moved to a non-adjacent room.

## object

Activates or deactivates an object.

#### Aliases

`.object` `.activate` `.deactivate`

#### Examples

    .object activate blender
    .object deactivate microwave
    .activate keurig kyra
    .deactivate oven noko
    .object activate fireplace log cabin
    .object deactivate fountain flower garden
    .activate freezer zoran "Zoran plugs in the FREEZER."
    .deactivate washer 1 laundry room "WASHER 1 turns off"

#### Description

Activates or deactivates an object. You may specify a player to activate/deactivate the object. If you do, players in
the room will be notified, so you should generally give a string for the bot to use, otherwise the bot will
say "[player] turns on/off the [object]." which may not sound right. If you specify a player, only objects in the room
that player is in can be activated/deactivated. You can also use a room name instead of a player name. In that case,
only objects in the room you specify can be activated/deactivated. This is useful if you have multiple objects with the
same name spread across the map. This command can only be used for objects with a recipe tag. If there is a puzzle with
the same name as the object whose state is supposed to be the same as the object, use the puzzle command to update it as
well.

## occupants

Lists all occupants in a room.

#### Aliases

`.occupants` `.o`

#### Examples

    .occupants floor-b1-hall-1
    .o ultimate conference hall

#### Description

Lists all occupants currently in the given room. If an occupant is in the process of moving, their move queue will be
included, along with the time remaining until they reach the next room in their queue. Note that the displayed time
remaining will not be adjusted according to the heatedSlowdownRate setting. If a player in the game has the heated
status effect, movement times for all players will be displayed as shorter than they actually are. Occupants with the
`hidden` behavior attributes will also be listed alongside their hiding spots.

## ongoing

Lists all ongoing events.

#### Aliases

`.ongoing` `.events`

#### Examples

    .ongoing
    .events

#### Description

Lists all events which are currently ongoing, along with the time remaining on each one, if applicable.

## online

Lists all online players.

#### Aliases

`.online`

#### Examples

    .online

#### Description

Lists all players who are currently online.

## puzzle

Solves or unsolves a puzzle.

#### Aliases

`.puzzle` `.solve` `.unsolve` `.attempt`

#### Examples

    .puzzle solve button
    .puzzle unsolve keypad
    .solve binder taylor
    .unsolve lever colin
    .solve computer PASSWORD1
    .solve computer PASSWORD2
    .puzzle solve keypad tool shed
    .puzzle unsolve lock men's locker room
    .solve paintings emily "Emily removes the PAINTINGS from the wall."
    .unsolve lock men's locker room "The LOCK on LOCKER 1 locks itself"
    .puzzle attempt cyptex lock 05-25-99 scarlet

#### Description

Solves or unsolves a puzzle. You may specify an outcome, if the puzzle has more than one solution. You may specify a
player to solve the puzzle. If you do, players in the room will be notified, so you should generally give a string for
the bot to use, otherwise the bot will say "[player] uses the [puzzle]." which may not sound right. If you specify a
player, only puzzles in the room that player is in can be solved/unsolved. Additionally, if you specify a player, you
can make them attempt to solve a puzzle. You can also use a room name instead of a player name. In that case, only
puzzles in the room you specify can be solved/unsolved. This is useful if you have multiple puzzles with the same name
spread across the map. This should generally only be used for puzzles which require moderator intervention.

## restore

Restores a player's stamina.

#### Aliases

`.restore`

#### Examples

    .restore flint

#### Description

Sets the given player's stamina to its maximum value. Note that this does not automatically cure the weary status
effect.

## reveal

Gives a player the Dead role.

#### Aliases

`.reveal`

#### Examples

    .reveal chris
    .reveal micah joshua amber devyn veronica

#### Description

Removes the Player role from the listed players and gives them the Dead role. All listed players must be dead.

## roll

Rolls a die.

#### Aliases

`.roll`

#### Examples

    .roll
    .roll int colin
    .roll faye devyn
    .roll str seamus terry
    .roll strength shinobu shiori
    .roll sta evad
    .roll dexterity agiri

#### Description

Rolls a d6. If a stat and a player are specified, calculates the result plus the modifier of the player's specified
stat. If two players are specified, any status effects the second player has which affect the first player will be
applied to the first player, whose stats will be recalculated before their stat modifier is applied. Additionally, if a
strength roll is performed using two players, the second player's dexterity stat will be inverted and applied to the
first player's roll. Any modifiers will be mentioned in the result, but please note that the result sent has already had
the modifiers applied. Valid stat inputs include: `str`, `strength`, `int`, `intelligence`, `dex`, `dexterity`, `spd`,
`speed`, `sta`, `stamina`.

## save

Saves the game data to the spreadsheet.

#### Aliases

`.save`

#### Examples

    .save

#### Description

Manually saves the game data to the spreadsheet. Ordinarily, game data is automatically saved to the spreadsheet every
30 seconds, as defined in the settings file. However, this command allows you to save at any time, even when edit mode
is enabled.

## say

Sends a message.

#### Aliases

`.say`

#### Examples

    .say #park Hello. My name is Alter Ego.
    .say #general Thank you for speaking with me today.
    .say amy One appletini, coming right up.

#### Description

Sends a message. A channel or player must be specified. Messages can be sent to any channel, but if it is sent to a room
channel, it will be treated as a narration so that players with the "see room" attribute can see it. If the name of a
player is specified and that player has the talent "NPC", the player will speak in the channel of the room they're in.
Their dialog will be treated just like that of any normal player's. The image URL set in the player's Discord ID will be
used for the player's avatar.

## set

Sets an object, puzzle, or set of items as accessible or inaccessible.

#### Aliases

`.set`

#### Examples

    .set accessible puzzle button
    .set inaccessible object terminal
    .set accessible object keypad tool shed
    .set accessible object items medicine cabinet
    .set inaccessible puzzle items lock men's locker room

#### Description

Sets an object, puzzle, or set of items as accessible or inaccessible. You have to specify whether to set an object or
puzzle, even if you want to set a set of items. When you use the optional "items" argument, it will set all of the items
contained in that object or puzzle as accessible/inaccessible at once. Individual items cannot be set. You can also
specify a room name. If you do, only object/items/puzzles in the room you specify can be set as accessible/
inaccessible. This is useful if you have multiple objects or puzzles with the same name spread across the map.

## setdest

Updates an exit's destination.

#### Aliases

`.setdest`

#### Examples

    .setdest corolla DOOR wharf VEHICLE
    .setdest motor boat PORT docks BOAT
    .setdest wharf MOTOR BOAT wharf MOTOR BOAT

#### Description

Replaces the destination for the specified room's exit. Given the following initial room setup:

    Room Name|Exits |Leads To|From
    ---------------------------------
    room-1   |EXIT A|room-2  | EXIT B
    ---------------------------------
    room-2   |EXIT B|room-1  | EXIT A
    	 |EXIT C|room-3  | EXIT D
    ---------------------------------
    room-3   |EXIT D|room-2  | EXIT C

If the destination for room-1's EXIT A is set to room-3's EXIT D, players passing through EXIT A would emerge from EXIT
D from that point onward. The Rooms sheet will be updated to reflect the updated destination, like so:

    room-1   |EXIT A|room-3  | EXIT D
    ---------------------------------
    ...
    ---------------------------------
    room-3   |EXIT D|room-1  | EXIT A

Note that this will leave room-2's EXIT B and EXIT C without exits that lead back to them, which will result in errors
next time rooms are loaded. To prevent this, this command should be used sparingly, and all affected exits should have
their destinations reassigned.

## setdisplayicon

Sets a player's display icon.

#### Aliases

`.setdisplayicon`

#### Examples

    .setdisplayicon kyra https://cdn.discordapp.com/attachments/697623260736651335/912103115241697301/mm.png
    .setdisplayicon kyra

#### Description

Sets the icon that will display when the given player's dialog appears in spectator channels. It will also appear in
Room channels when the player uses the say command. The icon given must be a URL with a .jpg or .png extension. When
player data is reloaded, their display icon will be reverted to their Discord avatar. Note that if the player is
inflicted with or cured of a status effect with the concealed attribute, their display icon will be updated, thus
overwriting one that was set manually. However, this command can be used to overwrite their new display icon afterwards
as well. Note that this command will not change the player's avatar when they send messages to Room channels normally.
To reset a player's display icon to their Discord avatar, simply do not specify a new display icon.

## setdisplayname

Sets a player's display name.

#### Aliases

`.setdisplayname`

#### Examples

    .setdisplayname usami Monomi
    .setdisplayname faye An individual wearing a MINOTAUR MASK

#### Description

Sets the name that will display whenever the given player does something in-game. This will not change their name on the
spreadsheet, and when player data is reloaded, their display name will be reverted to their true name. Note that if the
player is inflicted with or cured of a status effect with the concealed attribute, their display name will be updated,
thus overwriting one that was set manually. However, this command can be used to overwrite their new display name
afterwards as well. Note that this command will not change the player's nickname in the server.

## setpronouns

Sets a player's pronouns.

#### Aliases

`.setpronouns`

#### Examples

    .setpronouns sadie female
    .setpronouns roma neutral
    .setpronouns platt male
    .setpronouns monokuma it/it/its/its/itself/false
    .setpronouns sadie she/her/her/hers/herself/false
    .setpronouns roma they/them/their/theirs/themself/true
    .setpronouns platt he/him/his/his/himself/false

#### Description

Sets the pronouns that will be used in the given player's description and other places where pronouns are used. This
will not change their pronouns on the spreadsheet, and when player data is reloaded, their pronouns will be reverted to
their original pronouns. Note that if the player is inflicted with or cured of a status effect with the concealed
attribute, their pronouns will be updated, thus overwriting the ones that were set manually. However, this command can
be used to overwrite their new pronouns afterwards as well. Temporary custom pronoun sets can be applied with this
method. They must adhere to the following format:
`subjective/objective/dependent possessive/independent possessive/reflexive/plural`.

## setupdemo

Sets up a demo game.

#### Aliases

`.setupdemo`

#### Examples

    .setupdemo

#### Description

Populates an empty spreadsheet with default game data as defined in the demodata config file. This will create a game
environment to demonstrate most of the basics of Neo World Program gameplay. By default, it will generate 2 rooms, 8
objects, 11 prefabs, 2 recipes, 2 items, 1 puzzle, 1 event, 13 status effects, and 6 gestures. If the channels for the
demo game's rooms don't exist, they will be created automatically. It will not create any players for you. Once this
command is used you can use the .startgame command to add players, or manually add them on the spreadsheet. It is
recommended that you have at least one other Discord account to use as a player. Once the spreadsheet has been fully
populated, you can use .load all start to begin the demo. **If there is already data on the spreadsheet, it will be
overwritten. Only use this command if the spreadsheet is currently blank.**

## setvoice

Sets a player's voice.

#### Aliases

`.setvoice`

#### Examples

    .setvoice kyra a deep modulated voice
    .setvoice spektrum a high digitized voice
    .setvoice persephone multiple overlapping voices
    .setvoice ghost a disembodied voice
    .setvoice typhos pollux
    .setvoice nero haru
    .setvoice kyra

#### Description

Sets a player's voice descriptor that will be used when the player uses the .say command or speaks in a room with a
player who can't view the room channel. This will not change their voice descriptor on the spreadsheet, and when player
data is reloaded, their voice descriptor will be reverted to what appears on the spreadsheet. You can also supply
another player's name instead of a voice descriptor. In this case, the first player's voice will sound exactly like the
second player's, which they can use to deceive other players. Note that unlike other commands which change a player's
characteristics, the player's voice will **not** be changed by being inflicted or cured of a status effect with the
concealed attribute. If this command is used to change a character's voice, it must be used again to change it back to
normal. It can be reset to their original voice descriptor by omitting a voice descriptor in the commands.

## startgame

Starts a game.

#### Aliases

`.startgame` `.start`

#### Examples

    .startgame 24h
    .start 0.25m

#### Description

Starts a new game. You must specify a timer using either hours (h) or minutes (m). During this time, any players with
the Eligible role will be able to join using the PLAY command, at which point they will be given the Player role. When
the timer reaches 0, all of the players will be uploaded to the Players spreadsheet. After making any needed
modifications, use ".load all start" to begin the game.

## stash

Stores a player's inventory item inside another inventory item.

#### Aliases

`.stash` `.store` `.s`

#### Examples

    .stash vivian laptop in satchel
    .store nero's sword in sheath
    .stash antimony's old key in right pocket of pants
    .store cassie water bottle in side pouch of backpack

#### Description

Moves an item from the given player's hand to another item in their inventory. You can specify any item in their
inventory that has the capacity to hold items. If the inventory item you choose has multiple slots for items (such as
multiple pockets), you can specify which slot you want to store the item in. Note that each slot has a maximum capacity
that it can hold, so if it's too full or too small to contain the item you're trying to stash, you won't be able to
stash it there. If you attempt to stash a very large item (a sword, for example), people in the room with the player
will see them doing so.

## stats

Lists a given player's stats.

#### Aliases

`.stats`

#### Examples

    .stats ayaka

#### Description

Lists the given player's default and current stats, as well as the roll modifiers they have based on each current stat.
The maximum weight the player can carry will be listed, as well as how much weight they are currently carrying.
Additionally, the player's current maximum stamina will be listed, as this can differ if the player is inflicted with
any status effects that modify the stamina stat.

## status

Deals with status effects on players.

#### Aliases

`.status` `.inflict` `.cure` `.view`

#### Examples

    .status add mari heated
    .inflict yume heated
    .status add aki saay yuko haru asleep
    .inflict all deafened
    .status remove flint injured
    .cure elijah injured
    .status remove astrid ryou juneau drunk
    .cure living asleep
    .status view jordan
    .view jordan

#### Description

Deals with status effects on players.

-**add**/**inflict**: Inflicts the specified players with the given status effect. Those players will receive the "
Message When Inflicted" message for the specified status effect. If the status effect has a timer, the players will be
cured and then inflicted with the status effect in the "Develops Into" column when the timer reaches 0. If the status
effect is fatal, then they will simply die when the timer reaches 0 instead.

-**remove**/**cure**: Cures the specified players of the given status effect. Those players will receive the "Message
When Cured" message for the specified status effect. If the status effect develops into another effect when cured, the
players will be inflicted with that status effect.

-**view**: Views all of the status effects that a player is currently afflicted with, along with the time remaining on
each one, if applicable.

## tag

Adds, removes, or lists a room's tags.

#### Aliases

`tag` `addtag` `removetag` `tags`

#### Examples

    tag add kitchen video surveilled
    tag remove kitchen audio surveilled
    addtag vault soundproof
    removetag freezer cold
    addtag command-center video monitoring, audio monitoring
    removetag command-center video monitoring, audio monitoring
    tag list kitchen
    tags kitchen

#### Description

-**add**/**addtag**: Adds a comma-separated list of tags to the given room. Events that affect rooms with that tag will
immediately apply to the given room, and any tags that give a room special behavior will immediately activate those
functions.

-**remove**/**removetag**: Removes a comma-separated list of tags from the given room. Events that affect rooms with
that tag will immediately stop applying to the given room, and any tags that give a room special behavior will
immediately stop functioning.

-**list**/**tags**: Displays the list of tags currently applied to the given room.

## take

Takes the given item for a player.

#### Aliases

`.take` `.get` `.t`

#### Examples

    .take nero food
    .take livida food from floor
    .take cleo sword from desk
    .take taylor hammer from tool box
    .take aria green key from large purse
    .take veronica game system from main pocket of backpack

#### Description

Forcibly takes an item for a player. The player must have a free hand to take an item. You can specify which object or
item to take the item from, but only items in the same room as the player can be taken. Additionally, if the item is
contained in another item with multiple inventory slots (such as pockets), you can specify which slot to take it from.

## testparser

Tests the parsing module on your descriptions.

#### Aliases

`.testparser`

#### Examples

    .testparser parse
    .testparser parse nero
    .testparser add
    .testparser add vivian
    .testparser add formatted
    .testparser remove
    .testparser remove aria
    .testparser remove formatted

#### Description

Tests the parsing algorithm responsible for interpreting and editing descriptions. Sends the results as a text file to
the command channel. If testing the add or remove function, you can add "formatted" to display the formatted
descriptions. Otherwise, it will display the parsed versions. For all functions, you can input a player name to parse
the text as if that player is reading it. Note that if using the "formatted" argument, a player name cannot be used.
This command should be used to make sure you've written properly formatted descriptions.

-**parse**: Outputs the formatted and parsed descriptions.

-**add**: Goes through each object, item, puzzle, player, and inventory item description with item containers and adds
random items.

-**remove**: Goes through each room, object, item, puzzle, player, and inventory item description with items and removes
each item in the list. In "formatted" mode, items will be removed in every possible order. However, it will only remove
up to 4 items in a description.

## testspeeds

Checks the move times between each exit.

#### Aliases

`.testspeeds`

#### Examples

    .testspeeds players
    .testspeeds stats

#### Description

Tests the amount of time it takes to move between every exit in the game. Sends the results as a text file to the
command channel. An argument must be provided. If the "players" argument is given, then the move times will be
calculated for each player in the game. Note that the weight of any items the players are carrying will affect their
calculated speed. If the "stats" argument is given, then the move times will be calculated for hypothetical players with
speed from 1-10.

## text

Sends a text message from an NPC.

#### Aliases

`.text`

#### Examples

    .text amy florian I work at the bar.
    .text amy florian Here's a picture of me at work. (attached image)
    .text ??? keiko This is a message about your car's extended warranty.
    .text ??? hibiki (attached image)

#### Description

Sends a text message from the first player to the second player. The first player must have the talent "NPC". If an
image is attached, it will be sent as well.

## trigger

Triggers an event.

#### Aliases

`.trigger`

#### Examples

    .trigger rain
    .trigger explosion

#### Description

Triggers the specified event. The event must not already be ongoing. If the event has any triggered commands, they will
be run.

## undress

Unequips and drops all items for a player.

#### Aliases

`.undress`

#### Examples

    .undress haru
    .undress yuko locker 1
    .undress aki laundry basket
    .undress stella main pocket of backpack

#### Description

Unequips all items the given player has equipped and drops them into a container of your choosing. If no container is
chosen, then items will be dropped on the FLOOR. The given container must have a large enough capacity to hold all of
the items in the given player's inventory. This command will also drop any items in their hands.

## unequip

Unequips an item for a player.

#### Aliases

`.unequip` `.u`

#### Examples

    .unequip lavris's mask
    .unequip keiko lab coat
    .unequip cara's sweater from shirt
    .unequip aria large purse from glasses

#### Description

Unequips an item the given player currently has equipped. The unequipped item will be placed in one of the player's free
hands. You can specify which equipment slot you want the item to be unequipped from. Any item can be unequipped, whether
it's equippable or not. People in the room will see the player unequip an item, regardless of its size.

## unstash

Moves an inventory item into a player's hand.

#### Aliases

`.unstash` `.retrieve` `.r`

#### Examples

    .unstash vivian's laptop
    .retrieve nero sword from sheath
    .unstash antimony's old key from right pocket of pants
    .retrieve cassie water bottle from side pouch of backpack

#### Description

Moves a player's inventory item from another item in their inventory into their hand. You can specify which item to
remove it from, if they have multiple items with the same name. If the inventory item you choose to move it from has
multiple slots for items (such as multiple pockets), you can specify which slot you want to take it from as well. If you
attempt to unstash a very large item (a sword, for example), people in the room with the player will see them doing so.

## use

Uses an item in the given player's inventory.

#### Aliases

`.use`

#### Examples

    .use princeton first aid kit
    .use celia's food
    .use pollux first aid spray ximena "Pollux uncaps and applies a can of FIRST AID SPRAY to Ximena's wounds."
    .use ayaka's black lipstick on wynne "Ayaka applies a tube of BLACK LIPSTICK to Wynne's lips."

#### Description

Uses an item in one of the given player's hands. You can specify a second player for the first player to use their item
on. If you do, players in the room will be notified, so you should generally give a string for the bot to use, otherwise
the bot will say "[player] uses [item single containing phrase] on [target]." which may not sound right. Both players
must be in the same room. If no second player is given, the first player will use the item on themself. Note that you
cannot solve puzzles using this command. To do that, use the puzzle command.

## whisper

Initiates a whisper with the given players.

#### Aliases

`.whisper`

#### Examples

    .whisper nestor jun
    .whisper sadie elijah flint
    .whisper amy hibiki Clean it up.
    .whisper amy hibiki The mess you made. Clean it up now.

#### Description

Creates a channel for the given players to speak in. Only the selected players will be able to read messages posted in
the new channel, but everyone in the room will be notified that they've begun whispering to each other. You can select
as many players as you want as long as they're all in the same room. When a player in the whisper leaves the room, they
will be removed from the channel. If everyone leaves the room, the whisper channel will be deleted. If one of the
players listed has the talent "NPC", the remaining string after the list of players will be sent in the whisper channel.
Once the channel is created, NPC players can only speak in the whisper using this command and the list of players in the
whisper.

