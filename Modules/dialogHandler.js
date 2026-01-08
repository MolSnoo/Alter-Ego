import { ChannelType } from 'discord.js';
import { addNarration, addSpectatedPlayerMessage } from './messageHandler.js';

/** @typedef {import('../Data/Game.js').default} Game */
/** @typedef {import('../Data/Player.js').default} Player */
/** @typedef {import('../Data/Room.js').default} Room */
/** @typedef {import('../Data/Whisper.js').default} Whisper */

/**
 * Interprets a dialog message and executes behavior caused by it.
 * @param {Game} game - The game in which the dialog was sent.
 * @param {UserMessage} message - The message which sent the dialog.
 * @param {boolean} deletable - Whether the dialog message can be deleted by the bot. If it was sent in a DM channel, it can't be deleted.
 * @param {Player} [player] - The player who sent the dialog.
 * @param {string} [originalDisplayName] - The original displayName of the player who sent the dialog, in case their real displayName needs to be hidden.
 */
export default async function execute(game, message, deletable, player = null, originalDisplayName = "") {
    return new Promise(async (resolve) => {
        // Determine if the speaker is a moderator first.
        let isModerator = false;
        if (message.member && message.member.roles.resolve(game.guildContext.moderatorRole))
            isModerator = true;

        // Determine if the speaker is a player.
        if (player === null) {
            for (const livingPlayer of game.livingPlayersCollection.values()) {
                if (livingPlayer.id === message.author.id) {
                    player = livingPlayer;
                    break;
                }
            }
        }

        // Get the location of the message.
        /** @type {Room} */
        let room = null;
        /** @type {Whisper} */
        let whisper = null;
        if (player !== null) room = player.location;
        else if (message.channel.type === ChannelType.GuildText) {
            if (game.entityFinder.getRoom(message.channel.name))
                room = game.entityFinder.getRoom(message.channel.name);
            for (let i = 0; i < game.whispers.length; i++) {
                if (game.whispers[i].channelName === message.channel.name) {
                    whisper = game.whispers[i];
                    break;
                }
            }
        }
        if (player !== null && message.channel.id === game.guildContext.announcementChannel.id) {
            game.livingPlayersCollection.forEach(livingPlayer => {
                addSpectatedPlayerMessage(livingPlayer, player, message);
            });
            resolve();
        }
        if (room === null) resolve();

        // Add message to messageHandler cache.
        if (game.dialogCache.length >= 50) game.dialogCache.pop();
        game.dialogCache.unshift({ messageId: message.id, spectateMirrors: [] });

        if (player !== null && message.channel.id !== game.guildContext.announcementChannel.id) {
            if (!player.isNPC) player.setOnline();

            /**
             * Preserve the player data as it is now in order to display it in spectate channels. Only preserve what's needed for that purpose.
             * @type {PseudoPlayer}
             */
            const speaker = { displayName: player.displayName, displayIcon: player.displayIcon, member: player.member, game: player.getGame(), getGame: () => speaker.game };

            if (player.hasBehaviorAttribute("no speech")) {
                if (!player.isNPC) player.notify("You are mute, so you cannot speak.", false);
                if (deletable) message.delete().catch();
                resolve();
            }

            // Set variables related to voice changing.
            let speakerVoiceString = player.voiceString;
            let speakerRecognitionName = player.name;
            if (player.voiceString !== player.originalVoiceString) {
                let fetchedPlayer = game.entityFinder.getPlayer(player.voiceString);
                if (fetchedPlayer) {
                    speakerVoiceString = fetchedPlayer.originalVoiceString;
                    speakerRecognitionName = fetchedPlayer.name;
                }
                // If the player's voice descriptor is different but doesn't match the name of another player,
                // set their recognition name to unknown so that other players won't recognize their voice.
                if (speakerRecognitionName === player.name)
                    speakerRecognitionName = "unknown";
            }

            // Handle whisper messages.
            if (message.channel.type === ChannelType.GuildText && message.channel.parentId === game.guildContext.whisperCategoryId) {
                // Find whisper.
                /** @type {Whisper} */
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
                            if (whisper.players[i].hasBehaviorAttribute("no hearing") || whisper.players[i].hasBehaviorAttribute("unconscious")) continue;

                            if (whisper.players[i].hasBehaviorAttribute(`knows ${speakerRecognitionName}`) && !whisper.players[i].hasBehaviorAttribute("no sight")) {
                                if (player.displayName !== speakerRecognitionName) {
                                    whisper.players[i].notify(`${player.displayName}, with ${speakerVoiceString} you recognize to be ${speakerRecognitionName}'s, whispers "${message.content}".`, false);
                                    addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper, `${player.displayName} (${speakerRecognitionName})`);
                                }
                                else if (!whisper.players[i].isNPC && !whisper.players[i].member.permissionsIn(message.channel).has("ViewChannel")) {
                                    whisper.players[i].notify(`${speakerRecognitionName} whispers "${message.content}".`, false);
                                    addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper, speakerRecognitionName);
                                }
                                else addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper);
                            }
                            else if (!whisper.players[i].isNPC && !whisper.players[i].member.permissionsIn(message.channel).has("ViewChannel")) {
                                if (whisper.players[i].hasBehaviorAttribute(`knows ${speakerRecognitionName}`)) {
                                    whisper.players[i].notify(`${speakerRecognitionName} whispers "${message.content}".`, false);
                                    addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper, speakerRecognitionName);
                                }
                                else if (!whisper.players[i].hasBehaviorAttribute("no sight")) {
                                    if (whisper.players[i].name === speakerRecognitionName)
                                        whisper.players[i].notify(`${player.displayName} whispers "${message.content}" in your voice!`);
                                    else {
                                        whisper.players[i].notify(`${player.displayName} whispers "${message.content}".`, false);
                                        addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper);
                                    }
                                }
                                else {
                                    let voiceString = whisper.players[i].name === speakerRecognitionName ? "your voice" : speakerVoiceString;
                                    whisper.players[i].notify(`Someone with ${voiceString} whispers "${message.content}".`);
                                }
                            }
                            else if (whisper.players[i].name === speakerRecognitionName)
                                whisper.players[i].notify(`${player.displayName} whispers "${message.content}" in your voice!`);
                            else
                                addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper);
                        }
                        else if (whisper.players[i].name === player.name) {
                            if (player.displayName !== player.name)
                                addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper, `${player.displayName} (${player.name})`);
                            else
                                addSpectatedPlayerMessage(whisper.players[i], speaker, message, whisper);
                        }
                    }
                }

                for (let i = 0; i < room.occupants.length; i++) {
                    // Players with the acute hearing attribute should overhear other whispers.
                    if (room.occupants[i].hasBehaviorAttribute("acute hearing") && !whisper.players.includes(room.occupants[i]) && !message.content.startsWith('(')) {
                        if (room.occupants[i].hasBehaviorAttribute(`knows ${speakerRecognitionName}`)) {
                            if (player.hasBehaviorAttribute("hidden") || room.occupants[i].hasBehaviorAttribute("no sight"))
                                room.occupants[i].notify(`You overhear ${speakerRecognitionName} whisper "${message.content}".`);
                            else if (player.displayName !== speakerRecognitionName && !room.occupants[i].hasBehaviorAttribute("no sight"))
                                room.occupants[i].notify(`You overhear ${player.displayName}, with ${speakerVoiceString} you recognize to be ${speakerRecognitionName}'s, whisper "${message.content}".`);
                        }
                        else if (room.occupants[i].name === speakerRecognitionName && !room.occupants[i].hasBehaviorAttribute("no sight") && !player.hasBehaviorAttribute("hidden"))
                            room.occupants[i].notify(`You overhear ${player.displayName} whisper "${message.content}" in your voice!`);
                        else if (player.hasBehaviorAttribute("hidden") || room.occupants[i].hasBehaviorAttribute("no sight")) {
                            let voiceString = room.occupants[i].name === speakerRecognitionName ? "your voice" : speakerVoiceString;
                            room.occupants[i].notify(`You overhear someone in the room with ${voiceString} whisper "${message.content}".`);
                        }
                        else
                            room.occupants[i].notify(`You overhear ${player.displayName} whisper "${message.content}".`);
                    }
                }
            }
            else {
                let isShouting = false;
                let verb = "say";
                // If the message includes at least two letters and all letters in the message are uppercase, then the player is shouting.
                if (RegExp("[a-zA-Z](?=(.*)[a-zA-Z])", 'g').test(message.content) && message.content === message.content.toUpperCase()) {
                    isShouting = true;
                    verb = "shout";
                }
                let deafPlayerInRoom = false;
                // Check if there are any deaf players in the room. Count non-deaf players.
                for (let i = 0; i < room.occupants.length; i++) {
                    // If a player in the room has the no hearing attribute, delete the message and redirect it to anyone who can hear.
                    if (room.occupants[i].hasBehaviorAttribute("no hearing")) {
                        deafPlayerInRoom = true;
                        break;
                    }
                }
                if (room.occupants.length === 1 && room.occupants[0].hasBehaviorAttribute("unconscious"))
                    deafPlayerInRoom = true;
                // Handle messages in adjacent rooms.
                if (!room.tags.has("soundproof") && !message.content.startsWith('(')) {
                    /** @type {string[]} */
                    let destinations = [];
                    for (let exit of room.exitCollection.values()) {
                        const nextdoor = exit.dest;
                        // Prevent duplication when two rooms are connected by multiple exits.
                        if (destinations.includes(nextdoor.id)) continue;
                        destinations.push(nextdoor.id);
                        if (!nextdoor.tags.has("soundproof") && nextdoor.occupants.length > 0 && nextdoor.id !== room.id) {
                            let deafPlayerInNextdoor = false;
                            // Check if there are any deaf players in the next room.
                            for (let j = 0; j < nextdoor.occupants.length; j++) {
                                if (nextdoor.occupants[j].hasBehaviorAttribute("no hearing"))
                                    deafPlayerInNextdoor = true;
                            }
                            if (nextdoor.occupants.length === 1 && nextdoor.occupants[0].hasBehaviorAttribute("unconscious"))
                                deafPlayerInNextdoor = true;

                            if (isShouting && !deafPlayerInNextdoor)
                                addNarration(nextdoor, `Someone in a nearby room with ${speakerVoiceString} shouts "${message.content}".`, true, player);
                            for (let j = 0; j < nextdoor.occupants.length; j++) {
                                let occupant = nextdoor.occupants[j];
                                if (occupant.hasBehaviorAttribute("no hearing") || occupant.hasBehaviorAttribute("unconscious")) continue;
                                if (isShouting) {
                                    if (occupant.hasBehaviorAttribute(`knows ${speakerRecognitionName}`))
                                        occupant.notify(`You hear ${speakerRecognitionName} ${verb} "${message.content}" in a nearby room.`);
                                    else if (occupant.name === speakerRecognitionName)
                                        occupant.notify(`You hear someone with your voice ${verb} "${message.content} in a nearby room.`);
                                    else if (deafPlayerInNextdoor || occupant.hasBehaviorAttribute("hear room"))
                                        occupant.notify(`You hear ${speakerVoiceString} from a nearby room ${verb} "${message.content}".`);
                                }
                                // Players with the acute hearing attribute should hear messages from adjacent rooms.
                                else if (occupant.hasBehaviorAttribute("acute hearing") && occupant.hasBehaviorAttribute(`knows ${speakerRecognitionName}`))
                                    occupant.notify(`You hear ${speakerRecognitionName} ${verb} "${message.content}" in a nearby room.`);
                                else if (occupant.hasBehaviorAttribute("acute hearing") && occupant.name === speakerRecognitionName)
                                    occupant.notify(`You hear someone with your voice ${verb} "${message.content}" in a nearby room.`);
                                else if (!isShouting && occupant.hasBehaviorAttribute("acute hearing"))
                                    occupant.notify(`You hear ${speakerVoiceString} from a nearby room say "${message.content}".`);
                            }
                            if (isShouting && nextdoor.tags.has("audio surveilled")) {
                                let roomDisplayName = nextdoor.tags.has("secret") ? "Intercom" : nextdoor.id;
                                const monitoringRooms = game.entityFinder.getRooms(null, "audio monitoring", true);
                                for (let monitoringRoom of monitoringRooms) {
                                    let deafPlayerInMonitoringRoom = false;
                                    // Check if there are any deaf players in the monitoring room.
                                    for (let k = 0; k < monitoringRoom.occupants.length; k++) {
                                        if (monitoringRoom.occupants[k].hasBehaviorAttribute("no hearing"))
                                            deafPlayerInMonitoringRoom = true;
                                    }
                                    if (monitoringRoom.occupants.length === 1 && monitoringRoom.occupants[0].hasBehaviorAttribute("unconscious"))
                                        deafPlayerInMonitoringRoom = true;

                                    if (!deafPlayerInMonitoringRoom)
                                        addNarration(monitoringRoom, `\`[${roomDisplayName}]\` Someone in a nearby room with ${speakerVoiceString} shouts "${message.content}".`, true, player);
                                    for (let k = 0; k < monitoringRoom.occupants.length; k++) {
                                        let occupant = monitoringRoom.occupants[k];
                                        if (occupant.hasBehaviorAttribute("no hearing") || occupant.hasBehaviorAttribute("unconscious")) continue;
                                        if (occupant.hasBehaviorAttribute(`knows ${speakerRecognitionName}`))
                                            occupant.notify(`\`[${roomDisplayName}]\` ${speakerRecognitionName} shouts "${message.content}" in a nearby room.`);
                                        else if (occupant.name === speakerRecognitionName)
                                            occupant.notify(`\`[${roomDisplayName}]\` Someone with your voice shouts "${message.content}" in a nearby room.`);
                                        else if (deafPlayerInMonitoringRoom || occupant.hasBehaviorAttribute("hear room"))
                                            occupant.notify(`\`[${roomDisplayName}]\` You hear ${speakerVoiceString} from a nearby room shout "${message.content}".`);
                                    }
                                }
                            }
                        }
                    }
                }

                if (deafPlayerInRoom && deletable)
                    message.delete().catch();

                for (let i = 0; i < game.puzzles.length; i++) {
                    if (game.puzzles[i].location.id === room.id && game.puzzles[i].type === "voice") {
                        const cleanContent = message.content.replace(/[^a-zA-Z0-9 ]+/g, "").toLowerCase().trim();
                        for (let j = 0; j < game.puzzles[i].solutions.length; j++) {
                            if (cleanContent.includes(game.puzzles[i].solutions[j]))
                                game.puzzles[i].solve(player, "", game.puzzles[i].solutions[j], true);
                        }
                    }
                }

                for (let i = 0; i < room.occupants.length; i++) {
                    let occupant = room.occupants[i];
                    if (occupant.name !== player.name && !message.content.startsWith('(')) {
                        if (occupant.hasBehaviorAttribute("no hearing") || occupant.hasBehaviorAttribute("unconscious")) continue;

                        if (occupant.hasBehaviorAttribute(`knows ${speakerRecognitionName}`) && !occupant.hasBehaviorAttribute("no sight")) {
                            if (player.displayName !== speakerRecognitionName) {
                                occupant.notify(`${player.displayName}, with ${speakerVoiceString} you recognize to be ${speakerRecognitionName}'s, ${verb}s "${message.content}".`, false);
                                addSpectatedPlayerMessage(occupant, speaker, message, null, `${player.displayName} (${speakerRecognitionName})`);
                            }
                            else if (occupant.hasBehaviorAttribute("hear room")) {
                                occupant.notify(`${speakerRecognitionName} ${verb}s "${message.content}".`, false);
                                addSpectatedPlayerMessage(occupant, speaker, message);
                            }
                            else addSpectatedPlayerMessage(occupant, speaker, message);
                        }
                        else if (occupant.hasBehaviorAttribute("hear room") || deafPlayerInRoom) {
                            if (occupant.hasBehaviorAttribute(`knows ${speakerRecognitionName}`)) {
                                occupant.notify(`${speakerRecognitionName} ${verb}s "${message.content}".`, false);
                                addSpectatedPlayerMessage(occupant, speaker, message, null, speakerRecognitionName);
                            }
                            else if (!occupant.hasBehaviorAttribute("no sight") && player.hasBehaviorAttribute("hidden") && occupant.hasBehaviorAttribute("hidden") && player.hidingSpot === occupant.hidingSpot) {
                                if (occupant.name === speakerRecognitionName)
                                    occupant.notify(`${originalDisplayName} ${verb}s "${message.content}" in your voice!`);
                                else {
                                    occupant.notify(`${originalDisplayName} ${verb}s "${message.content}".`, false);
                                    addSpectatedPlayerMessage(occupant, speaker, message, null, `${player.displayName} (${originalDisplayName})`);
                                }
                            }
                            else if (!occupant.hasBehaviorAttribute("no sight")) {
                                if (occupant.name === speakerRecognitionName)
                                    occupant.notify(`${player.displayName} ${verb}s "${message.content}" in your voice!`);
                                else {
                                    occupant.notify(`${player.displayName} ${verb}s "${message.content}".`, false);
                                    addSpectatedPlayerMessage(occupant, speaker, message);
                                }
                            }
                            else if (occupant.name === speakerRecognitionName)
                                occupant.notify(`You hear someone with your voice in the room ${verb} "${message.content}".`);
                            else
                                occupant.notify(`You hear ${speakerVoiceString} in the room ${verb} "${message.content}".`);
                        }
                        else if (!player.hasBehaviorAttribute("concealed") || player.hasBehaviorAttribute("concealed") && deletable) {
                            if (occupant.name === speakerRecognitionName)
                                occupant.notify(`${player.displayName} ${verb}s "${message.content}" in your voice!`);
                            else addSpectatedPlayerMessage(occupant, speaker, message);
                        }

                    }
                    else if (occupant.name === player.name && !message.content.startsWith('(')) {
                        if (player.displayName !== player.name)
                            addSpectatedPlayerMessage(occupant, speaker, message, null, `${player.displayName} (${player.name})`);
                        else
                            addSpectatedPlayerMessage(occupant, speaker, message);
                    }
                }

                // Handle surveillance behavior.
                if (room.tags.has("audio surveilled") && !message.content.startsWith('(')) {
                    let roomDisplayName = room.tags.has("secret") ? room.tags.has("video surveilled") ? "Surveillance feed" : "Intercom" : room.id;
                    const monitoringRooms = game.entityFinder.getRooms(null, "audio monitoring", true);
                    for (let monitoringRoom of monitoringRooms) {
                        if (monitoringRoom.id !== room.id) {
                            let deafPlayerInMonitoringRoom = false;
                            for (let j = 0; j < monitoringRoom.occupants.length; j++) {
                                if (monitoringRoom.occupants[j].hasBehaviorAttribute("no hearing"))
                                    deafPlayerInMonitoringRoom = true;
                            }
                            if (monitoringRoom.occupants.length === 1 && monitoringRoom.occupants[0].hasBehaviorAttribute("unconscious"))
                                deafPlayerInMonitoringRoom = true;

                            if (room.tags.has("video surveilled") && monitoringRoom.tags.has("video monitoring") && !deafPlayerInMonitoringRoom) {
                                // Create a webhook for this channel if necessary, or grab the existing one.
                                let webHooks = await monitoringRoom.channel.fetchWebhooks();
                                let webHook = webHooks.find(webhook => webhook.owner.id === game.botContext.client.user.id);
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
                                addNarration(monitoringRoom, `\`[${roomDisplayName}]\` Someone with ${speakerVoiceString} ${verb}s "${message.content}".`, true, player);
                            }
                            for (let j = 0; j < monitoringRoom.occupants.length; j++) {
                                let occupant = monitoringRoom.occupants[j];
                                if (occupant.hasBehaviorAttribute("no hearing") || occupant.hasBehaviorAttribute("unconscious")) continue;

                                if (occupant.hasBehaviorAttribute(`knows ${speakerRecognitionName}`) && room.tags.has("video surveilled") && monitoringRoom.tags.has("video monitoring") && !occupant.hasBehaviorAttribute("no sight")) {
                                    if (player.displayName !== speakerRecognitionName) {
                                        occupant.notify(`\`[${roomDisplayName}]\` ${player.displayName}, with ${speakerVoiceString} you recognize to be ${speakerRecognitionName}'s, ${verb}s "${message.content}".`, false);
                                        addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${player.displayName} (${speakerRecognitionName})`);
                                    }
                                    else if (occupant.hasBehaviorAttribute("hear room")) {
                                        occupant.notify(`\`[${roomDisplayName}]\` ${speakerRecognitionName} ${verb}s "${message.content}".`, false);
                                        addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${player.displayName}`);
                                    }
                                    else addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${player.displayName}`);
                                }
                                else if (room.tags.has("video surveilled") && monitoringRoom.tags.has("video monitoring") && !occupant.hasBehaviorAttribute("no sight")) {
                                    if (occupant.hasBehaviorAttribute("hear room")) {
                                        if (occupant.name === speakerRecognitionName)
                                            occupant.notify(`\`[${roomDisplayName}]\` ${player.displayName} ${verb}s "${message.content}" in your voice!`);
                                        else {
                                            occupant.notify(`\`[${roomDisplayName}]\` ${player.displayName} ${verb}s "${message.content}".`, false);
                                            addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${player.displayName}`);
                                        }
                                    }
                                    else if (occupant.name === speakerRecognitionName)
                                        occupant.notify(`\`[${roomDisplayName}]\` ${player.displayName} ${verb}s "${message.content}" in your voice!`);
                                    else addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${player.displayName}`);
                                }
                                else if (occupant.hasBehaviorAttribute(`knows ${speakerRecognitionName}`) && (!room.tags.has("video surveilled") || !monitoringRoom.tags.has("video monitoring"))) {
                                    occupant.notify(`\`[${roomDisplayName}]\` ${speakerRecognitionName} ${verb}s "${message.content}".`);
                                }
                                else if (occupant.hasBehaviorAttribute("hear room") || deafPlayerInMonitoringRoom) {
                                    if (occupant.hasBehaviorAttribute(`knows ${speakerRecognitionName}`)) {
                                        let noSight = occupant.hasBehaviorAttribute("no sight");
                                        occupant.notify(`\`[${roomDisplayName}]\` ${speakerRecognitionName} ${verb}s "${message.content}".`, noSight);
                                        if (!noSight) addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${speakerRecognitionName}`);
                                    }
                                    else if (room.tags.has("video surveilled") && monitoringRoom.tags.has("video monitoring") && !occupant.hasBehaviorAttribute("no sight")) {
                                        if (occupant.name === speakerRecognitionName)
                                            occupant.notify(`\`[${roomDisplayName}]\` ${player.displayName} ${verb}s "${message.content}" in your voice!`);
                                        else {
                                            occupant.notify(`\`[${roomDisplayName}]\` ${player.displayName} ${verb}s "${message.content}".`, false);
                                            addSpectatedPlayerMessage(occupant, speaker, message, null, `[${roomDisplayName}] ${player.displayName}`);
                                        }
                                    }
                                    else if (occupant.name === speakerRecognitionName)
                                        occupant.notify(`\`[${roomDisplayName}]\` Someone with your voice ${verb}s "${message.content}".`);
                                    else
                                        occupant.notify(`\`[${roomDisplayName}]\` Someone with ${speakerVoiceString} ${verb}s "${message.content}".`);
                                }
                            }

                            for (let j = 0; j < game.puzzles.length; j++) {
                                if (game.puzzles[j].location.id === monitoringRoom.id && game.puzzles[j].type === "voice") {
                                    const cleanContent = message.content.replace(/[^a-zA-Z0-9 ]+/g, "").toLowerCase().trim();
                                    for (let k = 0; k < game.puzzles[j].solutions.length; k++) {
                                        if (cleanContent.includes(game.puzzles[j].solutions[k]))
                                            game.puzzles[j].solve(null, "", game.puzzles[j].solutions[k], true);
                                    }
                                }
                            }
                        }
                    }
                }

                // Handle walkie talkie behavior.
                if (player.hasBehaviorAttribute("sender") && !message.content.startsWith('(')) {
                    let receiver = null;
                    for (const livingPlayer of game.livingPlayersCollection.values()) {
                        if (livingPlayer.hasBehaviorAttribute("receiver") && livingPlayer.name !== player.name) {
                            receiver = livingPlayer;
                            break;
                        }
                    }
                    if (receiver !== null) {
                        let voiceString = speakerVoiceString.substring(0, 1).toUpperCase() + speakerVoiceString.substring(1);
                        let deafPlayerInReceiverRoom = false;
                        // Check if there are any deaf players in the room. Count non-deaf players.
                        for (let i = 0; i < receiver.location.occupants.length; i++) {
                            // If a player in the room has the no hearing attribute, delete the message and redirect it to anyone who can hear.
                            if (receiver.location.occupants[i].hasBehaviorAttribute("no hearing")) {
                                deafPlayerInReceiverRoom = true;
                                break;
                            }
                        }
                        if (receiver.location.occupants.length === 1 && receiver.location.occupants[0].hasBehaviorAttribute("unconscious"))
                            deafPlayerInReceiverRoom = true;

                        if (!deafPlayerInReceiverRoom)
                            addNarration(receiver.location, `${voiceString} coming from ${receiver.displayName}'s WALKIE TALKIE ${verb}s "${message.content}".`, true, player);

                        for (let j = 0; j < receiver.location.occupants.length; j++) {
                            let occupant = receiver.location.occupants[j];
                            if (occupant.hasBehaviorAttribute("no hearing") || occupant.hasBehaviorAttribute("unconscious")) continue;
                            const receiverName = occupant.name === receiver.name ? "your" : `${receiver.displayName}'s`;
                            if (occupant.hasBehaviorAttribute(`knows ${speakerRecognitionName}`))
                                occupant.notify(`${speakerRecognitionName} ${verb}s "${message.content}" through ${receiverName} WALKIE TALKIE.`);
                            else if (occupant.hasBehaviorAttribute("hear room") || deafPlayerInReceiverRoom)
                                occupant.notify(`${voiceString} coming from ${receiverName} WALKIE TALKIE ${verb}s "${message.content}".`);
                            else if (occupant.name === speakerRecognitionName)
                                occupant.notify(`Someone ${verb}s "${message.content}" through ${receiverName} WALKIE TALKIE in your voice!`);
                        }

                        for (let i = 0; i < game.puzzles.length; i++) {
                            if (game.puzzles[i].location.id === receiver.location.id && game.puzzles[i].type === "voice") {
                                const cleanContent = message.content.replace(/[^a-zA-Z0-9 ]+/g, "").toLowerCase().trim();
                                for (let j = 0; j < game.puzzles[i].solutions.length; j++) {
                                    if (cleanContent.includes(game.puzzles[i].solutions[j]))
                                        game.puzzles[i].solve(null, "", game.puzzles[i].solutions[j], true);
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
                if (!occupant.hasBehaviorAttribute("no sight") && !occupant.isNPC
                    && (occupant.hasBehaviorAttribute("see room") || message.channel.type === ChannelType.GuildText && !occupant.member.permissionsIn(message.channel).has("ViewChannel"))
                    && !message.content.startsWith('('))
                    occupant.notify(message.content);
                else if (!occupant.hasBehaviorAttribute("no sight") && !occupant.hasBehaviorAttribute("unconscious") && !message.content.startsWith('('))
                    addSpectatedPlayerMessage(occupant, message.member, message, whisper, message.member.displayName);
            }
            if (whisper === null && room.tags.has("video surveilled")) {
                let roomDisplayName = room.tags.has("secret") ? "Surveillance feed" : room.displayName;
                let messageText = `\`[${roomDisplayName}] ${message.content}\``;
                let monitoringRooms = game.entityFinder.getRooms(null, "video monitoring", true);
                for (let monitoringRoom of monitoringRooms) {
                    if (monitoringRoom.id !== room.id) {
                        for (let j = 0; j < monitoringRoom.occupants.length; j++) {
                            let occupant = monitoringRoom.occupants[j];
                            if (occupant.hasBehaviorAttribute("see room") && !occupant.hasBehaviorAttribute("no sight") && !occupant.hasBehaviorAttribute("hidden") && !occupant.isNPC) {
                                occupant.notify(messageText, false);
                            }
                        }
                        addNarration(monitoringRoom, messageText, true);
                    }
                }
            }
        }

        resolve();
    });
}
