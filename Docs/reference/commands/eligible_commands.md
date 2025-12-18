# Eligible commands

Eligible commands are usable by users with
the [Eligible role](../../appendix/manual_installation/channel_and_role_creation.md#eligible) (or
the [Tester role](../../appendix/manual_installation/channel_and_role_creation.md#tester) if Alter Ego is
in [debug mode]()). These commands have extremely limited use, only usable by Players before they've been given the
Player role.

Eligible commands can only be used when a game is in progress. They can only be sent in
the [general channel](../../appendix/manual_installation/channel_and_role_creation.md#channel-general) (or
the [testing channel](../../appendix/manual_installation/channel_and_role_creation.md#channel-testing) if debug mode is
on). If Alter Ego accepts the user's command, the message in which the command was issued will be deleted.

Below is a list of all eligible commands, as well as information about each one.

## help

Lists all commands available to you.

#### Aliases

`.help`

#### Examples

    .help
    .help play

#### Description

Lists all commands available to the user. If a command is specified, displays the help menu for that command.

## play

Joins a game.

#### Aliases

`.play`

#### Examples

    .play

#### Description

Adds you to the list of players for the current game.
