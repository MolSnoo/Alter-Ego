# Moderating

Moderating a Neo World Program game is a difficult endeavor. Although Alter Ego was designed to make that process
easier, it presents its own challenges. In this tutorial, the process will be explained.

## Table of Contents

<!-- toc -->

## Purpose

The purpose of a moderator in the Neo World Program is to facilitate gameplay. While Alter Ego does most of the heavy
lifting, there are many things it cannot do. A moderator must draw the Map, program the game world on the spreadsheet,
create and manage the server, host Alter Ego, respond to player inquiries, narrate player actions, handle combat, fix
bugs, and much more.

A good moderator must remain calm even during the most tense situations. However, these responsibilities can and do take
a toll on a moderator, and it is all too easy to become overwhelmed. For this reason, it is **strongly** recommended to
have multiple moderators running a game so that the responsibilities are not all carried out by one person.

## Motivation

Before you can become a moderator, you should think about whether it's right for you. Moderating a Neo World Program
game is not easy, and it takes a specific kind of person to excel at it. Consider why you want to do so before setting
anything in stone. Do you have a story you want to tell that would be best told in a Neo World Program game? Do you have
experience in game design or an interest in learning about it? Do you easily grasp basic programming concepts? Do you
find repetitive tasks enjoyable? Do you have enough free time to dedicate months of your life to programming, writing,
and testing a game world? Will you have enough free time and energy to moderate game sessions for several hours every
day? Will you be able to financially support yourself and tend to your physical needs during that time? If you can
answer yes to all of these questions, then you're a perfect fit to moderate a Neo World Program game. If you answer no
to any of them, consider whether the Neo World Program is right for you. If you simply want to host a Danganronpa-style
killing game role play, there are much simpler alternatives that you could use instead.

## First steps

Once you've decided that you want to be a Neo World Program moderator, your first step should be to install and set up
Alter Ego. To do that, see the following articles:

* [Installation and Setup](installation.md)
* [Settings](../reference/settings/docker_settings.md)

Once you're able to use Alter Ego, you must learn how it works. Alter Ego is a complex tool with many intricate
behaviors that you need to familiarize yourself with. The best way to get started is to read all of the articles on this
wiki - most importantly, the Data Structure entries and the [writing descriptions tutorial](writing_descriptions.md).
After that, you can begin putting your knowledge into practice.

