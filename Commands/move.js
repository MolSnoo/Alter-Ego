const discord = require("discord.js");
const settings = require("../settings.json");

const sheet = require("../House-Data/sheets.js");
const status = require("./status.js");

//>move [room] || >move [user1] [user2] [userN] [room]

module.exports.run = async (bot, config, message, args) => {
    // Determine if the user is a player.
    var isPlayer = false;
    var currentPlayer;
    for (var i = 0; i < config.players_alive.length; i++) {
        if (message.author.id === config.players_alive[i].id) {
            isPlayer = true;
            currentPlayer = config.players_alive[i];
            break;
        }
    }

    var isHeadmaster = false;
    if (currentPlayer) {
        const member = bot.guilds.first().members.find(member => member.id === currentPlayer.id);
        if (member.roles.find(role => role.id === config.headmasterRole)) isHeadmaster = true;
    }

    if ((message.channel.parentID !== config.parent_channel)
        && (message.channel.id !== config.commandsChannel)
        && (!isPlayer || message.channel.type !== "dm")) return;

	let usage = new discord.RichEmbed()
		.setTitle("Command Help")
		.setColor("a42004")
        .setDescription(`(Player) ${settings.prefix}move [room] OR (Moderator) ${settings.prefix}move [user1] [user2] [userN] [channel]`);

    if (!config.game) return message.reply("There is no game currently running");

	if (!args.length) {
		message.reply("you need to specify a room. Usage:");
		message.channel.send(usage);
		return;
    }

    var input = args.join(" ");
    const room = config.rooms;

    if (isPlayer && !isHeadmaster) {
        const statuses = currentPlayer.statusString;
        if (statuses.includes("asleep")) return message.reply("you are **asleep**. You cannot do anything.");
        if (statuses.includes("unconscious")) return message.reply("you are **unconscious**. You cannot do anything.");
        if (statuses.includes("heated")) return message.reply("the situation is **heated**. Moderator intervention is required.");
        if (statuses.includes("restricted")) return message.reply("you are **restricted**. You cannot move.");
        if (statuses.includes("hidden")) return message.reply(`you are currently **hidden**. Use "${settings.prefix}hide unhide" first.`);
        if (statuses.includes("weary")) return message.reply("you are **weary**. You need to take a break before moving again.");

        var nonDiscreetItems = new Array();
        for (var i = 0; i < currentPlayer.inventory.length; i++) {
            if (currentPlayer.inventory[i].discreet === false) {
                nonDiscreetItems.push(currentPlayer.inventory[i].singleContainingPhrase);
            }
        }
        var appendString;

        if (nonDiscreetItems.length === 0)
            appendString = ".";
        else if (nonDiscreetItems.length === 1)
            appendString = " carrying " + nonDiscreetItems[0] + ".";
        else if (nonDiscreetItems.length === 2)
            appendString = " carrying " + nonDiscreetItems[0] + " and " + nonDiscreetItems[1] + ".";
        else if (nonDiscreetItems.length >= 3) {
            appendString = " carrying ";
            for (var i = 0; i < nonDiscreetItems.length; i++) {
                if (i === nonDiscreetItems.length - 1)
                    appendString = appendString + "and " + nonDiscreetItems[i] + ".";
                else
                    appendString = appendString + nonDiscreetItems[i] + ", ";
            }
        }

        // Get the row number of the current room.
        var currentRoom;
        for (currentRoom = 0; currentRoom < room.length; currentRoom++) {
            if (room[currentRoom].name === currentPlayer.location && room[currentRoom].accessible)
                break;
            else if (room[currentRoom].name === currentPlayer.location)
                return message.reply("There is no escape.");
        }

        // Get the number of exits in the current room. This will be used to decide how many rows to take from the spreadsheet.
        const noExits = room[currentRoom].exit.length;

        // Determine if desired room is adjacent to current room.
        var adjacent = false;
        var exitNo = 0;
        for (exitNo; exitNo < noExits; exitNo++) {
            if (input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase() === room[currentRoom].exit[exitNo].dest) {
                adjacent = true;
                break;
            }
            if (input.toUpperCase() === room[currentRoom].exit[exitNo].name) {
                adjacent = true;
                break;
            }
        }
        if (!adjacent) return message.reply("you can't move to that room.");

        // Now get the row number of the desired room.
        var desiredRoom;
        for (desiredRoom = 0; desiredRoom < room.length; desiredRoom++) {
            if (room[desiredRoom].name === room[currentRoom].exit[exitNo].dest && room[desiredRoom].accessible)
                break;
            else if (room[desiredRoom].name === room[currentRoom].exit[exitNo].dest)
                return message.reply("the entrance to that room is locked.");
        }

        // Get the number of entrances in the desired room. This will be used to decide how many rows to take from the spreadsheet.
        const noEntrances = room[desiredRoom].exit.length;

        // Now get the correct entrance.
        var entranceNo;
        for (entranceNo = 0; entranceNo < noEntrances; entranceNo++) {
            if (room[desiredRoom].exit[entranceNo].name === room[currentRoom].exit[exitNo].link)
                break;
        }

        // Find the correct channel.
        const guild = bot.guilds.first();
        const schannel = guild.channels.find(channel => channel.name === room[desiredRoom].name);
        if (!schannel || schannel.parentID !== config.parent_channel) return message.reply("room not found.");
        if ((schannel === message.channel) || (schannel.name === currentPlayer.location)) return;

        // Leave current room.
        const channel = guild.channels.find(channel => channel.name === room[currentRoom].name);
        if (statuses.includes("concealed")) {
            channel.send("A masked figure exits into " + room[currentRoom].exit[exitNo].name + appendString);
        }
        else {
            channel.send(currentPlayer.name + " exits into " + room[currentRoom].exit[exitNo].name + appendString);
            channel.overwritePermissions(message.author, { VIEW_CHANNEL: null });
            if (config.concealedPlayer.member !== null && config.concealedPlayer.location === room[currentRoom].name && !config.concealedPlayer.hidden) {
                config.concealedPlayer.member.send(currentPlayer.name + " exits into " + room[currentRoom].exit[exitNo].name + appendString);
            }
        }
        room[currentRoom].removePlayer(currentPlayer);

        // Remove player from any whispers, if applicable.
        exports.deleteWhispers(currentPlayer, guild, config, "has left the room.");

        // Move to new room.
        currentPlayer.location = room[desiredRoom].name;
        if (statuses.includes("concealed")) {
            schannel.send("A masked figure enters from " + room[desiredRoom].exit[entranceNo].name + appendString);
            config.concealedPlayer.location = room[desiredRoom].name;
            if (room[desiredRoom].occupantsString !== "") {
                message.author.send("Players in this room: " + room[desiredRoom].occupantsString);
            }
        }
        else {
            schannel.send(currentPlayer.name + " enters from " + room[desiredRoom].exit[entranceNo].name + appendString);
            schannel.overwritePermissions(message.author, { VIEW_CHANNEL: true });
            if (config.concealedPlayer.member !== null && config.concealedPlayer.location === room[desiredRoom].name && !config.concealedPlayer.hidden) {
                message.author.send("In this room, you see a masked figure.");
                config.concealedPlayer.member.send(currentPlayer.name + " enters from " + room[desiredRoom].exit[entranceNo].name + appendString);
            }
        }
        room[desiredRoom].addPlayer(currentPlayer);
        sheet.getData(room[desiredRoom].exit[entranceNo].descriptionCell(), function (response) {
            message.author.send(response.data.values[0][0]);
        });

        // Update location on spreadsheet.
        sheet.updateCell(currentPlayer.locationCell(), currentPlayer.location);

        if (currentPlayer.talent === "Ultimate Gamer") {
            for (var i = 0; i < config.statusEffects.length; i++) {
                if (config.statusEffects[i].name === "weary") {
                    status.inflict(currentPlayer, config.statusEffects[i], config, bot, true, true);
                    break;
                }
            }
        }

        // Post log message
        const logchannel = guild.channels.find(channel => channel.id === config.logChannel);
        var time = new Date();
        logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " moved to " + schannel);

        if (message.channel.type !== "dm")
            message.delete().catch();
    }
    else if (isPlayer && isHeadmaster) {
        const parsedInput = input.replace(/\'/g, "").replace(/ /g, "-").toLowerCase();
        var currentRoom = -1;
        var desiredRoom = -1;
        for (var i = 0; i < room.length; i++) {
            if (room[i].name === currentPlayer.location)
                currentRoom = i;
            if (room[i].name === parsedInput)
                desiredRoom = i;
            if (currentRoom !== -1 && desiredRoom !== -1)
                break;
        }
        const scope = {
            guild: bot.guilds.first(),
            config: config,
            message: message,
            currentPlayer: currentPlayer,
            statuses: currentPlayer.statusString,
            room: config.rooms,
            currentRoom: currentRoom,
            desiredRoom: desiredRoom
        };
        if (currentRoom === -1 || desiredRoom === -1) message.author.send("Invalid room.");
        else exports.movePlayer(scope, "suddenly appears", "suddenly disappears");

        if (message.channel.type !== "dm")
            message.delete().catch();
    }
    else if (message.member.roles.find(role => role.name === config.role_needed)) {
        const commandsChannel = bot.channels.get(config.commandsChannel);
        var roomExists = false;
        var desiredRoom;
        for (desiredRoom = 0; desiredRoom < room.length; desiredRoom++) {
            if (room[desiredRoom].name === args[args.length - 1]) {
                roomExists = true;
                break;
            }
        }
        if (!roomExists) return message.reply('couldn\'t find room "' + args[args.length - 1] + '". Make sure it matches the channel name exactly.');
        const schannel = message.guild.channels.find(channel => channel.name === room[desiredRoom].name);
        for (var i = 0; i < config.players_alive.length; i++) {
            currentPlayer = config.players_alive[i];

            var currentRoom;
            for (currentRoom = 0; currentRoom < room.length; currentRoom++) {
                if (room[currentRoom].name === currentPlayer.location)
                    break;
            }

            const scope = {
                guild: bot.guilds.first(),
                config: config,
                message: message,
                currentPlayer: currentPlayer,
                statuses: currentPlayer.statusString,
                room: config.rooms,
                currentRoom: currentRoom,
                desiredRoom: desiredRoom
            };

            if (args[0] === "all" || args[0] === "living") {
                const member = message.guild.members.find(member => member.id === currentPlayer.id);
                if (currentPlayer.location !== room[desiredRoom].name && !member.roles.find(role => role.id === config.headmasterRole))
                    exports.movePlayer(scope, "enters", "exits");
            }
            else {
                for (var j = 0; j < args.length - 1; j++) {
                    if (config.players_alive[i].name.toLowerCase() === args[j].toLowerCase() && config.players_alive[i].location !== room[desiredRoom].name)
                        exports.movePlayer(scope, "enters", "exits");
                }
            }
        }
        commandsChannel.send("The listed players have been moved to " + schannel + "."); 
    }
};

