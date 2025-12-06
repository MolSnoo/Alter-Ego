import serverconfig from '../Configs/serverconfig.json' with { type: 'json' };

export default async function execute (bot, game, message, deletable, player = null, originalDisplayName = "") {
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

        // Add message to messageHandler cache.
        if (game.messageHandler.cache.length >= 50) game.messageHandler.cache.pop();
        game.messageHandler.cache.unshift({ id: message.id, related: [] });

        if (player !== null && message.channel.id !== serverconfig.announcementChannel) {
            if (player.talent !== "NPC") player.setOnline();

            // Preserve the player data as it is now in order to display it in spectate channels. Only preserve what's needed for that purpose.
            const speaker = { displayName: player.displayName, displayIcon: player.displayIcon, member: player.member };

            if (player.hasAttribute("no speech")) {
                if (player.talent !== "NPC") game.messageHandler.addGameMechanicMessage(player.member, "You are mute, so you cannot speak.");
                if (deletable) message.delete().catch();
                resolve();
            }

            // Set variables related to voice changing.
            let speakerVoiceString = player.voiceString;
            let speakerRecognitionName = player.name;
            if (player.voiceString !== player.originalVoiceString) {
                for (let i = 0; i < game.players.length; i++) {
                    if (player.voiceString === game.players[i].name) {
                        speakerVoiceString = game.players[i].originalVoiceString;
                        speakerRecognitionName = game.players[i].name;
                        break;
                    }
                }
                // If the player's voice descriptor is different but doesn't match the name of another player,
                // set their recognition name to unknown so that other players won't recognize their voice.
                if (speakerRecognitionName === player.name)
                    speakerRecognitionName = "unknown";
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

                            if (whisper.players[i].hasAttribute(`knows ${speakerRecognitionName}`) && !whisper.players[i].hasAttribute("no sight")) {
                                if (player.displayName !== speakerRecognitionName) {
                                    whisper.players[i].notify(game, `${player.displayName}, with ${speakerVoiceString} you recognize to be ${speakerRecognitionName}'s, whispers "${message.content}".`, false);
                                    game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper, `${player.displayName} (${speakerRecognitionName})`);
                                }
                                else if (whisper.players[i].talent !== "NPC" && !whisper.players[i].member.permissionsIn(message.channel).has("ViewChannel")) {
                                    whisper.players[i].notify(game, `${speakerRecognitionName} whispers "${message.content}".`, false);
                                    game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper, speakerRecognitionName);
                                }
                                else game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper);
                            }
                            else if (whisper.players[i].talent !== "NPC" && !whisper.players[i].member.permissionsIn(message.channel).has("ViewChannel")) {
                                if (whisper.players[i].hasAttribute(`knows ${speakerRecognitionName}`)) {
                                    whisper.players[i].notify(game, `${speakerRecognitionName} whispers "${message.content}".`, false);
                                    game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper, speakerRecognitionName);
                                }
                                else if (!whisper.players[i].hasAttribute("no sight")) {
                                    if (whisper.players[i].name === speakerRecognitionName)
                                        whisper.players[i].notify(game, `${player.displayName} whispers "${message.content}" in your voice!`);
                                    else {
                                        whisper.players[i].notify(game, `${player.displayName} whispers "${message.content}".`, false);
                                        game.messageHandler.addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper);
                                    }
                                }
                                else {
                                    let voiceString = whisper.players[i].name === speakerRecognitionName ? "your voice" : speakerVoiceString;
                                    whisper.players[i].notify(game, `Someone with ${voiceString} whispers "${message.content}".`);
                                }
                            }
                            else if (whisper.players[i].name === speakerRecognitionName)
                                whisper.players[i].notify(game, `${player.displayName} whispers "${message.content}" in your voice!`);
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
                        if (room.occupants[i].hasAttribute(`knows ${speakerRecognitionName}`)) {
                            if (player.hasAttribute("hidden") || room.occupants[i].hasAttribute("no sight"))
                                room.occupants[i].notify(game, `You overhear ${speakerRecognitionName} whisper "${message.content}".`);
                            else if (player.displayName !== speakerRecognitionName && !room.occupants[i].hasAttribute("no sight"))
                                room.occupants[i].notify(game, `You overhear ${player.displayName}, with ${speakerVoiceString} you recognize to be ${speakerRecognitionName}'s, whisper "${message.content}".`);
                        }
                        else if (room.occupants[i].name === speakerRecognitionName && !room.occupants[i].hasAttribute("no sight") && !player.hasAttribute("hidden"))
                            room.occupants[i].notify(game, `You overhear ${player.displayName} whisper "${message.content}" in your voice!`);
                        else if (player.hasAttribute("hidden") || room.occupants[i].hasAttribute("no sight")) {
                            let voiceString = room.occupants[i].name === speakerRecognitionName ? "your voice" : speakerVoiceString;
                            room.occupants[i].notify(game, `You overhear someone in the room with ${voiceString} whisper "${message.content}".`);
                        }
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
                                game.messageHandler.addNarration(nextdoor, `Someone in a nearby room with ${speakerVoiceString} shouts "${message.content}".`, true, player);
                            for (let j = 0; j < nextdoor.occupants.length; j++) {
                                let occupant = nextdoor.occupants[j];
                                if (occupant.hasAttribute("no hearing") || occupant.hasAttribute("unconscious")) continue;
                                if (isShouting) {
                                    if (occupant.hasAttribute(`knows ${speakerRecognitionName}`))
                                        occupant.notify(game, `You hear ${speakerRecognitionName} ${verb} "${message.content}" in a nearby room.`);
                                    else if (occupant.name === speakerRecognitionName)
                                        occupant.notify(game, `You hear someone with your voice ${verb} "${message.content} in a nearby room.`);
                                    else if (deafPlayerInNextdoor || occupant.hasAttribute("hear room"))
                                        occupant.notify(game, `You hear ${speakerVoiceString} from a nearby room ${verb} "${message.content}".`);
                                }
                                // Players with the acute hearing attribute should hear messages from adjacent rooms.
                                else if (occupant.hasAttribute("acute hearing") && occupant.hasAttribute(`knows ${speakerRecognitionName}`))
                                    occupant.notify(game, `You hear ${speakerRecognitionName} ${verb} "${message.content}" in a nearby room.`);
                                else if (occupant.hasAttribute("acute hearing") && occupant.name === speakerRecognitionName)
                                    occupant.notify(game, `You hear someone with your voice ${verb} "${message.content}" in a nearby room.`);
                                else if (!isShouting && occupant.hasAttribute("acute hearing"))
                                    occupant.notify(game, `You hear ${speakerVoiceString} from a nearby room say "${message.content}".`);
                            }
                            if (isShouting && nextdoor.tags.includes("audio surveilled")) {
                                let roomDisplayName = nextdoor.tags.includes("secret") ? "Intercom" : nextdoor.name;
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
                                            game.messageHandler.addNarration(monitoringRoom, `\`[${roomDisplayName}]\` Someone in a nearby room with ${speakerVoiceString} shouts "${message.content}".`, true, player);
                                        for (let k = 0; k < monitoringRoom.occupants.length; k++) {
                                            let occupant = monitoringRoom.occupants[k];
                                            if (occupant.hasAttribute("no hearing") || occupant.hasAttribute("unconscious")) continue;
                                            if (occupant.hasAttribute(`knows ${speakerRecognitionName}`))
                                                occupant.notify(game, `\`[${roomDisplayName}]\` ${speakerRecognitionName} shouts "${message.content}" in a nearby room.`);
                                            else if (occupant.name === speakerRecognitionName)
                                                occupant.notify(game, `\`[${roomDisplayName}]\` Someone with your voice shouts "${message.content}" in a nearby room.`);
                                            else if (deafPlayerInMonitoringRoom || occupant.hasAttribute("hear room"))
                                                occupant.notify(game, `\`[${roomDisplayName}]\` You hear ${speakerVoiceString} from a nearby room shout "${message.content}".`);
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

                        if (occupant.hasAttribute(`knows ${speakerRecognitionName}`) && !occupant.hasAttribute("no sight")) {
                            if (player.displayName !== speakerRecognitionName) {
                                occupant.notify(game, `${player.displayName}, with ${speakerVoiceString} you recognize to be ${speakerRecognitionName}'s, ${verb}s "${message.content}".`, false);
                                game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `${player.displayName} (${speakerRecognitionName})`);
                            }
                            else if (occupant.hasAttribute("hear room")) {
                                occupant.notify(game, `${speakerRecognitionName} ${verb}s "${message.content}".`, false);
                                game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message);
                            }
                            else game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message);
                        }
                        else if (occupant.hasAttribute("hear room") || deafPlayerInRoom) {
                            if (occupant.hasAttribute(`knows ${speakerRecognitionName}`)) {
                                occupant.notify(game, `${speakerRecognitionName} ${verb}s "${message.content}".`, false);
                                game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, speakerRecognitionName);
                            }
                            else if (!occupant.hasAttribute("no sight") && player.hasAttribute("hidden") && occupant.hasAttribute("hidden") && player.hidingSpot === occupant.hidingSpot) {
                                if (occupant.name === speakerRecognitionName)
                                    occupant.notify(game, `${originalDisplayName} ${verb}s "${message.content}" in your voice!`);
                                else {
                                    occupant.notify(game, `${originalDisplayName} ${verb}s "${message.content}".`, false);
                                    game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `${player.displayName} (${originalDisplayName})`);
                                }
                            }
                            else if (!occupant.hasAttribute("no sight")) {
                                if (occupant.name === speakerRecognitionName)
                                    occupant.notify(game, `${player.displayName} ${verb}s "${message.content}" in your voice!`);
                                else {
                                    occupant.notify(game, `${player.displayName} ${verb}s "${message.content}".`, false);
                                    game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message);
                                }
                            }
                            else if (occupant.name === speakerRecognitionName)
                                occupant.notify(game, `You hear someone with your voice in the room ${verb} "${message.content}".`);
                            else
                                occupant.notify(game, `You hear ${speakerVoiceString} in the room ${verb} "${message.content}".`);
                        }
                        else if (!player.hasAttribute("concealed") || player.hasAttribute("concealed") && deletable) {
                            if (occupant.name === speakerRecognitionName)
                                occupant.notify(game, `${player.displayName} ${verb}s "${message.content}" in your voice!`);
                            else game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message);
                        }
                            
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
                    let roomDisplayName = room.tags.includes("secret") ? room.tags.includes("video surveilled") ? "Surveillance feed" : "Intercom" : room.name;
                    for (let i = 0; i < game.rooms.length; i++) {
                        if (game.rooms[i].tags.includes("audio monitoring") && game.rooms[i].occupants.length > 0 && game.rooms[i].name !== room.name) {
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
                                    username: `[${roomDisplayName}] ${player.displayName}`,
                                    avatarURL: player.displayIcon ? player.displayIcon : player.member.displayAvatarURL() || message.author.defaultAvatarURL,
                                    embeds: message.embeds,
                                    files: files
                                });
                            }
                            else if (!deafPlayerInMonitoringRoom) {
                                game.messageHandler.addNarration(monitoringRoom, `\`[${roomDisplayName}]\` Someone with ${speakerVoiceString} ${verb}s "${message.content}".`, true, player);
                            }
                            for (let j = 0; j < monitoringRoom.occupants.length; j++) {
                                let occupant = monitoringRoom.occupants[j];
                                if (occupant.hasAttribute("no hearing") || occupant.hasAttribute("unconscious")) continue;
                                
                                if (occupant.hasAttribute(`knows ${speakerRecognitionName}`) && room.tags.includes("video surveilled") && monitoringRoom.tags.includes("video monitoring") && !occupant.hasAttribute("no sight")) {
                                    if (player.displayName !== speakerRecognitionName) {
                                        occupant.notify(game, `\`[${roomDisplayName}]\` ${player.displayName}, with ${speakerVoiceString} you recognize to be ${speakerRecognitionName}'s, ${verb}s "${message.content}".`, false);
                                        game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${player.displayName} (${speakerRecognitionName})`);
                                    }
                                    else if (occupant.hasAttribute("hear room")) {
                                        occupant.notify(game, `\`[${roomDisplayName}]\` ${speakerRecognitionName} ${verb}s "${message.content}".`, false);
                                        game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${player.displayName}`);
                                    }
                                    else game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${player.displayName}`);
                                }
                                else if (room.tags.includes("video surveilled") && monitoringRoom.tags.includes("video monitoring") && !occupant.hasAttribute("no sight")) {
                                    if (occupant.hasAttribute("hear room")) {
                                        if (occupant.name === speakerRecognitionName)
                                            occupant.notify(game, `\`[${roomDisplayName}]\` ${player.displayName} ${verb}s "${message.content}" in your voice!`);
                                        else {
                                            occupant.notify(game, `\`[${roomDisplayName}]\` ${player.displayName} ${verb}s "${message.content}".`, false);
                                            game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${player.displayName}`);
                                        }
                                    }
                                    else if (occupant.name === speakerRecognitionName)
                                        occupant.notify(game, `\`[${roomDisplayName}]\` ${player.displayName} ${verb}s "${message.content}" in your voice!`);
                                    else game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${player.displayName}`);
                                }
                                else if (occupant.hasAttribute(`knows ${speakerRecognitionName}`) && (!room.tags.includes("video surveilled") || !monitoringRoom.tags.includes("video monitoring"))) {
                                    occupant.notify(game, `\`[${roomDisplayName}]\` ${speakerRecognitionName} ${verb}s "${message.content}".`);
                                }
                                else if (occupant.hasAttribute("hear room") || deafPlayerInMonitoringRoom) {
                                    if (occupant.hasAttribute(`knows ${speakerRecognitionName}`)) {
                                        let noSight = occupant.hasAttribute("no sight");
                                        occupant.notify(game, `\`[${roomDisplayName}]\` ${speakerRecognitionName} ${verb}s "${message.content}".`, noSight);
                                        if (!noSight) game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${speakerRecognitionName}`);
                                    }
                                    else if (room.tags.includes("video surveilled") && monitoringRoom.tags.includes("video monitoring") && !occupant.hasAttribute("no sight")) {
                                        if (occupant.name === speakerRecognitionName)
                                            occupant.notify(game, `\`[${roomDisplayName}]\` ${player.displayName} ${verb}s "${message.content}" in your voice!`);
                                        else {
                                            occupant.notify(game, `\`[${roomDisplayName}]\` ${player.displayName} ${verb}s "${message.content}".`, false);
                                            game.messageHandler.addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${player.displayName}`);
                                        }
                                    }
                                    else if (occupant.name === speakerRecognitionName)
                                        occupant.notify(game, `\`[${roomDisplayName}]\` Someone with your voice ${verb}s "${message.content}".`);
                                    else
                                        occupant.notify(game, `\`[${roomDisplayName}]\` Someone with ${speakerVoiceString} ${verb}s "${message.content}".`);
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
                        let voiceString = speakerVoiceString.substring(0, 1).toUpperCase() + speakerVoiceString.substring(1);
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
                            game.messageHandler.addNarration(receiver.location, `${voiceString} coming from ${receiver.displayName}'s WALKIE TALKIE ${verb}s "${message.content}".`, true, player);

                        for (let j = 0; j < receiver.location.occupants.length; j++) {
                            let occupant = receiver.location.occupants[j];
                            if (occupant.hasAttribute("no hearing") || occupant.hasAttribute("unconscious")) continue;
                            const receiverName = occupant.name === receiver.name ? "your" : `${receiver.displayName}'s`;
                            if (occupant.hasAttribute(`knows ${speakerRecognitionName}`))
                                occupant.notify(game, `${speakerRecognitionName} ${verb}s "${message.content}" through ${receiverName} WALKIE TALKIE.`);
                            else if (occupant.hasAttribute("hear room") || deafPlayerInReceiverRoom)
                                occupant.notify(game, `${voiceString} coming from ${receiverName} WALKIE TALKIE ${verb}s "${message.content}".`);
                            else if (occupant.name === speakerRecognitionName)
                                occupant.notify(game, `Someone ${verb}s "${message.content}" through ${receiverName} WALKIE TALKIE in your voice!`);
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
                let roomDisplayName = room.tags.includes("secret") ? "Surveillance feed" : room.name;
                let messageText = `\`[${roomDisplayName}] ${message.content}\``;
                for (let i = 0; i < game.rooms.length; i++) {
                    if (game.rooms[i].tags.includes("video monitoring") && game.rooms[i].occupants.length > 0 && game.rooms[i].name !== room.name) {
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
}
