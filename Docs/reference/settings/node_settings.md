# Node Settings

Alter Ego has various **settings** that can be configured in configuration files. They are split up into
`settings.json`, `serverconfig.json`, and `playerdefaults.json`. This page details each setting and what it does.

## Table of Contents

<!-- toc -->

## Bot settings (settings.json)

### commandPrefix

This is what users must begin their messages with in order to run a command. If Alter Ego detects that a message begins
with this string, it will pass the message into its command handler module to determine if it was a command or not, and
run it if it was.

### debug

This is a simple [Boolean value](https://en.wikipedia.org/wiki/Boolean_data_type). If this is `true`, Alter Ego will
start in debug mode. If this is `false`, it will start normally.

### embedColor

This is a string that determines the color of embed messages sent by Alter Ego. String should be in the format of a 24-bit hexadecimal number without a hash symbol, e.g. `1F8B4C`

### autoLoad

This is a boolean that determines whether or not the bot automatically executes functionality equivalent to `.load all resume` upon startup.

## Other game data (settings.json)

### pixelsPerMeter

This is how many pixels it takes to represent 1 meter on your [Map](). When calculating the amount of time it takes a
player to move from one room to another, Alter Ego needs to convert the distance between the two rooms from pixels to
meters. In order to set this properly, find a part of your map with a standard size (for example, a basketball court
must be 28 x 15 meters according to the International Basketball Federation). Divide the number of pixels making up its
length by its length in meters. The result should go here.

### staminaUseRate

This is used to calculate how much stamina a player will lose every 1/10th of a second they are moving. You can change
this to be higher or lower, depending on how quickly you want players to lose stamina, but it should always be a
negative number.

### heatedSlowdownRate

This number is used to slow down time when at least one player is inflicted with the "heated" Status Effect. To
accomplish this feat, the rate of time passing during player movement as well as in timed Status Effects is multiplied
by this number. This allows you to narrate heated situations such as combat without worrying about how much time is
passing. The lower this number, the more slowed down time will become. Players are not informed that time is being
slowed, so setting this number too low can tip them off that a heated situation is ongoing.

### diceMin

This is an integer that indicates the lowest possible number for a standard die roll. This should usually be set to `1`.

### diceMax

This is an integer that indicates the highest possible number for a standard die roll. The default is `6`, but it can be
changed to any number higher than diceMin.

### defaultDropObject

This is the name of the [Object](../data_structures/object.md) in each room that players will drop Items on if they
don't specify one themselves. Every Room must have an Object with this name capable of holding Items.

### defaultRoomIconURL

This is the URL of an image that will be inserted into
the [Room MessageEmbed](../data_structures/room.md#room-description)
when a player enters or inspects a Room if the Room does not have a unique icon URL. This must end in `.jpg`, `.png`, or
`.gif`. If this is left blank and the Room does not have a unique icon URL, then Alter Ego will use the server icon
instead. If the server icon is not set, then no image will be sent in the MessageEmbed.

### autoDeleteWhisperChannels

This is a Boolean value that determines whether or not [Whisper](../data_structures/whisper.md) channels will be
automatically deleted when all players have left the room. If this is `true`, they will be deleted. If this is `false`,
they will be renamed "archived-(Room name)". Because [Discord](../../about/discord.md) only allows a single category to
have up to 50 channels, this should be `true` unless you plan on manually deleting Whisper channels when you no longer
need to see them.

### autoSaveInterval

This is how often, in seconds, Alter Ego should update the spreadsheet with any necessary changes. The default is `30`.

## Bot activities (settings.json)

These are Discord user activities that Alter Ego will set for itself at certain times. They each have two options:

* **type**: This is the verb that will be used. This is
  a [Discord ActivityType](https://discord.js.org/docs/packages/discord.js/main/ActivityType:Enum), so valid strings
  are:
    * PLAYING
    * STREAMING
    * LISTENING
    * WATCHING
    * COMPETING
* **string**: This is the name of the activity that will be used after the verb.

### onlineActivity

This is the activity that Alter Ego will set for itself when it comes online. Its default activity will display as
`Listening to Future Foundation HQ`. Alter Ego will set its status to Online.

### debugModeActivity

This is the activity that Alter Ego will set for itself when it comes online in debug mode. Its default activity will
display as `Playing NWP Debugger.exe`. Alter Ego will set its status to Do Not Disturb.

### gameInProgressActivity

This is the activity that Alter Ego will set for itself when a game has begun. Its default activity will display as
`Streaming Neo World Program`. Alter Ego's status will be set to Online, however if a valid URL is set, it will appear
to be streaming. The number of players online will be appended and updated periodically.

## playerdefaults.json

All of the settings in this section will be uploaded to the Players sheet when the startgame timer ends. They can be
changed to suit each individual player on the spreadsheet itself before all game data is loaded for the first time.

### defaultPronouns

This is the default [pronoun string](../data_structures/player.md#pronoun-string) that each player will have. The 
default is `neutral`. Once it is on the spreadsheet, it should be edited to suit each player.

### defaultVoice

This is the default [original voice string](../data_structures/player.md#original-voice-string) that each player will 
have. The default is `a neutral voice`. Once it is on the spreadsheet, it should be edited to suit each player.

### defaultStats

These are the default [stats](../data_structures/player.md#stats) a player will have. These should generally be changed
on the spreadsheet to suit each individual player before the game is officially started.

#### strength

This is the strength stat that each player will have by default. The default is `5`. For more information, read the
[strength section](../data_structures/player.md#strength) of the Player article.

#### intelligence

This is the intelligence stat that each player will have by default. The default is `5`. For more information, read the
[intelligence section](../data_structures/player.md#intelligence) of the Player article.

#### dexterity

This is the dexterity stat that each player will have by default. The default is `5`. For more information, read the
[dexterity section](../data_structures/player.md#dexterity) of the Player article.

#### speed

This is the speed stat that each player will have by default. The default is `5`. For more information, read the
[speed section](../data_structures/player.md#speed) of the Player article.

#### stamina

This is the stamina stat that each player will have by default. The default is `5`. For more information, read the
[stamina section](../data_structures/player.md#stamina) of the Player article.

### defaultLocation

This is the name of the [Room](../data_structures/room.md) that all players will start in at the beginning of the game.

### defaultStatusEffects

This is a comma-separated list of [Status Effects](../data_structures/status.md) that will be inflicted on all players
at the beginning of the game.

### defaultInventory

This is an [array](https://en.wikipedia.org/wiki/Array_data_structure) of arrays that creates the default player
inventory on the spreadsheet. This is used to initialize the Inventory Items sheet when the startgame timer ends. If you
wish to change the default inventory that players start with, you can do so here. Note that if the `#` character is
found in the container identifier slot, Alter Ego will replace it with a unique number for each player.

### defaultDescription

This is the default description that will be applied to each player's Description cell on the Players sheet when the
startgame timer ends. Once it is on the spreadsheet, it should be edited to describe each player's appearance. The item
lists should also be filled out to contain the containing phrases for the default inventory, if it has been changed.

## Role IDs (serverconfig.json)

In general, these should not need be changed, as they are now autopopulated by Alter Ego. However, if you created your
own roles instead of using a template, or if Alter Ego cannot find the correct role names, you can manually change the
IDs here.

In order to copy a role ID, make sure your Discord account
has [Developer Mode](../../moderator_guide/installation.md#enable-developer-mode) enabled. Mention a role by typing
`@(Role name)` on Discord, but place a `\` before the `@` symbol. When you send the message, the role will display its
ID, which is a string of numbers.

### testerRole

This should be the ID of the [Tester role](../../appendix/manual_installation/channel_and_role_creation.md#tester) in
quotes.

### eligibleRole

This should be the ID of the [Eligible role](../../appendix/manual_installation/channel_and_role_creation.md#eligible)
in quotes.

### playerRole

This should be the ID of the [Player role](../../appendix/manual_installation/channel_and_role_creation.md#player) in
quotes.

### headmasterRole

This should be the ID of
the [Headmaster role](../../appendix/manual_installation/channel_and_role_creation.md#headmaster) in quotes.

### moderatorRole

This should be the ID of the [Moderator role](../../appendix/manual_installation/channel_and_role_creation.md#moderator)
in quotes.

### deadRole

This should be the ID of the [Dead role](../../appendix/manual_installation/channel_and_role_creation.md#dead) in
quotes.

### spectatorRole

This should be the ID of the [Spectator role](../../appendix/manual_installation/channel_and_role_creation.md#spectator)
in quotes.

## Category and channel IDs (serverconfig.json)

In general, these should not need be changed, as they are now autopopulated by Alter Ego. However, if you created your
own categories and channels instead of using a template, or if Alter Ego cannot find the correct category / channel
names, you can manually change the IDs here.

In order to copy a category or channel ID, right click on it in the channel list and click **Copy ID**.

### roomCategories

> **NOTE:** You can now use the `.createroomcategory` command to set these, so it is very unlikely that you will need to
> change this.

This is a list of
all [room category IDs](../../appendix/manual_installation/channel_and_role_creation.md#category-rooms). They can be
separated by commas, spaces, or anything else, but it should all be a single string.

### whisperCategory

This should be the ID of
the [Whisper category](../../appendix/manual_installation/channel_and_role_creation.md#category-whispers) in quotes.

### spectateCategory

This should be the ID of
the [Spectator category](../../appendix/manual_installation/channel_and_role_creation.md#category-spectators) in quotes.

### testingChannel

This should be the ID of
the [testing channel](../../appendix/manual_installation/channel_and_role_creation.md#channel-testing) in quotes.

### generalChannel

This should be the ID of
the [general channel](../../appendix/manual_installation/channel_and_role_creation.md#channel-general) in quotes.

### announcementChannel

This should be the ID of
the [announcements channel](../../appendix/manual_installation/channel_and_role_creation.md#channel-announcements) in
quotes.

### commandChannel

This should be the ID of
the [bot-commands channel](../../appendix/manual_installation/channel_and_role_creation.md#channel-bot-commands) in
quotes.

### logChannel

This should be the ID of
the [bot-log channel](../../appendix/manual_installation/channel_and_role_creation.md#channel-bot-log) in quotes.

## Spreadsheet ID (settings.json)

A Google Sheets URL contains two IDs. The first is the ID of the entire spreadsheet itself. The second is the ID of the
individual sheet currently open in the spreadsheet. You can retrieve the ID of either by copying them from the URL. The
format is as follows:

`https://docs.google.com/spreadsheets/d/(entire spreadsheet ID)/edit#gid=(individual sheet ID)`

### spreadsheetID

This should be the ID of the spreadsheet Alter Ego will use in quotes.

## Cell constants

These are all cell constants used by Alter Ego to retrieve data. These generally shouldn't be changed.