module.exports.movePlayer = function (scope, entranceVerb, exitVerb) {
    const guild = scope.guild;
    const config = scope.config;
    const message = scope.message;
    const currentPlayer = scope.currentPlayer;
    const statuses = scope.statuses;
    const room = scope.room;
    const currentRoom = scope.currentRoom;
    const desiredRoom = scope.desiredRoom;

    const member = guild.members.find(member => member.id === currentPlayer.id);

    var nonDiscreetItems = new Array();
    for (var i = 0; i < currentPlayer.inventory.length; i++) {
        if (currentPlayer.inventory[i].discreet === false) {
            nonDiscreetItems.push(currentPlayer.inventory[i].singleContainingPhrase);
        }
    }
    var appendString;

    if (nonDiscreetItems.length === 0)
        appendString = ".";
    else if (nonDiscreetItems.length === 1)
        appendString = " carrying " + nonDiscreetItems[0] + ".";
    else if (nonDiscreetItems.length === 2)
        appendString = " carrying " + nonDiscreetItems[0] + " and " + nonDiscreetItems[1] + ".";
    else if (nonDiscreetItems.length >= 3) {
        appendString = " carrying ";
        for (var i = 0; i < nonDiscreetItems.length; i++) {
            if (i === nonDiscreetItems.length - 1)
                appendString = appendString + "and " + nonDiscreetItems[i] + ".";
            else
                appendString = appendString + nonDiscreetItems[i] + ", ";
        }
    }

    // Leave current room.
    if (exitVerb) {
        const channel = guild.channels.find(channel => channel.name === room[currentRoom].name);
        if (statuses.includes("concealed")) {
            channel.send("A masked figure " + exitVerb + appendString);
        }
        else {
            channel.overwritePermissions(member.user, { VIEW_CHANNEL: null });
            channel.send(currentPlayer.name + ' ' + exitVerb + appendString);
            if (config.concealedPlayer.member !== null && config.concealedPlayer.location === room[currentRoom].name && !config.concealedPlayer.hidden) {
                config.concealedPlayer.member.send(currentPlayer.name + ' ' + exitVerb + appendString);
            }
        }
        room[currentRoom].removePlayer(currentPlayer);

        // Remove player from any whispers, if applicable.
        exports.deleteWhispers(currentPlayer, guild, config, "has left the room.");
    }

    // Move to new room.
    const schannel = guild.channels.find(channel => channel.name === room[desiredRoom].name);
    currentPlayer.location = room[desiredRoom].name;
    if (statuses.includes("concealed")) {
        config.concealedPlayer.location = room[desiredRoom].name;
        if (entranceVerb) {
            schannel.send("A masked figure " + entranceVerb + appendString);
            if (room[desiredRoom].occupantsString !== "") {
                member.user.send("Players in this room: " + room[desiredRoom].occupantsString);
            }
        }
    }
    else {
        schannel.overwritePermissions(member.user, { VIEW_CHANNEL: true });
        if (entranceVerb) {
            schannel.send(currentPlayer.name + ' ' + entranceVerb + appendString);
            if (config.concealedPlayer.member !== null && config.concealedPlayer.location === room[desiredRoom].name && !config.concealedPlayer.hidden) {
                member.user.send("In this room, you see a masked figure.");
                config.concealedPlayer.member.send(currentPlayer.name + ' ' + entranceVerb + appendString);
            }
        }
    }
    room[desiredRoom].addPlayer(currentPlayer);
    sheet.getData(room[desiredRoom].descriptionCell(), function (response) {
        member.user.send(response.data.values[0][0]);
    });

    // Update location on spreadsheet.
    sheet.updateCell(currentPlayer.locationCell(), currentPlayer.location);

    // Post log message
    const logchannel = guild.channels.find(channel => channel.id === config.logChannel);
    var time = new Date();
    logchannel.send(time.toLocaleTimeString() + " - " + currentPlayer.name + " forcefully moved to " + schannel);
}

