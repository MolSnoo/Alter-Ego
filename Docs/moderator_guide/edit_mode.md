# Edit Mode

Edit mode is a special mode in the Neo World Program that drastically limits gameplay. It can be toggled on and off by
a [moderator](moderating.md) at will using
the [editmode command](../developer_reference/commands/moderator_commands.md#editmode).

## Purpose

Most of the game world data is stored on a Google Sheets spreadsheet. However, this data is useless by itself. Alter Ego
uses this data to facilitate the Neo World Program, but reading it directly from the spreadsheet would be inefficient,
as doing so would necessitate making frequent requests to
the [Google Sheets API](https://developers.google.com/sheets/api/guides/concepts), which would introduce additional
latency and increase the potential for data asynchrony due to the inherent unpredictability of making requests over the
Internet, thus making gameplay significantly slower and more prone to bugs.

In order to combat this, Alter Ego must load data from the spreadsheet into its internal memory, which can be triggered
by a moderator with the [load command](../developer_reference/commands/moderator_commands.md#load). By keeping an
internal copy of the game data, it is able to more efficiently access and modify that data, thus allowing for a much
faster and smoother gameplay experience. However, at any given time, Alter Ego has more data than actually appears on
the spreadsheet (typically to allow for faster access to data it needs - many of the internal attributes found on the
Data Structures pages on this Wiki serve this purpose), and more importantly, that data is out of sync with the data on
the spreadsheet.

During gameplay, this is typically not a problem. However, in the event of an error, or a crash, or a power outage, or
some other incident which causes Alter Ego to shut down during gameplay, its internal data will be lost. In order to
combat this, Alter Ego regularly updates the spreadsheet with the most recent copy of its internal data using
the [saver module](https://github.com/MolSnoo/Alter-Ego/blob/master/Modules/saver.js); the interval at which this occurs
can be set with the [autoSaveInterval setting](../developer_reference/settings/docker_settings.md#autosave_interval).
While this still guarantees that at least some data will be lost if Alter Ego goes offline, there will always be a
fairly recent backup to load from in order to minimize the amount of data loss.

However, because Alter Ego updates the entire spreadsheet at once (only
the [Prefab](../developer_reference/data_structures/prefab.md), [Recipe](../developer_reference/data_structures/recipe.md), [Status Effect](../developer_reference/data_structures/status.md),
and [Gesture](../developer_reference/data_structures/gesture.md) sheets remain unaffected by the saving process), this
can make it difficult for a moderator to edit the spreadsheet during gameplay, both because their changes will be
overwritten if they're not fast enough, and because attempting to edit the spreadsheet during gameplay can result in
outdated game data being stored during the next load. The solution to this problem is edit mode.

## Functionality

When edit mode is activated, Alter Ego will manually save the current game state to the spreadsheet. It is one of two
ways (the other being the [save command](../developer_reference/commands/moderator_commands.md#save)) of forcibly saving
the game. After the spreadsheet is updated, Alter Ego will pause its autosave functionality until edit mode is disabled.
This allows a moderator to manually edit the spreadsheet without worrying about their work being overwritten by the next
autosave.

In addition, [Players](../developer_reference/data_structures/player.md) are unable to use commands during edit mode.
They are still able to speak (and thus use the [say command](../developer_reference/commands/player_commands.md#say)),
since that almost never changes the game state, but the vast majority of their actions are restricted during edit mode.
All Players will be notified that edit mode has been enabled or disabled, unless they have the
`unconscious` [behavior attribute](../developer_reference/data_structures/status.md#behavior-attributes). As Players are
normally able to act autonomously, their restriction during edit mode drastically reduces the amount of changes that can
occur to the game state without the moderator's awareness.

To be clear, edit mode does **not** prevent Alter Ego's copy of the game data stored in its internal memory from
changing. Timers on [Events](../developer_reference/data_structures/event.md)
and [Status Effects](../developer_reference/data_structures/status.md) will continue to count down, for example, and any
consequences that result from those changes will still be present when edit mode is disabled. Edit mode simply
temporarily reduces the amount of unpredictable changes caused by Player actions.

Edit mode is not a perfect solution to this problem. Data asynchrony can still occur when edit mode is used, and the
amount of asynchrony within the game data will accumulate the more frequently edit mode is used in conjunction with the
load command (especially when only specific data structures are loaded, as is generally good practice). Edit mode is a
useful tool for modifying the spreadsheet during gameplay, but care must be taken in order to prevent bugs from
accumulating; it can sometimes lead to exceptionally strange behavior when not used responsibly. Some tips to keep the
game data consistent are:

* Use edit mode sparingly - only when needed.
* Only load the manually edited data structures before disabling edit mode in order to avoid reloading old game data.
* When applicable, load related data structures. For example, if manually
  editing [Items](../developer_reference/data_structures/item.md), load
  the [Objects](../developer_reference/data_structures/object.md)
  and [Puzzles](../developer_reference/data_structures/puzzle.md) which contain them.
* Avoid loading Players unless absolutely necessary.
* Every so often, load all game data to get everything back in sync.
* Every once in a while, reboot Alter Ego entirely in order to clear out its internal memory.