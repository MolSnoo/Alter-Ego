const discord = require("discord.js");
const settings = require("../settings.json");

const Status = require("../House-Data/Status.js");
const sheet = require("../House-Data/sheets.js");
const move = require("./move.js");

//>status add [player] [status] || >status remove [player] [status] || >status view [player]

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

    if ((message.channel.parentID !== config.parent_channel)
        && (message.channel.id !== config.commandsChannel)
        && (!isPlayer || message.channel.type !== "dm")) return;

    if (!config.game) return message.reply("There is no game currently running");

    // If the user is a player instead, show them the status effects they currently have.
    if (isPlayer) {
        var statusMessage = "You are currently:\n";
        statusMessage += currentPlayer.statusString;
        message.author.send(statusMessage);
    }
    else {
        // User must be a moderator.
        if (message.member.roles.find(role => role.name === config.role_needed)) {
            let usage = new discord.RichEmbed()
                .setTitle("Command Help")
                .setColor("a42004")
                .setDescription(`${settings.prefix}status add [player] [status] OR ${settings.prefix}status remove [player] [status] OR ${settings.prefix}status view [player]`);
            if (args.length < 2) {
                message.reply("you need to input all required arguments. Usage:");
                message.channel.send(usage);
                return;
            }

            // Determine if specified player exists.
            var isPlayer = false;
            var currentPlayer;
            for (var i = 0; i < config.players_alive.length; i++) {
                if (args[1].toLowerCase() === config.players_alive[i].name.toLowerCase()) {
                    isPlayer = true;
                    currentPlayer = config.players_alive[i];
                    break;
                }
            }

            // Determine if specified status exists.
            var isStatus = false;
            var currentStatus;
            const joined = args.join(" ");
            const statusArg = joined.slice(joined.indexOf(args[2]));
            for (var i = 0; i < config.statusEffects.length; i++) {
                if (statusArg.toLowerCase() === config.statusEffects[i].name.toLowerCase()) {
                    isStatus = true;
                    currentStatus = config.statusEffects[i];
                    break;
                }
            }

            if (isPlayer && isStatus) {
                if (args[0] === "add") {
                    const response = exports.inflict(currentPlayer, currentStatus, config, bot, true, true);
                    message.channel.send(response);
                }
                else if (args[0] === "remove") {
                    const response = exports.cure(currentPlayer, currentStatus, config, bot, true, true);
                    message.channel.send(response);
                }
                else {
                    message.reply('you need to use "add", "remove", or "view". Usage:');
                    message.channel.send(usage);
                    return;
                }
            }
            else if (isPlayer && args[0] === "view") {
                const response = exports.view(currentPlayer);
                message.channel.send(response);
            }
            else {
                message.reply('player or status effect not found.');
            }
        }
    }
};