module.exports.deleteWhispers = function (currentPlayer, guild, config, removalString) {
    for (var i = 0; i < config.whispers.length; i++) {
        for (var j = 0; j < config.whispers[i].players.length; j++) {
            if (config.whispers[i].players[j].id === currentPlayer.id) {
                const whisperChannel = guild.channels.find(channel => channel.name === config.whispers[i].channelName);
                if (config.whispers[i].players.length <= 2) {
                    config.whispers.splice(i, 1);
                    i--;
                    whisperChannel.delete();
                    break;
                }
                else {
                    // Remove player from the whisper.
                    config.whispers[i].players.splice(j, 1);
                    whisperChannel.overwritePermissions(currentPlayer.id, { VIEW_CHANNEL: null, READ_MESSAGE_HISTORY: null });

                    // Make sure a group with the same set of people doesn't already exist, then rename the channel. If it does exist, just delete this one.
                    var changeName = true;
                    const newWhisperName = config.whispers[i].setChannelName(config.whispers[i].players, config.whispers[i].location);
                    for (var k = 0; k < config.whispers.length; k++) {
                        if (config.whispers[k].channelName === newWhisperName) {
                            changeName = false;
                            config.whispers.splice(i, 1);
                            i = 0;
                            j = 0;
                            whisperChannel.delete();
                            break;
                        }
                    }
                    if (changeName) {
                        config.whispers[i].channelName = newWhisperName;
                        whisperChannel.setName(newWhisperName);
                        whisperChannel.send(currentPlayer.name + ' ' + removalString);
                    }
                }
            }
        }
    }
}

module.exports.help = {
	name: "move"
};