# Commands

Commands are messages sent to Alter Ego in order to interface with the Neo World Program. In general, they allow a
Discord user to influence the game world in some way.

Commands are loaded from the commands directory when Alter Ego is booted up. Each command is a JavaScript file with a
`.js` extension. This file contains all of the command's logic which Alter Ego uses to interpret the content of the
message which sent the command and carry out the desired behavior.

All commands are passed through
the [commandHandler module](https://github.com/MolSnoo/Alter-Ego/blob/master/Modules/commandHandler.js) before being
executed. The purpose ouf this module is to determine who is sending the command, and if they have permission to do so.
All commands are restricted to a single permission level based on the sender's Discord roles in the game server.