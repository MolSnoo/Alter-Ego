# Die

A Die is a data structure in the Neo World Program. Its purpose is to add a degree of randomness to gameplay. The result
of a Die roll can be modified based on various factors, most notably a [Player's](player.md) [stats](player.md#stats).
Players cannot directly interact with Dice, and their very presence is hidden from a Player's view; there are no
circumstances in which a Player will see the results of a Die roll directly. Currently, there are only two cases where
Players can initiate a Die roll of their own volition:

* A Die roll is initiated when a Player uses the [steal command](../commands/player_commands.md#steal). The roll is
  modified by their [dexterity stat](../data_structures/player.md#dexterity) and whether or not they have the
  [`thief` behavior attribute](../data_structures/status.md#thief).
* A Die roll is initiated when a Player solves
  a [`probability`-type](../data_structures/puzzle.md#probability) or [`stat probability`-type](../data_structures/puzzle.md#stat-probability) Puzzle. The roll is modified by the
  stat used, if applicable. The result is then used to determine which solution is used to solve the Puzzle.

Dice are predominantly used by [moderators](../../moderator_guide/moderating.md) in order to determine the result of a
given Player's action. This is done with the [roll command](../commands/moderator_commands.md#roll).

## Table of Contents

<!-- toc -->

## Parameters

A Die can be rolled with up to three optional parameters.

### Attacker

This is the active Player in a Die roll. In other words, when rolling to determine the outcome of an action, this is the
Player who is attempting the action. If no attacker is given, then the base roll will be the final result.

### Defender

This is the passive Player in a Die roll. If an attacker is given, then a defender is optional. A defender should only
be given if the attacker is attempting to perform an action against another Player. The defender is capable of modifying
the outcome of the attacker's roll in certain situations, detailed below.

### Stat

This is the stat that is being used to modify the Die's base roll. To be exact, this is the specified stat of the
attacker. However, this is optional. A Die can be rolled with an attacker and defender, or just an attacker, without
specifying a stat.

#### Stat Roll Modifier

This is not a parameter, but a value derived from the attacker's specified stat. This determines what value is added or
subtracted from the base roll. The stat roll modifier, \\(M\\), is calculated with the following formula:

\\[ M = \left\lfloor \Bigl\lfloor \frac{1}{2}s - \frac{10}{6} \Bigr\rfloor + \frac{a - i}{a} \right\rfloor \\]
Stat roll modifier = floor(floor( ( (s - 10) / 3) / 2 ) + (a - i) / a)

In this formula are several variables:

* \\(s\\) is the attacker's specified stat.
* \\(a\\) is the [diceMax setting](../settings/docker_settings.md#dice_max).
* \\(i\\) is the [diceMin setting](../settings/docker_settings.md#dice_min).

## Attributes

Dice have few attributes.

### Minimum

* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.min`

This is the minimum possible value for the base Die roll. This equals the diceMin setting.

### Maximum

* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.max`

This is the maximum possible value for the base Die roll. This equals the diceMax setting.

### Base Roll

* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.baseRoll`

This is the initial result of the Die roll before any modifiers are applied. This is calculated by generating a random
number and clamping it between the minimum and maximum values, inclusive.

If the attacker has the `all or nothing` behavior attribute, then the base roll has 50-50 odds of being either the Die's
minimum or maximum value, with nothing in-between.

### Modifier

* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.modifier`

This is the value that is added or subtracted from the base roll to determine the final result. The modifier begins with
a value of 0, and is calculated as follows.

If the attacker has the `coin flipper` behavior attribute, and they have
an [Inventory Item](../data_structures/inventory_item.md)
whose [single name](../data_structures/inventory_item.md#single-name)
contains the string "COIN", a coin flip is performed to determine if they will have a +1 added to the Die's modifier,
independent of stat. Effectively, this has a 50% chance of occuring if the given conditions are met.

If the Die is being rolled with a defender and uses the [strength stat](../data_structures/player.md#strength), this is
interpreted as the attacker physically attacking the defender. Thus, the defender's ability to dodge the attack is taken
into account. Under these circumstances, the defender's dexterity roll modifier will be multiplied by `-1` and added to
the Die's modifier.

Then, if the Die is being rolled with a defender, and the defender has
any [Status Effects](../data_structures/status.md)
with [stat modifiers](../data_structures/status.md#stat-modifiers) that affect the attacker, the attacker is very
briefly inflicted with Status Effects that modify their current stats accordingly. This will likely affect their
calculated stat roll modifier.

Finally, if the Die is being rolled for a stat, the attacker's stat roll modifier for the given stat is calculated and
added to Die's modifier. This is the final value of the Die's mofidier.

### Modifier String

* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.modifierString`

This is a comma-separated list of all of the factors which were used to calculate the Die's final modifier, along with
the values that each factor added.

### Result

* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.result`

This is the final result of the Die roll, equal to the base roll plus the modifier.