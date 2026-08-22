<!--
SPDX-FileCopyrightText: 2019 Alter Ego Contributors

SPDX-License-Identifier: CC-BY-SA-4.0
-->

<h1 align="center">
    Alter Ego
</h1>

<p align="center">
    <a href="#getting-started">Getting Started</a> |
    <a href="https://msvblank.github.io/Alter-Ego/">Documentation</a> |
    <a href="https://msvblank.github.io/Alter-Ego/player_guide/how_to_use_this_guide.html">Player Guide</a> |
    <a href="#troubleshooting">Troubleshooting</a>
</p>

<div align="center">
    <a href="https://github.com/MsVBLANK/Alter-Ego/blob/master/LICENSE.md">
        <img alt="GitHub License" src="https://img.shields.io/github/license/MsVBLANK/Alter-Ego?style=flat-square"/>
    </a>
    <a href="https://github.com/MsVBLANK/Alter-Ego/releases">
        <img alt="GitHub Release" src="https://img.shields.io/github/v/release/MsVBLANK/Alter-Ego?style=flat-square&logo=github"/>
    </a>
    <a href="https://github.com/MsVBLANK/Alter-Ego/actions/workflows/test.yml">
        <img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/MsVBLANK/Alter-Ego/test.yml?branch=master&style=flat-square&logo=github&label=tests">
    </a>
    <a href="https://discord.gg/zdfnyu8A6w">
        <img alt="Discord Support Server" src="https://img.shields.io/badge/Support%20Server-5865F2?style=flat-square&logo=discord&logoColor=ffffff">
    </a>
    <br /><br />
</div>

![Animated webp demonstrating the act of moving from room to room. A player named Kyra finds herself stuck in the
`#dorm-3` channel, so she flips a SWITCH, and the DOOR unlocks. She types ".move door", and her access to the `#dorm-3`
channel is removed. Where it once was is a different channel, `#hall-0`. She clicks on it and finds a player named Ava,
who says "Oh...! Hi..." to which Kyra responds with "Hello there. Who are you?"](Docs/images/alteregodemo-optimized.webp)

## Table of Contents

