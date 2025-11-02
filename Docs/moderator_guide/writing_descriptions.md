# Writing Descriptions

Writing for the Neo World Program is somewhat complex, but thanks to Alter Ego's custom [parser module](https://github.com/MolSnoo/Alter-Ego/blob/8432696144b167993d299b8ddec5958e10fc649d/Modules/parser.js), it is
incredibly flexible. Alter Ego makes use of [XML](https://en.wikipedia.org/wiki/XML) formatting to understand what
the [moderator](moderating.md) has written so that it can make changes as necessary.

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

The `desc` tag is used to mark the beginning and ending of a description. It *must* be included in every single description.

## `<s>`

Example:
`<desc><s>After leaving the PARK, you come to a crossroads.</s> <s>To your left is PATH 2.</s> <s>Straight ahead is PATH 3.</s> <s>To your right is PATH 4.</s> <s>It seems all of these roads lead you to the north side of the island.</s></desc>`

The `s` tag, short for **sentence**, is used to mark the beginning and ending of a sentence. The closing tag should always go after the final punctuation mark of the sentence. There should generally be a space between the closing tag of one sentence and the opening tag of another sentence. It isn't *technically* required that every sentence be in its own `s` tag. For the most part, unless a single sentence contains other tags, such as [item lists](#il), the `s` tag can go around multiple sentences. For example, this would be perfectly acceptable:

`<desc><s>You inspect the couches. They are soft and comfortable, and each is lined with a few pillows.</s> <s>Looking underneath the cushions, you find <il><item>a GUN</item></il>.</s></desc>`

## `<br>`

Example: `<desc><s>You flip through the diary.</s> <s>Most of the pages are blacked out.</s> <s>A few things remain:</s><br /><s>-"my wife's birthday is on the 4th Monday of the month this year,"</s><br /><s>-"anniversary dinner went great, but my wife's birthday is in just 3 days and I don't know what to get her!"</s></desc>`

The `br` tag, short for **break**, is used to divide text into multiple lines. In general, you should _never_ split the contents of a cell on the spreadsheet into multiple lines. Instead, use the `br` tag. Note that the `br` tag cannot surround text, so it must be closed in the same tag that it is opened with, like so: `<br />`. If a Player inspects the example description above, it will be divided into multiple lines, like this:

```
You flip through the diary. Most of the pages are blacked out. A few things remain:
-"my wife's birthday is on the 4th Monday of the month this year,"
-"anniversary dinner went great, but my wife's birthday is in just 3 days and I don't know what to get her!"
```

## `<il>`

Example:
`<desc><s>The floor beneath you is soft and earthy.</s> <s>You find <il></il> haphazardly placed on it.</s></desc>`

The `il` tag, short for **item list**, is used to mark the beginning and ending of a list of Items, though it can include non-Items as well. In the example above, the set of `il` tags contains nothing. In this case, when this description is sent to a player, the entire sentence containing the pair of `il` tags will be removed. That is, the player will be sent: `The floor beneath you is soft and earthy.`

The primary function of the `il` tag is so Alter Ego can remove and add Items to descriptions as players take and drop them, while making sentences that are grammatically correct. For that to be possible, the grammar within an item list must be correct to begin with. In order to do that, several rules should be followed:
* `item` tags should be wrapped around either the entire single containing phrase or plural containing phrase of that Item.
* If there are two Items, the item list should follow this format: `<il><item>ITEM 1</item> and <item>ITEM 2</item></il>`. That is, the word "and" should be between the two `item` tags.
* If there are three or more Items, the `item` tags should be comma separated, and an Oxford comma should be used before the "and" preceding the last `item` tag. That is, it should follow this format: `<il><item>ITEM 1</item>, <item>ITEM 2</item>, and <item>ITEM 3</item></il>`.
* Periods and other sentence-ending punctuation should not placed within `il` tags.
* If the word "is" or the word "are" is in the clause just before or just after an item list, it should be the final word or first word of the clause, respectively. This is so that Alter Ego can change them if the plurality of the referenced Items changes. For example, if you have a sentence like this: `<s>There is <il><item>a PENCIL</item></il> on the desk.</s>` and a player drops another `PENCIL` Item on the desk, the sentence will become: `<s>There are <il><item>2 PENCILS</item></il> on the desk.</s>`. The same will happen if a different Item is added as well. For example, if an `ERASER` Item was dropped on the desk, the sentence would become: `<s>There are <il><item>a PENCIL</item> and <item>an ERASER</item></il> on the desk.</s>`. The same happens in reverse, as well. If the second Item, whatever it may be, is removed from the desk, "are" will be changed to "is".
* Though non-Items can be placed within `il` tags, they should follow the same grammatical rules that `item` tags would have. For example, in the sentence `<s>The shelves are lined with <il><item>2 bags of RICE</item>, different ingredients for baking, and dough mixes</il>.</s>`, if the `RICE` Items were removed, Alter Ego would remove the Oxford comma before "dough mixes", making the sentence `<s>The shelves are lined with <il>different ingredients for baking and dough mixes</il>.</s>`. Non-Items should only be placed after all `item` tags.

`il` tags are capable of having attributes. There is one attribute with defined behavior, the `name` attribute. This
allows you to insert multiple item lists into a description, giving each a name. This looks like:
`<desc><s>It's a plain pair of black jeans.</s> <s>It has four pockets in total.</s> <s>In the right pocket, you find <il name="RIGHT POCKET"></il>.</s> <s>In the left pocket, you find <il name="LEFT POCKET"></il>.</s> <s>In the right back pocket, you find <il name="RIGHT BACK POCKET"></il>.</s> <s>In the left back pocket, you find <il name="LEFT BACK POCKET"></il>.</s></desc>`

Note that
only [Prefabs](../developer_reference/data_structures/prefab.md), [Items](../developer_reference/data_structures/item.md),
[Inventory Items](../developer_reference/data_structures/inventory_items.md)
and [Players](../developer_reference/data_structures/player.md) support multiple `il` tags in a single description.

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

Lastly, every item list must be in its own sentence. That is, a single `s` tag can only have one `il` tag within it.

To test that you've formatted item lists correctly, use the `add` and `remove` functions of
the [testparser command](../developer_reference/commands/moderator_commands.md#testparser).

## `<item>`

Example: `<desc><s>You open the locker.</s> <s>Inside, you find <il><item>a SWIMSUIT</item></il>.</s></desc>`

The `item` tag is used to mark the beginning and ending of [Items](../developer_reference/data_structures/item.md). It
must go inside an [il tag](#il) and contain only the Item's
entire [single containing phrase](../developer_reference/data_structures/item.md#single-containing-phrase) or a quantity
plus its plural containing phrase. For example:

`<desc><s>You open the dresser.</s> <s>There are a few drawers with nothing of interest in them.</s> <s>In the bottom drawer, you find <il><item>a pair of NEEDLES</item></il>.</s></desc>`

In this example, the Item, `NEEDLES`, has the single containing phrase `a pair of NEEDLES`. If a Player dropped another `NEEDLES` Item into this Object, Alter Ego would change the contents of the `item` tag to the quantity 2 plus the `NEEDLES` Item's plural containing phrase, which is `pairs of NEEDLES`. The description would become:

`<desc><s>You open the dresser.</s> <s>There are a few drawers with nothing of interest in them.</s> <s>In the bottom drawer, you find <il><item>2 pairs of NEEDLES</item></il>.</s></desc>`

Likewise, if the Player then removed a `NEEDLES` Item from this Object, Alter Ego would revert the description to use the Item's single containing phrase.

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

The `if` tag is used to modify the contents of a description before it is sent to a Player. If the condition in the `cond` (condition) attribute is true, then the contents of the `if` tag will be kept in the description. If it is false, the contents will be removed. In the above example, there are two outcomes:
* If the Player inspecting this Object has the talent "Ultimate Herbalist", the condition is true, and they will be sent `You take a look at the seaberry plant. Growing on it are SEABERRIES. You think you've heard that it can cure nausea.`
* If the Player inspecting this Object doesn't have the talent "Ultimate Herbalist", the condition is false, and they will be sent `You take a look at the seaberry plant. Growing on it are SEABERRIES.`

You can chain multiple `if` tags together for different outcomes. For example, in this Object description: `<desc><s>The window covers most of the wall, filling the room with <if cond="findEvent('NIGHT').ongoing === true">moonlight</if><if cond="findEvent('NIGHT').ongoing === false">sunlight</if>.</s></desc>`
* If the `NIGHT` Event is ongoing, the Player inspecting this Object will be sent: `The window covers most of the wall, filling the room with moonlight.`
* If the `NIGHT` Event is _not_ ongoing, the Player inspecting this Object will be sent: `The window covers most of the wall, filling the room with sunlight.`

### Player conditionals

The function which parses descriptions (and thus, `if` tags) has access to the Player inspecting it. As a result, you can easily write descriptions that change based on a number of the Player's attributes:

* Based on the Player's name: `<if cond="player.name === 'Astrid'">Your name is Astrid.</if>`
* Based on the Player's talent: `<if cond="player.talent === 'Ultimate Mortician'">You are the Ultimate Mortician.</if>`
* Based on the Player's [[intelligence stat|Data-Structure:-Player#Intelligence]]: `<if cond="player.intelligence > 7">You notice something your classmates didn't notice.</if>`
* Based on whether a Player has a given [[Status Effect|Data-Structure:-Status]]: `<if cond="player.statusString.includes('hungry')">This food looks delicious.</if>`
* Based on whether a Player has a given [[behavior attribute|Data-Structure:-Status#behavior-attributes]]: `<if cond="player.hasAttribute('acute hearing')">It produces an extremely faint noise that you should be able to make out if you listen closely.</if>`

### Container conditionals

The function which parses descriptions also has access to the entire _container_ of the description, which is accessible
with the `this` keyword. That is, if the description belongs to
a [Room](../developer_reference/data_structures/room.md), you can write descriptions that change:

* Based on the number of Players in the room:
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

Here are just a few examples of ways to use the finder module in `if` tags:

* Indicate if a Puzzle is solved or not:
  `<desc><s>This is a table for praying.</s> <s>On it there are two CANDLES.</s> <if cond="findPuzzle('CANDLES').solved === true"><s>They are currently lit.</s></if><if cond="findPuzzle('CANDLES').solved === false"><s>If you lit them, maybe you'd be able to pray for something.</s></if></desc>`
* Indicate if a Puzzle is solved or not when there are several Puzzles with the desired name in different Rooms:
  `<desc><s>You step onto the bridge from the BOTANICAL GARDEN.</s> <if cond="findPuzzle('LOCK', 'bridge').solved === true"><s>A mysterious CAVE is behind where the waterfall used to be.</s></if><if cond="findPuzzle('LOCK', 'bridge').solved === false"><s>A WATERFALL roars right next to the bridge as you enter, spraying you with a cool mist.</s></if> <s>The bridge arches up slightly over a beautiful lake, and in the middle of the bridge is a GAZEBO.</s> <s>The other end leads to a GREENHOUSE.</s></desc>`
* Indicate which Puzzle of a pair is currently solved:
  `<desc><s>The terminal appears to control the heat sensor for the freezer.</s> <s>It has two buttons: the OFF BUTTON and the ON BUTTON.</s> <if cond="findPuzzle('OFF BUTTON').solved === true"><s>The sensor is already off.</s></if><if cond="findPuzzle('ON BUTTON').solved === true"><s>The sensor is currently on.</s></if></desc>`
* Indicate if there are Players in a given Room:
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

The `var` tag is used to insert data from the game. The data in question is stored in the `v` (variable) attribute. In the above example, the `this.childPuzzle.alreadySolvedDescription` is: `<desc><s>You open the locker.</s> <s>Inside, you find <il><item>a FIRST AID KIT</item>, <item>a bottle of PAINKILLERS</item>, <item>a PILL BOTTLE</item>, and <item>an OLD KEY</item></il>.</s></desc>`. Thus, if the child Puzzle is solved, the Player will be sent:

`You open the locker. Inside, you find a FIRST AID KIT, a bottle of PAINKILLERS, a PILL BOTTLE, and an OLD KEY.`

Note that the `var` tag cannot surround text, so it must be closed in the same tag that it is opened with, like so:
`<var v="some variable" />`.

The `var` tag is incredibly useful due to its flexibility for writing dynamic descriptions. Here are just a few common
uses for it:

### Indicating Puzzle status

One of the `var` tag's most common uses is changing the description of an Object or something else based on the solved
status of a Puzzle. Here are a few examples:

* Indicating what items are inside the Object's child Puzzle:
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

Another very useful feature of the `var` tag is indicating how many uses a particular Item has left. Here are a few
examples:

* `<desc><s>This is a gallon-sized jug of orange juice.</s> <s>It's pulp-free.</s> <if cond="this.uses > 0 && this.uses < 6"><s>It's about <var v="this.uses" />/6th full.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`

* Parsed description if this Item has 6 or more uses left:
  `This is a gallon-sized jug of orange juice. It's pulp-free.`
* Parsed description if this Item has (for example) 1 use left:
  `This is a gallon-sized jug of orange juice. It's pulp-free. It's about 1/6th full.`
* Parsed description if this Item has 0 uses left:
  `This is a gallon-sized jug of orange juice. It's pulp-free. It's empty.`

* `<desc><s>It's a bag of frozen chicken nuggets.</s> <s>Sadly, they don't come in fun shapes.</s> <if cond="this.uses > 0"><s>It looks like there are enough in here for <var v="this.uses" /> serving<if cond="this.uses > 1">s</if>, though.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`

* Parsed description if this Item has (for example) 3 uses left:
  `It's a bag of frozen chicken nuggets. Sadly, they don't come in fun shapes. It looks like there are enough in here for 3 servings, though.`
* Parsed description if this Item has 1 use left:
  `It's a bag of frozen chicken nuggets. Sadly, they don't come in fun shapes. It looks like there are enough in here for 1 serving, though.`
* Parsed description if this Item has 0 uses left:
  `It's a bag of frozen chicken nuggets. Sadly, they don't come in fun shapes. It's empty.`

* `<desc><s>It's a box of fish sticks.</s> <if cond="this.uses > 0"><s>These look delicious.</s> <s>You should cook them in the oven before eating them, though.</s> <s>There are about <var v="this.uses * 8" /> fish sticks inside.</s></if><if cond="this.uses === 0"><s>It's empty.</s></if></desc>`

* Parsed description if this Item has (for example) 6 uses left:
  `It's a box of fish sticks. These look delicious. You should cook them in the oven before eating them, though. There are about 48 fish sticks inside.`
* Parsed description if this Item has (for example) 1 use left:
  `It's a box of fish sticks. These look delicious. You should cook them in the oven before eating them, though. There are about 8 fish sticks inside.`
* Parsed description if this Item has 0 uses left: `It's a box of fish sticks. It's empty.`

### Other uses

Because the `var` tag is able to access all of the game's data, it has many more uses. Here are just a few:

* Indicate which players are in another Room:
  `<desc><s>You look through the window into the pool room below.</s> <s>On the right side of the room you see an Olympic-size swimming pool and on the left is a larger recreational pool, surrounded by a number of beach chairs.</s> <if cond="findRoom('rec-pool').occupantsString !== ''"><s>You think you see <var v="findRoom('rec-pool').occupantsString" /> down there.</s></if></desc>`
* Use the player's name: `<desc><s>You look in the mirror.</s> <s>It's you.</s> <s><var v="player.name" />.</s></desc>`
* Indicate the password to an Object's child Puzzle:
  `<desc><s>You examine the safe.</s> <s>It comes equipped with a small screen and a miniature keyboard.</s> <if cond="this.childPuzzle.solved === true"><s>It's currently unlocked.</s> <var v="this.childPuzzle.alreadySolvedDescription" /></if><if cond="this.childPuzzle.solved === false"><s>It seems to require a password to unlock.</s> <s><if cond="player.name === 'Nero'">You, of course, know that the password is <var v="this.childPuzzle.solution" />.</if></s></if></desc>`

***

## `<procedural>`

Example: `<desc><s>It's a trading card from the hugely popular card game, Capsulebeasts.</s> <s>This one features the ocean-type fan-favorite, Tortide.</s> <procedural chance="5"><s>This card has a holographic finish, making it extra rare!</s></procedural></desc>`

The `procedural` tag allows Prefabs to be instantiated as Items and Inventory Items with procedurally-generated descriptions. This can allow you to add some variation in instances of Prefabs without having to create entirely new Prefabs or manually edit the descriptions of instances of those Prefabs. Keep in mind that `procedural` tags only affect the description of instantiated Prefabs, and do not alter their other properties at all.

Note that only Prefabs can have `procedural` tags in their description. When a Prefab is instantiated as an Item or Inventory Item, the parser module evaluates all of the `procedural` tags in the description and algorithmically decides which ones to keep. The description it generates contains only the text inside the `procedural` and `poss` tags that were selected, without the tags themselves. All other tags remain unaffected.

`procedural` tags can have attributes. There are three attributes with defined behavior:

### Procedural attribute: `name`

`name` allows you to give each `procedural` tag its own identifier. This allows you to manually select procedurals and the possibilities contained within them when using the [instantiate](../developer_reference/commands/moderator_commands.md#instantiate) [command](../developer_reference/commands/bot_commands.md#instantiate).

### Procedural attribute: `chance`

`chance` takes a percent chance for the contents of a given `procedural` tag to appear in instances of a Prefab. This chance is independent of other `procedural` tags. If the `chance` attribute is omitted from the tag, or its value is not a number between 0 and 100, it is assigned a `chance` of 100, meaning that it will always appear.

However, if a `procedural` tag is nested inside of another `procedural` tag, then it will not appear in the generated description if the parent `procedural` tag failed to generate, even if its `chance` is 100.

For example, given the description:

`<desc><s>Sentence.</s> <procedural chance="50" name="A1"><s>A1.</s> <procedural chance="100" name="A2"><s>A2.</s></procedural></procedural></desc>`

Because `procedural` `A2` is contained inside `procedural` `A1`, which has a `chance` of 50, it will not appear if `A1` did not generate. If `A1` did generate, then `A2` will always generate, since it has a `chance` of 100. In other words, the parser module's generated output will be:

* **50%** of the time: `<desc><s>Sentence.</s></desc>`
* **50%** of the time: `<desc><s>Sentence.</s> <s>A1.</s> <s>A2.</s></desc>`

For another example, given the description:

`<desc><s>Sentence.</s> <procedural name="A1" chance="50"><s>A1.</s> <procedural name="A2" chance="50"><s>A2.</s> <procedural name="A3" chance="50"><s>A3.</s></procedural></procedural></procedural></desc>`

Because `procedural` `A3` is nested inside `procedural` `A2` — which is itself nested inside `procedural` `A1` — the probability of `A3` generating will be dependent on `A2` generating, which is dependent on `A1` generating. In other words, the parser module's generated output will be:

* **50%** of the time: `<desc><s>Sentence.</s></desc>`
* **25%** of the time: `<desc><s>Sentence.</s> <s>A1.</s></desc>`
* **12.5%** of the time: `<desc><s>Sentence.</s> <s>A1.</s> <s>A2.</s></desc>`
* **12.5%** of the time: `<desc><s>Sentence.</s> <s>A1.</s> <s>A2.</s> <s>A3.</s></desc>`

### Procedural attribute: `stat`

`stat` takes the name of one of the Player's five [stats](../developer_reference/data_structures/player.md#stats): `strength`, `intelligence`, `dexterity`, `speed`, `stamina`, or their abbreviations: `str`, `int`, `dex`, `spd`, `sta`. If a Player is supplied when the output is generated, then the chosen stat will affect the chances of all of the `poss` tags contained within this `procedural` tag. When instantiating a Prefab as an Inventory Item, the Player will always be the Player who the Inventory Item belongs to. When instantiating a Prefab as an Item, it is only possible to supply a Player in the bot version of the instantiate command; this is the Player who caused the command to be executed.

When a Player's stat is provided, a percent modifier, \\(M\\), is calculated for each `poss` tag within the `procedural`. The formula for \\(M\\) is as follows:

\\[ M = (f + \frac{c - f}{p - 1}) * i * 10\\]

In this formula there are several variables:
* \\(c\\) is the maximum modifier value, where \\(c = x - 5\\), with \\(x\\) being the stat value.
* \\(f\\) is the minimum modifier value, where \\(f = -1 * c\\).
* \\(p\\) is the number of `poss` tags inside this `procedural`.
* \\(i\\) is the numbered position of the `poss` tag that \\(M\\) is being calculated for. The first `poss` tag in the list has an \\(i\\) value of \\(0\\).

After `M` is calculated for a `poss` tag, it is added to that tag's `chance`, before moving onto the next `poss` tag.

In effect, this means that a higher stat value is more likely to result in `poss` tags near the end of the list being generated, while a lower stat value is more likely to result in `poss` tags near the beginning of the list being generated. A Player with a stat value of 10 may have a percent modifier of -50% for the first listed `poss` tag and +50% for the final listed `poss` tag. Meanwhile, a Player with a stat value of 1 may have a percent modifier of +40% for the first listed `poss` tag and a -40% for the final listed `poss` tag. This may very well make it impossible for some `poss` tags in the `procedural` to generate at all, as it is unlikely that all of the `poss` chances will still be between 0 and 100.

For example, given the description:

`<desc><s>This is a red clay pot.</s> <procedural stat="dexterity"><poss chance="50"><s>Judging by the abysmal craftsmanship, it looks like it was made by a total rookie.</s></poss><poss chance="35"><s>It looks decently made, but there are some noticeable mistakes.</s></poss><poss chance="15"><s>It's very well made, with perfectly smooth edges.</s></poss></procedural></desc>`

Suppose the provided Player's dexterity stat is 3. Using the formula listed above, the percent modifiers for each `poss` tag would be +20%, ±0%, and -20%, respectively. On the other hand, if the provided Player's dexterity stat is 9, the percent modifiers would instead be -40%, ±0%, and +40%, respectively. As a result, the parser module's generated output would be:

* `<desc><s>This is a red clay pot.</s> <s>Judging by the abysmal craftsmanship, it looks like it was made by a total rookie.</s></desc>`
   * **70%** of the time if the Player's dexterity stat is 3.
   * **10%** of the time if the Player's dexterity stat is 9.
* `<desc><s>This is a red clay pot.</s> <s>It looks decently made, but there are some noticeable mistakes.</s></desc>`
   * **30%** of the time if the Player's dexterity stat is 3. This is because 70% + 35% exceeds 100%, so the extra 5% doesn't matter.
   * **35%** of the time if the Player's dexterity stat is 9.
* `<desc><s>This is a red clay pot.</s> <s>It's very well made, with perfectly smooth edges.</s></desc>`
   * **0%** of the time if the Player's dexterity stat is 3. The actual calculated probability is -5%, but because 70% + 35% exceeds 100%, this makes no difference.
   * **55%** of the time if the Player's dexterity stat is 9.

Note that if the `stat` attribute is set, but there is no Player provided, or the Player's stat value is 5, the chances of all of the `poss` tags contained within the `procedural` will not be changed.

***

## `<poss>`

Example: `<desc><s>It's a capsule from your favorite game, Capsulebeasts!</s> <s>This is a <procedural name="color"><poss name="red" chance="25">red</poss><poss name="blue" chance="25">blue</poss><poss name="green" chance="25">green</poss><poss name="black" chance="12.5">black</poss><poss name="white" chance="12.5">white</poss></procedural> <procedural name="species"><poss name="lavazard">Lavazard</poss><poss name="loamander">Loamander</poss><poss name="tortide">Tortide</poss></procedural>.</s> <s><procedural name="finish" chance="25"><poss name="glass" chance="50">This one has a glassy finish.</poss><poss name="metal" chance="50">This one has a metallic finish.</poss><poss name="standard" chance="0"></poss></procedural></s></desc>`

The `poss` tag, short for **possibility**, is used to add pre-defined variations to the descriptions of Prefabs. It must go inside a [procedural tag](#procedural). If it is placed outside of a `procedural` tag, it has no functionality. As with the `procedural` tag, `poss` tags only affect the description of instantiated Prefabs, and do not alter their other properties at all.

When a Prefab is instantiated into an Item or Inventory Item, the parser module uses a random number generator to pick one `poss` tag to keep in the final description. After one is selected, all of the others within the same `procedural` tag are removed. The `poss` tag itself is also removed from the description, so make sure that the text it contains will not end up outside of an `s` tag.

`poss` tags can have attributes. There are two attributes with defined behavior:

### Poss attribute: `name`

`name` allows you to give each `poss` tag its own identifier. This allows you to manually select procedurals and the possibilities contained within them when using the [instantiate](../developer_reference/commands/moderator_commands.md#instantiate) [command](../developer_reference/commands/bot_commands.md#instantiate).

In order to make use of the `name` attribute in a `poss` tag, the `procedural` tag that contains it must also have a `name`. When using the instantiate command, it is possible to provide procedural selections with the syntax `(procedural name=poss name)`. For instance, in the above example, if you wanted to manually instantiate an Item with the `standard` `finish`, which normally has no possibility of generating, your command would start with: `.instantiate GACHA CAPSULE (finish=standard)`. This syntax is not case-sensitive, and extra spaces are ignored. The effect of doing this would result in the final `s` tag being removed, because the `poss` that was selected contained no text, and as a result, the `procedural` and thus `s` tag contained no text. The `poss` tags within the other `procedural` tags in the description would still be randomly chosen.

It is possible to chain manual procedural selections together with a `+` character. For example, if your command began with `.instantiate GACHA CAPSULE (color=black + species=tortide + finish=metal)`, then the generated Item would always have the description:

`<desc><s>It's a capsule from your favorite game, Capsulebeasts!</s> <s>This is a black Tortide.</s> <s>This one has a metallic finish.</s></desc>`

### Poss attribute: `chance`

`chance` takes a percent chance for the contents of a given `poss` tag to be chosen in instances of a Prefab. This chance is independent of the `chance` attribute of the `procedural` tag which contains it. The `chance` given for the `procedural` tag determines how likely it is that _any_ of the `poss` tags contained inside it will be generated. That is, even if the containing `procedural` tag has a `chance` under 100, all of the chances of the `poss` tags contained inside it should ideally add up to 100 (and not the `chance` of the `procedural`, as one might assume).

When the parser module has to select a `poss` tag in a given `procedural` tag to keep, it first adds together the chances assigned to each `poss` tag in the `procedural`. If a `poss` tag does not have a `chance` attribute, or its value is not a number between 0 and 100, it is considered chanceless, and thus not included in this sum. If there are any chanceless possibilities, the sum calculated earlier is subtracted from 100, and then divided by the number of chanceless possibilities. This makes it so that all chanceless possibilities are equally likely to generate, and all of the chances will add up to 100.

For example, given the description: `<desc><s><procedural><poss name="A1" chance="50">A1.</poss><poss name="A2">A2.</poss><poss name="A3">A3.</poss></procedural></s></desc>`

Because `A1` has a chance of 50, and `A2` and `A3` are chanceless, the remainder that it would take for all of the `poss` chances to add up to 100 — 50 — is divided by the number of chanceless possibilities — 2 — and assigned equally to them. As a result, `A2` and `A3` have an effective `chance` of 25 each.

If _none_ of the `poss` tags in a `procedural` have assigned chances, then they will all be equally likely to be selected. If the sum of all of the chances already adds up to 100 and there are also chanceless possibilities, then the chanceless possibilities will never be selected.

After all of the possibilities have been assigned chances, if the `procedural` has a `stat` attribute and a Player's stat has been provided, these chances will have [percent modifiers](#procedural-attribute-stat) applied to them.

Then, all of the possibilities are sorted from highest to lowest chance. A random number between 0 and 100 is generated, and an accumulator value that starts at 0 is created. The possibilities are iterated through, with each one adding to the accumulator value. If at any point during this iteration, the randomly-generated number is less than the accumulator's current value, that possibility is selected. Finally, all other possibilities in the current `procedural` are removed from the description.