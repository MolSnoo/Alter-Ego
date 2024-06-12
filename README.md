# Alter Ego
![GitHub Release](https://img.shields.io/github/v/release/MolSnoo/Alter-Ego)

Alter Ego is an open-source Discord bot that facilitates an in-depth, multiplayer text adventure role-playing game called the Neo World Program. The gameplay style is heavily influenced by [MUD games](https://en.wikipedia.org/wiki/Multi-user_dungeon). Alter Ego simplifies the game development process by allowing any user to create an immersive game world entirely on Google Sheets with little to no programming knowledge.

For installation, setup, and documentation, check out the [the Wiki](https://github.com/MolSnoo/Alter-Ego/wiki).

## Gameplay

![Animated webp demonstrating the act of moving from room to room](https://file.garden/ZUa9hrTfUypbnjcL/alteregodemo-optimized.webp)

The basis of the Neo World Program is moving between rooms. Each room is represented by a Discord channel. When a player moves from one room to another, they will be removed from the room channel they are currently in and added to the channel corresponding to the desired room. Upon entering the new room, they will receive a written description of the room, noting any interesting objects and any other players they find there. In any given room, a player may speak to other players in the room, inspect objects, take and discard items, solve puzzles, whisper to other players, hide in objects to observe the room without being detected, and much more.

![Screenshot of a player named Vivian waking up in a hotel suite and inspecting the nightstand object](https://file.garden/ZUa9hrTfUypbnjcL/alteregodemo1.png)
![Screenshot of a player named Vivian inspecting a safe with a combination lock and opening it, finding two walkie talkies and a purple key](https://file.garden/ZUa9hrTfUypbnjcL/alteregodemo6.png)


Players must all have a separate Discord account, but moderators can add NPCs to the game without one, and have full control over them. Players can interact with each other and NPCs freely. Meanwhile, spectators can watch the game from any player's spectate channel, and see everything that player sees in real time.

![Screenshot of a room channel with players named Vivian, Kyra, and Amy. Vivian questions why Amy is wearing a hazmat suit, and Amy gives her a gas mask to put on](https://file.garden/ZUa9hrTfUypbnjcL/alteregodemo3.png)
![Screenshot of a room channel with players named Vivian, Kyra, and Amy. Vivian questions why Amy is wearing a hazmat suit, and Amy gives her a gas mask to put on, this time with all of the messages Alter Ego has sent Vivian included](https://file.garden/ZUa9hrTfUypbnjcL/alteregodemo4.png)

The possibilities are endless. To try it for yourself, [install Alter Ego using Docker](https://github.com/MolSnoo/Alter-Ego/wiki/Tutorial%3A-Installation-and-setup) and use the `.setupdemo` command to instantly create a small demo environment.
