const settings = include('settings.json');

module.exports.execute = async (bot, game, message, deletable) => {
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
            game.messageHandler.addGameMechanicMessage(player.member, "You are mute, so you cannot speak.");
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

            for (let i = 0; i < whisper.players.length; i++) {
                game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], message, whisper);
            }

            for (let i = 0; i < room.occupants.length; i++) {
                // Players with the acute hearing attribute should overhear other whispers.
                if (room.occupants[i].hasAttribute("acute hearing") && !whisper.players.includes(room.occupants[i]) && !message.content.startsWith('('))
                    room.occupants[i].notify(game, `You overhear ${player.displayName} whisper "${message.content}".`);
            }
        }
        else {
            var isShouting = false;
            var verb = "say";
            // If the message includes at least one letter and all letters in the message are uppercase, then the player is shouting.
            if (RegExp("[a-zA-Z]", 'g').test(message.content) && message.content === message.content.toUpperCase()) {
                isShouting = true;
                verb = "shout";
            }
            var deafPlayerInRoom = false;
            // Check if there are any deaf players in the room. Count non-deaf players.
            for (let i = 0; i < room.occupants.length; i++) {
                // If a player in the room has the no hearing attribute, delete the message and redirect it to anyone who can hear.
                if (room.occupants[i].hasAttribute("no hearing")) {
                    deafPlayerInRoom = true;
                    break;
                }
            }
            if (room.occupants.length === 1 && room.occupants[0].hasAttribute("unconscious"))
                deafPlayerInRoom = true;
            // Handle messages in adjacent rooms.
            if (!room.tags.includes("soundproof") && !message.content.startsWith('(')) {
                for (let i = 0; i < room.exit.length; i++) {
                    let nextdoor = room.exit[i].dest;
                    if (!nextdoor.tags.includes("soundproof") && nextdoor.occupants.length > 0 && nextdoor.name !== room.name) {
                        let deafPlayerInNextdoor = false;
                        // Check if there are any deaf players in the next room.
                        for (let j = 0; j < nextdoor.occupants.length; j++) {
                            if (nextdoor.occupants[j].hasAttribute("no hearing"))
                                deafPlayerInNextdoor = true;
                        }
                        if (nextdoor.occupants.length === 1 && nextdoor.occupants[0].hasAttribute("unconscious"))
                            deafPlayerInNextdoor = true;

                        if (isShouting && !deafPlayerInNextdoor)
                            game.messageHandler.addNarration(nextdoor, `Someone in a nearby room shouts "${message.content}".`);
                        for (let j = 0; j < nextdoor.occupants.length; j++) {
                            let occupant = nextdoor.occupants[j];
                            if (occupant.hasAttribute("no hearing") || occupant.hasAttribute("unconscious")) continue;
                            //if (isShouting && (deafPlayerInNextdoor || occupant.hasAttribute("hear room"))) {
                            if (isShouting) {
                                if (occupant.hasAttribute(`knows ${player.name}`))
                                    occupant.notify(game, `You hear ${player.name} ${verb} "${message.content}" in a nearby room.`);
                                else if (deafPlayerInNextdoor || occupant.hasAttribute("hear room"))
                                    occupant.notify(game, `You hear a voice from a nearby room ${verb} "${message.content}".`);
                            }
                            // Players with the acute hearing attribute should hear messages from adjacent rooms.
                            else if (occupant.hasAttribute("acute hearing") && occupant.hasAttribute(`knows ${player.name}`))
                                occupant.notify(game, `You hear ${player.name} ${verb} "${message.content}" in a nearby room.`);
                            else if (!isShouting && occupant.hasAttribute("acute hearing"))
                                occupant.notify(game, `You hear a voice from a nearby room say "${message.content}".`);
                        }
                    }
                }
            }

            if (deafPlayerInRoom && deletable)
                message.delete().catch();
            else if (!deletable)
                game.messageHandler.addNarration(room, `${player.displayName} ${verb}s "${message.content}".`);

            for (let i = 0; i < game.puzzles.length; i++) {
                if (game.puzzles[i].location.name === room.name && game.puzzles[i].type === "voice") {
                    const cleanContent = message.content.replace(/[^a-zA-Z0-9 ]+/g, "").toLowerCase().trim();
                    for (let j = 0; j < game.puzzles[i].solutions.length; j++) {
                        if (cleanContent.includes(game.puzzles[i].solutions[j]))
                            game.puzzles[i].solve(bot, game, player, "", game.puzzles[i].solutions[j], true);
                    }
                }
            }

            for (let i = 0; i < room.occupants.length; i++) {
                let occupant = room.occupants[i];
                if (occupant.id !== player.id && !message.content.startsWith('(')) {
                    if (occupant.hasAttribute("no hearing") || occupant.hasAttribute("unconscious")) continue;
                    else game.messageHandler.addSpectatedPlayerMessage(occupant, message);

                    if (occupant.hasAttribute(`knows ${player.name}`) && !occupant.hasAttribute("no sight")) {
                        if (player.displayName !== player.name) occupant.notify(game, `${player.displayName}, whose voice you recognize to be ${player.name}'s, ${verb}s "${message.content}".`);
                        else if (occupant.hasAttribute("hear room")) occupant.notify(game, `${player.name} ${verb}s "${message.content}".`);
                    }
                    else if (occupant.hasAttribute("hear room") || deafPlayerInRoom) {
                        if (occupant.hasAttribute(`knows ${player.name}`))
                            occupant.notify(game, `${player.name} ${verb}s "${message.content}".`);
                        else if (!occupant.hasAttribute("no sight"))
                            occupant.notify(game, `${player.displayName} ${verb}s "${message.content}".`);
                        else
                            occupant.notify(game, `You hear a voice in the room ${verb} "${message.content}".`);
                    }
                }
                else if (occupant.id === player.id && !message.content.startsWith('(')) {
                    game.messageHandler.addSpectatedPlayerMessage(occupant, message);
                }
            }
        }
    }
    else if (isModerator) {
        for (let i = 0; i < room.occupants.length; i++) {
            let occupant = room.occupants[i];
            // Players with the see room attribute should receive narrations from moderators.
            if (occupant.hasAttribute("see room") && !occupant.hasAttribute("no sight") && !message.content.startsWith('('))
                occupant.notify(game, message.content);
        }
    }

    return;
};