module.exports.inflict = function (player, status, config, bot, notify, updateSheet) {
    const guild = bot.guilds.first();
    const playerUser = guild.members.find(member => member.displayName === player.name);
    const playerName = player.name;
    const playerLocation = guild.channels.find(channel => channel.name === player.location);
    const logchannel = guild.channels.find(channel => channel.id === config.logChannel);

    if (player.statusString.includes(status.name)) return "Specified player already has that status.";

    const timeLimit = status.duration;

    if (notify === null || notify === undefined) notify = true;
    if (updateSheet === null || updateSheet === undefined) updateSheet = true;
    
    if (timeLimit === "") {
        player.status.push(new Status(status.name, "", status.fatal, status.cure, status.nextStage, status.curedCondition, status.rollModifier, status.row));
        const position = player.status.length - 1;
        const createdStatus = player.status[position];

        if (createdStatus.name === "mute")
            config.playersDeafened = true;
        else if (createdStatus.name === "hidden") {
            if (player.statusString.includes("concealed")) {
                playerLocation.send("A masked figure hides in the " + player.hidingSpot + ".");
                config.concealedPlayer.hidden = true;
            }
            else {
                playerLocation.overwritePermissions(player.id, { VIEW_CHANNEL: null });
                playerLocation.send(player.name + " hides in the " + player.hidingSpot + ".");
                if (config.concealedPlayer.member !== null && config.concealedPlayer.location === player.location && !config.concealedPlayer.hidden)
                    config.concealedPlayer.member.send(player.name + " hides in the " + player.hidingSpot + ".");
            }
            sheet.updateCell(player.hidingSpotCell(), player.hidingSpot);
            // Delete whispers, if applicable.
            move.deleteWhispers(player, guild, config, " has hidden.");

            for (var i = 0; i < config.rooms.length; i++) {
                if (config.rooms[i].name === player.location) {
                    config.rooms[i].removePlayer(player);
                    break;
                }
            }
            config.hiddenPlayers.push(player);
        }
        else if (createdStatus.name === "concealed") {
            playerLocation.overwritePermissions(player.id, { VIEW_CHANNEL: null });
            if (!player.statusString.includes("hidden"))
                playerLocation.send(player.name + " puts on a mask.");
            // Delete whispers, if applicable.
            move.deleteWhispers(player, guild, config, " puts on a mask.");
            config.concealedPlayer.member = playerUser;
            config.concealedPlayer.location = player.location;

            for (var i = 0; i < config.rooms.length; i++) {
                if (config.rooms[i].name === player.location) {
                    config.rooms[i].removePlayer(player);
                    break;
                }
            }
        }
        else if (createdStatus.name === "asleep") {
            playerLocation.overwritePermissions(player.id, { VIEW_CHANNEL: null });
            playerLocation.send(player.name + " falls asleep.");
            // Delete whispers, if applicable.
            move.deleteWhispers(player, guild, config, "has fallen asleep.");

            if (player.statusString.includes("well rested")) {
                for (var j = 0; j < config.statusEffects.length; j++) {
                    if (config.statusEffects[j].name === "well rested") {
                        exports.cure(player, config.statusEffects[j], config, bot, false, false);
                        break;
                    }
                }
            }
            if (player.statusString.includes("tired")) {
                for (var j = 0; j < config.statusEffects.length; j++) {
                    if (config.statusEffects[j].name === "tired") {
                        exports.cure(player, config.statusEffects[j], config, bot, false, false);
                        break;
                    }
                }
            }
        }
    }
    else {
        if (isNaN(timeLimit.charAt(0)) && isNaN(timeLimit.charAt(1))
            || (timeLimit.indexOf('m') === -1 && timeLimit.indexOf('h') === -1)
            || (timeLimit.indexOf('m') !== -1 && timeLimit.indexOf('h') !== -1))
            return "Failed to add status. Duration format is incorrect. Must be a number followed by 'm' or 'h'.";

        let time, halfTime, min, hour, mn = false, hr = false;
        if (timeLimit.indexOf('m') !== -1) {
            min = timeLimit.slice(0, timeLimit.indexOf('m'));
            time = min * 60000;
            halfTime = time / 2;
            mn = true;
        }
        if (timeLimit.indexOf('h') !== -1) {
            hour = timeLimit.slice(0, timeLimit.indexOf('h'));
            time = hour * 3600000;
            halfTime = time / 2;
            hr = true;
        }

        player.status.push(new Status(status.name, time, status.fatal, status.cure, status.nextStage, status.curedCondition, status.rollModifier, status.row));
        const position = player.status.length - 1;
        const createdStatus = player.status[position];

        if (createdStatus.name === "unconscious") {
            playerLocation.overwritePermissions(player.id, { VIEW_CHANNEL: null });
            playerLocation.send(player.name + " has gone unconscious.");
            // Delete whispers, if applicable.
            move.deleteWhispers(player, guild, config, "has gone unconscious.");
        }
        player.status[position].timer = setInterval(function () {
            createdStatus.duration -= 1000;

            if (createdStatus.duration <= 0) {
                if (createdStatus.nextStage) {
                    var nextStage = null;
                    for (var i = 0; i < config.statusEffects.length; i++) {
                        if (config.statusEffects[i].name === createdStatus.nextStage) {
                            nextStage = config.statusEffects[i];
                            break;
                        }
                    }

                    exports.cure(player, createdStatus, config, bot, false, false);

                    if (nextStage !== null) {
                        //player.status.splice(position, 1);
                        exports.inflict(player, nextStage, config, bot, true);
                    }
                    else return (status.name + " has been cured, but the status effect in cell 'Develops Into' was not found.");
                }
                else {
                    if (createdStatus.fatal) {
                        clearInterval(player.status[position].timer);

                        const dead = require("./dead.js");
                        dead.die(player, config, playerLocation);

                        // Post log message
                        var time = new Date();
                        logchannel.send(time.toLocaleTimeString() + " - " + playerName + " was " + createdStatus.name + " and died in " + playerLocation);
                    }
                    else {
                        //player.status.splice(position, 1);
                        exports.cure(player, createdStatus, config, bot, true);
                    }
                }
                var time = new Date();
                //console.log(time.toLocaleTimeString() + " y ending on " + createdStatus.name);
                //clearInterval(player.status[position].timer);
                //console.log(player.status);
            }
            /*
            const timeLeft = createdStatus.duration / 1000;  // Gets the total time in seconds.
            const seconds = Math.floor(timeLeft % 60);
            const minutes = Math.floor((timeLeft / 60) % 60);
            const hours = Math.floor(timeLeft / 3600);

            var statusMessage = " (";
            if (hours >= 0 && hours < 10) statusMessage += "0";
            statusMessage += hours + ":";
            if (minutes >= 0 && minutes < 10) statusMessage += "0";
            statusMessage += minutes + ":";
            if (seconds >= 0 && seconds < 10) statusMessage += "0";
            statusMessage += seconds + " remaining)";

            var curtime = new Date();
            console.log(curtime.toLocaleTimeString() + " y running on " + createdStatus.name + statusMessage);
            */
        }, 1000);
    }
    // Inform player what happened.
    if (notify) {
        sheet.getData(status.inflictedCell(), function (response) {
            playerUser.send(response.data.values[0][0]);
        });
    }

    // Update player's statuses on the sheet.
    var statusList;
    for (var i = 0; i < player.status.length; i++) {
        if (i === 0) statusList = player.status[i].name;
        else statusList += ", " + player.status[i].name;
    }
    if (updateSheet) sheet.updateCell(player.statusCell(), statusList);
    player.statusString = statusList;

    // Post log message
    var time = new Date();
    logchannel.send(time.toLocaleTimeString() + " - " + playerName + " is now " + status.name + " in " + playerLocation);

    return "Status successfully added.";
}

