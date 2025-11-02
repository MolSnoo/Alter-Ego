# Event

An Event is a data structure in the Neo World Program. Its primary purpose is to
allow [moderators](../../moderator_guide/moderating.md) to create a more dynamic game world capable of automatically
changing its state in predictable, predefined ways. [Players](player.md) cannot directly interact with Events. In most
cases, Events are completely autonomous, requiring little to no intervention from Players or moderators.

## Table of Contents

<!-- toc -->

## Attributes

Events have relatively few attributes. However, they are capable of quite a lot despite this. Note that if an attribute
is _internal_, that means it only exists within
the [Event class](https://github.com/MolSnoo/Alter-Ego/blob/master/Data/Event.js). Internal attributes will be given in
the "Class attribute" bullet point, preceded by their data type. If an attribute is _external_, it only exists on the
spreadsheet. External attributes will be given in the "Spreadsheet label" bullet point.

### Name

* Spreadsheet label: **Event Name**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.name`

This is the name of the Event. All letters should be capitalized, and spaces are allowed. Every Event must have a unique
name. This will only be used when Events are triggered or ended
with [moderator](../commands/moderator_commands.md#trigger) [commands](../commands/moderator_commands.md#end)
or [bot](../commands/bot_commands.md#trigger) [commands](../commands/bot_commands.md#end).

### Ongoing

* Spreadsheet label: **Ongoing?**
* Class attribute: [Boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)
  `this.ongoing`

This is a simple Boolean value indicating whether the Event is currently ongoing or not. If this `true`, then the Event
is ongoing. If it is `false`, then the Event is not ongoing.

### Duration String

* Spreadsheet label: **Duration**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.durationString`

This is a string which determines how long after the Event is triggered it will be ongoing until it ends. This should
consist of a whole number (no decimals) with a letter immediately following it, with no space between them. There is a
fixed set of predefined units that correspond with each letter. They are as follows:
| Letter | Unit | | ------ | ------- | | s | seconds | | m | minutes | | h | hours | | d | days | | w | weeks | | M |
months | | y | years |

So, an Event that should last 30 seconds should have a duration of `30s`, one that should last 15 minutes should have a
duration of `15m`, one that should last 2 hours should have a duration of `2h`, one that should last 1.5 days should
have a duration of `36h`, and so on.

### Duration

* Class attribute: [Duration](https://momentjs.com/docs/#/durations/) `this.duration`

This is an internal attribute which contains a Duration object created from the duration string. If the Event has no
duration string, this is `null`.

### Remaining String

* Spreadsheet label: **Time Remaining**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.remainingString`

This is a string which determines how much longer the Event has until it ends. If the Event has no fixed duration, then
this can be left blank. An Event that is currently ongoing and has a duration must have the time remaining provided. It
must follow a specific format:

`(D) H:mm:ss`

`D` stands for the number of 24-hour days remaining; it is optional. `H` stands for the number of hours remaining. `mm`
stands for the number of minutes remaining; leading zeroes are required. `ss` stands for the number of seconds
remaining; leading zeroes are required. For example, an Event with 2 days, 13 hours, 45 minutes, and 11 seconds
remaining would have a remaining string of `2 13:45:11`. An Event with 1 day, 4 hours, 9 minutes, and 7 seconds
remaining would have a remaining string of `1 4:09:07`. An Event with 59 minutes remaining would have a remaining string
of `0:59:00`.

### Remaining

* Class attribute: [Duration](https://momentjs.com/docs/#/durations/) `this.remaining`

This is an internal attribute which contains a Duration object indicating how much time is remaining until the Event
ends. If the Event has no duration or the Event is not currently ongoing, this is `null`. While the Event is ongoing,
1000 milliseconds are subtracted from this Duration every second until it is less than or equal to zero, at which point
the Event ends.

### Trigger Times String

* Spreadsheet label: **Triggers At**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.triggerTimesString`

This is a string of comma-separated times that this Event will automatically trigger at. Every minute, [[Alter Ego]] iterates through the list of all Events and checks the trigger times for each one. If the current month, weekday, date, hour and minute match one of the Event's trigger times, it will automatically be triggered, after which it will be ongoing. A single Event can have multiple trigger times. However, if it is already ongoing, it will not be triggered again. If this cell is left blank, then the Event will not trigger automatically at any time of day.

Note that trigger times are based on the clock of the system running Alter Ego. If it is running on a server with a different timezone than the moderator's local time, the server's timezone must be used.

In addition to setting the time that an Event will trigger, it is also possible to specify the day of the week, the numbered day of the month, or days of the year. Trigger times must be written in a specific format.

First, the accepted time formats are as follows:

* `LT`, the time (in hours and minutes) in the system's local format.
* `LTS`, the time (in hours, minutes, and seconds) in the system's local format. Note that triggering Events on specific seconds is not supported, so the seconds will be ignored.
* `HH:mm`, where `HH` stands for the hour in a 24-hour format (0-23) and `mm` stands for the minutes with leading zeroes. Example: `7:35` or `15:00`.
* `hh:mm a`, where `hh` stands for the hour in a 12-hour format (1-12), `mm` stands for the minutes with leading zeroes, and `a` is either `AM` or `PM`. Example: `7:35 AM` or `3:00 PM`.

The accepted date formats are as follows:

* `ddd`, the abbreviated day of the week in the system's local format. Example: `Wed`.
* `ddd`, the day of the week in the system's local format. Example: `Wednesday`.
* `Do`, the numbered day of the month with ordinal. Example: `16th`.
* `Do MMM`, the numbered day of the month with ordinal and abbreviated month. Example: `16th Apr`.
* `Do MMMM`, the numbered day of the month with ordinal and the month. Example: `16th April`.
* `D MMM`, the numbered day of the month and abbreviated month. Example: `16 Apr`.
* `D MMMM`, the numbered day of the month and the month. Example: `16 April`.
* `MMM Do`, the abbreviated month and numbered day of the month with ordinal. Example: `Apr 16th`.
* `MMMM Do`, the month and numbered day of the month with ordinal. Example: `April 16th`.
* `MMM D`, the abbreviated month and numbered day of the month. Example: `Apr 16`.
* `MMMM D`, the month and numbered day of the month. Example: `April 16`.

It is possible to set a trigger time with only a time of day, and no date. In this case, the Event will trigger at the same time every day. However, it is not possible to set a trigger time with only a date; a time must also be specified. In this case, the date must always precede the time. This is the full table of acceptable formats grouped by date format, as well as an example and a note indicating when the given example will cause the Event to trigger:
|				        |				        |					          |					          | Example					          | Triggers on								                |
| ------------- | ------------- | ----------------- | ----------------- | ------------------------- | ----------------------------------------- |
| `LT`          | `LTS`         | `HH:mm`           | `hh:mm a`			    | `8:30 PM`					        | Every day at 8:30 PM						          |
| `ddd LT`      | `ddd LTS`     | `ddd HH:mm`       | `ddd hh:mm a`		  | `Wed 8:30:00 PM`			    | Every Wednesday at 8:30 PM				        |
| `dddd LT`     | `dddd LTS`    | `dddd HH:mm`      | `dddd hh:mm a`	  | `Wednesday 20:30`			    | Every Wednesday at 8:30 PM				        |
| `Do LT`       | `Do LTS`      | `Do HH:mm`        | `Do hh:mm a`		  | `16th 08:30 PM`			      | The 16th day of every month at 8:30 PM	  |
| `Do MMM LT`   | `Do MMM LTS`  | `Do MMM HH:mm`    | `Do MMM hh:mm a`	| `16th Apr 8:30 PM`		    | The 16th of April at 8:30 PM 				      |
| `Do MMMM LT`  | `Do MMMM LTS` | `Do MMMM HH:mm`   | `Do MMMM hh:mm a`	| `16th April 8:30:00 PM`	  | The 16th of April at 8:30 PM				      |
| `D MMM LT`    | `D MMM LTS`   | `D MMM HH:mm`     | `D MMM hh:mm a`	  | `16 Apr 20:30`			      | The 16th of April at 8:30 PM				      |
| `D MMMM LT`   | `D MMMM LTS`  | `D MMMM HH:mm`    | `D MMMM hh:mm a`	| `16 April 08:30 PM`		    | The 16th of April at 8:30 PM				      |
| `MMM Do LT`   | `MMM Do LTS`  | `MMM Do HH:mm`    | `MMM Do hh:mm a`	| `Apr 16th 8:30 PM`		    | The 16th of April at 8:30 PM				      |
| `MMMM Do LT`  | `MMMM Do LTS` | `MMMM Do HH:mm`   | `MMMM Do hh:mm a`	| `April 16th 8:30:00 PM`	  | The 16th of April at 8:30 PM				      |
| `MMM D LT`    | `MMM D LTS`   | `MMM D HH:mm`     | `MMM D hh:mm a`	  | `Apr 16 20:30`			      | The 16th of April at 8:30 PM				      |
| `MMMM D LT`   | `MMMM D LTS`  | `MMMM D HH:mm`    | `MMMM D hh:mm a`	| `April 16 08:30 PM`		    | The 16th of April at 8:30 PM				      |

### Trigger Times

* Class attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)> `this.triggerTimes`

This is an internal attribute which contains a list of strings separated from the trigger times string. Every minute, each string in this list is converted into a [Moment](https://momentjs.com/docs/#/parsing/). This is to ensure that any fields that are not set in this string will match the current date. Then the month, weekday, date, hour, and minute of every Event's trigger time Moment objects are compared to the current month, weekday, date, hour, and minute. If they match, the Event is triggered.

### Room Tag

* Spreadsheet label: **In Rooms with Tag**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.roomTag`

This is a keyword or phrase assigned to an Event that allows it to affect [Rooms](room.md). When the Event is triggered,
its [triggered narration](event.md#triggered-narration) is sent to the channels of all Rooms which have
this [tag](room.md#tags), provided there is at least one Player in each Room. Likewise, when the Event is ended,
its [ended narration](event.md#ended-narration) is sent. Additionally, when an Event is ongoing, any Players in a Room
affected by it will be subjected to its [inflicted](event.md#inflicted-status-effects-strings)
and [refreshed](event.md#refreshed-status-effects-strings) [Status Effects](status.md).

### Commands String

* Spreadsheet label: **When Triggered / Ended**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.commandsString`

This is a comma-separated list of [bot commands](../commands/bot_commands.md) that will be executed when the Event is
triggered. A comma-separated list of bot commands that will be executed when the Event is ended can also be included,
with both sets separated by a forward slash (`/`). If no ended commands are desired, then the forward slash can be
omitted from the cell. If no triggered commands are desired but ended commands are, the forward slash should be the
first character in the cell, with the ended commands following it.

Note that when writing bot commands, it is good practice to be as precise as possible and provide room names if they are
permitted, in order to prevent potential bugs. It should also be noted that when an Event's commands trigger or end
another Event, its commands will not be executed.

### Triggered Commands

* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.triggeredCommands`

This is an internal attribute which contains a list of commands that will be executed when the Event is triggered.

### Ended Commands

* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.endedCommands`

This is an internal attribute which contains a list of commands that will be executed when the Event is ended.

### Inflicted Status Effects Strings

* Spreadsheet label: **Inflict Status Effect(s)**
* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.effectsStrings`

This is a comma-separated list of Status Effects that will be inflicted onto all Players who are in a Room which is
affected by this Event. Every second, if the Event is ongoing, Alter Ego will look for all Rooms affected by it and
attempt to inflict all Players in those Rooms with these Status Effects, if there are any listed. Players who are in the
Room when the Event is triggered and Players who enter the Room later while it is still ongoing will all be inflicted,
unless they have a Status Effect which [overrides](status.md#overriders) it.

### Inflicted Status Effects

* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Status Effect](../data_structuresstatus.md)>
  `this.effects`

This is an internal attribute which contains references to each of the Status Effect objects whose names are listed in
`this.effectsStrings`.

### Refreshed Status Effects Strings

* Spreadsheet label: **Refresh Status Effect(s)**
* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>
  `this.refreshesStrings`

This is a comma-separated list of Status Effects whose durations will be reset to full on all Players who are in a Room
which is affected by this Event. Every second, if the Event is ongoing, Alter Ego will look for all Rooms affected by it
and attempt to refresh the durations of all Status Effects every Player in each Room has that are listed here. When a
Status Effect's duration is refreshed, it is set to its original value:
the [duration](status.md#duration)
of the Status Effect that the Player's Status Effect is an instance of. The Player's instance of the Status Effect will
continue to have its duration decremented by 1000 milliseconds every second; however, this will be canceled out every
second when its duration is refreshed. Effectively, this makes it so that the Player's instance of the Status Effect
cannot expire or develop into its [next stage](status.md#next-stage) because its duration can never reach

0.

This is particularly useful if the Event is intended to inflict a Status Effect upon all Players who enter certain Rooms
that should not expire while the Player continues to stay in one of the affected Rooms (such as "soaking wet" for a RAIN
Event and "blinded" for a BLACKOUT Event). However, due to the asynchronous nature of the JavaScript language, it may
still be possible for a refreshed Status Effect to expire if its duration is only 1 second. For that reason, refreshed
Status Effects that are intended to expire immediately after a Player leaves an affected Room should have a duration of
2 seconds or more. It should also be noted that a Status Effect being refreshed does **not** mean it will be inflicted
upon all Players who are in an affected Room. It must be inflicted by some other means, such as being listed as one of
the Event's inflicted Status Effects.

### Refreshed Status Effects

* Class
  attribute: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Status Effect](status.md)>
  `this.refreshes`

This is an internal attribute which contains references to each of the Status Effect objects whose names are listed in
`this.refreshesStrings`.

### Triggered Narration

* Spreadsheet label: **Narration When Triggered**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.triggeredNarration`

This is the [Narration]() that will be parsed and then sent to the channels of all occupied Rooms that the Event is
affected by when it is triggered. If no Players are in one of the Rooms affected by the Event, the Narration will not be
sent to that Room's channel. See the article on [writing descriptions](../../moderator_guide/writing_descriptions.md)
for more information. However, note that because this is a Narration and not a description, it cannot make use of the
`player` variable under any circumstances.

### Ended Narration

* Spreadsheet label: **Narration When Ended**
* Class attribute: [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)
  `this.endedNarration`

This is the Narration that will be parsed and then sent to the channels of all occupied Rooms that the Event is affected
by when it is ended. If no Players are in one of the Rooms affected by the Event, the Narration will not be sent to that
Room's channel. See the article on [writing descriptions](../../moderator_guide/writing_descriptions.md) for more
information. However, note that because this is a Narration and not a description, it cannot make use of the `player`
variable under any circumstances.

### Row

* Class attribute: [Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
  `this.row`

This is an internal attribute, but it can also be found on the spreadsheet. This is the row number of the Event.

### Timer

* Class attribute: [moment-timer](https://momentjs.com/docs/#/plugins/timer/) `this.timer`

This is an internal attribute which contains a timer counting down until the Event ends. Every 1000 milliseconds, 1
second is subtracted from the Event's [remaining Duration](event.md#remaining) until it reaches 0. When it does, the
Event ends, and this attribute becomes `null`.

### Effects Timer

* Class attribute: [moment-timer](https://momentjs.com/docs/#/plugins/timer/) `this.effectsTimer`

This is an internal attribute which contains a timer that inflicts and refreshes Status Effects while the Event is
ongoing. Every 1000 milliseconds, Alter Ego iterates through all Rooms tagged with this
Event's [room tag](event.md#room-tag) and attempts to inflict and refresh its inflicted and refreshed Status Effects on
any Players occupying them. If this Event has no inflicted or refreshed Status Effects, or if the Event is not ongoing,
this attribute becomes `null`.