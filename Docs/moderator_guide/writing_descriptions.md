# Writing Descriptions

Writing for the [[spreadsheet]] is somewhat complex, but thanks to [[Alter Ego]]'s custom parser module, it is
incredibly flexible. Alter Ego makes use of [XML](https://en.wikipedia.org/wiki/XML) formatting to understand what
the [[moderator|Tutorial:-Moderating]] has written so that it can make changes as necessary.

## Table of Contents

<!-- toc -->

## Basic concepts of XML

XML, short for eXtensible Markup Language, was designed to store and transport data, and to be relatively simple to
understand. In XML, data is wrapped in **tags**, like so: `<tag>data</tag>`.

In XML, you can nest tags. For example, you can write:

```xml

<tag>
  <text>
    data
  </text>
</tag>
```

Note that when nesting tags, you must close them in the same order you opened them. Therefore, you cannot write
something like this:

```xml

<tag>
  <text>
  data
</tag>
    </text>
```

Additionally, you can add **attributes** to tags to give them more information. In order to assign an attribute, use the
following format: `<tag attribute="something">data</tag>`.

XML is similar to [HTML](https://en.wikipedia.org/wiki/HTML). However, the primary difference between the two is that
unlike HTML, XML doesn't *do* anything. XML is used to carry data, but unless a program was designed to interpret that
specific data, the XML won't do anything. HTML, on the other hand, is used to modify how data looks. Additionally, XML
tags are not predefined like HTML tags are. For example, entering `<b>text</b>` in an HTML document will display **text
** in a bold font. Entering that in an XML document, however, will have no effect because XML tags have no inherent
meaning.

## `<desc>`

Example: `<desc>This is the simplest description you can write.</desc>`

The **desc** tag is used to mark the beginning and ending of a description. It *must* be included in every single
description.

## `<s>`

Example:
`<desc><s>After leaving the PARK, you come to a crossroads.</s> <s>To your left is PATH 2.</s> <s>Straight ahead is PATH 3.</s> <s>To your right is PATH 4.</s> <s>It seems all of these roads lead you to the north side of the island.</s></desc>`

The **s** tag, short for **sentence**, is used to mark the beginning and ending of a sentence. The closing tag should
always go after the final punctuation mark of the sentence. There should generally be a space between the closing tag of
one sentence and the opening tag of another sentence. It isn't *technically* required that every sentence be in its own
**s** tag. For the most part, unless a single sentence contains other tags, such as [item lists](#il), the **s** tag can
go around multiple sentences. For example, this would be perfectly acceptable:

`<desc><s>You inspect the couches. They are soft and comfortable, and each is lined with a few pillows.</s> <s>Looking underneath the cushions, you find <il><item>a GUN</item></il>.</s></desc>`

## `<br>`

The **br** tag, short for **break**, is used to divide text into multiple lines. In general, you should _never_ split
the contents of a cell on the spreadsheet into multiple lines. Instead, use the **br** tag. Note that the **br** tag
cannot surround text, so it must be closed in the same tag that it is opened with, like so: `<br />`. An example of the
**br** tag is in this Item description:
`<desc><s>You flip through the diary.</s> <s>Most of the pages are blacked out.</s> <s>A few things remain:</s><br /><s>-"my husband's birthday is on the 4th Monday of the month this year,"</s><br /><s>-"anniversary dinner went great, but my husband's birthday is in just 3 days and I don't know what to get him!"</s></desc>`.
When a player inspects this Item, it will be divided into multiple lines, displaying like so:

```
You flip through the diary. Most of the pages are blacked out. A few things remain:
-"my husband's birthday is on the 4th Monday of the month this year,"
-"anniversary dinner went great, but my husband's birthday is in just 3 days and I don't know what to get him!"
```

## `<il>`

Example:
`<desc><s>The floor beneath you is soft and earthy.</s> <s>You find <il></il> haphazardly placed on it.</s></desc>`

The **il** tag, short for **item list**, is used to mark the beginning and ending of a list of Items, though it can
include non-Items as well. In the example above, the set of **il** tags contains nothing. In this case, when this
description is sent to a player, the entire sentence containing the pair of **il** tags will be removed. That is, the
player will be sent: `The floor beneath you is soft and earthy.`

The primary function of the **il** tag is so Alter Ego can remove and add Items to descriptions as players take and drop
them, while making sentences that are grammatically correct. For that to be possible, the grammar within an item list
must be correct to begin with. In order to do that, several rules should be followed:

* **item** tags should be wrapped around either the entire single containing phrase or plural containing phrase of that
  item.
* If there are two items, the item list should follow this format:
  `<il><item>ITEM 1</item> and <item>ITEM 2</item></il>`. That is, the word "and" should be between the two item tags.
* If there are three or more items, the items should be comma separated, and an Oxford comma should be used before the "
  and" preceding the last item. That is, it should follow this format:
  `<il><item>ITEM 1</item>, <item>ITEM 2</item>, and <item>ITEM 3</item></il>`.
* Periods and other sentence-ending punctuation should not placed within **il** tags.
* If the word "is" or the word "are" is in the clause just before or just after an item list, it should be the final
  word or first word of the clause, respectively. This is so that Alter Ego can change them if the plurality of items
  changes. For example, if you have a sentence like this: `<s>There is <il><item>a PENCIL</item></il> on the desk.</s>`
  and a player drops another `PENCIL` Item on the desk, the sentence will become:
  `<s>There are <il><item>2 PENCILS</item></il> on the desk.</s>`. The same will happen if a different item is added as
  well. For example, if an `ERASER` Item was dropped on the desk, the sentence would become:
  `<s>There are <il><item>a PENCIL</item> and <item>an ERASER</item></il> on the desk.</s>`. The same happens in
  reverse, as well. If the second Item, whatever it may be, is removed from the desk, "are" will be changed to "is".
* Though non-Items can be placed within **il** tags, they should follow the same grammatical rules that Items would
  have. For example, in the sentence
  `<s>The shelves are lined with <il><item>2 bags of RICE</item>, different ingredients for baking, and dough mixes</il>.</s>`,
  if the `RICE` Items were removed, Alter Ego would remove the Oxford comma before "dough mixes", making the sentence
  `<s>The shelves are lined with <il>different ingredients for baking and dough mixes</il>.</s>`. Non-items should only
  be placed after all item tags.

`il` tags are capable of having attributes. There is one attribute with defined behavior, the `name` attribute. This
allows you to insert multiple item lists into a description, giving each a name. This looks like:
`<desc><s>It's a plain pair of black jeans.</s> <s>It has four pockets in total.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s></desc>`

Note that
only [Prefabs](../developer_reference/data_structures/prefab.md), [Items](../developer_reference/data_structures/item.md),
[Inventory Items](../developer_reference/data_structures/inventory_items.md)
and [Players](../developer_reference/data_structures/player.md) support multiple item lists in a single description.

Lastly, `il` tags can only be used in a certain number of places, and each one has its own limitations. They can be used
in:

* An [Object](../developer_reference/data_structures/object.md)'s description. A single Object can only have one item
  list in its description.
* A [Prefab](../developer_reference/data_structures/prefab.md)'s description. A single Prefab can have multiple item
  lists; however, there must be one for
  each [inventory slot](../developer_reference/data_structures/prefab.md#inventory), with names to match. Item lists in
  a Prefab's description will never be updated. They simply serve as a base for instances of that Prefab.
* An [Item](../developer_reference/data_structures/item.md)
  or [Inventory Item](../developer_reference/data_structures/inventory_item.md)'s description. The same rules that
  Prefabs have apply, however these can be updated as other Items/Inventory Items are inserted or removed.
* A [Puzzle](../developer_reference/data_structures/puzzle.md)'s "Already Solved" text. A single Puzzle can only have
  one item list in its "
  Already Solved" text.
* A [Player](../developer_reference/data_structures/player.md)'s description. A single Player can only have two item
  lists in their description, and they must be named `equipment` and `hands`. Any other item lists will never be
  updated.

Lastly, every item list must be in its own sentence. That is, a single **s** tag can only have one **il** tag within it.

For examples of how the contents of **il** tags are edited when Items are added or removed, see the test functions
in [Tests/test_add_item.js](https://github.com/MolSnoo/Alter-Ego/blob/master/Tests/test_add_item.js)
and [Tests/test_remove_item.js](https://github.com/MolSnoo/Alter-Ego/blob/master/Tests/test_remove_item.js). In each
function, the `text` variable contains the original item list, and the `result` variable contains what the item list
should become.

To test that you've formatted item lists correctly, use the `add` and `remove` functions of
the [testparser command](https://github.com/MolSnoo/Alter-Ego/blob/master/Commands/testparser.js).

## `<item>`

Example: `<desc><s>You open the locker.</s> <s>Inside, you find <il><item>a SWIMSUIT</item></il>.</s></desc>`

The **item** tag is used to mark the beginning and ending of [Items](../developer_reference/data_structures/item.md). It
must go inside an [il tag](#il) and contain only the Item's
entire [single containing phrase](../developer_reference/data_structures/item.md#single-containing-phrase) or a quantity
plus its plural containing phrase. For example:

`<desc><s>You open the dresser.</s> <s>There are a few drawers with nothing of interest in them.</s> <s>In the bottom drawer, you find <il><item>a pair of NEEDLES</item></il>.</s></desc>`

In this example, the Item, `NEEDLES`, has the single containing phrase `a pair of NEEDLES`. If a player dropped another
`NEEDLES` Item into this Object, Alter Ego would change the contents of the **item** tag to the quantity 2 plus the
`NEEDLES` Item's plural containing phrase, which is `pairs of NEEDLES`. The description would become:

`<desc><s>You open the dresser.</s> <s>There are a few drawers with nothing of interest in them.</s> <s>In the bottom drawer, you find <il><item>2 pairs of NEEDLES</item></il>.</s></desc>`

Likewise, if the player then removed a `NEEDLES` Item from this Object, Alter Ego would revert the description to use
the Item's single containing phrase.

## `<if>`

Example:
`<desc><s>You take a look at the seaberry plant.</s> <s>Growing on it are <il><item>SEABERRIES</item></il>.</s> <if cond="player.talent === 'Ultimate Herbalist'"><s>You think you've heard that it can cure nausea.</s></if></desc>`

```admonish danger
This tag has the ability to run code. In order to determine if the condition in the `cond` attribute is
true, Alter Ego uses the [JavaScript eval function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval),
which most programmers agree is a massive security risk. Given that the only way to insert code is to write it on the
spreadsheet, write access should be given to as few people as possible. Possible malicious uses of this feature include, but are not limited to:

- Sending Alter Ego's authentication token to the server
- Killing a player in the game
- Shutting down Alter Ego
```

The **if** tag is used to modify the contents of a description before it is sent to a player. If the condition in the
`cond` (condition) attribute is true, then the contents of the **if** tag will be kept in the description. If it is
false, the contents will be removed. In the above example, there are two outcomes:

* If the player inspecting this Object has the talent "Ultimate Herbalist", the condition is true, and they will be sent
  `You take a look at the seaberry plant. Growing on it are SEABERRIES. You think you've heard that it can cure nausea.`
* If the player inspecting this Object doesn't have the talent "Ultimate Herbalist", the condition is false, and they
  will be sent `You take a look at the seaberry plant. Growing on it are SEABERRIES.`

You can chain multiple `if` tags together for different outcomes. For example, in this Object description:
`<desc><s>The window covers most of the wall, <if cond="let hour = new Date().getHours(); hour >= 7 && hour < 20">filling the room with sunlight.</if><if cond="let hour = new Date().getHours(); hour < 7 || hour >= 20">filling the room with moonlight.</if></s></desc>`

* If the current time is after (or exactly) 7 AM and before 8 PM, the player inspecting this Object will be sent:
  `The window covers most of the wall, filling the room with sunlight.`
* If the current time is before 7 AM or after (or exactly) 8 PM, the player inspecting this Object will be sent:
  `The window covers most of the wall, filling the room with moonlight.`

### Player conditionals

The function which parses descriptions (and thus, **if** tags) has access to the player inspecting it. As a result, you
can easily write descriptions that change based on a number of the player's attributes:

* Based on the player's name: `<if cond="player.name === 'Makoto'">Your name is Makoto.</if>`
* Based on the player's talent:
  `<if cond="player.talent === 'Ultimate Lucky Student'">You are the Ultimate Lucky Student.</if>`
* Based on the player's [intelligence stat](../developer_reference/data_structures/player.md#intelligence):
  `<if cond="player.intelligence > 7">You notice something your classmates didn't notice.</if>`
* Based on whether a player has a given [Status Effect](../developer_reference/data_structures/status.md):
  `<if cond="player.statusString.includes('hungry')">This food looks delicious.</if>`
* Based on whether a player has a
  given [behavior attribute](../developer_reference/data_structures/status.md#behavior-attributes):
  `<if cond="player.hasAttribute('no hearing')">It looks like it would make a noise, but you can't hear it.</if>`

### Container conditionals

The function which parses descriptions also has access to the entire _container_ of the description, which is accessible
with the `this` keyword. That is, if the description belongs to
a [Room](../developer_reference/data_structures/room.md), you can write descriptions that change:

* Based on the number of players in the room:
  `<if cond="this.occupants.length > 6">It's a little cramped with so many people in a room this small.</if>`

If the description belongs to an [Object](../developer_reference/data_structures/object.md), you can write descriptions
that change:

* Based on whether the Object's child Puzzle has been solved:
  `<desc><if cond="this.childPuzzle.solved === true"><s>You examine the poster.</s> <s>It looks like this: https://i.imgur.com/wtUujam.png</s></if><if cond="this.childPuzzle.solved === false"><s>It is too dark to see anything.</s></if></desc>`

If the description belongs to an [Item](../developer_reference/data_structures/item.md), you can write descriptions that
change:

* Based on the number of uses the Item has left:
  `<desc><if cond="this.uses > 0"><s>It's a bottle of water.</s> <s>You feel thirsty just looking at it.</s></if><if cond="this.uses === 0"><s>It's an empty plastic water bottle.</s></if></desc>`

Note that the examples given above are not the only things you can do with the description's container; they are simply
the most helpful and commonly used.

### Finder conditionals

The function which parses descriptions also has access to the entire game. This is most useful when descriptions should
change based on the status of a [Puzzle](../developer_reference/data_structures/puzzle.md). This is made easy using the
functions in the [finder module](https://github.com/MolSnoo/Alter-Ego/blob/master/Modules/finder.js). The finder module
includes the following functions (parameters listed in parentheses are optional):

* `findRoom('room-name')`
* `findObject('OBJECT NAME', ('location-name'))`
* `findPrefab('PREFAB ID')`
* `findItem('PREFAB ID OR IDENTIFIER', ('location-name'), ('Type: CONTAINER NAME'))`
* `findPuzzle('PUZZLE NAME', ('location-name'))`
* `findEvent('EVENT NAME')`
* `findStatusEffect('status effect name')`
* `findPlayer('Player name')`
* `findLivingPlayer('Player name')`
* `findDeadPlayer('Player name')`
* `findInventoryItem('PREFAB ID OR IDENTIFIER', ('Player name'), ('CONTAINER NAME'), ('EQUIPMENT SLOT'))`

Here are just a few examples of ways to use the finder module in **if** tags:

* Indicate if a Puzzle is solved or not:
  `<desc><s>This is a table for praying.</s> <s>On it there are two CANDLES.</s> <if cond="findPuzzle('CANDLES').solved === true"><s>They are currently lit.</s></if><if cond="findPuzzle('CANDLES').solved === false"><s>If you lit them, maybe you'd be able to pray for something.</s></if></desc>`
* Indicate if a Puzzle is solved or not when there are several Puzzles with the desired name in different rooms:
  `<desc><s>You step onto the bridge from the BOTANICAL GARDEN.</s> <if cond="findPuzzle('LOCK', 'bridge').solved === true"><s>A mysterious CAVE is behind where the waterfall used to be.</s></if><if cond="findPuzzle('LOCK', 'bridge').solved === false"><s>A WATERFALL roars right next to the bridge as you enter, spraying you with a cool mist.</s></if> <s>The bridge arches up slightly over a beautiful lake, and in the middle of the bridge is a GAZEBO.</s> <s>The other end leads to a GREENHOUSE.</s></desc>`
* Indicate which Puzzle of a pair is currently solved:
  `<desc><s>The terminal appears to control the heat sensor for the freezer.</s> <s>It has two buttons: the OFF BUTTON and the ON BUTTON.</s> <if cond="findPuzzle('OFF BUTTON').solved === true"><s>The sensor is already off.</s></if><if cond="findPuzzle('ON BUTTON').solved === true"><s>The sensor is currently on.</s></if></desc>`
* Indicate if there are players in a given Room:
  `<desc><s>You look through the peephole.</s> <if cond="findRoom('hall-1').occupants.length > 0"><s>There's someone in the hall outside.</s></if><if cond="findRoom('hall-1').occupants.length === 0"><s>You don't see anyone in the hall.</s></if></desc>`
* Add additional details to a description based on the presence of an Item:
  `<desc><s>It's a queen bed with perfectly white sheets<if cond="findItem('COMFORTER', this.location.name, 'Object: BED') !== undefined"> and a thick, black comforter tucked neatly under the mattress</if>.</s> <s>On it, you find <il><item>2 PILLOWS</item> and <item>a COMFORTER</item></il>.</s></desc>`
* Indicate if another Object is activated or not:
  `<desc><s>It’s a life-sized iron bull made out of metal, with a chamber so you can climb inside.</s> <var v="this.childPuzzle.alreadySolvedDescription" /> <s>Underneath it is <if cond="findObject('BUTTON', 'torture-chamber').activated === false">what looks like a pit for a campfire</if><if cond="findObject('BUTTON', 'torture-chamber').activated === true">a roaring fire</if>.</s> <s>There is a BUTTON on its nose.</s> <s>Do you dare push it?</s></desc>`
* Provide details based on the presence of an Inventory Item in the Player's inventory:
  `<desc><s>You examine the rightmost poster.</s> <s>It seems to be an eye chart to test a patient's vision.</s> <s>There's a line of text on the bottom that's so small you need a magnifying glass to read it.</s> <if cond="findInventoryItem('MAGNIFYING GLASS', player.name) !== undefined"><s>You use your MAGNIFYING GLASS to read the text, which is as follows: "MADE YOU LOOK".</s></if></desc>`

***

## `<var>`

Example:
`<desc><if cond="this.childPuzzle.solved === true"><var v="this.childPuzzle.alreadySolvedDescription" /></if><if cond="this.childPuzzle.solved === false"><s>The locker is locked with a combination LOCK.</s> <s>It seems someone scribbled on the front with marker: xyz.</s> <s>What's that supposed to mean?</s></if></desc>`

```admonish danger
This tag has the ability to run code. In order to determine if the condition in the `cond` attribute is
true, Alter Ego uses the [JavaScript eval function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval),
which most programmers agree is a massive security risk. Given that the only way to insert code is to write it on the
spreadsheet, write access should be given to as few people as possible. Possible malicious uses of this feature include, but are not limited to:

- Sending Alter Ego's authentication token to the server
- Killing a player in the game
- Shutting down Alter Ego
```

The **var** tag is used to insert data from the game. The data in question is stored in the `v` (variable) attribute. In
the above example, the `this.childPuzzle.alreadySolvedDescription` is:
`<desc><s>You open the locker.</s> <s>Inside, you find <il><item>a FIRST AID KIT</item>, <item>a bottle of PAINKILLERS</item>, <item>a PILL BOTTLE</item>, and <item>an OLD KEY</item></il>.</s></desc>`.
Thus, if the child puzzle is solved, the player will be sent:

`You open the locker. Inside, you find a FIRST AID KIT, a bottle of PAINKILLERS, a PILL BOTTLE, and an OLD KEY.`

Note that the **var** tag cannot surround text, so it must be closed in the same tag that it is opened with, like so:
`<var v="some variable" />`.

The **var** tag is incredibly useful due to its flexibility for writing dynamic descriptions. Here are just a few common
uses for it:

### Indicating Puzzle status

One of the **var** tag's most common uses is changing the description of an Object or something else based on the solved
status of a Puzzle. Here are a few examples:

* Indicating what items are inside the Object's `childPuzzle`:
  `<desc><s>You examine the table.</s> <s>Looking closely, you can see that it's not a table at all, but a chest!</s> <if cond="this.childPuzzle.solved === true"><s>It looks like it requires an old key to open, but it seems to be unlocked.</s> <var v=" this.childPuzzle.alreadySolvedDescription" /></if><if cond="this.childPuzzle.solved === false"><s>It looks like it requires an old key to open.</s></if></desc>`
    * `this.childPuzzle.alreadySolvedDescription`:
      `<desc><s>You open the chest.</s> <s>Inside, you find <il><item>a bottle of PEPSI</item>, <item>a ROPE</item>, and <item>a KNIFE</item></il>.</s></desc>`
    * Parsed description if `this.childPuzzle.solved === true`:
      `You examine the table. Looking closely, you can see that it's not a table at all, but a chest! It looks like it requires an old key to open, but it seems to be unlocked. You open the chest. Inside, you find a bottle of PEPSI, a ROPE, and a KNIFE.`
    * Parsed description if `this.childPuzzle.solved === false`:
      `You examine the table. Looking closely, you can see that it's not a table at all, but a chest! It looks like it requires an old key to open.`
* Replace the entire description with `childPuzzle.alreadySolvedDescription`:
  `<desc><if cond="this.childPuzzle.solved === true"><var v="this.childPuzzle.alreadySolvedDescription" /></if><if cond="this.childPuzzle.solved === false"><s>The computer is asking for a password.</s></if></desc>`
    * `this.childPuzzle.alreadySolvedDescription`:
      `<desc><s>The computer is logged in.</s> <s>There's no Internet connection, but it seems whoever was using this computer left a saved EMAIL open.</s> <if cond="findPuzzle('DETONATOR').solved === false"><s>There's also a program called DETONATOR open.</s></if></desc>`
    * Parsed description if `this.childPuzzle.solved === true`:
      `The computer is logged in. There's no Internet connection, but it seems whoever was using this computer left a saved EMAIL open. There's also a program called DETONATOR open.`
    * Parsed description if `this.childPuzzle.solved === false`: `The computer is asking for a password.`

### Indicate Item uses

Another very useful feature of the **var** tag is indicating how many uses a particular Item has left. Here are a few
examples:

*

`<desc><s>This is a gallon-sized jug of orange juice.</s> <s>It's pulp-free.</s> <if cond="this.uses > 0 && this.uses < 6"><s>It's about <var v="this.uses" />/6th full.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`

* Parsed description if this Item has 6 or more uses left:
  `This is a gallon-sized jug of orange juice. It's pulp-free.`
* Parsed description if this Item has (for example) 1 use left:
  `This is a gallon-sized jug of orange juice. It's pulp-free. It's about 1/6th full.`
* Parsed description if this Item has 0 uses left:
  `This is a gallon-sized jug of orange juice. It's pulp-free. It's empty.`

*

`<desc><s>It's a bag of frozen chicken nuggets.</s> <s>Sadly, they don't come in fun shapes.</s> <if cond="this.uses > 0"><s>It looks like there are enough in here for <var v="this.uses" /> serving<if cond="this.uses > 1">s</if>, though.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`

* Parsed description if this Item has (for example) 3 uses left:
  `It's a bag of frozen chicken nuggets. Sadly, they don't come in fun shapes. It looks like there are enough in here for 3 servings, though.`
* Parsed description if this Item has 1 use left:
  `It's a bag of frozen chicken nuggets. Sadly, they don't come in fun shapes. It looks like there are enough in here for 1 serving, though.`
* Parsed description if this Item has 0 uses left:
  `It's a bag of frozen chicken nuggets. Sadly, they don't come in fun shapes. It's empty.`

*

`<desc><s>It's a box of fish sticks.</s> <if cond="this.uses > 0"><s>These look delicious.</s> <s>You should cook them in the oven before eating them, though.</s> <s>There are about <var v="this.uses * 8" /> fish sticks inside.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`

* Parsed description if this Item has (for example) 6 uses left:
  `It's a box of fish sticks. These look delicious. You should cook them in the oven before eating them, though. There are about 48 fish sticks inside.`
* Parsed description if this Item has (for example) 1 use left:
  `It's a box of fish sticks. These look delicious. You should cook them in the oven before eating them, though. There are about 8 fish sticks inside.`
* Parsed description if this Item has 0 uses left: `It's a box of fish sticks. It's empty.`

### Other uses

Because the **var** tag is able to access all of the game's data, it has many more uses. Here are just a few:

* Indicate which players are in another room:
  `<desc><s>You look through the window into the pool room below.</s> <s>On the right side of the room you see an Olympic-size swimming pool and on the left is a larger recreational pool, surrounded by a number of beach chairs.</s> <if cond="findRoom('rec-pool').occupantsString !== ''"><s>You think you see <var v="findRoom('rec-pool').occupantsString" /> down there.</s></if></desc>`
* Use the player's name: `<desc><s>You look in the mirror.</s> <s>It's you.</s> <s><var v="player.name" />.</s></desc>`
* Indicate the password to an Object's `childPuzzle`:
  `<desc><s>You examine the safe.</s> <s>It comes equipped with a small screen and a miniature keyboard.</s> <if cond="this.childPuzzle.solved === true"><s>It's currently unlocked.</s> <var v="this.childPuzzle.alreadySolvedDescription" /></if><if cond="this.childPuzzle.solved === false"><s>It seems to require a password to unlock.</s> <s><if cond="player.name === 'Nero'">You, of course, know that the password is <var v="this.childPuzzle.solution" />.</if></s></if></desc>`