module.exports.cure = function (player, status, config, bot, notify, doCuredCondition) {
    const guild = bot.guilds.first();
    const playerUser = guild.members.find(member => member.displayName === player.name);
    const playerLocation = guild.channels.find(channel => channel.name === player.location);
    const logchannel = guild.channels.find(channel => channel.id === config.logChannel);
    
    if (notify === null || notify === undefined) notify = true;
    if (doCuredCondition === null || doCuredCondition === undefined) doCuredCondition = true;

    var statusList = "";
    var statusIndex = -1;
    for (var i = 0; i < player.status.length; i++) {
        // If the status effect to remove is found, save its index to remove later.
        if (player.status[i].name === status.name)
            statusIndex = i;
        // Otherwise, add it to the status list. Make sure not to prefix it with a comma in case the first status effect was removed.
        else {
            if ((i === 0) || (i === 1 && statusIndex !== -1)) statusList = player.status[i].name;
            else statusList += ", " + player.status[i].name;
        }
    }
    var returnMessage;
    if (statusList === "") statusList = " ";
    if (statusIndex !== -1) {
        const statusCuredCell = status.curedCell();

        if (player.status[statusIndex].curedCondition && doCuredCondition) {
            var nextStage = null;
            for (var i = 0; i < config.statusEffects.length; i++) {
                if (config.statusEffects[i].name === player.status[statusIndex].curedCondition) {
                    nextStage = config.statusEffects[i];
                    break;
                }
            }

            if (player.status[statusIndex].name === "asleep") {
                playerLocation.overwritePermissions(player.id, { VIEW_CHANNEL: true });
                playerLocation.send(player.name + " wakes up.");
            }

            clearInterval(player.status[statusIndex].timer);
            player.status.splice(statusIndex, 1);

            // Post log message
            var time = new Date();
            logchannel.send(time.toLocaleTimeString() + " - " + player.name + " has been cured of " + status.name + " in " + playerLocation);

            if (nextStage !== null) {
                exports.inflict(player, nextStage, config, bot, false, true);

                // Update player's statuses on the sheet.
                //sheet.updateCell(player.statusCell(), statusList);
                //player.statusString = statusList;
                returnMessage = "Successfully removed status. Player is now " + nextStage.name;
            }
            else {
                // Update player's statuses on the sheet.
                sheet.updateCell(player.statusCell(), statusList);
                player.statusString = statusList;
                returnMessage = status.name + " has been cured, but the status effect in cell 'When Cured' was not found.";
            }
        }
        else {
            if (player.status[statusIndex].name === "unconscious") {
                playerLocation.overwritePermissions(player.id, { VIEW_CHANNEL: true });
                playerLocation.send(player.name + " wakes up.");
            }
            else if (player.status[statusIndex].name === "mute")
                config.playersDeafened = false;
            else if (player.status[statusIndex].name === "hidden") {
                if (player.statusString.includes("concealed")) {
                    playerLocation.send("A masked figure comes out of the " + player.hidingSpot + ".");
                    config.concealedPlayer.hidden = false;
                }
                else {
                    playerLocation.overwritePermissions(player.id, { VIEW_CHANNEL: true });
                    playerLocation.send(player.name + " comes out of the " + player.hidingSpot + ".");
                    if (config.concealedPlayer.member !== null && config.concealedPlayer.location === player.location && !config.concealedPlayer.hidden)
                        config.concealedPlayer.member.send(player.name + " comes out of the " + player.hidingSpot + ".");
                }
                player.hidingSpot = "";
                sheet.updateCell(player.hidingSpotCell(), " ");

                for (var i = 0; i < config.rooms.length; i++) {
                    if (config.rooms[i].name === player.location) {
                        config.rooms[i].addPlayer(player);
                        break;
                    }
                }
                for (var i = 0; i < config.hiddenPlayers.length; i++) {
                    if (config.hiddenPlayers[i].name === player.name) {
                        config.hiddenPlayers.splice(i, 1);
                        break;
                    }
                }
            }
            else if (player.status[statusIndex].name === "concealed") {
                if (!player.statusString.includes("hidden")) {
                    playerLocation.overwritePermissions(player.id, { VIEW_CHANNEL: true });
                    playerLocation.send("The mask comes off, revealing the figure to be " + player.name + ".");
                }
                config.concealedPlayer.member = null;
                config.concealedPlayer.location = null;

                for (var i = 0; i < config.rooms.length; i++) {
                    if (config.rooms[i].name === player.location) {
                        config.rooms[i].addPlayer(player);
                        break;
                    }
                }
            }

            clearInterval(player.status[statusIndex].timer);
            player.status.splice(statusIndex, 1);

            // Post log message
            var time = new Date();
            logchannel.send(time.toLocaleTimeString() + " - " + player.name + " has been cured of " + status.name + " in " + playerLocation);

            // Update player's statuses on the sheet.
            sheet.updateCell(player.statusCell(), statusList);
            player.statusString = statusList;

            returnMessage = "Successfully removed status.";
        }

        if (notify) {
            // Inform player what happened.
            sheet.getData(statusCuredCell, function (response) {
                if (response.data.values)
                    playerUser.send(response.data.values[0][0]);
            });
        }
    }
    else
        returnMessage = "Specified player doesn't have that status.";

    return returnMessage;
}

module.exports.view = function (player) {
    var statusMessage = player.name + "'s status: ";
    for (var i = 0; i < player.status.length; i++) {
        if (player.status[i].duration === "") {
            statusMessage += "[" + player.status[i].name + "] ";
        }
        else {
            const time = player.status[i].duration / 1000;  // Gets the total time in seconds.
            const seconds = Math.floor(time % 60);
            const minutes = Math.floor((time / 60) % 60);
            const hours = Math.floor(time / 3600);

            statusMessage += "[" + player.status[i].name + " (";
            if (hours >= 0 && hours < 10) statusMessage += "0";
            statusMessage += hours + ":";
            if (minutes >= 0 && minutes < 10) statusMessage += "0";
            statusMessage += minutes + ":";
            if (seconds >= 0 && seconds < 10) statusMessage += "0";
            statusMessage += seconds + " remaining)] ";
        }
    }

    return statusMessage;
}

module.exports.help = {
    name: "status"
};