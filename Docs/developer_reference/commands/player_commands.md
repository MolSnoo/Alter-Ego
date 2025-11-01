# Player commands

Player commands are usable by users with the Player role. These commands allow Players to interact with the game world
of their own volition.

Player commands can only be used when a game is in progress. They can be sent to Alter Ego through DM or in the channel
corresponding with the [Room](../data_structures/room.md) that the Player is in. The Player must
be [alive](../data_structures/player.md#alive) to use commands, and they must not be inflicted with
a [Status Effect](../data_structures/status.md) which disables the command they're trying to use. With few exceptions,
Players cannot use commands when [edit mode](../../moderator_guide/edit_mode.md) is enabled. If Alter Ego accepts the
Player's command and it was sent in a Room channel, the message in which the command was issued will be deleted.

## Table of Contents

<!-- toc -->

## craft

Crafts two items in your inventory together.

#### Aliases

`.craft` `.combine` `.mix`

#### Examples

    .craft drain cleaner and plastic bottle
    .combine bread and cheese
    .mix red vial with blue vial
    .craft soap with knife

#### Description

Creates a new item using the two items in your hand. The names of the items must be separated by "with" or "and". If no
recipe for those two items exists, the items cannot be crafted together. Note that this command can also be used to use
one item on another item, which may produce something new.

## dress

Takes and equips all items from a container.

#### Aliases

`.dress` `.redress`

#### Examples

    .dress wardrobe
    .dress laundry basket
    .redress main pocket of backpack

#### Description

Takes all items from a container of your choosing and equips them, if possible. You must have a free hand to take an
item. Items will be equipped in the order in which they appear in the game's data, which may not be obvious upon
inspecting the container. If an item is equippable to an equipment slot, but you already have something equipped to that
slot, it will not be equipped, and you will not be notified when this happens. If the container you choose has multiple
inventory slots, you can specify which slot to dress from. Otherwise, you will dress from all slots.

## drop

Discards an item from your inventory.

#### Aliases

`.drop` `.discard` `.d`

#### Examples

    .drop first aid kit
    .discard basketball
    .drop knife in sink
    .discard towel on benches
    .drop key in right pocket of skirt
    .discard wrench on top rack of tool box

#### Description

Discards an item from your inventory and leaves it in the room you're currently in. The item you want to discard must be
in either of your hands. You can specify where in the room you'd like to leave it by putting the name of an object or
item in the room after the item. Not all objects and items can contain items, but it should be fairly obvious which ones
can. If you want to discard it in an item with multiple inventory slots (such as pockets), you can specify which slot to
put it in. If you don't specify an object or item, you will simply leave it on the floor. If you drop a very large
item (a sword, for example), people in the room with you will see you discard it.

## equip

Equips an item.

#### Aliases

`.equip` `.wear` `.e`

#### Examples

    .equip mask
    .wear coat
    .equip sweater to shirt

#### Description

Equips an item currently in your hand. You can specify which equipment slot you want to equip the item to, if you want.
However, some items can only be equipped to certain equipment slots (for example, a mask can only be equipped to the
FACE slot). People in the room will see you equip an item, regardless of its size.

## gesture

Performs a gesture.

#### Aliases

`.gesture`

#### Examples

    .gesture smile
    .gesture point at door 1
    .gesture wave johnny

#### Description

Performs one of a set of predefined gestures. Everybody in the room with you will see you do this gesture. This allows
you to communicate during times where you are unable to speak for some reason, though you can gesture at any time, with
few exceptions. Certain gestures may require a target to perform them. For example, a gesture might require you specify
an Exit, an Object, another Player, etc. A gesture can only be performed with one target at a time. Gestures can be made
impossible if you are inflicted with certain Status Effects. For example, if you are concealed, you cannot smile, frown,
etc. as nobody would be able to see it. To see a list of all possible gestures, send `.gesture list`.

## give

Gives an item to another player.

#### Aliases

`.give` `.g`

#### Examples

    .give keiko moldy bread

#### Description

Transfers an item from your inventory to another player in the room. The item selected must be in one of your hands. The
receiving player must also have a free hand, or else they will not be able to receive the item. If a particularly large
item (a chainsaw, for example) is given, people in the room with you will see you giving it to the recipient.

## help

Lists all commands available to you.

#### Aliases

`.help`

#### Examples

    .help
    .help move

#### Description

Lists all commands available to the user. If a command is specified, displays the help menu for that command.

## hide

Hides you in an object.

#### Aliases

`.hide` `.unhide`

#### Examples

    .hide desk
    .hide cabinet
    .unhide

#### Description

Allows you to use an object in a room as a hiding spot. When hidden, you will be removed from that room's channel so
that when other players enter the room, they won't see you on the user list. When players speak in the room that you're
hiding in, you will hear what they say. Under normal circumstances, a whisper channel will be created for you to speak
in. Most players will be unable to hear what you say in this channel. However, if you want to speak so that everyone can
hear you (while having your identity remain a secret), use the `.say` command. If someone hides in the same hiding spot
as you, you will be placed in a whisper channel together. If someone inspects or tries to hide in the object you're
hiding in, your position will be revealed. If you wish to come out of hiding on your own, use the unhide command.

## inspect

Learn more about an object, item, or player.

#### Aliases

`.inspect` `.investigate` `.examine` `.look` `.x`

#### Examples

    .inspect desk
    .examine knife
    .investigate my knife
    .look akari
    .examine an individual wearing a mask
    .look marielle's glasses
    .x an individual wearing a bucket's shirt
    .inspect room

#### Description

Tells you about an object, item, or player in the room you're in. The description will be sent to you via DMs. An object
is something in the room that you can interact with but not take with you. An item is something that you can both
interact with and take with you. If you inspect an object, everyone in the room will see you inspect it. The same goes
for very large items. You can also inspect items in your inventory. If you have an item with the same name as an item in
the room you're currently in, you can specify that you want to inspect your item by adding "my" before the item name.
You can even inspect visible items in another player's inventory by adding "[player name]'s" before the item name. No
one will see you do this, however you will receive slightly less info when inspecting another player's items. You can
use ".inspect room" to get the description of the room you're currently in.

## inventory

Lists the items in your inventory.

#### Aliases

`.inventory` `.i`

#### Examples

    .inventory

#### Description

Shows you what items you currently have. Your inventory will be sent to you via DMs.

## knock

Knocks on a door.

#### Aliases

`.knock`

#### Examples

    .knock door 1

#### Description

Knocks on a door in the room you're in.

## move

Moves you to another room.

#### Aliases

`.move` `.go` `.exit` `.enter` `.walk` `.m`

#### Examples

    .move door 1
    .enter door 1
    .go locker room
    .move door 1>door 1>door 1
    .walk hall 1 > hall 2 > hall 3 > hall 4
    .m lobby>path 3>path 1>park>path 7>botanical garden

#### Description

Moves you to another room. You will be removed from the current channel and put into the channel corresponding to the
room you specify. You can specify either an exit of the current room or the name of the desired room, if you know it.
Note that you can only move to adjacent rooms. It is recommended that you open the new channel immediately so that you
can start seeing messages as soon as you're added. The room description will be sent to you via DMs. You can create a
queue of movements to perform such that upon entering one room, you will immediately start moving to the next one. To do
this, separate each destination with `>`.

## recipes

Lists all recipes available to you.

#### Aliases

`.recipes`

#### Examples

    .recipes
    .recipes glass
    .recipes pot of rice

#### Description

Lists all recipes you can carry out with the items in your inventory and items in the room. If you supply the name of an
item in your inventory, you will receive a list of all recipes that use that item as an ingredient. There are crafting
and object recipes.

To carry out a crafting recipe, you must have both of the ingredients in your hands and combine them with the `.craft`
command. Crafting recipes will be completed instantaneously.

To carry out an object recipe, you must use the `.drop` command to place all the ingredients in the appropriate object,
and then activate the object with the `.use` command. Object recipes take a certain amount of time to be completed. If
it worked correctly, you will receive a message indicating that the process has begun, and another message when it is
completed. You will not receive a message if the object was already activated when all of the ingredients were put in,
though the recipe will still be carried out so long as all of the ingredients are in place.

## run

Runs to another room.

#### Aliases

`.run`

#### Examples

    .run hall 1
    .run botanical garden
    .run hall 1 > hall 2 > hall 3 > hall 4
    .run lobby>path 3>path 1>park>path 7>botanical garden

#### Description

Moves you to another room by running. This functions the same as the move command, however you will move twice as
quickly and lose stamina at three times the normal rate. You will be removed from the current channel and put into the
channel corresponding to the room you specify. You can specify either an exit of the current room or the name of the
desired room, if you know it. Note that you can only move to adjacent rooms. It is recommended that you open the new
channel immediately so that you can start seeing messages as soon as you're added. The room description will be sent to
you via DMs. You can create a queue of movements to perform such that upon entering one room, you will immediately start
running to the next one. To do this, separate each destination with `>`.

## say

Sends your message to the room you're in.

#### Aliases

`.say` `.speak`

#### Examples

    .say What happened?
    .speak Did someone turn out the lights?

#### Description

Sends your message to the channel of the room you're currently in. This command is only available to players with
certain status effects.

## sleep

Puts you to sleep.

#### Aliases

`.sleep`

#### Examples

    .sleep

#### Description

Puts you to sleep by inflicting you with the **asleep** status effect. This should be used at the end of the day before
the game pauses to ensure you wake up feeling well-rested.

## stash

Stores an inventory item inside another inventory item.

#### Aliases

`.stash` `.store` `.s`

#### Examples

    .stash laptop in satchel
    .store sword in sheath
    .stash old key in right pocket of pants
    .store water bottle in side pouch of backpack

#### Description

Moves an item from your hand to another item in your inventory. You can specify any item in your inventory that has the
capacity to hold items. If the inventory item you choose has multiple slots for items (such as multiple pockets), you
can specify which slot you want to store the item in. Note that each slot has a maximum capacity that it can hold, so if
it's too full or too small to contain the item you're trying to stash, you won't be able to stash it there. If you
attempt to stash a very large item (a sword, for example), people in the room with you will see you doing so.

## status

Shows your status.

#### Aliases

`.status`

#### Examples

    .status

#### Description

Shows you what status effects you're currently afflicted with.

## steal

Steals an item from another player.

#### Aliases

`.steal` `.pickpocket`

#### Examples

    .steal from faye's pants
    .pickpocket from veronicas jacket
    .steal micah's right pocket of pants
    .pickpocket devyns left pocket of pants
    .steal from an individual wearing a mask's cloak
    .pickpocket an individual wearing a buckets side pouch of backpack

#### Description

Attempts to steal an item from another player in the room. You must specify one of the player's equipped items to steal
from. You can also specify which of that item's inventory slots to steal from. If no slot is specified and the item has
multiple inventory slots, one slot will be randomly chosen. If the inventory slot contains multiple items, you will
attempt to steal one at random.

There are three possible outcomes to attempting to steal an item: you steal the item without them noticing, you steal
the item but they notice, and you fail to steal the item because they notice in time. If you happen to steal a very
large item, the other player will notice you taking it whether you successfully steal it or not, and so will everyone
else in the room. Your dexterity stat has a significant impact on how successful you are at stealing an item. Various
status effects affect the outcome as well. For example, if the player you're stealing from is unconscious, they won't
notice you stealing their items no matter what.

## stop

Stops your movement.

#### Aliases

`.stop`

#### Examples

    .stop

#### Description

Stops you in your tracks while moving to another room. Your distance to that room will be preserved, so if you decide to
move to that room again, it will not take as long. This command will also cancel any queued movements.

## take

Takes an item and puts it in your inventory.

#### Aliases

`.take` `.get` `.t`

#### Examples

    .take butcher's knife
    .get first aid kit
    .take pill bottle from medicine cabinet
    .get towel from benches
    .take hammer from tool box
    .get key from pants
    .take key from left pocket of pants

#### Description

Adds an item from the room you're in to your inventory. You must have a free hand to take an item. If there are multiple
items with the same name in a room, you can specify which object or item you want to take it from. Additionally, if the
item is contained in another item with multiple inventory slots (such as pockets), you can specify which slot to take it
from. If you take a very large item (a sword, for example), people will see you pick it up and see you carrying it when
you enter or exit a room.

## text

Sends a text message to another player.

#### Aliases

`.text`

#### Examples

    .text elijah Hello. I am EVA Chan. We are schoolmates.
    .text astrid i often paint cityscapes, urban scenes, and portraits of people - but today i decided to experiment with something a bit more abstract. (attached image)
    .text viviana (attached image)

#### Description

Sends a text message to the player you specify. If an image is attached, it will be sent as well. This command works
best when sent via direct message, rather than in a room channel. This command is only available to players with certain
status effects.

## undress

Unequips and drops all items.

#### Aliases

`.undress`

#### Examples

    .undress
    .undress wardrobe
    .undress laundry basket
    .undress main pocket of backpack

#### Description

Unequips all items you have equipped and drops them into a container of your choosing. If no container is chosen, then
items will be dropped on the FLOOR. The given container must have a large enough capacity to hold all of the items in
your inventory. This command will also drop any items in your hands.

## unequip

Unequips an item.

#### Aliases

`.unequip` `.u`

#### Examples

    .unequip sweater
    .unequip glasses from face

#### Description

Unequips an item you currently have equipped. The unequipped item will be placed in your hand, so you must have a free
hand. You can specify which equipment slot you want to unequip the item from, if you want. People in the room will see
you unequip an item, regardless of its size.

## unstash

Moves an inventory item into your hand.

#### Aliases

`.unstash` `.retrieve` `.r`

#### Examples

    .unstash laptop
    .retrieve sword from sheath
    .unstash old key from right pocket of pants
    .retrieve water bottle from side pouch of backpack

#### Description

Moves an inventory item from another item in your inventory into your hand. You can specify which item to remove it
from, if you have multiple items with the same name. If the inventory item you choose to move it from has multiple slots
for items (such as multiple pockets), you can specify which slot you want to take it from as well. If you attempt to
unstash a very large item (a sword, for example), people in the room with you will see you doing so.

## use

Uses an item in your inventory or an object in a room.

#### Aliases

`.use` `.unlock` `.lock` `.type` `.activate` `.flip` `.push` `.press` `.ingest` `.consume` `.swallow` `.eat` `.drink`

#### Examples

    .use first aid kit
    .eat food
    .use old key chest
    .use lighter candle
    .lock locker
    .type keypad YAMA NI NOBORU
    .unlock locker 1 12-22-11
    .press button
    .flip lever
    .use blender

#### Description

Uses an item from your inventory. Not all items have programmed uses. Those that do will inflict you with or cure you of
a status effect of some kind. Status effects can be good, bad, or neutral, but it should be fairly obvious what kind of
effect a particular item will have on you.

Some items can be used on objects. For example, using a key on a locker will unlock the locker, using a crowbar on a
crate will open the crate, etc.

Some objects are capable of turning items into other items. For example, an oven can turn frozen food into cooked food.
In order to use objects like this, drop the items in the object and use it.

You can even use objects in the room without using an item at all. Not all objects are usable. Anything after the name
of the object will be treated as a password or combination. Passwords and combinations are case-sensitive. If the object
is a lock of some kind, you can relock it using the lock command. Other objects may require a puzzle to be solved before
they do anything special.

## wake

Wakes you up.

#### Aliases

`.wake` `.awaken` `.wakeup`

#### Examples

    .wake
    .awaken
    .wakeup

#### Description

Wakes you up when you're asleep.

## whisper

Allows you to speak privately with the selected player(s).

#### Aliases

`.whisper`

#### Examples

    .whisper tim
    .whisper katie susie tim

#### Description

Creates a channel for you to whisper to the selected recipients. Only you and the people you select will be able to read
messages posted in the new channel, but everyone in the room will be notified that you've begun whispering to each
other. You can select as many players as you want as long as they're in the same room as you. When one of you leaves the
room, they will be removed from the channel. If everyone leaves the room, the whisper channel will be deleted. You are
required to use this when discussing the game with other players. Do not use DMs.


