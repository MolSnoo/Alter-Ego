const serverconfig = include('Configs/serverconfig.json');

module.exports.execute = async (bot, game, message, deletable, player = null, originalDisplayName = "") => {
    return new Promise(async (resolve) => {
        // Determine if the speaker is a moderator first.
        var isModerator = false;
        if (message.member && message.member.roles.cache.find(role => role.id === serverconfig.moderatorRole))
            isModerator = true;

        // Determine if the speaker is a player.
        if (player === null) {
            for (let i = 0; i < game.players_alive.length; i++) {
                if (game.players_alive[i].id === message.author.id) {
                    player = game.players_alive[i];
                    break;
                }
            }
        }

        // Get the location of the message.
        var room = null;
        var whisper = null;
        if (player !== null) room = player.location;
        else {
            for (let i = 0; i < game.rooms.length; i++) {
                if (game.rooms[i].name === message.channel.name) {
                    room = game.rooms[i];
                    break;
                }
            }
            for (let i = 0; i < game.whispers.length; i++) {
                if (game.whispers[i].channelName === message.channel.name) {
                    whisper = game.whispers[i];
                    break;
                }
            }
        }
        if (player !== null && message.channel.id === serverconfig.announcementChannel) {
            for (let i = 0; i < game.players_alive.length; i++)
                game.messageHandler.addSpectatedPlayerMessage(game.players_alive[i], player, message);
            resolve();
        }
        if (room === null) resolve();

        if (player !== null && message.channel.id !== serverconfig.announcementChannel) {
            if (player.talent !== "NPC") player.setOnline();

            // Preserve the player data as it is now in order to display it in spectate channels. Only preserve what's needed for that purpose.
            const speaker = { displayName: player.displayName, displayIcon: player.displayIcon, member: player.member };

            if (player.hasAttribute("no speech") || ["716134432234274906", "772627705329745942", "805513660948545546", "621560673196834816", "585830504327151616", "693308651640717332", "701721767022035046", "600938008908136449", "223898787981164544", "481623932835856385", "309807598071185410", "132591626366353410", "660304615283359744", "772632468201144320", "747273189947867137", "253716652636504065", "479128980700790813", "749401864881307810", "749813541317640215", "711990013566386337", "750752005143789598", "258480539063812096", "818916356442292305", "122172345505939457", "711985273512132751", "621562058005151775", "701964065534115990", "805511135162794076", "754888916225491036"].includes(player.id)) {
                if (player.talent !== "NPC") game.messageHandler.addGameMechanicMessage(player.member, "You are mute, so you cannot speak.");
                if (deletable) message.delete().catch();
                resolve();
            }
            // Handle whisper messages.
            if (message.channel.parentId === serverconfig.whisperCategory) {
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
                    message.channel.permissionOverwrites.create(player.id, {
                        ViewChannel: null,
                        ReadMessageHistory: null
                    });
                    if (deletable) message.delete().catch();
                    resolve();
                }

                if (!message.content.startsWith('(')) {
                    for (let i = 0; i < whisper.players.length; i++) {
                        if (whisper.players[i].name !== player.name) {
                            if (whisper.players[i].hasAttribute("no hearing") || whisper.players[i].hasAttribute("unconscious")) continue;

                            if (whisper.players[i].hasAttribute(`knows ${player.name}`) && !whisper.players[i].hasAttribute("no sight")) {
                                if (player.displayName !== player.name) {
                                    whisper.players[i].notify(game, `${player.displayName}, whose voice you recognize to be ${player.name}'s, whispers "${message.content}".`, false);
                                    game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper, `${player.displayName} (${player.name})`);
                                }
                                else if (whisper.players[i].talent !== "NPC" && !whisper.players[i].member.permissionsIn(message.channel).has("ViewChannel")) {
                                    whisper.players[i].notify(game, `${player.name} whispers "${message.content}".`, false);
                                    game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper, player.name);
                                }
                                else game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper);
                            }
                            else if (whisper.players[i].talent !== "NPC" && !whisper.players[i].member.permissionsIn(message.channel).has("ViewChannel")) {
                                if (whisper.players[i].hasAttribute(`knows ${player.name}`)) {
                                    whisper.players[i].notify(game, `${player.name} whispers "${message.content}".`, false);
                                    game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper, player.name);
                                }
                                else if (!whisper.players[i].hasAttribute("no sight")) {
                                    whisper.players[i].notify(game, `${player.displayName} whispers "${message.content}".`, false);
                                    game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper);
                                }
                                else
                                    whisper.players[i].notify(game, `Someone whispers "${message.content}".`);
                            }
                            else
                                game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper);
                        }
                        else if (whisper.players[i].name === player.name) {
                            if (player.displayName !== player.name)
                                game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper, `${player.displayName} (${player.name})`);
                            else
                                game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper);
                        }
                    }
                }

                for (let i = 0; i < room.occupants.length; i++) {
                    // Players with the acute hearing attribute should overhear other whispers.
                    if (room.occupants[i].hasAttribute("acute hearing") && !whisper.players.includes(room.occupants[i]) && !message.content.startsWith('(')) {
                        if ((player.displayName !== player.name || player.hasAttribute("hidden") || room.occupants[i].hasAttribute("no sight")) && room.occupants[i].hasAttribute(`knows ${player.name}`))
                            room.occupants[i].notify(game, `You overhear ${player.name} whisper "${message.content}".`);
                        else if (player.hasAttribute("hidden") || room.occupants[i].hasAttribute("no sight"))
                            room.occupants[i].notify(game, `You overhear someone in the room whisper "${message.content}".`);
                        else
                            room.occupants[i].notify(game, `You overhear ${player.displayName} whisper "${message.content}".`);
                    }
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
                    let destinations = [];
                    for (let i = 0; i < room.exit.length; i++) {
                        let nextdoor = room.exit[i].dest;
                        // Prevent duplication when two rooms are connected by multiple exits.
                        if (destinations.includes(nextdoor.name)) continue;
                        destinations.push(nextdoor.name);
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
                            if (isShouting && nextdoor.tags.includes("audio surveilled")) {
                                for (let j = 0; j < game.rooms.length; j++) {
                                    if (game.rooms[j].tags.includes("audio monitoring") && game.rooms[j].occupants.length > 0) {
                                        let monitoringRoom = game.rooms[j];
                                        let deafPlayerInMonitoringRoom = false;
                                        // Check if there are any deaf players in the monitoring room.
                                        for (let k = 0; k < monitoringRoom.occupants.length; k++) {
                                            if (monitoringRoom.occupants[k].hasAttribute("no hearing"))
                                                deafPlayerInMonitoringRoom = true;
                                        }
                                        if (monitoringRoom.occupants.length === 1 && monitoringRoom.occupants[0].hasAttribute("unconscious"))
                                            deafPlayerInMonitoringRoom = true;

                                        if (!deafPlayerInMonitoringRoom)
                                            game.messageHandler.addNarration(monitoringRoom, `\`[${nextdoor.name}]\` Someone in a nearby room shouts "${message.content}".`, true, player);
                                        for (let k = 0; k < monitoringRoom.occupants.length; k++) {
                                            let occupant = monitoringRoom.occupants[k];
                                            if (occupant.hasAttribute("no hearing") || occupant.hasAttribute("unconscious")) continue;
                                            if (occupant.hasAttribute(`knows ${player.name}`))
                                                occupant.notify(game, `\`[${nextdoor.name}]\` ${player.name} shouts "${message.content}" in a nearby room.`);
                                            else if (deafPlayerInMonitoringRoom || occupant.hasAttribute("hear room"))
                                                occupant.notify(game, `\`[${nextdoor.name}]\` You hear a voice from a nearby room shout "${message.content}".`);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                if (deafPlayerInRoom && deletable)
                    message.delete().catch();

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
                    if (occupant.name !== player.name && !message.content.startsWith('(')) {
                        if (occupant.hasAttribute("no hearing") || occupant.hasAttribute("unconscious")) continue;

                        if (occupant.hasAttribute(`knows ${player.name}`) && !occupant.hasAttribute("no sight")) {
                            if (player.displayName !== player.name) {
                                occupant.notify(game, `${player.displayName}, whose voice you recognize to be ${player.name}'s, ${verb}s "${message.content}".`, false);
                                game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `${player.displayName} (${player.name})`);
                            }
                            else if (occupant.hasAttribute("hear room")) {
                                occupant.notify(game, `${player.name} ${verb}s "${message.content}".`, false);
                                game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message);
                            }
                            else game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message);
                        }
                        else if (occupant.hasAttribute("hear room") || deafPlayerInRoom) {
                            if (occupant.hasAttribute(`knows ${player.name}`)) {
                                occupant.notify(game, `${player.name} ${verb}s "${message.content}".`, false);
                                game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, player.name);
                            }
                            else if (!occupant.hasAttribute("no sight") && player.hasAttribute("hidden") && occupant.hasAttribute("hidden") && player.hidingSpot === occupant.hidingSpot) {
                                occupant.notify(game, `${originalDisplayName} ${verb}s "${message.content}".`, false);
                                game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `${player.displayName} (${originalDisplayName})`);
                            }
                            else if (!occupant.hasAttribute("no sight")) {
                                occupant.notify(game, `${player.displayName} ${verb}s "${message.content}".`, false);
                                game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message);
                            }
                            else
                                occupant.notify(game, `You hear a voice in the room ${verb} "${message.content}".`);
                        }
                        else if (!player.hasAttribute("concealed") || player.hasAttribute("concealed") && deletable)
                            game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message);
                    }
                    else if (occupant.name === player.name && !message.content.startsWith('(')) {
                        if (player.displayName !== player.name)
                            game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `${player.displayName} (${player.name})`);
                        else
                            game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message);
                    }
                }

                // Handle surveillance behavior.
                if (room.tags.includes("audio surveilled") && !message.content.startsWith('(')) {
                    for (let i = 0; i < game.rooms.length; i++) {
                        if (game.rooms[i].tags.includes("audio monitoring") && game.rooms[i].occupants.length > 0) {
                            let monitoringRoom = game.rooms[i];
                            let deafPlayerInMonitoringRoom = false;
                            for (let j = 0; j < monitoringRoom.occupants.length; j++) {
                                if (monitoringRoom.occupants[j].hasAttribute("no hearing"))
                                    deafPlayerInMonitoringRoom = true;   
                            }
                            if (monitoringRoom.occupants.length === 1 && monitoringRoom.occupants[0].hasAttribute("unconscious"))
                                deafPlayerInMonitoringRoom = true;

                            if (room.tags.includes("video surveilled") && monitoringRoom.tags.includes("video monitoring") && !deafPlayerInMonitoringRoom) {
                                // Create a webhook for this channel if necessary, or grab the existing one.
                                let webHooks = await monitoringRoom.channel.fetchWebhooks();
                                let webHook = webHooks.find(webhook => webhook.owner.id === bot.user.id);
                                if (webHook === null || webHook === undefined)
                                    webHook = await monitoringRoom.channel.createWebhook({ name: monitoringRoom.channel.name });

                                let files = [];
                                [...message.attachments.values()].forEach(attachment => files.push(attachment.url));

                                webHook.send({
                                    content: message.content,
                                    username: `[${room.name}] ${player.displayName}`,
                                    avatarURL: player.displayIcon ? player.displayIcon : player.member.displayAvatarURL() || message.author.defaultAvatarURL,
                                    embeds: message.embeds,
                                    files: files
                                });
                            }
                            else if (!deafPlayerInMonitoringRoom) {
                                game.messageHandler.addNarration(monitoringRoom, `\`[${room.name}]\` Someone ${verb}s "${message.content}".`, true, player);
                            }
                            for (let j = 0; j < monitoringRoom.occupants.length; j++) {
                                let occupant = monitoringRoom.occupants[j];
                                if (occupant.hasAttribute("no hearing") || occupant.hasAttribute("unconscious")) continue;

                                if (occupant.hasAttribute(`knows ${player.name}`) && room.tags.includes("video surveilled") && monitoringRoom.tags.includes("video monitoring") && !occupant.hasAttribute("no sight")) {
                                    if (player.displayName !== player.name) {
                                        occupant.notify(game, `\`[${room.name}]\` ${player.displayName}, whose voice you recognize to be ${player.name}'s, ${verb}s "${message.content}".`, false);
                                        game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${room.name}] ${player.displayName} (${player.name})`);
                                    }
                                    else if (occupant.hasAttribute("hear room")) {
                                        occupant.notify(game, `\`[${room.name}]\` ${player.name} ${verb}s "${message.content}".`, false);
                                        game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${room.name}] ${player.displayName}`);
                                    }
                                    else game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${room.name}] ${player.displayName}`);
                                }
                                else if (room.tags.includes("video surveilled") && monitoringRoom.tags.includes("video monitoring") && !occupant.hasAttribute("no sight")) {
                                    if (occupant.hasAttribute("hear room")) {
                                        occupant.notify(game, `\`[${room.name}]\` ${player.name} ${verb}s "${message.content}".`, false);
                                        game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${room.name}] ${player.displayName}`);
                                    }
                                    else game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${room.name}] ${player.displayName}`);
                                }
                                else if (occupant.hasAttribute(`knows ${player.name}`) && (!room.tags.includes("video surveilled") || !monitoringRoom.tags.includes("video monitoring"))) {
                                    occupant.notify(game, `\`[${room.name}]\` ${player.name} ${verb}s "${message.content}".`, false);
                                    game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${room.name}] ${player.name}`);
                                }
                                else if (occupant.hasAttribute("hear room") || deafPlayerInMonitoringRoom) {
                                    if (occupant.hasAttribute(`knows ${player.name}`)) {
                                        occupant.notify(game, `\`[${room.name}]\` ${player.name} ${verb}s "${message.content}".`, false);
                                        game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${room.name}] ${player.name}`);
                                    }
                                    else if (room.tags.includes("video surveilled") && monitoringRoom.tags.includes("video monitoring") && !occupant.hasAttribute("no sight")) {
                                        occupant.notify(game, `\`[${room.name}]\` ${player.displayName} ${verb}s "${message.content}".`, false);
                                        game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${room.name}] ${player.displayName}`);
                                    }
                                    else
                                        occupant.notify(game, `\`[${room.name}]\` Someone ${verb}s "${message.content}".`);
                                }
                            }

                            for (let j = 0; j < game.puzzles.length; j++) {
                                if (game.puzzles[j].location.name === monitoringRoom.name && game.puzzles[j].type === "voice") {
                                    const cleanContent = message.content.replace(/[^a-zA-Z0-9 ]+/g, "").toLowerCase().trim();
                                    for (let k = 0; k < game.puzzles[j].solutions.length; k++) {
                                        if (cleanContent.includes(game.puzzles[j].solutions[k]))
                                            game.puzzles[j].solve(bot, game, null, "", game.puzzles[j].solutions[k], true);
                                    }
                                }
                            }
                        }
                    }
                }

                // Handle walkie talkie behavior.
                if (player.hasAttribute("sender") && !message.content.startsWith('(')) {
                    let receiver = null;
                    for (let i = 0; i < game.players_alive.length; i++) {
                        if (game.players_alive[i].hasAttribute("receiver") && game.players_alive[i].name !== player.name) {
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
                            const receiverName = occupant.name === receiver.name ? "your" : `${receiver.displayName}'s`;
                            if (occupant.hasAttribute(`knows ${player.name}`))
                                occupant.notify(game, `${player.name} ${verb}s "${message.content}" through ${receiverName} WALKIE TALKIE.`);
                            else if (occupant.hasAttribute("hear room") || deafPlayerInReceiverRoom)
                                occupant.notify(game, `A voice coming from ${receiverName} WALKIE TALKIE ${verb}s "${message.content}".`, false);
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
            let players = whisper !== null ? whisper.players : room.occupants;
            for (let i = 0; i < players.length; i++) {
                let occupant = players[i];
                // Players with the see room attribute should receive narrations from moderators.
                if (!occupant.hasAttribute("no sight") && occupant.talent !== "NPC" && (occupant.hasAttribute("see room") || !occupant.member.permissionsIn(message.channel).has("ViewChannel")) && !message.content.startsWith('('))
                    occupant.notify(game, message.content);
                else if (!occupant.hasAttribute("no sight") && !occupant.hasAttribute("unconscious") && !message.content.startsWith('('))
                    game.messageHandler.addSpectatedPlayerMessage(occupant, message, message, whisper, message.member.displayName);
            }
            if (whisper === null && room.tags.includes("video surveilled")) {
                let messageText = `\`[${room.name}] ${message.content}\``;
                for (let i = 0; i < game.rooms.length; i++) {
                    if (game.rooms[i].tags.includes("video monitoring") && game.rooms[i].occupants.length > 0) {
                        for (let j = 0; j < game.rooms[i].occupants.length; j++) {
                            let occupant = game.rooms[i].occupants[j];
                            if (occupant.hasAttribute("see room") && !occupant.hasAttribute("no sight") && !occupant.hasAttribute("hidden") && occupant.talent !== "NPC") {
                                occupant.notify(game, messageText, false);
                            }
                        }
                        game.messageHandler.addNarration(game.rooms[i], messageText, true);
                    }
                }
            }
        }

        resolve();
    });
};
