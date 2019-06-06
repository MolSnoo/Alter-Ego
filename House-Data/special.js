const discord = require("discord.js");
const settings = require("../settings.json");

module.exports.determineBehavior = function (bot, config, message) {
    const guild = message.guild;

    if (!config.game) return;

    var redirectMessage = true;

    if (config.room_categories.includes(message.channel.parentID) || message.channel.parentID === config.whisper_category) {
        for (var i = 0; i < config.players_alive.length; i++) {
            if (config.players_alive[i].id === message.author.id) {
                const author = message.author;
                if (config.players_alive[i].statusString.includes("deaf")) {
                    redirectMessage = false;
                    author.send("You try to speak, but no one can hear you.");
                    message.delete().catch();
                }
                else if (config.players_alive[i].statusString.includes("mute")) {
                    redirectMessage = false;
                    author.send("You are mute, so you cannot speak.");
                    message.delete().catch();
                }
                break;
            }
        }
    }

    if (redirectMessage && message.member.roles.find(role => role.id === config.playingRole)) {
        const concealedPlayer = config.concealedPlayer;
        if ((concealedPlayer.member !== null)
            && (concealedPlayer.location === message.channel.name)
            && (!concealedPlayer.hidden)) {
            concealedPlayer.member.send(message.member.displayName + ' says "' + message.content + '"');
        }

        const hiddenPlayers = config.hiddenPlayers;
        for (var i = 0; i < hiddenPlayers.length; i++) {
            if (hiddenPlayers[i].location === message.channel.name) {
                const hiddenMember = guild.members.find(member => member.id === hiddenPlayers[i].id);
                hiddenMember.send('You hear a voice in the room say "' + message.content + '"');
            }
        }

        var currentRoom;
        for (var i = 0; i < config.rooms.length; i++) {
            if (config.rooms[i].name === message.channel.name) {
                currentRoom = config.rooms[i];
                break;
            }
        }
        if (currentRoom) {
            for (var i = 0; i < currentRoom.exit.length; i++) {
                const hearingPlayers = config.hearingPlayers;
                for (var j = 0; j < hearingPlayers.length; j++) {
                    if (currentRoom.exit[i].dest === hearingPlayers[j].location) {
                        const hearingMember = guild.members.find(member => member.id === hearingPlayers[j].id);
                        hearingMember.send('You hear a voice from a nearby room say "' + message.content + '"');
                    }
                }
            }
        }
    }
};