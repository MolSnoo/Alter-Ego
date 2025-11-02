# Docker Settings

Alter Ego has various **settings** that can be configured in the file `.env`. All values should be enclosed with
single quotes. Remember to uncomment (i.e. remove the `#` before the line) for them to go into effect. This page details
each setting and what it does.

## Table of Contents

<!-- toc -->

## Bot settings

### COMMAND_PREFIX

This is what users must begin their messages with in order to run a command. If Alter Ego detects that a message begins
with this string, it will pass the message into its command handler module to determine if it was a command or not, and
run it if it was.

### DEBUG_MODE

This is a simple [Boolean value](https://en.wikipedia.org/wiki/Boolean_data_type). If this is `true`, Alter Ego will
start in debug mode. If this is `false`, it will start normally.

## Other game data

### PIXELS_PER_M

This is how many pixels it takes to represent 1 meter on your [Map](). When calculating the amount of time it takes a
player to move from one room to another, Alter Ego needs to convert the distance between the two rooms from pixels to
meters. In order to set this properly, find a part of your map with a standard size (for example, a basketball court
must be 28 x 15 meters according to the International Basketball Federation). Divide the number of pixels making up its
length by its length in meters. The result should go here.

### STAMINA_USE_RATE

This is used to calculate how much stamina a player will lose every 1/10th of a second they are moving. You can change
this to be higher or lower, depending on how quickly you want players to lose stamina, but it should always be a
negative number.

### HEATED_SLOWDOWN_RATE

This number is used to slow down time when at least one player is inflicted with the "heated" Status Effect. To
accomplish this feat, the rate of time passing during player movement as well as in timed Status Effects is multiplied
by this number. This allows you to narrate heated situations such as combat without worrying about how much time is
passing. The lower this number, the more slowed down time will become. Players are not informed that time is being
slowed, so setting this number too low can tip them off that a heated situation is ongoing.

### DICE_MIN

This is an integer that indicates the lowest possible number for a standard die roll. This should usually be set to `1`.

### DICE_MAX

This is an integer that indicates the highest possible number for a standard die roll. The default is `6`, but it can be
changed to any number higher than diceMin.

### DEFAULT_DROP_OBJECT

This is the name of the [Object](../data_structures/object.md) in each room that players will drop Items on if they don't
specify one themselves. Every Room must have an Object with this name capable of holding Items.

### DEFAULT_ROOM_ICON_URL

This is the URL of an image that will be inserted into the [Room MessageEmbed](../data_structures/room.md#room-description)
when a player enters or inspects a Room if the Room does not have a unique icon URL. This must end in `.jpg`, `.png`, or
`.gif`. If this is left blank and the Room does not have a unique icon URL, then Alter Ego will use the server icon
instead. If the server icon is not set, then no image will be sent in the MessageEmbed.

### AUTODELETE_WHISPER_CHANNELS

This is a Boolean value that determines whether or not [Whisper](../data_structures/whisper.md) channels will be
automatically deleted when all players have left the room. If this is `true`, they will be deleted. If this is `false`,
they will be renamed "archived-(Room name)". Because [Discord](../../about/discord.md) only allows a single category to have up to 50
channels, this should be `true` unless you plan on manually deleting Whisper channels when you no longer need to see
them.

### AUTOSAVE_INTERVAL

This is how often, in seconds, Alter Ego should update the spreadsheet with any necessary changes. The default is `30`.

## Bot activities

These are Discord user activities that Alter Ego will set for itself at certain times. They each have two options:

* **type**: This is the verb that will be used. This is
  a [Discord ActivityType](https://discord.js.org/#/docs/main/stable/typedef/ActivityType), so valid strings are:
    * PLAYING
    * STREAMING
    * LISTENING
    * WATCHING
    * COMPETING
* **string**: This is the name of the activity that will be used after the verb.

### ONLINE_ACTIVITY_TYPE, ONLINE_ACTIVITY_STRING

This is the activity that Alter Ego will set for itself when it comes online. Its default activity will display as
`Listening to Future Foundation HQ`. Alter Ego will set its status to Online.

### DEBUG_MODE_TYPE, DEBUG_MODE_STRING

This is the activity that Alter Ego will set for itself when it comes online in debug mode. Its default activity will
display as `Playing NWP Debugger.exe`. Alter Ego will set its status to Do Not Disturb.

### IN_PROGRESS_TYPE, IN_PROGRESS_STRING

This is the activity that Alter Ego will set for itself when a game has begun. Its default activity will display as
`Streaming Neo World Program`. Alter Ego's status will be set to Online, however if a valid URL is set, it will appear
to be streaming. The number of players online will be appended and updated periodically.

## Default player data

All of the settings in this section will be uploaded to the Players sheet when the startgame
timer ends. They can be changed to suit each individual player on the spreadsheet itself before all game data is loaded
for the first time.

### Default Stats

These are the default [stats](../data_structures/player.md#stats) a player will have. These should generally be changed on
the spreadsheet to suit each individual player before the game is officially started.

#### DEFAULT_STR

The [strength stat](../data_structures/player.md#strength) determines the maximum weight a Player is able to carry as well as
the likelihood of attacking successfully in [dice rolls](../data_structures/die.md). The formula for calculating
their [maximum carry weight](../data_structures/player.md#max-carry-weight) is:

`Max carry weight (kg) = 1.783 * strength^2 - 2 * strength + 22`

#### DEFAULT_INT

The [intelligence stat](../data_structures/player.md#Intelligence) isn't used by Alter Ego's internal code, however it can be
used in [if conditionals](../../moderator_guide/writing_descriptions.md#if) to alter what a player sees when inspecting various
things. This is most helpful for investigations.

#### DEFAULT_DEX

The [dexterity stat](../data_structures/player.md#dexterity) determines how likely a Player is to dodge an attack from
another Player in dice rolls. It also determines how likely a Player is to succeed when [stealing]() Items from another
Player.

#### DEFAULT_SPD

The [speed stat](../data_structures/player.md#speed) is used to calculate how quickly a player can move from one room to
another. The base formula for calculating their rate of movement (without factoring in slope) is:

`Rate (m/ms) = 0.0183 * speed^2 + 0.005 * speed + 0.916`

#### DEFAULT_STA

The [stamina stat](../data_structures/player.md#max-stamina) is used to determine how long a player can move before being
inflicted with the `weary` [Status Effect](../data_structures/status.md).

### DEFAULT_LOCATION

This is the name of the [Room](../data_structures/room.md) that all players will start in at the beginning of the game.

### DEFAULT_STATUS_EFFECTS

This is a comma-separated list of [Status Effects](../data_structures/status.md) that will be inflicted on all players at the
beginning of the game.

### DEFAULT_INVENTORY

This is an [array](https://en.wikipedia.org/wiki/Array_data_structure) of arrays that creates the default player
inventory on the spreadsheet. This is used to initialize the Inventory Items sheet when the startgame timer ends. If you
wish to change the default inventory that players start with, you can do so here. Note that if the `#` character is
found in the container identifier slot, Alter Ego will replace it with a unique number for each player.

### DEFAULT_DESCRIPTION

This is the default description that will be applied to each player's Description cell on the Players sheet when the
startgame timer ends. Once it is on the spreadsheet, it should be edited to describe each player's appearance. The item
lists should also be filled out to contain the containing phrases for the default inventory, if it has been changed.

## Role IDs

In general, these should not need be changed, as they are now autopopulated by Alter Ego. However, if you created your
own roles instead of using a template, or if Alter Ego cannot find the correct role names, you can manually change the
IDs here.

In order to copy a role ID, make sure your Discord account
has [Developer Mode](../../moderator_guide/installation.md#enable-developer-mode) enabled. Mention a role by typing
`@(Role name)` on Discord, but place a `\` before the `@` symbol. When you send the message, the role will display its
ID, which is a string of numbers.

### TESTER_ROLE

This should be the ID of the [Tester role](../../appendix/manual_installation/channel_and_role_creation.md#tester) in single quotes.

### ELIGIBLE_ROLE

This should be the ID of the [Eligible role](../../appendix/manual_installation/channel_and_role_creation.md#eligible) in single quotes.

### PLAYER_ROLE

This should be the ID of the [Player role](../../appendix/manual_installation/channel_and_role_creation.md#player) in single quotes.

### HEADMASTER_ROLE

This should be the ID of the [Headmaster role](../../appendix/manual_installation/channel_and_role_creation.md#headmaster) in single quotes.

### MODERATOR_ROLE

This should be the ID of the [Moderator role](../../appendix/manual_installation/channel_and_role_creation.md#moderator) in single quotes.

### DEAD_ROLE

This should be the ID of the [Dead role](../../appendix/manual_installation/channel_and_role_creation.md#dead) in single quotes.

### SPECTATOR_ROLE

This should be the ID of the [Spectator role](../../appendix/manual_installation/channel_and_role_creation.md#spectator) in single quotes.

## Category and channel IDs

In general, these should not need be changed, as they are now autopopulated by Alter Ego. However, if you created your
own channels instead of using a template, or if Alter Ego cannot find the correct room names, you can manually change
the IDs here.

In order to copy a category or channel ID, right click on it in the channel list and click **Copy ID**.

### ROOM_CATEGORIES

> **NOTE:** You can now use the `.createroomcategory` command to set these, so it is very unlikely that you will need to
> change this.

This is a list of all [room category IDs](../../appendix/manual_installation/channel_and_role_creation.md#category-rooms). They can be separated by
commas, spaces, or anything else, but it should all be a single string.

### WHISPER_CATEGORY

This should be the ID of the [Whisper category](../../appendix/manual_installation/channel_and_role_creation.md#category-whispers) in single quotes.

### SPECTATE_CATEGORY

This should be the ID of the [Spectator category](../../appendix/manual_installation/channel_and_role_creation.md#category-spectators) in single
quotes.

### TESTING_CHANNEL

This should be the ID of the [testing channel](../../appendix/manual_installation/channel_and_role_creation.md#channel-testing) in single quotes.

### GENERAL_CHANNEL

This should be the ID of the [general channel](../../appendix/manual_installation/channel_and_role_creation.md#channel-general) in single quotes.

### ANNOUNCEMENT_CHANNEL

This should be the ID of the [announcements channel](../../appendix/manual_installation/channel_and_role_creation.md#channel-announcements) in single
quotes.

### COMMAND_CHANNEL

This should be the ID of the [bot-commands channel](../../appendix/manual_installation/channel_and_role_creation.md#channel-bot-commands) in single
quotes.

### LOG_CHANNEL

This should be the ID of the [bot-log channel](../../appendix/manual_installation/channel_and_role_creation.md#channel-bot-log) in single quotes.