Familiarize yourself with all of the commands available to you as a moderator by utilizing
the [help command](../reference/commands/moderator_commands.md#help) to read the details of each one. Memorize
the syntax of each command and all of the ways it can be used. Create a small test game consisting of a few Rooms. Get a
good understanding of how Alter Ego interprets data entered on the spreadsheet and what will make it return errors when
you load data. Make use of the [testparser command](../reference/commands/moderator_commands.md#testparser) to
catch errors in your writing. Test your game using a separate [Player](../reference/data_structures/player.md)
account and observe what bugs Alter Ego is unable to detect. Implement fixes for them and test again. Develop a habit of
loading, parsing, testing, and fixing your game until it's second nature to you.

## Planning a game

Once you're intimately familiar with Alter Ego's workings, you can begin planning a real game. Consider what kind of
story you want to tell. The best kinds of stories told through the Neo World Program have many moving pieces that are
gradually revealed throughout the course of the game. This style of storytelling lends itself well to the nature of the
Neo World Program, where players are only aware of things they've personally seen. It allows each player to attempt to
piece together the clues in order to shine light on the overarching mysteries. The specifics of what story you want to
tell are up to you, but you should at least have a general plan before formally announcing your game.

Due to how much work it takes to develop a Neo World Program game, it is strongly recommended that you select your
players several months in advance. Having a cast of characters set in stone long before the game is held makes it
significantly easier to tailor the game world to them.

Also during the planning phase, you should decide on a setting. A good setting effortlessly aids the story you want to
tell. When you've decided on a setting, you can begin making a map to display how the various rooms connect to one
another. However, you should keep in mind the scope of the game and how you're going to make the map manageable. A map
with hundreds of rooms is a gargantuan task to implement, so you should start small. Remember: what makes a map engaging
to the players isn't how many rooms it has, but how interesting those rooms are to explore. See
the [mapmaking tutorial]() for more information.

## Writing a game

By far the longest and most difficult part of a moderator's job is writing the game. Writing takes place entirely on the
spreadsheet. In this stage of development, your goal must be to write all of
the [Rooms](../reference/data_structures/room.md) on the map and fill them
with [Objects](../reference/data_structures/object.md), [Items](../reference/data_structures/item.md)
and [Puzzles](../reference/data_structures/puzzle.md) for Players to interact with. You'll need to
write [Prefabs](../reference/data_structures/prefab.md) to provide functionality to Items,
add [Recipes](../reference/data_structures/recipe.md) for Players to carry out, and
create [Events](../reference/data_structures/event.md) to enhance the game world.
Creating [Status Effects](../reference/data_structures/status.md) can make Players feel more immersed in the
game, and writing [Gestures](../reference/data_structures/gesture.md) makes it easier for them to roleplay
simple actions. You'll need to personalize each [Player](../reference/data_structures/player.md)'s data to
suit their character and give them [Inventory Items](../reference/data_structures/inventory_item.md) to start
out with. When all of these features work together in harmony, it can create an experience that makes it easy for the
players on the other side of the screen to feel like they really *are* a part of the world.

Nevertheless, this is a very time-consuming process. It takes months of continuous work to create a functioning game.
Remember that when the game occurs, it takes place in real-time; you will not have time to fix numerous bugs without
severely disrupting gameplay. This is why you must get into the habit of loading, parsing, testing, and fixing your game
during the writing process. This is game development - using Alter Ego is no different than using a game engine like RPG
Maker. This means you have to test your game extensively. **Just because Alter Ego loads everything without giving you
error messages does not mean everything works as intended, or at all.** It is *your* responsibility to ensure that your
game functions properly before you start running it. The more bugs you catch and fix before the game begins, the fewer
you'll have to deal with during the game proper, and the less stressful the experience will be.

In order to write a fun game, your goal should be to make each Room serve a purpose. When writing a Room, ask yourself
what it contributes to the game overall. Is it somewhere that Players would want to go? Are there things to do in that
Room when they first arrive? What about upon subsequent visits? Does this Room suit the setting? Does it provide
valuable insights into the world's lore? Will this Room be used to further the story? If your game is a killing game
role play, can this Room be used to create an interesting murder? Is there already a Room that serve the same purpose
that this one would? Remember, the ultimate purpose of a Room is to provide Players a setting in which to role play. If
it doesn't serve that purpose, why have that Room at all? If there's nothing interesting to do there, then nobody will
go there, and you'll have wasted your time creating that Room.

The Danganronpa formula mandates that after each murder case, a new area of the game world is made accessible to the
Players. You don't have to follow this procedure, but it does keep the game engaging if the Players always have a new
area to explore. You can plan for this by using Events corresponding with each chapter that, when triggered,
automatically unlock the next section of the map. Then, when writing Room descriptions, you can
use [if conditionals](writing_descriptions.md#if) to systematically change the descriptions to indicate the new state of
the game world based on what chapter Event is currently ongoing. If you write your game with this procedure in mind, it
allows you to pace the storytelling such that the Players are always gaining new insights into the lore exactly when you
want them to. This procedure also allows you to make certain areas of the map more memorable. If each section of the map
has its own unique theme, that allows you to tailor each Room to suit that theme, as well as write the lore contained in
that section to revolve around it. These things can all make your story more compelling and more memorable.

Making all of the Players NPCs during the writing process can be helpful. This way, you can write up and test all of
their data in advance without loading them into the game world before the game begins, and without them even being in
the server.

This section of this tutorial is a work in progress. There is always more to consider when writing your game. Writing is
a learned skill in general, as it is for the Neo World Program.

## Preparing a game

When most or all of your game has been written, it comes time to prepare for the game to begin. This can be a stressful
period in the development cycle.

The first step you should take in the preparation phase is to make your server presentable before inviting the players.
If you have any moderator-controlled Player characters that you'd like to keep hidden, you should give their account
the [Hidden role](../appendix/manual_installation/channel_and_role_creation.md#hidden) and making sure there are no publicly accessible channels where they appear on
the user list. Make sure to delete any messages in publicly accessible channels that spoil the game. If any of your Room
channels have message history enabled for Players (such as the trial grounds, in the case of a killing game role play),
make sure to delete any messages that have been sent in that channel. Create any supplementary channels that the players
might need, such as RP rules, an Alter Ego writing guide, a guide to the basics of the RP universe, rules for the
killing game, a list of killing game participants, maps, and so on. If you're creating any new channel categories that
are intended to be publicly accessible, remember to activate the read message history permission for everyone, and deny
access to members with the Hidden role.

Once you've prepared the server, you can invite all of the players to join. When they do, you'll need to change their
nicknames to match the names of their Player characters and give each of them the Player role. Make sure to remind each
Player to check their privacy settings for the server to make sure that Direct Messages from server members are allowed,
otherwise Alter Ego will be unable to send them messages. Your players will likely be excited that the game is about to
begin - let yourself be excited with them.

If, during the writing process, you made all of the Players NPCs, you'll need to make them regular Players now by
changing their [talent](../reference/data_structures/player.md#talent) and assigning their Discord ID. **Be
warned that once you do this, loading the game after this point will give them access to the channel associated with
their location.** If you want to continue testing, give them all a Status Effect on the spreadsheet with the following
[behavior attributes](../reference/data_structures/status.md#behavior-attributes):
`disable all, no speech, no channel, hidden, unconscious`. This will prevent them from gaining access to any Room
channels and from getting most messages related to the game, but be aware that they will still receive Status
Effect [inflicted](../reference/data_structures/status.md#inflicted-description)
and [cured](../reference/data_structures/status.md#cured-description) Effect messages unless their other
Status Effects are manually removed from the sheet. For this reason, it's recommended that if you're not currently
testing something, you should keep Alter Ego running *without* having any game data loaded until it's time to begin.
Once you finish testing, you can simply reboot Alter Ego to unload everything.

During this step, you should consult with all of the players and decide when the game sessions will be held. For a
killing game role play, the Neo World Program works best in daily 8-hour sessions, with break days between chapters.
This is a huge time commitment, and coordinating the schedules of 16 or more people is a difficult task. Try to find the
time that consistently works for the most people possible. Of course, choosing the date that the role play begins on is
hard, too - arguably even more so than selecting a time for the sessions to begin. The first day of the session is one
of the most important - it's one of the few times you want every player to participate. Just do the best you can to find
a day that works for everyone.

When preparing a game, you should procure a Virtual Private Server (VPS) on which to host Alter Ego. **Running it
continuously on a (Windows) personal computer is SEVERELY not recommended.** Doing so will likely result in Alter Ego
being slow and unresponsive when dealing with more than a few Players, and it may even crash. Running it on a VPS will
drastically increase performance. If you have no experience operating a VPS, it can be challenging to learn, but it is
worth it. You will not find a VPS for free, and you should be suspicious of any that purport to be free. However, there
are affordable options, especially considering how little operating power Alter Ego requires, with options ranging
from $4 a month. Some good VPS providers
include [Hetzner](https://www.hetzner.com/cloud), [DigitalOcean](https://www.digitalocean.com/pricing),
and [Linode](https://www.linode.com/pricing/). Once you have a VPS, you'll need to repeat steps 1-2 of
the [installation and setup tutorial](installation.md) on it, but then you can copy your credentials and settings files
over to it and get Alter Ego up and running with ease.

You can write a custom spawn message for all of the Players to receive when the game begins for the first time. This can
be an effective way of immediately immersing the Players into the game world. To accomplish this, all you need to do is
make an Event which is ongoing at the start of the game. For the sake of example, this Event will be called PROLOGUE.
Once it exists, you can modify the description of the first [Exit](../reference/data_structures/exit.md) in each Room that the Players
spawn into to contain an if conditional tag that checks whether the PROLOGUE Event is ongoing or not. This message can
be customized to suit each individual Player. You can then end the PROLOGUE Event immediately after everyone spawns in
so that they don't receive the spawn message again when they inspect or enter the Room through the first Exit. An
example of a description that uses this tactic looks something like this:

`<desc><if cond="findEvent('PROLOGUE').ongoing === true"><s>You wake up feeling disoriented. It doesn't take long for your eyes to adjust to the bright light of the room, and you find yourself in bed in what appears to be a small dorm of sorts. The last thing you remember is arriving at the hotel in Miami, Florida on the morning of August 12th, 2045. People were buzzing about the solar eclipse that was supposed to happen today around 12:30 PM, but you were there for another reason: the **Ultimate Conference**. Several months ago, an official from the UN approached you and informed you that you had been selected as the <var v="player.talent" />, and you were invited to speak at the Ultimate Conference, where you and many other talented individuals would be able to promote your talents and ideas on the world stage. The conference was supposed to start on the 14th, but as soon as you entered your hotel suite, the room filled up with gas, and you went unconscious.<br /><br />You look around. You're currently lying in a BED, which is pushed into the corner of the room. A NIGHTSTAND is just to your right. In the corner past it is a small CLOSET with a DRESSER beside it. A MONITOR is mounted on the wall to your right. Looking up at the ceiling, you notice a CAMERA between the dull fluorescent lights. On the wall to your left, past the foot of the bed, is a wall-mounted MIRROR. There is a DOOR on the wall across from you, with an electronic SWITCH just above the door handle. Beside it is a TRASH CAN. You suddenly notice the strange BRACELET on your left wrist.</s></if><if cond="findEvent('PROLOGUE').ongoing === false"><s>You enter dorm 1. In the back right corner is a BED, which has a NIGHTSTAND just to the left of it. A MIRROR is mounted on the wall to the right, past the foot of the bed. In the back left corner is a small CLOSET. Beside it, against the left wall, is a DRESSER. A MONITOR is mounted on the left wall as well. Looking up at the ceiling, you notice a CAMERA between the dull fluorescent lights. The DOOR behind you is fitted with an electronic SWITCH just above the door handle. There is a TRASH CAN just beside the door.</s></if></desc>`

Once all of your preparations have been made and you have Alter Ego up and running, it's officially time to start the
game. Note that if you have all of the Player data written on the spreadsheet already, you don't have to use
the [startgame command](../reference/commands/moderator_commands.md#startgame) at all, and doing so will
result in your Player data being overwritten. To begin, all you need to do is send `.load all start`.

## Running a game

If the entire game world has been written and thoroughly tested in advance, then the process of running the game can be
surprisingly easy. In this situation, Alter Ego handles everything like a well-oiled machine. For the most part, you can
take this time to sit back and watch the Players interact with one another as they move through the game world. The
first day will be busy, however. In a killing game role play, this is when you'll have to have an NPC explain the
situation and the rules of the game, usually with all Players present in the same Room.

Running the game can be stressful. For that reason, you should make sure that you have people to support you during this
time - ideally, people who aren't players in the game. You may get frustrated, but don't take your anger out on the
players. Don't forget to eat, drink water, and use the bathroom throughout the session, and try to get enough sleep at
night. The game should not take priority over your physical needs, and giving it that priority will only make you more
stressed.

### Dealing with bugs

When the game is finally underway, this is when your game world will truly be tested. Players will act in ways that you
may not have anticipated, which could reveal bugs that you didn't catch during development. This is why the more testing
you did beforehand, the better - the more bugs you caught in advance, the fewer you'll have to fix during the game
itself. When they do pop up, you can usually just turn on [edit mode](edit_mode.md) and fix them within a few minutes.

The most common category of bugs is ghost Items. These are Items that exist in Object, Item, or Puzzle descriptions
which can't be interacted with in any way because they don't actually exist. It could be that they never existed on the
Items sheet, they turned into something else via a Recipe, or they were taken or destroyed and now have a quantity of 0.
These are created under several different circumstances, one of which is the use of edit mode combined with the load
command. This is troublesome, as there's no way to fix ghost Items other than to use edit mode and the load command. For
this reason, ghost Items should usually be dealt with during off-times, such as after the game session when Players
aren't currently interacting with the game world. They, along with the item tags surrounding them, can simply be removed
from the descriptions in which they appear. Issuing the command `.testparser remove` can help you identify ghost Items
so that you can remove them from descriptions, although this method won't necessarily catch all of them.

There will be some bugs whose cause you can't quickly identify. If they're not that severe, you can simply let them be
until the game session is over and you have time to study them without Players getting in the way. Sometimes, all you
need to do is reboot Alter Ego and send `.load all resume`. If this resolves the issue, the bug can usually be
attributed to Alter Ego's internal data structures getting out of sync with each other. If the bug is severe enough, it
can lead to a stressful situation. Having a moderator-controlled Player in reserve can come in handy in these scenarios,
as it can allow you to experiment with the bug until you determine the cause so that you can fix it.

### Managing time

You should try to limit the number of NPCs that you have to control as a moderator. It takes a lot of energy to write
multiple characters at once, and Players tend to want to interact with them. Don't be afraid to let other people write
NPCs, such as other moderators, dead Players, or spectators. Just be sure to communicate adequately with them so that
they know what the character is like, what their purpose is, and what they are and aren't allowed to tell Players.

It's likely you'll have planned events to carry out during each chapter. For example, you might have an important NPC
speak with the Players about a significant plot detail, or you may be planning a deadly combat encounter, or there might
be an in-depth Puzzle that requires moderator assistance to solve. In order to prevent Players from blazing through all
of the chapter's content on the first day, you can implement bottlenecks to prevent them from making progress too
quickly. For example, you might lock the Exits to important areas, or you could implement a Puzzle that the Players
can't solve until an Event makes the clues visible close to the end of the game session, or you could make an NPC refuse
to let the Players take on a combat encounter until they're adequately prepared. Measures like these can make these
planned events less stressful to conduct.

### Conducting a murder case

A high source of stress comes when you have to orchestrate a murder case. Sometimes, you'll find that nobody wants to
commit a murder. This is troublesome, as the game can't progress if no one is willing to kill a fellow Player. To
prevent this, you should provide motives that you know will be highly tempting for at least a few characters. You can
even plan murders with certain players before the game even begins to circumvent this potential problem altogether.

Once a player has come to you with the intent to kill, you should help them select a victim, if they haven't chosen one
already. If you know of any players with time conflicts that may prevent them from participating, their characters can
make for ideal murder victims, and you can suggest them to the culprit. You can ask those players if they're willing to
let their character die, but you're not obligated to get permission.

If the prospective culprit wants to target a Player whose writer doesn't want them to die, this can create an
opportunity for combat if the chosen victim intends to fight back. During combat, you should give all involved Players
the `heated` Status Effect, which will slow down movement speed for all other Players. Then, you should take turns
gathering input from all involved Players about what they intend to do during their next combat move. You can use
the [roll command](../reference/commands/moderator_commands.md#roll) to roll
a [Die](../reference/data_structures/die.md) to determine the success of each action and narrate the results.
In this scenario, the chosen victim can actually come out on top and kill the prospective killer, which can create an
interesting murder case.

During a murder, you should take care to prevent the culprit from getting caught in the act of killing the victim. If
the Room it occurs in is unlocked, keep an eye on the surrounding area to make sure that no Players are wandering
around. Also be sure that the killer has an escape route that they can use without getting caught carrying a weapon or
covered in blood. This can be difficult, as there are a lot of Players to keep track of and you'll already be busy
narrating the murder. This is where it can come in handy to have other moderators who can keep an eye on things and
distract nearby Players.

You won't have time to write in-depth clues for an investigation without turning on edit mode for an unusually long
time - this can tip players off out-of-character that something is going on, which can influence how they behave
in-character. If you need to, you can always just write the victim's body into the Room description so that Players can
discover it and save writing clues for after the session is over. There's nothing wrong with holding the investigation
and trial the next day. When you *do* write clues, try to find ways to incorporate the
Players' [intelligence stat](../reference/data_structures/player.md#intelligence) into the descriptions using
if conditionals. For example, Players with a high intelligence stat may notice details about the body that other Players
don't. This can make players who created characters with high intelligence stats feel like the investment was worth it.

Once a murder has occurred, you'll have to do a lot of writing. Aside from clues, you'll have to write a case summary
and execution, and these can be time-consuming processes. If you want to provide a variation of the Monokuma File from
Danganronpa, you can
use [this GIMP template](https://cdn.discordapp.com/attachments/709093783278583891/715285885754671244/Monokuma_File_-_Template.xcf).
However, once everything has been written, you can largely sit back and relax during the investigation and trial. You
should give Players ample time to investigate all the clues, although generally only a few hours are needed. You should
warn them not to discuss the case while they investigate, as that can easily sour the trial by making the discussion
seem redundant.

There may come a point during the trial when the Players are stuck. If this is the case, you can help them. It can be
anxiety-inducing for the Players to vote for the wrong culprit, after all. Whether you want to handle that outcome and
how you choose to do so is up to you. You might give the culprit a special victory scene before rewinding to earlier in
the trial to give the other Players another chance, or you might execute the person they voted for and let the real
culprit go free, among other possibilities. When the trial is finally over, however, you can generally take the rest of
the day easy.

After the trial, you should take a few break days before resuming the game. You and your players need time to rest and
recharge.

### Ending the game

As you approach the end of the game, the cast will inevitably feel more tight-knit than it started out with. They've
worked together to overcome countless obstacles, and now it's time for them to put an end to it all. Near the end of the
game, the Players should have a lot of information about the story - perhaps nearly enough to identify the mastermind of
the game, with only a few pieces missing. The last few days should give them an opportunity to obtain the missing pieces
they need.

Pacing the last few days can be difficult. You want to ensure that the Players feel like they're making progress without
overwhelming them with too much information at once or too many dramatic reveals. Once they have all the tools they
need, though, have confidence in them.

The final day is what all of your work has been building up to. Make sure that they'll be able to do everything you have
planned for them within the game session. The Players should confront the mastermind in one final encounter. Since this
is the finale, there's no need to hold back any secrets - the Players have worked hard to uncover the truth throughout
the game, and they deserve to hear everything. The Players absolutely **must** have agency in the finale. If all of the
important choices are being made by NPCs, then it can be underwhelming for the players who have invested all of their
time and energy into the game. They should have a say in how the game ends. You should account for the different choices
they may want to make and give them set options to choose from so that you're not blindsided by their decisions.

The final moments of the game will be filled with emotion as the players reflect on everything they've been through and
resolve to face the future they chose. Let yourself be emotional with them. Be proud of them for making it this far, and
be proud of yourself for everything you've accomplished, too. Running a game of the Neo World Program is a difficult
endeavor, but if you've made it to this point, then you've succeeded. It feels immensely rewarding to reach the ending,
to say that you finished a game. Enjoy it. And when everyone is ready, end the game by issuing the command, `.endgame`.