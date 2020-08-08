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
    if (player !== null && message.channel.id === settings.announcementChannel) {
        for (let i = 0; i < game.players_alive.length; i++)
            if (!game.players_alive[i].hasAttribute("unconscious")) game.messageHandler.addSpectatedPlayerMessage(game.players_alive[i], player.displayName, message);
        return;
    }
    if (room === null) return;

    if (player !== null) {
        player.setOnline();

        if (player.hasAttribute("no speech")) {
            game.messageHandler.addGameMechanicMessage(player.member, "You are mute, so you cannot speak.");
            if (deletable) message.delete().catch();
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

            if (!message.content.startsWith('(')) {
                for (let i = 0; i < whisper.players.length; i++)
                    game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], player.displayName, message, whisper);
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
            // If the message includes at least two letters and all letters in the message are uppercase, then the player is shouting.
            if (RegExp("[a-zA-Z](?=(.*)[a-zA-Z])", 'g').test(message.content) && message.content === message.content.toUpperCase()) {
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
                            game.messageHandler.addNarration(nextdoor, `Someone in a nearby room shouts "${message.content}".`, true, player);
                        for (let j = 0; j < nextdoor.occupants.length; j++) {
                            let occupant = nextdoor.occupants[j];
                            if (occupant.hasAttribute("no hearing") || occupant.hasAttribute("unconscious")) continue;
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
                game.messageHandler.addNarration(room, `${player.displayName} ${verb}s "${message.content}".`, true, player);

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

                    if (occupant.hasAttribute(`knows ${player.name}`) && !occupant.hasAttribute("no sight")) {
                        if (player.displayName !== player.name) occupant.notify(game, `${player.displayName}, whose voice you recognize to be ${player.name}'s, ${verb}s "${message.content}".`);
                        else if (occupant.hasAttribute("hear room")) occupant.notify(game, `${player.name} ${verb}s "${message.content}".`);
                        else game.messageHandler.addSpectatedPlayerMessage(occupant, player.displayName, message);
                    }
                    else if (occupant.hasAttribute("hear room") || deafPlayerInRoom) {
                        if (occupant.hasAttribute(`knows ${player.name}`))
                            occupant.notify(game, `${player.name} ${verb}s "${message.content}".`);
                        else if (!occupant.hasAttribute("no sight"))
                            occupant.notify(game, `${player.displayName} ${verb}s "${message.content}".`);
                        else
                            occupant.notify(game, `You hear a voice in the room ${verb} "${message.content}".`);
                    }
                    else if (!player.hasAttribute("concealed"))
                        game.messageHandler.addSpectatedPlayerMessage(occupant, player.displayName, message);
                }
                else if (occupant.id === player.id && !message.content.startsWith('(')) {
                    if (player.displayName !== player.name)
                        game.messageHandler.addSpectatedPlayerMessage(occupant, `${player.displayName} (${player.name})`, message);
                    else
                        game.messageHandler.addSpectatedPlayerMessage(occupant, `${player.displayName}`, message);
                }
            }

            // Handle walkie talkie behavior.
            if (player.hasAttribute("sender") && !message.content.startsWith('(')) {
                let receiver = null;
                for (let i = 0; i < game.players_alive.length; i++) {
                    if (game.players_alive[i].hasAttribute("receiver") && game.players_alive[i].id !== player.id) {
                        receiver = game.players_alive[i];
                        break;
                    }
                }
                if (receiver !== null) {
                    var deafPlayerInReceiverRoom = false;
                    // Check if there are any deaf players in the room. Count non-deaf players.
                    for (let i = 0; i < receiver.location.occupants.length; i++) {
                        // If a player in the room has the no hearing attribute, delete the message and redirect it to anyone who can hear.
                        if (receiver.location.occupants[i].hasAttribute("no hearing")) {
                            deafPlayerInReceiverRoom = true;
                            break;
                        }
                    }
                    if (receiver.location.occupants.length === 1 && receiver.location.occupants[0].hasAttribute("unconscious"))
                        deafPlayerInReceiverRoom = true;

                    if (!deafPlayerInReceiverRoom)
                        game.messageHandler.addNarration(receiver.location, `A voice coming from ${receiver.displayName}'s WALKIE TALKIE ${verb}s "${message.content}".`, true, player);

                    for (let j = 0; j < receiver.location.occupants.length; j++) {
                        let occupant = receiver.location.occupants[j];
                        if (occupant.hasAttribute("no hearing") || occupant.hasAttribute("unconscious")) continue;
                        const receiverName = occupant.id === receiver.id ? "your" : `${receiver.displayName}'s`;
                        if (occupant.hasAttribute(`knows ${player.name}`))
                            occupant.notify(game, `${player.name} ${verb}s "${message.content}" through ${receiverName} WALKIE TALKIE.`);
                        else if (occupant.hasAttribute("hear room") || deafPlayerInReceiverRoom)
                            occupant.notify(game, `A voice coming from ${receiverName} WALKIE TALKIE ${verb}s "${message.content}".`);
                    }

                    for (let i = 0; i < game.puzzles.length; i++) {
                        if (game.puzzles[i].location.name === receiver.location.name && game.puzzles[i].type === "voice") {
                            const cleanContent = message.content.replace(/[^a-zA-Z0-9 ]+/g, "").toLowerCase().trim();
                            for (let j = 0; j < game.puzzles[i].solutions.length; j++) {
                                if (cleanContent.includes(game.puzzles[i].solutions[j]))
                                    game.puzzles[i].solve(bot, game, null, "", game.puzzles[i].solutions[j], true);
                            }
                        }
                    }
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
            else if (!occupant.hasAttribute("no sight") && !occupant.hasAttribute("unconscious") && !message.content.startsWith('('))
                game.messageHandler.addSpectatedPlayerMessage(occupant, message.member.displayName, message);
        }
    }

    return;
};
