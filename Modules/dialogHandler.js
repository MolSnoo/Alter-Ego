const settings = include('settings.json');

module.exports.execute = async (game, message, deletable) => {
    // Determine if the speaker is a moderator first.
    var isModerator = false;
    if (message.member.roles.find(role => role.id === settings.moderatorRole))
        isModerator = true;

    // Determine if the speaker is a player.
    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].id === message.author.id) {
            player = game.players_alive[i];
            break;
        }
    }

    // Get the location of the message.
    var room = null;
    if (player !== null) room = player.location;
    else {
        for (let i = 0; i < game.rooms.length; i++) {
            if (game.rooms[i].name === message.channel.name) {
                room = game.rooms[i];
                break;
            }
        }
    }
    if (room === null) return;

    if (player !== null) {
        player.setOnline();

        if (player.hasAttribute("no speech")) {
            player.member.send("You are mute, so you cannot speak.");
            if(deletable) message.delete().catch();
            return;
        }
        // Handle whisper messages.
        if (message.channel.parentID === settings.whisperCategory) {
            // Find whisper.
            let whisper = null;
            for (let i = 0; i < game.whispers.length; i++) {
                if (game.whispers[i].channel.id === message.channel.id) {
                    whisper = game.whispers[i];
                    break;
                }
            }
            // If whisper does not exist but player still has access to the channel, remove them.
            if (whisper === null) {
                message.channel.overwritePermissions(player.id, {
                    VIEW_CHANNEL: null,
                    READ_MESSAGE_HISTORY: null
                });
                if (deletable) message.delete().catch();
                return;
            }
            for (let i = 0; i < room.occupants.length; i++) {
                // Players with the acute hearing attribute should overhear other whispers.
                if (room.occupants[i].hasAttribute("acute hearing") && !whisper.players.includes(room.occupants[i]) && !message.content.startsWith('('))
                    room.occupants[i].member.send(`You overhear ${player.displayName} whisper "${message.content}".`);
            }
        }
        else {
            var deafPlayerInRoom = false;
            // Handle room messages in the same room as the player.
            for (let i = 0; i < room.occupants.length; i++) {
                let occupant = room.occupants[i];
                // If a player in the room has the no hearing attribute, delete the message and redirect it to anyone who can hear.
                if (occupant.hasAttribute("no hearing")) {
                    deafPlayerInRoom = true;
                }
                // Players with the hear room attribute should hear all messages sent to the room.
                else if (occupant.hasAttribute("hear room") && occupant.id !== player.id && !message.content.startsWith('('))
                    occupant.member.send(`You hear a voice in the room say "${message.content}".`);
            }
            // Handle messages in adjacent rooms.
            for (let i = 0; i < room.exit.length; i++) {
                let nextdoor = room.exit[i].dest;
                for (let j = 0; j < nextdoor.occupants.length; j++) {
                    let occupant = nextdoor.occupants[j];
                    // Players with the acute hearing attribute should hear messages from adjacent rooms.
                    if (occupant.hasAttribute("acute hearing") && !message.content.startsWith('('))
                        occupant.member.send(`You hear a voice from a nearby room say "${message.content}".`);
                }
            }

            if (deafPlayerInRoom) {
                var hearingPlayersCount = 0;
                for (let i = 0; i < room.occupants.length; i++) {
                    let occupant = room.occupants[i];
                    if (!occupant.hasAttribute("no hearing") && !occupant.hasAttribute("hear room") && occupant.id !== player.id && !message.content.startsWith('(')) {
                        hearingPlayersCount += 1;
                        occupant.member.send(`${player.displayName} says "${message.content}".`);
                    }
                }
                if (hearingPlayersCount === 0) player.member.send("You try to speak, but no one can hear you.");
                if (deletable) message.delete().catch();
            }
            else if (!deletable)
                room.channel.send(`${player.displayName} says "${message.content}".`);
        }
    }
    else if (isModerator) {
        for (let i = 0; i < room.occupants.length; i++) {
            let occupant = room.occupants[i];
            // Players with the see room attribute should receive narrations from moderators.
            if (occupant.hasAttribute("see room") && !occupant.hasAttribute("no sight") && !message.content.startsWith('(')) {
                occupant.member.send(message.content);
            }
        }
    }

    return;
};
