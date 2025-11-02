# Puzzle

A **Puzzle** is a data structure in the Neo World Program. Its primary purpose is to allow [Players](player.md) to
interact with the game world and change its state in predictable, predefined ways. While this can be in the form of a
gameplay puzzle that the Player can solve, a Puzzle can be far simpler than what would traditionally be called a puzzle
in most games.

## Table of Contents

<!-- toc -->

## Attributes

In order to provide a versatile array of behaviors, Puzzles have many attributes. Note that if an attribute is
_internal_, that means it only exists within
the [Puzzle class](https://github.com/MolSnoo/Alter-Ego/blob/master/Data/Puzzle.js). Internal attributes will be given
in the "Class attribute" bullet point, preceded by their data type. If an attribute is _external_, it only exists on
the spreadsheet. External attributes will be given in the "Spreadsheet label" bullet point.

### Name

* Spreadsheet label: **Puzzle Name**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.name`

This is the name of the Puzzle. All letters should be capitalized, and spaces are allowed. Players will be able to
interact with this Puzzle by using it as an argument in the [use command](../commands/player_commands.md#use). Note that
multiple Puzzles can have the same name, so long as they are in different Rooms. However, to lower the likelihood of
bugs and enable certain features, it is recommended that each Puzzle be given a unique name.

### Solved

* Spreadsheet label: **Solved?**
* Class attribute: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)
  `this.solved`

This is a simple Boolean value indicating whether the Puzzle has already been solved or not. If this is `true`, then the
Puzzle has been solved. If it is `false`, then the Puzzle has not been solved. How this affects a Puzzle's behavior
varies based on the Puzzle's [type](puzzle.md#type), but in general, if the Puzzle has not been solved, then a Player
can attempt to solve it. If the Puzzle has been solved, then the Player will simply receive the text in
the [already solved description](puzzle.md#already-solved-description).

### Outcome

* Spreadsheet label: **Outcome**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.outcome`

This is a string indicating which [solution](puzzle.md#solutions) the Puzzle has been solved with, if any. If the Puzzle
is not solved or only has one possible solution, then this must be blank. In general, this does not need to be set
manually. Alter Ego will automatically set this when the Puzzle is solved, if it has multiple possible solutions.
This should only be set manually if the Puzzle should be solved by default. If that is the case, then it should match
exactly one of the Puzzle's solutions.

### Requires Moderator

* Spreadsheet label: **Requires Mod?**
* Class attribute: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)
  `this.requiresMod`

This is another Boolean value indicating whether the Puzzle requires [moderator](../../moderator_guide/moderating) intervention to
solve. If this is `true`, then the Puzzle can only be solved by a moderator using
the [puzzle command](../commands/moderator_commands.md#puzzle), and a Player who attempts to solve the Puzzle will
receive the message "You need moderator assistance to do that." If this is `false`, then a Player will be able to
attempt to solve the Puzzle freely.

A Puzzle that requires moderator intervention to solve can be useful in a few situations. A few examples are:

* A Puzzle whose solution cannot be entered in a [Discord](../../about/discord.md) message and interpreted by Alter Ego, such as an image or
  an arrangement of items in a certain order,
* A Puzzle with an open-ended solution that requires a Player to think creatively,
* A Puzzle that can only be attempted under certain conditions,
* A Puzzle that is not intended to be solved until a certain time, and
* A Puzzle that is not intended to be directly interacted with, only existing for game-mechanic purposes.

By making use of this attribute, a Puzzle can be given greater flexibility of solutions, while still making use of the
predefined behavior that makes Puzzles such a useful data type.

### Location

* Spreadsheet label: **Location**
* Class attribute: [Room](room.md) `this.location`

This is the Room the Puzzle can be found in. This must match the Room's name exactly on the spreadsheet.

### Parent Object Name

* Spreadsheet label: **Parent Object**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.parentObjectName`

This is the name of an [Object](object.md) that is associated with the Puzzle, if any. The parent Object must be in the
same Room as the Puzzle referencing it. If the name of an Object is supplied, then a Player will be able to supply the
name of the parent Object as an argument in the use command instead of the name of the
Puzzle. [Narrations](narration.md) involving the Puzzle will also use the parent Object's name instead of the Puzzle's
name. This is particularly useful if every Puzzle is given a unique name. For example, if the Puzzle is named "PANIC
BUTTON" and the parent Object is named "YELLOW BUTTON", then a Player will be able to interact with the Puzzle by
sending `.use YELLOW BUTTON` or `.use PANIC BUTTON`. When the Puzzle is interacted with by a Player named Haru, Alter
Ego will send "Haru uses the YELLOW BUTTON." to the PANIC BUTTON's Room channel.

Additionally, by assigning a Puzzle a parent Object, it becomes possible for the Puzzle to contain [Items](item.md).
This allows Items to be made inaccessible until the Puzzle is solved, while also allowing Players to take and drop Items
from/into the parent Object if the Puzzle is solved. When an Object capable of containing Items is assigned a child
Puzzle, the [item list](../../moderator_guide/writing_descriptions.md#il) must be in the Puzzle's already solved description. If no
parent Object is needed, this cell can simply be left blank on the spreadsheet.

### Parent Object

* Class attribute: [Object](object.md) `this.parentObject`

This is an internal attribute which simply contains a reference to the actual Object object whose name matches
`this.parentObjectName` and whose location is the same as the Puzzle. If no parent Object name is given, this will be
`null` instead.

### Type

* Spreadsheet label: **Type**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.type`

This is a string which determines the specific behavior of the Puzzle. This must match exactly one of the predefined
Puzzle types that have been programmed into Alter Ego. Here, each Puzzle type will be listed, and their behavior will be
detailed. Note that if the term `[PUZZLE NAME]` is used, it doesn't necessarily refer to the Puzzle's name attribute. It
can refer to that, or the name of the Puzzle's parent Object, if it has one.

#### `password`
* A Player must enter the correct password in order to solve the Puzzle. The password is case sensitive.
* Once the Puzzle has been solved, it can never be directly unsolved by a Player without moderator intervention.
* If a Player attempts to solve the Puzzle again, they will be sent the Puzzle's already solved description.
* When a Player interacts with the Puzzle in any way, whether they solve it or not, Alter Ego will narrate 
  "`[Player displayName]` uses the `[PUZZLE NAME]`." in the Puzzle's Room channel.

#### `interact`
* A Player must only interact with the Puzzle in order to solve it.
* Once the Puzzle has been solved, it can never be directly unsolved by a Player without moderator intervention.
* If a Player attempts to solve the Puzzle again, they will be sent the Puzzle's already solved description.
* When a Player interacts with the Puzzle in any way, whether they solve it or not, Alter Ego will narrate 
  "`[Player displayName]` uses the `[PUZZLE NAME]`." in the Puzzle's Room channel.

#### `matrix`
* The Puzzle behaves exactly the same as an `interact`-type Puzzle. However, its solved commands have special behavior.
* When the Puzzle's solved commands are executed, the outcomes of all of its required Puzzles are accessible in its solved commands. If a solved command contains the name of one of its required Puzzles in curly braces (for example: `{PUZZLE NAME}`), that string will be replaced with that Puzzle's outcome before it is executed. This allows solved commands to have variable arguments that result in different behavior depending on the outcomes of one or more Puzzles.
* This is especially useful for instantiating [procedurally generated Prefabs](../../moderator_guide/writing_descriptions.md#poss-attribute-name) with possibilities manually selected by a Player in other Puzzles. However, this behavior can be used in any bot command.

#### `player`
* A Player must only interact with the Puzzle in order to solve it. However, the Player's name must match one of the
  Puzzle's solutions. The name is case sensitive.
* Once the Puzzle has been solved, it can never be directly unsolved by a Player without moderator intervention.
* If a Player attempts to solve the Puzzle again, they will be sent the Puzzle's already solved description.
* When a Player interacts with the Puzzle in any way, whether they solve it or not, Alter Ego will narrate 
  "`[Player displayName]` uses the `[PUZZLE NAME]`." in the Puzzle's Room channel.

#### `room player`
* A Player must enter the display name of a Player in the same Room as them in order to solve the Puzzle. However, the chosen Player's display name must match one of the Puzzle's solutions. The display name is not case sensitive. If a Player solves the Puzzle, Alter Ego will narrate "`[Player displayName]` uses the `[PUZZLE NAME]`." in the Puzzle's Room channel. When the Puzzle's solved commands are executed, the selected Player will be passed into the commandHandler module. As a result, any commands that use the `player` argument will execute as if the selected Player was the one who initiated them.
* Once the Puzzle has been solved, it can never be directly unsolved by a Player without moderator intervention.
* If a Player attempts to solve the Puzzle again, they will be sent the Puzzle's already solved description. Alter Ego will narrate "`[Player displayName]` uses the `[PUZZLE NAME]`." in the Puzzle's Room channel.
* If a Player fails to solve the Puzzle, Alter Ego will narrate "`[Player displayName]` attempts to use the `[PUZZLE NAME]`, but struggles." in the Puzzle's Room channel.

#### `toggle`
* A Player must only interact with the Puzzle in order to solve it.
* Once the Puzzle has been solved, it can be unsolved when a Player interacts with it again. This allows it to be 
  "toggled" between two states at will.
* If a Player unsolves the Puzzle, they will be sent the Puzzle's already solved description.
* When a Player interacts with the Puzzle, whether they solve or unsolve it, Alter Ego will narrate "
  `[Player displayName]` uses the `[PUZZLE NAME]`." in the Puzzle's Room channel. However, if the Player attempts to
  unsolve it and the [requirements](puzzle.md#requirements-strings) have not all been met, Alter Ego will narrate 
  "`[Player displayName]` attempts to use the `[PUZZLE NAME]`, but struggles." instead.

#### `combination lock`
* A Player must enter the correct password in order to solve the Puzzle. The password is case sensitive. If a Player
  solves the Puzzle, Alter Ego will narrate "`[Player displayName]` unlocks the `[PUZZLE NAME]`." in the Puzzle's
  Room channel.
* Once the Puzzle has been solved, it can be unsolved when a Player attempts to solve it again using an incorrect
  password or by using the lock alias for the use command.
* If a Player unsolves the Puzzle, they will be sent "You lock the `[PUZZLE NAME]`.", and Alter Ego will narrate 
  "`[Player displayName]` locks the `[PUZZLE NAME]`." in the Puzzle's Room channel.
* If the Puzzle is already solved and a Player attempts to solve the Puzzle again using the right password, or
  without supplying a password, Alter Ego will narrate "`[Player displayName]` opens the `[PUZZLE NAME]`." in the
  Puzzle's Room channel.
* If a Player fails to solve the Puzzle, Alter Ego will narrate "`[Player displayName]` attempts and fails to unlock
  the `[PUZZLE NAME]`." in the Puzzle's Room channel.

#### `key lock`
* A Player must have an [Inventory Item](inventory_item.md) based on the [Prefab](prefab.md) specified in the
  Puzzle's solution in order to solve the Puzzle. If no solution is given, this Puzzle behaves almost identically to
  a `toggle`-type Puzzle. If a Player solves the Puzzle, Alter Ego will narrate "`[Player displayName]` unlocks the
  `[PUZZLE NAME]`." in the Puzzle's Room channel.
* Once the Puzzle has been solved, it can be unsolved when a Player uses the lock alias for the use command, but
  only if they have the required Inventory Item. If the Player does not have the required Inventory Item, Alter Ego
  will narrate "`[Player displayName]` attempts and fails to lock the `[PUZZLE NAME]`." in the Puzzle's Room
  channel.
* If a Player unsolves the Puzzle, they will be sent "You lock the `[PUZZLE NAME]`.", and Alter Ego will narrate 
  "`[Player displayName]` locks the `[PUZZLE NAME]`." in the Puzzle's Room channel.
* If the Puzzle is already solved and a Player attempts to solve the Puzzle again while holding the required
  Inventory Item, Alter Ego will narrate "`[Player displayName]` opens the `[PUZZLE NAME]`." in the Puzzle's Room
  channel.

#### `probability`
* A Player must only interact with the Puzzle in order to solve it. One of the Puzzle's solutions will be randomly
  chosen as the outcome.
* Once the Puzzle has been solved, it can never be directly unsolved by a Player without moderator intervention.
* If a Player attempts to solve the Puzzle again, they will be sent the Puzzle's already solved description.
* When a Player interacts with the Puzzle in any way, whether they solve it or not, Alter Ego will narrate 
  "`[Player displayName]` uses the `[PUZZLE NAME]`." in the Puzzle's Room channel.

#### `stat probability`
* A Player must only interact with the Puzzle in order to solve it. A stat-weighted [Die](die.md) will be rolled to
  semi-randomly choose one of the Puzzle's solutions as the outcome.
* There are five versions of this Puzzle type: `str probability`, `int probability`, `dex probability`,
  `spd probability`, and `sta probability`. The stat that the Die is weighted with determines which of the Player's
  stats will be used. The Player's roll modifier in that stat will be applied to the initial roll, and the ratio of
  the final result to the maximum Die value is multiplied by the number of solutions to determine the outcome. In
  effect, this means that a higher stat value is more likely to consistently yield outcomes which appear later in
  the list of solutions; whereas a lower stat value is more likely to consistently yield outcomes which appear first
  in the list of solutions. A Player with a stat value of 1, for example, may never get the final listed solution
  and a Player with a stat value of 10 may never get the first listed solution, depending on how many solutions
  there are and the range of possible Die rolls.
* The precision of outcomes is limited by the range of Die values. For example, if the Die has
  a [minimum](../settings/docker_settings.md#dice_min) of 1 and a [maximum](../settings/docker_settings.md#dice_max) of 6, but
  there are 20 solutions, some outcomes may be impossible to achieve.
* Once the Puzzle has been solved, it can never be directly unsolved by a Player without moderator intervention.
* If a Player attempts to solve the Puzzle again, they will be sent the Puzzle's already solved description.
* When a Player interacts with the Puzzle in any way, whether they solve it or not, Alter Ego will narrate 
  "`[Player displayName]` uses the `[PUZZLE NAME]`." in the Puzzle's Room channel.

#### `channels`
* A Player must only interact with the Puzzle in order to solve it. However, the Player can also enter the correct
  password to solve the Puzzle. The password is case sensitive. If a password is supplied, it will be used as the
  outcome. If no password is supplied and the Puzzle has no current outcome, the first solution in the list will be
  used as the outcome. If no password is supplied and the Puzzle does have a current outcome, that outcome will be
  used. If a Player solves the Puzzle, Alter Ego will narrate "`[Player displayName]` turns on the `[PUZZLE NAME]`."
  in the Puzzle's Room channel.
* Once the Puzzle has been solved, it can be unsolved when a Player interacts with the Puzzle without providing a
  password. The outcome that the Puzzle was previously solved with will be retained and used if the Player solves
  the Puzzle again without providing a password.
* If a Player unsolves the Puzzle, they will be sent "You turn off the `[PUZZLE NAME]`.", and Alter Ego will
  narrate "`[Player displayName]` turns off the `[PUZZLE NAME]`." in the Puzzle's Room channel.
* If the Puzzle is already solved and a Player attempts to solve the Puzzle again using the right password, they
  will solve it again with that solution as the outcome, and Alter Ego will narrate "`[Player displayName]` changes
  the channel on the `[PUZZLE NAME]`." in the Puzzle's Room channel.
* If a Player fails to solve the Puzzle, Alter Ego will narrate "`[Player displayName]` attempts and fails to change
  the channel on the `[PUZZLE NAME]`." in the Puzzle's Room channel.

#### `weight`
* A Player must take from or drop into the Puzzle's parent Object an Item which makes the total weight of all Items
  in the Object equal the Puzzle's solution in order to solve the Puzzle. In order to prevent the Player from simply
  entering the correct weight as a password with the use command, the Puzzle should be made inaccessible.
* Once the Puzzle has been solved, it can be unsolved when the Player takes from or drops into the Puzzle's parent
  Object an Item which makes the total weight of all Items in the Object not equal the Puzzle's solution. The Player
  will not be sent a message for unsolving the Puzzle.
* When a Player interacts with the Puzzle in any way, whether they solve it or not, Alter Ego will not narrate
  anything in the Puzzle's Room channel.

#### `container`
* A Player must take from or drop into the Puzzle's parent Object an Item which makes the container hold all of the
  Items listed in the solution. Every time an Item is dropped into the Puzzle's parent Object, Alter Ego will check
  if the complete list of Items contained inside it matches the Puzzle's solution. If multiple Items are required to
  solve the Puzzle, they should be separated with a plus sign (`+`) in the solution. In order to prevent the Player
  from simply entering the Prefab IDs as a password with the use command, the Puzzle should be made inaccessible.
* Once the Puzzle has been solved, it can be unsolved when the Player takes from or drops into the Puzzle's parent
  Object an Item. However, if the remaining Items are also a valid solution, the Puzzle will immediately be solved
  again using them as an outcome. The Player will not be sent a message for unsolving the Puzzle.
* When a Player interacts with the Puzzle in any way, whether they solve it or not, Alter Ego will not narrate
  anything in the Puzzle's Room channel.

#### `voice`
* A Player must say the correct password in the Room that the Puzzle is in in order to solve it. Alternatively, a
  Player with the [`sender` behavior attribute](status.md#sender) must say the correct password while a Player with
  the [`receiver` behavior attribute](status.md#receiver) is in the Room that the Puzzle is in in order to solve it. The
  password is case insensitive, and non-alphanumeric (A-Z, 0-9, and spaces) characters will be ignored. The Player's
  whole message does not need to be the password; it only needs to contain it. For example, if the password is 
  "unlock the door", then a Player who says "How do I unlock the door?" will still solve the Puzzle.
* Once the Puzzle has been solved, it can never be directly unsolved by a Player without moderator intervention.
* If the Puzzle is already solved and a Player attempts to solve the Puzzle again using the right password, they
  will solve it again with that solution as the outcome.
* When a Player interacts with the Puzzle in any way, whether they solve it or not, Alter Ego will not narrate
  anything in the Puzzle's Room channel.

#### `switch`
* A Player must enter the correct password in order to solve the Puzzle. The password is case sensitive. If a Player
  solves the Puzzle, Alter Ego will narrate "`[Player displayName]` sets the `[PUZZLE NAME]` to `[password]`." in
  the Puzzle's Room channel.
* A switch-type Puzzle can never be unsolved under any circumstances; it can only be set to different outcomes. For
  this reason, Alter Ego will fail to load switch-type Puzzles that are not solved and which do not have an outcome
  set.
* If the Player attempts to solve the Puzzle again using the same password as the current outcome, Alter Ego will
  narrate "`[Player displayName]` uses the `[PUZZLE NAME]`, but nothing happens." in the Puzzle's Room channel.
* If a Player fails to solve the Puzzle, Alter Ego will narrate "`[Player displayName]` attempts to set the
  `[PUZZLE NAME]`, but struggles." in the Puzzle's Room channel.

#### `option`
* A Player must enter the correct password in order to solve the Puzzle. The password is case sensitive. If a Player solves the Puzzle, Alter Ego will narrate "`[Player displayName]` sets the `[PUZZLE NAME]` to `[password]`." in the Puzzle's Room channel.
* Once the Puzzle has been solved, it can be unsolved when a Player attempts to solve it without supplying a password.
* If a Player unsolves the Puzzle, they will be sent "You clear the selection for the `[PUZZLE NAME]`.", and Alter Ego will narrate "`[Player displayName]` resets the `[PUZZLE NAME]`." in the Puzzle's Room channel.
* If the Puzzle is already solved and a Player attempts to solve the Puzzle again using the right password, Alter Ego will narrate "`[Player displayName]` sets the `[PUZZLE NAME]`, but nothing changes." in the Puzzle's Room channel.
* If a Player fails to solve the Puzzle, Alter Ego will narrate "`[Player displayName]` attempts to set the `[PUZZLE NAME]`, but struggles." in the Puzzle's Room channel.

#### `media`
* A Player must provide the name of an Inventory Item in their inventory which is one of the Puzzle's solutions in
  order to solve the Puzzle. Unlike other Puzzle types which require an Inventory Item to solve, the name of the
  Inventory Item **must** be provided in the Player's use command; simply having it in their inventory isn't
  sufficient. If a Player solves the Puzzle, Alter Ego will narrate "`[Player displayName]` inserts `[item phrase]`
  into the `[PUZZLE NAME]`." in the Puzzle's Room channel. The item phrase can be one of two things: if the
  Inventory Item's Prefab is discreet, it will simply be "an item"; if it is not discreet, it will be the Prefab's
  single containing phrase.
* Once the Puzzle has been solved, it can be unsolved when a Player interacts with the Puzzle without providing the
  name of an Inventory Item.
* If a Player unsolves the Puzzle, they will be sent the Puzzle's already solved description, and Alter Ego will
  narrate "`[Player displayName]` presses eject on the `[PUZZLE NAME]`." in the Puzzle's Room channel.
* If the Puzzle is already solved and a Player attempts to solve the Puzzle again with one of the Puzzle's
  solutions, they will be sent "You cannot insert `[Prefab singleContainingPhrase]` into the `[PUZZLE NAME]` as
  something is already inside it. Eject it first by sending `.use [PUZZLE NAME]`."
* If a Player fails to solve the Puzzle, Alter Ego will narrate "`[Player displayName]` attempts to insert
  `[item phrase]` into the `[PUZZLE NAME]`, but it doesn't fit." in the Puzzle's Room channel. The item phrase can
  be one of two things: if the Inventory Item's Prefab is discreet, it will simply be "an item"; if it is not
  discreet, it will be the Prefab's single containing phrase.

#### `restricted exit`
* A Player must enter the [Exit](exit.md) whose name matches the name of this Puzzle in order to solve it. However,
  the Player's name must match one of the Puzzle's solutions, and the Puzzle must be accessible. The Exit must be in
  the same Room as the Puzzle.
* If the Player solves the Puzzle, they will be able to enter the Exit, even if it's [locked](exit.md#unlocked).
* Once the Puzzle has been solved, it can never be directly unsolved by a Player without moderator intervention.
* Even if the Puzzle has been solved, it will be repeatedly solved any time a Player enters the Exit if they are
  listed in the solutions and the Puzzle is accessible.
* When a Player interacts with the Puzzle in any way, whether they solve it or not, Alter Ego will not narrate
  anything in the Puzzle's Room channel.

### Accessible

* Spreadsheet label: **Accessible?**
* Class attribute: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)
  `this.accessible`

This is another Boolean value indicating whether the Puzzle can currently be interacted with or not. If this is `true`,
then Players can attempt to solve the Puzzle with the use command. However, if the Puzzle has requirements and not all
of them are met, the Puzzle will be made inaccessible. If it is `false`, then a number of things will happen when a
Player uses the Puzzle, based on various factors. If the Puzzle has any requirements, Alter Ego will check each one to
see if it is met. If all requirements are met, the Puzzle will be made accessible, and the Player will attempt to solve
it. If all requirements are not met, the Player will receive the
Puzzle's [requirements not met description](puzzle.md#requirements-not-met-description), and Alter Ego will narrate "
`[Player displayName]` attempts to use the `[PUZZLE NAME]`, but struggles." in the Puzzle's Room channel. If the Puzzle
has no requirements not met description, Alter Ego will act as if the Puzzle doesn't exist if the Player tries to use
it.

### Requirements Strings

* Spreadsheet label: **Requires**
* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.requirementsStrings`

This is a comma-separated list of Puzzle names and/or Prefabs that are required for the Puzzle to be made accessible if
it is not and vice versa. Puzzle names must match the Puzzle's name exactly on the spreadsheet, although they can
optionally be prefixed with "Puzzle: ". They do not need to be in the same Room as the Puzzle that requires them. If
there are multiple Puzzles with the same name as one that is required, then the first to appear on the sheet will be
required. For this reason, it is strongly suggested that Puzzles are given unique names. Prefabs can also be listed as
requirements. However, they **must** be prefixed with "Prefab: " or "Item: ", followed by the Prefab ID.

In order for all requirements to be considered met, all required Puzzles must be solved and all required Prefabs must be
in the Player's inventory as Inventory Items.

### Requirements

* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Puzzle](puzzle.md)|[Prefab](prefab.md)>
  `this.requirements`

This is an internal attribute which contains references to each of the Puzzle or Prefab objects whose names are listed
in `this.requirementsStrings`.

### Solutions

* Spreadsheet label: **Solution(s)**
* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.solutions`

This is a comma-separated list of accepted solutions to the Puzzle. There is no limit to how many solutions can be
listed. There are two types of solutions: passwords and items. Password solutions are generally case sensitive and
generally must be given in the Player's use command in order to attempt to solve the Puzzle, although this varies by
Puzzle type. Item solutions must consist of "Item: " followed by a Prefab ID. In general, item solutions require only
that the Player have an Inventory Item of the given Prefab in their inventory in order to solve the Puzzle. In some
situations, listing an item as a requirement or as a solution to the Puzzle produces identical behavior. The difference,
however, is that required items must all be present in the Player's inventory, whereas an item solution only requires
one item in the Player's inventory to solve the Puzzle. A Puzzle can only be solved with one solution as its outcome at
a time.

### Remaining Attempts

* Spreadsheet label: **Remaining Attempts**
* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.remainingAttempts`

This is a whole number indicating how many times the Puzzle can be failed. Each time a Player attempts to solve the
Puzzle and fails, this number will decrease by 1. If this reaches 0, the Puzzle cannot be solved, even if the correct
solution is provided, and a Player who attempts to do so will receive the
Puzzle's [no more attempts description](puzzle.md#no-more-attempts-description). If no number is given, the Puzzle can be attempted
and failed infinitely many times.

### Command Sets String

* Spreadsheet label: **When Solved / Unsolved**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.commandSetsString`

This is a comma-separated list of sets of [bot commands](../commands/bot_commands.md) that will be executed when the Puzzle
is solved or unsolved.

If the Puzzle has only one solution, then command sets are implicit, and do not need to be written. Instead, a simple
list of commands is sufficient. This takes the form of a comma-separated list of bot commands that will be executed when
the Puzzle is solved. A comma-separated list of bot commands that will be executed when the Puzzle is unsolved can also
be included, with both sets separated by a forward slash (`/`). If no unsolved commands are desired, then the forward
slash can be omitted from the cell. If no solved commands are desired but unsolved commands are, the forward slash
should be the first character in the cell, with the unsolved commands following it.

Note that when writing bot commands, it is good practice to be as precise as possible and provide room names if they are
permitted, in order to prevent potential bugs. It should also be noted that when a Puzzle's commands solve or unsolve
another Puzzle, its commands will not be executed. These are all valid examples of commands for a Puzzle with only one
solution:

* `unsolve GREEN 12, unsolve PANEL 12 floor-2-hall-3, lock suite-12 DOOR`
* `set accessible puzzle items LOCKER 1 locker-room / set inaccessible puzzle items LOCKER 1 locker-room`
* `/ set inaccessible object INPUT computer-lab`

If the Puzzle has multiple solutions, then the command set format is required, with each set being comma-separated. The
correct format is:

`[solution 1(, solution 2(, solution N)): solved commands / unsolved commands]`

Multiple solutions can share the same set of commands. The same rules as above apply, however there is one additional
rule to keep in mind: item solutions must be listed exactly as they appear in the solutions set, with the "Item: "
prefix.

Due to the complexity of multi-solution Puzzles, their list of command sets can get quite long. These are all valid
examples of Puzzles with multiple solutions:

* `[17, seventeen: unlock suite-10 VENT / lock suite-10 VENT]`
*

`[2: solve VENT suite-2, unlock suite-2 VENT / unsolve VENT suite-2, lock suite-2 VENT], [3, 4, 5, 6, 19, 27, 30, 42, 43, 49, 65, 66, 69, 83, 91: unsolve VENT suite-2, lock suite-2 VENT]`

*

`[OPEN: trigger BLAST DOOR 1, unlock cave-11 TUNNEL 1, unlock cave-11 TUNNEL 2, unlock cave-11 TUNNEL 3, trigger EXPLOSION COUNTDOWN END], [CLOSED: end BLAST DOOR 1, lock cave-11 TUNNEL 1, lock cave-11 TUNNEL 2, lock cave-11 TUNNEL 3]`

*

`[Item: BLUE DANUBE CD: destroy player BLUE DANUBE CD, trigger BLUE DANUBE WALTZ / end BLUE DANUBE WALTZ, instantiate BLUE DANUBE CD on FLOOR at ballroom], [Item: EINE KLEINE NACHTMUSIK CD: destroy player EINE KLEINE NACHTMUSIK CD, trigger EINE KLEINE NACHTMUSIK WALTZ / end EINE KLEINE NACHTMUSIK WALTZ, instantiate EINE KLEINE NACHTMUSIK CD on FLOOR at ballroom], [Item: FUR ELISE CD: destroy player FUR ELISE CD, trigger FUR ELISE WALTZ / end FUR ELISE WALTZ, instantiate FUR ELISE CD on FLOOR at ballroom], [Item: BEETHOVENS FIFTH CD: destroy player BEETHOVENS FIFTH CD, trigger BEETHOVENS FIFTH WALTZ / end BEETHOVENS FIFTH WALTZ, instantiate BEETHOVENS FIFTH CD on FLOOR at ballroom], [Item: FOUR SEASONS CD: destroy player FOUR SEASONS CD, trigger FOUR SEASONS WALTZ / end FOUR SEASONS WALTZ, instantiate FOUR SEASONS CD on FLOOR at ballroom], [Item: MARRIAGE OF FIGARO CD: destroy player MARRIAGE OF FIGARO CD, trigger MARRIAGE OF FIGARO WALTZ / end MARRIAGE OF FIGARO WALTZ, instantiate MARRIAGE OF FIGARO CD on FLOOR at ballroom], [Item: CANON IN D MAJOR CD: destroy player CANON IN D MAJOR CD, trigger CANON IN D MAJOR WALTZ / end CANON IN D MAJOR WALTZ, instantiate CANON IN D MAJOR CD on FLOOR at ballroom], [Item: CLAIR DE LUNE CD: destroy player CLAIR DE LUNE CD, trigger CLAIR DE LUNE WALTZ / end CLAIR DE LUNE WALTZ, instantiate CLAIR DE LUNE CD on FLOOR at ballroom]`

*

`[TIRAMISU, tiramisu: solve DESSERT IN PROGRESS player "Nestor begins preparing a dessert for player.", wait 60, instantiate TIRAMISU on TABLES at estia, unsolve DESSERT IN PROGRESS player "Penelope places a serving of TIRAMISU on one of the TABLES for player.", unsolve DESSERTS estia], [EK MEK, ek mek: solve DESSERT IN PROGRESS player "Nestor begins preparing an appetizer for player.", wait 60, instantiate EK MEK on TABLES at estia, unsolve DESSERT IN PROGRESS player "Penelope places a serving of EK MEK on one of the TABLES for player.", unsolve DESSERTS estia], [GELATO, gelato: solve DESSERT IN PROGRESS player "Nestor begins preparing a dessert for player.", wait 60, instantiate GELATO on TABLES at estia, unsolve DESSERT IN PROGRESS player "Penelope places a bowl of GELATO on one of the TABLES for player.", unsolve DESSERTS estia]`

### Command Sets

* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>
  `this.commandSets`

This is an internal attribute which consists of a list of command set objects. Command set objects have the following
structure:

`{ Array outcomes, Array solvedCommands, Array unsolvedCommands }`

### Correct Description

* Spreadsheet label: **Correct Answer**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.correctDescription`

When a Player solves the Puzzle, they will receive a parsed version of this string. See the article
on [writing descriptions](../../moderator_guide/writing_descriptions.md) for more information. If a Puzzle has multiple solutions, it
can be beneficial to make this vary based on the outcome the Player receives using if conditionals. It should be noted
that solutions are all strings, even if they're numbers. Therefore, solutions in if conditionals should be surrounded
with single quote characters (`'`).

### Already Solved Description

* Spreadsheet label: **Puzzle Already Solved**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.alreadySolvedDescription`

When a Player attempts to solve the Puzzle and it is already solved, they will receive a parsed version of this string.
However, the exact situation that this description is used in can vary based on the Puzzle type. For Puzzles that
contain Items, the item list must be contained in this description.

### Incorrect Description

* Spreadsheet label: **Incorrect Answer**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.incorrectDescription`

When a Player attempts to solve the Puzzle and enters the wrong solution, they will receive a parsed version of this
string.

### No More Attempts Description

* Spreadsheet label: **No More Attempts**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.noMoreAttemptsDescription`

When a Player attempts to solve the Puzzle but it has 0 remaining attempts, they will receive a parsed version of this
string.

### Requirements Not Met Description

* Spreadsheet label: **Requirement Not Met**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.requirementsNotMetDescription`

When a Player attempts to solve the Puzzle but all of the requirements are not met, they will receive a parsed version
of this string. However, if the Puzzle is not accessible and this is blank, then Alter Ego will pretend as if the Puzzle
doesn't exist.

### Row

* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.row`

This is an internal attribute, but it can also be found on the spreadsheet. This is the row number of the Puzzle.