# Bot Commands

Bot commands are not usable by any Discord user. These commands are passed into the commandHandler module directly by
Alter Ego. Their purpose is to allow greater flexibility in behavior
for [Prefabs](../reference/data_structures/prefab.md), [Events](../reference/data_structures/event.md),
and [Puzzles](../reference/data_structures/puzzle.md). They allow many built-in restrictions placed on Players' actions
to be bypassed.

Bot commands can only be used when a game is in progress. They can only be entered on the spreadsheet. Unlike other
commands, bot commands must not start with the [commandPrefix](../settings/docker_settings.md#command_prefix). Bot
commands which act upon Players generally have three different arguments that can be used in place of a Player's name,
but this isn't always the case.

These arguments are:

* `player`
    * The command will act on the Player who caused the command to be executed. For Prefabs, this is the Player who
      equipped/unequipped the Inventory Item. For Puzzles, this is the Player who solved/unsolved the Puzzle.
* `room`
    * The command will act on all Players in the same Room as the Player who caused the command to be executed.
      Alternatively, for Events, this is all Players in all Rooms affected by the Event.
* `all`
    * The command will act on all living Players, except for NPCs and Players with the Headmaster role.

## Table of Contents

<!-- toc -->

## destroy

Destroys an item.

#### Aliases

`destroy`

#### Examples

    destroy volleyball at beach
    destroy gasoline on shelves at warehouse
    destroy note in locker 1 at mens locker room
    destroy wrench in tool box at beach house
    destroy gloves in breast pocket of tuxedo at dressing room
    destroy all in trash can at lounge
    destroy player keyboard
    destroy all face
    destroy vivians laptop in vivian's vivians satchel
    destroy shotput ball in cassie's main pocket of large backpack
    destroy all in hitoshi's trousers
    destroy all in charlotte's right pocket of dress

#### Description

Destroys an item in the specified location or in the player's inventory. The prefab ID or container identifier of the
item must be given. In order to destroy an item, the name of the room must be given, following "at". The name of the
container it belongs to can also be specified. If the container is another item, the identifier of the item or its
prefab ID must be used. The name of the inventory slot to destroy the item from can also be specified.

To destroy an inventory item, "player", "room", "all", or the name of a player followed by "'s", must be given. A
container item can also be specified, as well as which slot to delete the item from. The player will not be notified if
a container item is specified. An equipment slot can also be specified instead of a container item. This will destroy
whatever item is equipped to it. The player will be notified in this case, and the item's unequipped commands will be
run.

Note that using the "all" argument with a container will destroy all items in that container.

## end

Ends an event.

#### Aliases

`end`

#### Examples

    end rain
    end explosion

#### Description

Ends the specified event. The event must be ongoing. If it isn't, nothing will happen. If the event has any ended
commands, they will not be run if they were passed by another event. They will be run if they were passed by anything
else, however.

## exit

Locks or unlocks an exit.

#### Aliases

`exit` `room` `lock` `unlock`

#### Examples

    exit lock carousel door
    exit unlock headmasters quarters door
    lock warehouse door 3
    unlock trial grounds elevator

#### Description

Locks or unlocks an exit in the specified room. The corresponding entrance in the room the exit leads to will also be
locked, so that it goes both ways. When an exit is locked, players will be unable to enter the room that exit leads to,
and will be unable to enter through the exit from another room.

## instantiate

Generates an item.

#### Aliases

`instantiate` `create` `generate`

#### Examples

    instantiate raw fish on floor at beach
    create pickaxe in locker 1 at mining hub
    generate 3 empty drain cleaner in cupboards at kitchen
    instantiate green book in main pocket of large backpack 1 at dorm library
    create 4 screwdriver in tool box at beach house
    instantiate gacha capsule (color=metal + character=upa) in gacha slot at arcade
    generate katana in player right hand
    instantiate monokuma mask on all face
    create laptop in vivian's vivians satchel
    generate 2 shotput ball in cassie's main pocket of large backpack
    instantiate 3 capsulebeast card (species=lavazard) in asuka's left pocket of gamer hoodie

#### Description

Generates an item or inventory item in the specified location. The prefab ID must be used. A quantity can also be set.
If the prefab has procedural options, they can be manually set in parentheses.

To instantiate an item, the name of the room must be given at the end, following "at". The name of the container to put
it in must also be given. If the container is an object with a child puzzle, the puzzle will be its container. If the
container is another item, the item's name or container identifier can be used. The name of the inventory slot to
instantiate the item in can also be specified.

To instantiate an inventory item, "player", "room", "all", or the name of a player followed by "'s", must be given. A
container item can be specified, as well as which slot to instantiate the item into. The player will not be notified if
a container item is specified. An equipment slot can also be chosen instead of a container item. The player will be
notified of obtaining the item in this case, and the prefab's equipped commands will be run.

## kill

Makes a player dead.

#### Aliases

`kill` `die`

#### Examples

    kill natalie
    die shiori corin terry andrew aria
    kill player
    die room

#### Description

Moves the listed players from the living list to the dead list. The player will be removed from whatever room channel
they're in as well as any whispers. A dead player will retain any items they had in their inventory, but they will not
be accessible unless they are manually added to the spreadsheet. A dead player will retain the Player role. When a dead
player's body is officially discovered, use the reveal command to remove the Player role and give them the Dead role. If
you use "player" in place of a list of players, then the player who triggered the command will be killed. If the "room"
argument is used instead, then all players in the room will be killed.

## move

Moves the given player(s) to the specified room.

#### Aliases

`move`

#### Examples

    move susie main-office
    move player general-managers-office
    move player cafeteria
    move room trial-grounds
    move all elevator

#### Description

Forcibly moves the specified player to the specified room. If you use "all" in place of the player, it will move all
living players to the specified room (skipping over players who are already in that room as well as players with the
Headmaster role). If you use "player" in place of the player, then the player who triggered the command will be moved.
If you use "room" instead, all players in the room will be moved. All of the same things that happen when a player moves
to a room of their own volition apply, however you can move players to non-adjacent rooms this way. The bot will not
announce which exit the player leaves through or which entrance they enter from when a player is moved to a non-adjacent
room.

## object

Activates or deactivates an object.

#### Aliases

`object` `activate` `deactivate`

#### Examples

    object activate blender
    object deactivate microwave
    activate keurig kyra
    deactivate oven noko
    object activate fireplace log cabin
    object deactivate fountain flower garden
    activate freezer zoran "Zoran plugs in the FREEZER."
    deactivate washer 1 laundry room "WASHER 1 turns off"

#### Description

Activates or deactivates an object. You may specify a player to activate/deactivate the object. If you do, players in
the room will be notified, so you should generally give a string for the bot to use, otherwise the bot will
say "[player] turns on/off the [object]." which may not sound right. If you specify a player, only objects in the room
that player is in can be activated/deactivated. You can also use a room name instead of a player name. In that case,
only objects in the room you specify can be activated/deactivated. This is useful if you have multiple objects with the
same name spread across the map. This command can only be used for objects with a recipe tag. If there is a puzzle with
the same name as the object whose state is supposed to be the same as the object, use the puzzle command to update it as
well.

## puzzle

Solves or unsolves a puzzle.

#### Aliases

`puzzle` `solve` `unsolve` `attempt`

#### Examples

    puzzle solve button
    puzzle unsolve keypad
    solve binder taylor
    unsolve lever colin
    solve computer PASSWORD1
    solve computer PASSWORD2
    puzzle solve keypad tool shed
    puzzle unsolve lock men's locker room
    solve paintings player "player removes the PAINTINGS from the wall."
    unsolve lock men's locker room "The LOCK on LOCKER 1 locks itself"
    puzzle attempt cyptex lock 05-25-99 player

#### Description

Solves or unsolves a puzzle. You may specify an outcome, if the puzzle has more than one solution. You may specify a
player to solve the puzzle. If you do, players in the room will be notified, so you should generally give a string for
the bot to use, otherwise the bot will say "[player] uses the [puzzle]." which may not sound right. If you specify a
player, only puzzles in the room that player is in can be solved/unsolved. Additionally, if you specify a player, you
can make them attempt to solve a puzzle. If you use "player" in place of the player, then the player who triggered the
command will be the one to solve/unsolve the puzzle. It will also do the same in the string, if one is specified. You
can also use a room name instead of a player name. In that case, only puzzles in the room you specify can be
solved/unsolved. This is useful if you have multiple puzzles with the same name spread across the map.

## set

Sets an object, puzzle, or set of items as accessible or inaccessible.

#### Aliases

`set`

#### Examples

    set accessible puzzle button
    set inaccessible object terminal
    set accessible object keypad tool shed
    set accessible object items medicine cabinet
    set inaccessible puzzle items lock men's locker room

#### Description

Sets an object, puzzle, or set of items as accessible or inaccessible. You have to specify whether to set an object or
puzzle, even if you want to set a set of items. When you use the optional "items" argument, it will set all of the items
contained in that object or puzzle as accessible/inaccessible at once. Individual items cannot be set. You can also
specify a room name. If you do, only object/items/puzzles in the room you specify can be set as accessible/
inaccessible. This is useful if you have multiple objects or puzzles with the same name spread across the map.

## setdest

Updates an exit's destination.

#### Aliases

`setdest`

#### Examples

    setdest corolla DOOR wharf VEHICLE
    setdest motor boat PORT docks BOAT
    setdest wharf MOTOR BOAT wharf MOTOR BOAT

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

`setdisplayicon`

#### Examples

    setdisplayicon kyra https://cdn.discordapp.com/attachments/697623260736651335/912103115241697301/mm.png
    setdisplayicon player https://cdn.discordapp.com/attachments/697623260736651335/911381958553128960/questionmark.png
    setdisplayicon player

#### Description

Sets the icon that will display when the given player's dialog appears in spectator channels. It will also appear in
Room channels when the player uses the say command. The icon given must be a URL with a .jpg or .png extension. When
player data is reloaded, their display icon will be reverted to their Discord avatar. Note that if the player is
inflicted with or cured of a status effect with the concealed attribute, their display icon will be updated, thus
overwriting one that was set manually. However, this command can be used to overwrite their new display icon afterwards
as well. Note that this command will not change the player's avatar when they send messages to Room channels normally.
If you use "player" in place of a player's name, then the player who triggered the command will have their display icon
changed. To reset a player's display icon to their Discord avatar, simply do not specify a new display icon.

## setdisplayname

Sets a player's display name.

#### Aliases

`setdisplayname`

#### Examples

    setdisplayname usami Monomi
    setdisplayname player An individual wearing a MINOTAUR MASK
    setdisplayname player

#### Description

Sets the name that will display whenever the given player does something in-game. This will not change their name on the
spreadsheet, and when player data is reloaded, their display name will be reverted to their true name. Note that if the
player is inflicted with or cured of a status effect with the concealed attribute, their display name will be updated,
thus overwriting one that was set manually. However, this command can be used to overwrite their new display name
afterwards as well. Note that this command will not change the player's nickname in the server. If you use "player" in
place of a player's name, then the player who triggered the command will have their display name changed. To reset a
player's display name to their real name, simply do not specify a new display name.

## setpos

Sets a player's position.

#### Aliases

`setpos`

#### Examples

    setpos player 200 5 350
    setpos room 400 -10 420
    setpos vivian x 350
    setpos player y 10
    setpos all z 250

#### Description

Sets the specified player's position. If the "player" argument is used in place of a name, then the player who triggered
the command will have their position updated. If the "room" argument is used instead, then all players in the same room
as the player who triggered the command will have their positions updated. Lastly, if the "all" argument is used, then
all players will have their positions updated. You can set individual coordinates with the "x", "y", or "z" arguments
and the value to set it to. Otherwise, a space-separated list of coordinates in the order **x y z** must be given.

## setpronouns

Sets a player's pronouns.

#### Aliases

`setpronouns`

#### Examples

    setpronouns sadie female
    setpronouns roma neutral
    setpronouns platt male
    setpronouns monokuma it\it\its\its\itself\false
    setpronouns player she\her\her\hers\herself\false
    setpronouns player they\them\their\theirs\themself\true
    setpronouns player he\him\his\his\himself\false

#### Description

Sets the pronouns that will be used in the given player's description and other places where pronouns are used. This
will not change their pronouns on the spreadsheet, and when player data is reloaded, their pronouns will be reverted to
their original pronouns. Note that if the player is inflicted with or cured of a status effect with the concealed
attribute, their pronouns will be updated, thus overwriting the ones that were set manually. However, this command can
be used to overwrite their new pronouns afterwards as well. Temporary custom pronoun sets can be applied with this
method. They must adhere to the following format:
`subjective\objective\dependent possessive\independent possessive\reflexive\plural`. If you use "player" in place of a
player's name, then the player who triggered the command will have their pronouns set.

## setvoice

Sets a player's voice.

#### Aliases

`setvoice`

#### Examples

    setvoice player a deep modulated voice
    setvoice player a high digitized voice
    setvoice persephone multiple overlapping voices
    setvoice ghost a disembodied voice
    setvoice player pollux
    setvoice player haru
    setvoice player

#### Description

Sets a player's voice descriptor that will be used when the player uses the say command or speaks in a room with a
player who can't view the room channel. This will not change their voice descriptor on the spreadsheet, and when player
data is reloaded, their voice descriptor will be reverted to what appears on the spreadsheet. You can also supply
another player's name instead of a voice descriptor. In this case, the first player's voice will sound exactly like the
second player's, which they can use to deceive other players. If you use "player" in place of a player's name, then the
player who triggered the command will have their voice changed. Note that unlike other commands which change a player's
characteristics, the player's voice will **not** be changed by being inflicted or cured of a status effect with the
concealed attribute. If this command is used to change a character's voice, it must be used again to change it back to
normal. It can be reset to their original voice descriptor by omitting a voice descriptor in the commands.

## status

Deals with status effects on players.

#### Aliases

`status` `inflict` `cure`

#### Examples

    status add player heated
    status add room safe
    inflict all deaf
    inflict diego heated
    status remove player injured
    status remove room restricted
    cure antoine injured
    cure all deaf

#### Description

Deals with status effects on players.

-**add**/**inflict**: Inflicts the specified player with the given status effect. If the "player" argument is used in
place of a name, then the player who triggered the command will be inflicted. If the "all" argument is used instead,
then all living players will be inflicted. If the "room" argument is used in place of a name, then all players in the
same room as the player who solved it will be inflicted.

-**remove**/**cure**: Cures the specified player of the given status effect. If the "player" argument is used in place
of a name, then the player who triggered the command will be cured. If the "all" argument is used instead, then all
living players will be cured. If the "room" argument is used in place of a name, then all players in the same room as
the player who solved it will be cured.

## tag

Adds or removes a room's tags.

#### Aliases

`tag` `addtag` `removetag`

#### Examples

    tag add kitchen video surveilled
    tag remove kitchen audio surveilled
    addtag vault soundproof
    removetag freezer cold

#### Description

-**add**/**addtag**: Adds a tag to the given room. Events that affect rooms with that tag will immediately apply to the
given room, and any tag that gives a room special behavior will immediately activate those functions.

-**remove**/**removetag**: Removes a tag from the given room. Events that affect rooms with that tag will immediately
stop applying to the given room, and any tag that gives a room special behavior will immediately stop functioning.

Note that unlike the moderator version of this command, you cannot add/remove multiple tags at once.

## trigger

Triggers an event.

#### Aliases

`trigger`

#### Examples

    trigger rain
    trigger explosion

#### Description

Triggers the specified event. The event must not already be ongoing. If it is, nothing will happen. If the event has any
triggered commands, they will not be run if they were passed by another event. They will be run if they were passed by
anything else, however.

## wait

Waits a set number of seconds.

#### Aliases

`wait`

#### Examples

    wait 5
    wait 60
    wait 300

#### Description

Not a true command, but a pseudo-command. When this command is used in a list of commands, Alter Ego will wait for the
given number of seconds before executing the next command.