- [About](#about)
- [Gameplay Features](#gameplay-features)
  - [Moving Around](#moving-around)
  - [Inspecting](#inspecting)
  - [Solving Puzzles](#solving-puzzles)
  - [Crafting and Cooking](#crafting-and-cooking)
  - [Dressing Up](#dressing-up)
  - [Killing](#killing)
- [Role Play Features](#role-play-features)
  - [Advanced Dialog System](#advanced-dialog-system)
  - [Private Whispers](#private-whispers)
  - [Spectate Channels](#spectate-channels)
  - [Internal Monologuing](#internal-monologuing)
- [Game Development](#game-development)
- [Getting Started](#getting-started)
- [Troubleshooting](#troubleshooting)
- [Requesting Features](#requesting-features)
- [Reporting Bugs and Contributing](#reporting-bugs-and-contributing)
- [License](#license)

## About

Alter Ego is a game engine that allows you to create your own immersive text adventure role-playing game that's played
entirely on Discord. With it, you can develop an entire game on Google Sheets with little to no programming knowledge.

![An example of a Google Sheet used by Alter Ego. Four Rooms are visible: Hall 5, Ceramics Studio,
Playroom, and Play Tunnels. Each Room is connected by named Exits, which have several columns to enter their
coordinates, how they're connected to each other, whether they're unlocked, a description when entering the Room they
belong to from each one, and more.](Docs/images/spreadsheet_example.png)

## Gameplay Features

### Moving Around

The basis of Alter Ego's gameplay is moving between rooms. Each room is represented by a Discord channel. When you
move from one room to another, you will be removed from the room channel you're currently in and added to the
desired room's channel. Upon entering, you'll receive a written description of the room, noting its layout and anything
you can interact with. You can perform actions by sending text commands, or by using interactive Discord components
like buttons and dropdowns.

![A message from Alter Ego split into several Discord components. On top, the name of the room is displayed: Rec Room.
Underneath is a description of the room:
"You enter from DOOR 1 into what seems to be a recreation room. The walls are painted green with a white baseboard.
In the center of the room is a PING PONG TABLE. Just in the corner to your right are a pair of COUCHES facing each other
with a COFFEE TABLE between them. Behind them on the wall to your right is a BOOKSHELF, with a POOL TABLE in the corner
behind it. Just in the corner to your left is a CHESS TABLE. There is a CLOCK on the wall to your left, with a JUKEBOX
underneath it. In the far left corner is an AIR HOCKEY TABLE. On the opposite side of the room is DOOR 2, which has a
DARTBOARD mounted on the wall to the left of it. On the ceiling in the middle of the room is a CAMERA and mounted on the
wall above the door you just came from is a MONITOR."
Underneath is a list of occupants in the room. It says "You see Jenny here."
Beneath that is a section about the floor. It says "The floor in this room is covered in a carpet with large squares of
varying shades of red in a tile pattern. You find a DART BOX placed haphazardly on it."
At the bottom of the message are two blue buttons: "Move DOOR 1" and "Move DOOR 2", followed by two red buttons:
"Run DOOR 1" and "Run DOOR 2". Beneath those is a dropdown menu labeled "Inspect".
](Docs/images/readme_room_description_example.png)

### Inspecting

You can inspect your surroundings to learn more about the environment, and discover things you can interact with.

![A message from Kyra that says ".inspect dartboard". Alter Ego responds to it with
"You inspect the DARTBOARD." and then
"It's an electronic dartboard hung on the wall. It consists of a circle with 20 numbered stokes, with two rings and a
bullseye. There's seemingly no pattern to the point values assigned to each stoke, but they're numbered from 1 - 20. If
you land a dart in the outer ring, you earn double the points of whatever stoke that section of the outer ring belongs
to, and the inner ring results in triple the points. A bullseye will net you 50 points.
Beneath the board itself is a small COMPARTMENT.
(Note: To enter the desired point values, make sure you have a dart in your inventory before each shot, and send
`.use first dart #`, then `.use second dart #`, then `.use third dart #`. Note that some point values may not be
possible.)"
In the following dropdown, "COMPARTMENT" is selected.
After that, Alter Ego says
"It's a small compartment below the dartboard. Written on it is "Prime x Prime x Prime = 266". There doesn't seem to be
any way to open it.
Maybe it will open if you hit three prime numbers on the dartboard that multiply together to make 266. If that's the
case, then you know a prime number is a number whose only products are 1 and itself. You don't even have to try any of
the double or triple point values, or 50 for that matter."
](Docs/images/readme_inspect_example.png)

### Solving Puzzles

Alter Ego has a robust system of puzzles, with a wide variety of puzzle types that can be programmed to react in
different ways depending on the outcome.

![Kyra: ".use third dart 13"
Alter Ego: "You cannot throw the third dart without a DART in your hand."
Kyra: ".take dart"
Alter Ego: "You take a DART from a DART BOX."
Kyra: ".use third dart 13"
Alter Ego: "You discard a DART."
Alter Ego: "You toss the DART onto the DARTBOARD, netting you 13 points.
All of the DARTS fall off of the DARTBOARD and onto the FLOOR."](Docs/images/readme_puzzle_example_1.png)
![Kyra: ".take dart"
Alter Ego: "You take a DART from the FLOOR."
Kyra: ".use third dart 19"
Alter Ego: "You discard a DART."
Alter Ego: "You toss the DART onto the DARTBOARD, netting you 19 points.
All of the DARTS fall off of the DARTBOARD and onto the FLOOR."
Alter Ego: "The COMPARTMENT underneath the DARTBOARD opens. Inside, you find a MINUTE HAND."](Docs/images/readme_puzzle_example_2.png)

### Crafting and Cooking

Recipes are a core feature of Alter Ego. You can craft items together and put them in fixtures around the room to
process them into different items over time.

![Alter Ego: "You inspect the CUTTING BOARD. This is a plain, stainless steel board used for food preparation.
On it, you find a LARGE KNIFE and a serving of RAW ONION RINGS."
Buttons: "Take LARGE KNIFE", "Take RAW ONION RINGS", "Drop CHICKPEA FLOUR"
Alter Ego: "You take a serving of RAW ONION RINGS from the CUTTING BOARD."
Buttons: "Craft CHICKPEA FLOUR and RAW ONION RINGS"
Alter Ego: "You coat the RAW ONION RINGS with some CHICKPEA FLOUR."
Kyra: ".x oiled pan on burner 1"
Alter Ego: "You inspect an OILED PAN on the BURNER 1. This is a pan that's been greased up with cooking oil.
In it, you see a pinch of SALT."
Buttons: "Take Salt", "Drop ONION RINGS"
Alter Ego: "You put a serving of uncooked ONION RINGS in an OILED PAN."
Kyra: ".use burner 1"
Alter Ego: "You turn on the BURNER 1. You start to fry the ONION RINGS."](Docs/images/readme_recipes_example_1.png)
![Alter Ego: "The hot ONION RINGS are ready!"
Dropdown: "BURNER 1" selected.
Alter Ego: "You inspect the BURNER 1. It's a high-powered electric stovetop burner. It's currently powered on.
On it, you find a DIRTY PAN."
Dropdown: "DIRTY PAN" selected.
Buttons: "Take DIRTY PAN"
Alter Ego: "You inspect a DIRTY PAN on the BURNER 1. This is a standard frying pan. It's dirty from its last use.
In it, you see a hot serving of ONION RINGS."
Dropdown: "ONION RINGS" selected.
Buttons: "Take ONION RINGS"
Alter Ego: "You inspect a hot serving of ONION RINGS in a DIRTY PAN. This is a hot serving of tasty onion rings."
Alter Ego: "You take a hot serving of ONION RINGS from a DIRTY PAN."
Dropdown: "Use"
Kyra: "take plate"
Alter Ego: "You take a PLATE from the CABINETS."
Buttons: "Craft PLATE and ONION RINGS"
Dropdown: "Use"
Alter Ego: "You put the ONION RINGS on a PLATE. You now have a plate of ONION RINGS."
Dropdowns: "Inspect", "Use"](Docs/images/readme_recipes_example_2.png)

### Dressing Up

Players have full inventories with lots of slots to put on clothes. The clothes you wear affect your character's
description, allowing you to express yourself. Clothes can even have pockets that allow you to store items inside of
them, which are hidden from other players.

![Kyra: ".inventory"
Alter Ego responds with "Your inventory:" followed by a list of equipment slots: RIGHT HAND, LEFT HAND, HAT, GLASSES,
FACE, NECK (BLACK TIE is equipped), ACCESSORY, CHEST (BLACK BRA is equipped), SHIRT (WHITE DRESS SHIRT is equipped),
JACKET, BAG, GLOVES, PANTS (BLACK TROUSERS are equipped with pockets RIGHT POCKET containing LOCKER KEY 3, LEFT POCKET,
RIGHT BACK POCKET containing SCALPEL, LEFT BACK POCKET), UNDERWEAR (BLACK BRIEFS are equipped), SOCKS (WHITE SOCKS are
equipped), SHOES (BLACK DRESS SHOES are equipped)
Buttons: "Unstash LOCKER KEY 3", "Unstash SCALPEL"
Dropdowns: "Inspect", "Unequip"
Kyra: ".inspect mirror"
Alter Ego: "You inspect the MIRROR. It's a mirror hung on the wall. You can see your reflection in it:
You examine Kyra. She's somewhat short with a pale skin tone and a thin build. She has red eyes and long, brown hair
tied back in an extremely long, low ponytail, with bangs swept to the right and two thick, wavy fringes on the sides
that reach down to her chest. Her expression is relatively neutral, making it hard to read what's on her mind.
She wears a BLACK TIE, a WHITE DRESS SHIRT, a pair of BLACK TROUSERS, and a pair of BLACK DRESS SHOES."
](Docs/images/readme_inventory_example_1.png)

Some items even have special behavior when worn. For example, wearing a mask can conceal your identity, allowing you to
move between rooms without being added to the room channel. It can even alter your character's display name and
description while you're wearing it.

![Alter Ego: "You inspect the BOTTOM DRAWER. You look inside the bottom drawer. In it, you find an ONNA MASK."
Dropdown with "ONNA MASK" selected.
Buttons: "Take ONNA MASK"
Alter Ego: "You inspect an ONNA MASK in the BOTTOM DRAWER. It's a pale mask of a smiling woman. It has blackened upper
teeth slightly exposed between the smiling red lips, full cheeks, rectangular pupil openings, high-set eyebrows, and
black hair with a white band at the center part."
Alter Ego: "You take an ONNA MASK from the BOTTOM DRAWER."
Buttons: "Equip ONNA MASK"
Alter Ego: "You put on an ONNA MASK."
Alter Ego: "Your face has been concealed. You will no longer be added to channels as you move between rooms, and others
will see you but not recognize you. You are also able to use the `.say` command to speak in the room, and your identity
will be concealed if you choose to do so."
Kyra: ".inspect mirror"
Alter Ego: "You inspect the MIRROR. It's a mirror hung on the wall. You can see your reflection in it:
You examine an individual wearing an ONNA MASK. They are somewhat short, but their face is concealed.
They wear an ONNA MASK, a BLACK TIE, a WHITE DRESS SHIRT, a pair of BLACK TROUSERS, and a pair of BLACK DRESS SHOES."](Docs/images/readme_inventory_example_2.png)

### Killing

Alter Ego allows you to kill other players. Usually that involves getting a moderator involved, but items can inflict
status effects that kill players after a set period of time, too. If you play your cards right, you might just get away
with it without leaving too much evidence behind.

![Ava: "I, um, have a syringe of morphine, if you're in any pain..."
Kyra: "Ngh... now that you mention it... yes, I am. Please."
Ava (narration): "Ava nods, and takes the syringe out from her BLACK HOODIE."
Kyra (narration): "She watches as Ava brings the syringe closer to her, and gulps."
Alter Ego: "Ava takes Kyra's hand, rolling the palm to face upwards. She takes a moment to wipe and disinfect a spot
below her wrist, and sticks the syringe needle haphazardly in the direction of a vein."
Kyra (narration): "Almost immediately, Kyra's eyes shoot open, and her muscles begin seizing up."
Kyra: "Hk-! What... is this!?"
Ava (narration): "Ava's eyes lower and dart to the side."
Ava: "Sorry, Kyra... I really didn't want to do this... But..."
Kyra: "Hn... hhhh... A...va... why.....?"
Ava (narration): "Ava tears up and sniffles."
Alter Ego: "Kyra dies."
](Docs/images/readme_death_example.png)

## Role Play Features

The gameplay mechanics of Alter Ego give rise to spontaneous character interactions. Every moment of your role play
occurs in a specific setting, with a specific context. This often leads to the development of unexpected relationships
between characters that occur organically, as they are built gradually over time. The linear progression of the core
gameplay loop means your character naturally develops over time as new events unfold.

Of course, Alter Ego also offers a variety of tools to enhance your moment-to-moment
role playing experience even further.

### Advanced Dialog System

Alter Ego has an extensive dialog system with many interconnected mechanics. You can shout to be heard in other rooms,
speak across great distances with wireless transceivers, mimic the voices of other characters, and more. There's even a
fully functional audio and video surveillance system.

![The channel for `#hall-3`.
Alter Ego: "Kyra begins inspecting the PANEL."
Alter Ego: "Kyra knocks on DOOR 4."
Kyra (shouting): "Hello? Is someone in there?"
Alter Ego: "Someone in a nearby room with a captivating voice shouts "Nope! Not a chance!""
Kyra (narration): "Kyra furrows her brow."
Kyra (shouting): "Why lie if you're going to respond anyway?"
Alter Ego: "Someone in a nearby room with a captivating voice shouts "Oops! Silly me!""
Alter Ego: "Someone in a nearby room with a captivating voice shouts
"Go away now! I'm not opening up this door, and that's that!""
Kyra (narration): "Kyra huffs, and looks at the camera. Whoever is in there must be watching her.
She'll just have to find another way in."](Docs/images/readme_dialog_example_1.png)
![The channel for `#surveillance`.
Alter Ego: "`[Hall 3] Kyra begins inspecting the PANEL.`"
Alter Ego: "`[Hall 3] Kyra knocks on DOOR 4.`"
[Hall 3] Kyra (webhook, shouting): "Hello? Is someone in there?"
Aisha (shouting): "Nope! Not a chance!"
[Hall 3] Kyra (narration): "Kyra furrows her brow."
[Hall 3] Kyra (webhook, shouting): "Why lie if you're going to respond anyway?"
Aisha (shouting): "Oops! Silly me!"
Aisha (shouting): "Go away now! I'm not opening up this door, and that's that!"
[Hall 3] Kyra (narration): "Kyra huffs, and looks at the camera. Whoever is in there must be watching her.
She'll just have to find another way in."
](Docs/images/readme_dialog_example_2.png)

### Private Whispers

You can speak privately to other players in the room by whispering. When you whisper, a temporary channel will be
created just for you and the people you select. You can speak in this channel without worrying about anyone hearing you.

![A channel under the Whispers category, named `#hall-0-ava-kyra`.
Kyra: "There's something you should know."
Kyra: "As I suspected, we are indeed being watched."
Kyra: "Someone is in the surveillance room, and refuses to open the door."
Kyra: "Strangely, whoever it was denied being inside. I have to wonder why they responded at all."
Kyra: "Whoever it is, they must be... rather eccentric."
Kyra: "Regardless, proceed with caution."](Docs/images/readme_whisper_example.png)

### Spectate Channels

While you play, everything you see and do is logged to your character's spectate channel in real time. This allows
spectators to watch the game from any player's perspective, and when the game is over, you can read over everything
that happened in chronological order.

![Florian's spectate channel. The permission to send messages to it is disabled, so only Alter Ego can do so.
Amadeus (Alter Ego): "You inspect the COUNTER. It's a granite countertop, which is rather clean. There are three SINKS
embedded in it. On the counter you find 6 TOOTHBRUSHES, 8 safety RAZORS, 4 cans of SHAVING CREAM, and 4 tubes of
TOOTHPASTE. Beneath it is a CABINET."
Amadeus: "You take a TOOTHBRUSH from the COUNTER."
Amadeus: "You take a tube of TOOTHPASTE from the COUNTER."
Amadeus: "You put some toothpaste on your TOOTHBRUSH."
Amadeus: "You brush with a TOOTHBRUSH with toothpaste."
Amadeus: "Your breath is now minty fresh!"
Florian (narration): "Florian Ngo WINS THE GENIUS [sic] BOOK OF WORLD RECORD for SHOWERING and BRUSHING HIS TEETH in
ALTER EGO for the FASTEST EVER AMOUNT OF TIME! He beat the ANY%! Everyone give Ngo a huge round of applause!"](Docs/images/readme_spectate_channel_example.png)

### Internal Monologuing

You can privately monologue your character's inner thoughts, and nobody except for you and spectators will know.

![Fable's spectate channel.
Amadeus (Alter Ego): "Ai enters from the CHUTE."
Ava: "Mhm...?"
Ava: "I- Hello...?"
Ai (narration): "Ai curtsies."
Ai: "Greetings."
Fable: "Oh-! Hi!"
Fable: "Um...How are you?"
Ai: "{Answer}: I am having a wonderful day."
Ai: "How are you doing today?"
Fable (monolog): "I am doing _so bad._"
Fable: "I'm, um, okay!...Could be better."
Ava (narration): "Ava puts her hand to her chin and thinks."
Ava: "What makes a day wonderful for someone like you?"
](Docs/images/readme_monolog_example.png)

## Game Development

Alter Ego has a wide array of tools to develop exciting and unique game environments. All games are developed on a
spreadsheet, and users require little to no programming knowledge to do so. Each data structure has its own tab on the
sheet. On the spreadsheet, you can:

- Give **Players** unique descriptions, custom pronouns, stats that have in-game effects, and full inventories.
- Add **NPCs** who are just like Players, but don't need a Discord account, and can only be controlled by a moderator.
- Create **Rooms** for Players to move between, with **Exits** determining how they connect to each other.
- Add **Fixtures** to Rooms that Players can inspect and interact with, and set some of them as **Hiding Spots** so
  Players can hide in them without being seen.
- Devise **Puzzles** for Players to try and solve, with multiple possible outcomes that can all trigger different
  behavior.
- Add **Status Effects** that Players can be inflicted with for a set period of time, which can give them special
  behavior and temporarily alter their stats.
- Define **Prefabs** that can be instantiated as **Room Items** and **Inventory Items**, and can be equipped by a Player
  and/or used to inflict or cure Status Effects.
- Create **Recipes** that can turn a list of ingredient Prefabs into any number of products, either instantaneously by
  crafting them together, or after a set amount of time by processing them in a Fixture.
- Set up **Events** that can automatically trigger at set days and times, and automatically inflict Players with a list
  of Status Effects in all affected Rooms.
- Add **Gestures** that allow Players to communicate non-verbally with ease.
- Set **Flags** with values that can be referenced by other data structures, and write scripts that automatically
  compute their value when read.

Alter Ego comes bundled with a small but fully-featured demo environment. It demonstrates how to use all of these data
structures effectively, and is free for users to study and experiment with. On top of that,
[the documentation](https://msvblank.github.io/Alter-Ego/) is detailed and thorough, with many examples and tutorials.

For additional resources to make developing games with Alter Ego easier, try out
[Alter Ego Tools](https://github.com/flufflesamy/alter-ego-tools).

## Getting Started

Alter Ego is strictly self-hosted, so you will have to install it and host it yourself.

The [installation and setup guide](https://msvblank.github.io/Alter-Ego/moderator_guide/installation.html)
walks you through every step of the process.

Once you have Alter Ego up and running, you can issue the `.setupdemo` command to instantly set up a demo game
environment for you and a small group of players to get a feel for its gameplay.

## Troubleshooting

If you're having trouble with Alter Ego, check out [the Docs](https://msvblank.github.io/Alter-Ego/) to see if there's
a solution in the article related to what you're trying to do.

If you don't find an answer in the Docs, check the relevant category of the
[Discussions board](https://github.com/MsVBLANK/Alter-Ego/discussions) to see if anyone else has had the same issue as
you; there may already be a solution posted.

If you don't find the issue you're facing in the Discussions board, feel free to open a new Discussion. Or, join the
official [Alter Ego Support](https://discord.gg/zdfnyu8A6w) Discord server.

## Requesting Features

Do you have an idea or a request for a new feature?
[Check to see if there's already an Issue for it.](https://github.com/MsVBLANK/Alter-Ego/issues?q=state%3Aopen%20AND%20(label%3A%22Planned%20Feature%3A%20major%22%20OR%20label%3A%22Planned%20Feature%3A%20minor%22%20OR%20label%3A%22Planned%20Feature%3A%20qol%22%20OR%20label%3A%22Category%3A%20feature%20request%22))
If there isn't, feel free to create a new Issue to propose it.

## Reporting Bugs and Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) to learn about reporting bugs and contributing to this project.

## License

Alter Ego

Copyright (C) <2019> Alter Ego Contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
