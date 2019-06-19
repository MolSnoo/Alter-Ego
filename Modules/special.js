const settings = include('settings.json');
const discord = require('discord.js');

module.exports.determineBehavior = function (bot, game, message) {
    const guild = message.guild;

    if (!game.game) return;

    var redirectMessage = true;

    if (game.room_categories.includes(message.channel.parentID) || message.channel.parentID === game.whisper_category) {
        for (var i = 0; i < game.players_alive.length; i++) {
            if (game.players_alive[i].id === message.author.id) {
                const author = message.author;
                if (game.players_alive[i].statusString.includes("deaf")) {
                    redirectMessage = false;
                    author.send("You try to speak, but no one can hear you.");
                    message.delete().catch();
                }
                else if (game.players_alive[i].statusString.includes("mute")) {
                    redirectMessage = false;
                    author.send("You are mute, so you cannot speak.");
                    message.delete().catch();
                }
                break;
            }
        }
    }

    if (redirectMessage && message.member.roles.find(role => role.id === game.playingRole)) {
        const concealedPlayer = game.concealedPlayer;
        if ((concealedPlayer.member !== null)
            && (concealedPlayer.location === message.channel.name)
            && (!concealedPlayer.hidden)) {
            concealedPlayer.member.send(message.member.displayName + ' says "' + message.content + '"');
        }

        const hiddenPlayers = game.hiddenPlayers;
        for (var i = 0; i < hiddenPlayers.length; i++) {
            if (hiddenPlayers[i].location === message.channel.name) {
                const hiddenMember = guild.members.find(member => member.id === hiddenPlayers[i].id);
                hiddenMember.send('You hear a voice in the room say "' + message.content + '"');
            }
        }

        var currentRoom;
        for (var i = 0; i < game.rooms.length; i++) {
            if (game.rooms[i].name === message.channel.name) {
                currentRoom = game.rooms[i];
                break;
            }
        }
        if (currentRoom) {
            for (var i = 0; i < currentRoom.exit.length; i++) {
                const hearingPlayers = game.hearingPlayers;
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