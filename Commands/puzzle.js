const discord = require("discord.js");
const settings = require("../settings.json");

//const sheet = require("../House-Data/sheets.js");
const puzzle = require("./use.js");

//>puzzle solve [puzzle] [player] ("message")|| >puzzle unsolve [puzzle] [player] ("message")

module.exports.run = async (bot, config, message, args) => {
    if (message.member.roles.find(role => role.name === config.role_needed)) {
        let usage = new discord.RichEmbed()
            .setTitle("Command Help")
            .setColor("a42004")
            .setDescription(`${settings.prefix}puzzle solve [puzzle] [player] ("message") OR ${settings.prefix}puzzle unsolve [player] ("message")`);

        if (!config.game) return message.reply("There is no game currently running");
        
        if (args.length < 3) {
            message.reply("insufficient arguments. Usage:");
            message.channel.send(usage);
            return;
        }

        var currentPlayer = null;
        for (var i = 0; i < config.players_alive.length; i++) {
            if (config.players_alive[i].name.toLowerCase() === args[2].toLowerCase()) {
                currentPlayer = config.players_alive[i];
                break;
            }
        }
        if (currentPlayer === null) return message.reply('couldn\'t find player "' + args[2] + '".');

        var currentPuzzle = null;
        for (var i = 0; i < config.puzzles.length; i++) {
            if (config.puzzles[i].name === args[1].toUpperCase()
                && config.puzzles[i].location === currentPlayer.location) {
                currentPuzzle = config.puzzles[i];
                break;
            }
        }
        if (currentPuzzle === null) return message.reply('couldn\'t find puzzle "' + args[1] + '".');

        const joinedArgs = args.join(' ');
        var announcement = "";
        if (args[3]) {
            if (args[3].startsWith('"') || args[3].startsWith('“')) {
                announcement = joinedArgs.substring(joinedArgs.indexOf(args[3]) + 1);
                if (announcement.endsWith('"') || announcement.endsWith('”'))
                    announcement = announcement.substring(0, announcement.length - 1);
                if (!announcement.endsWith('.'))
                    announcement += '.';
            }
            else return message.reply("invalid message argument. Be sure to surround the message with quotation marks.");
        }
        else announcement = "uses the " + currentPuzzle.name + ".";

        var concealedPlayerinRoom = false;
        let concealedPlayer = config.concealedPlayer.member;
        if (config.concealedPlayer.member !== null && config.concealedPlayer.location === currentPlayer.location && !config.concealedPlayer.hidden) {
            concealedPlayerinRoom = true;
        }

        const guild = bot.guilds.find(guild => guild.id === config);
        const channel = guild.channels.find(channel => channel.name === currentPlayer.location);
        const logchannel = guild.channels.find(channel => channel.id === config.logChannel);

        const scope = {
            bot: bot,
            config: config,
            message: message,
            currentPlayer: currentPlayer,
            input: joinedArgs,
            puzzle: currentPuzzle,
            statuses: currentPlayer.statusString,
            concealedPlayerinRoom: concealedPlayerinRoom,
            concealedPlayer: concealedPlayer,
            channel: channel,
            logchannel: logchannel
        }

        if (args[0] === "solve") {
            puzzle.solvePuzzle(
                scope,
                announcement,
                message.member.displayName + " solved " + currentPuzzle.name + " for " + currentPlayer.name + " in " + channel
            );
        }
        else if (args[0] === "unsolve") {
            puzzle.unsolvePuzzle(
                scope,
                announcement,
                "",
                message.member.displayName + " unsolved " + currentPuzzle.name + " for " + currentPlayer.name + " in " + channel
            );
        }
        else return message.reply('function "' + args[0] + '" does not exist. Input must be "solve" or "unsolve".');
    }
};

module.exports.help = {
    name: "puzzle"
};