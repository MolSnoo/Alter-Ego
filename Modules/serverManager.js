const serverconfig = include('Configs/serverconfig.json');

const fs = require('fs');
const { ChannelType } = require("../node_modules/discord-api-types/v10");

module.exports.validateServerConfig = async (guild) => {
    var missingSettings = [];
    var save = false;
    if (serverconfig.testerRole === "") {
        let testerRole = guild.roles.cache.find(role => role.name === "Tester");
        if (testerRole) {
            serverconfig.testerRole = testerRole.id;
            save = true;
        }
        else missingSettings.push("testerRole");
    }
    if (serverconfig.eligibleRole === "") {
        let eligibleRole = guild.roles.cache.find(role => role.name === "Eligible");
        if (eligibleRole) {
            serverconfig.eligibleRole = eligibleRole.id;
            save = true;
        }
        else missingSettings.push("eligibleRole");
    }
    if (serverconfig.playerRole === "") {
        let playerRole = guild.roles.cache.find(role => role.name === "Player");
        if (playerRole) {
            serverconfig.playerRole = playerRole.id;
            save = true;
        }
        else missingSettings.push("playerRole");
    }
    if (serverconfig.headmasterRole === "") {
        let headmasterRole = guild.roles.cache.find(role => role.name === "Headmaster");
        if (headmasterRole) {
            serverconfig.headmasterRole = headmasterRole.id;
            save = true;
        }
        else missingSettings.push("headmasterRole");
    }
    if (serverconfig.moderatorRole === "") {
        let moderatorRole = guild.roles.cache.find(role => role.name === "Moderator");
        if (moderatorRole) {
            serverconfig.moderatorRole = moderatorRole.id;
            save = true;
        }
        else missingSettings.push("moderatorRole");
    }
    if (serverconfig.deadRole === "") {
        let deadRole = guild.roles.cache.find(role => role.name === "Dead");
        if (deadRole) {
            serverconfig.deadRole = deadRole.id;
            save = true;
        }
        else missingSettings.push("deadRole");
    }
    if (serverconfig.spectatorRole === "") {
        let spectatorRole = guild.roles.cache.find(role => role.name === "Spectator");
        if (spectatorRole) {
            serverconfig.spectatorRole = spectatorRole.id;
            save = true;
        }
        else missingSettings.push("spectatorRole");
    }
    if (serverconfig.roomCategories === "") {
        let roomCategories = guild.channels.cache.find(channel => channel.name === "Rooms");
        if (roomCategories) {
            serverconfig.roomCategories = roomCategories.id;
            save = true;
        }
        else missingSettings.push("roomCategories");
    }
    if (serverconfig.whisperCategory === "") {
        let whisperCategory = guild.channels.cache.find(channel => channel.name === "Whispers");
        if (whisperCategory) {
            serverconfig.whisperCategory = whisperCategory.id;
            save = true;
        }
        else missingSettings.push("whisperCategory");
    }
    if (serverconfig.spectateCategory === "") {
        let spectateCategory = guild.channels.cache.find(channel => channel.name === "Spectate");
        if (spectateCategory) {
            serverconfig.spectateCategory = spectateCategory.id;
            save = true;
        }
        else missingSettings.push("spectateCategory");
    }
    if (serverconfig.testingChannel === "") {
        let testingChannel = guild.channels.cache.find(channel => channel.name === "testing");
        if (testingChannel) {
            serverconfig.testingChannel = testingChannel.id;
            save = true;
        }
        else missingSettings.push("testingChannel");
    }
    if (serverconfig.generalChannel === "") {
        let generalChannel = guild.channels.cache.find(channel => channel.name === "general");
        if (generalChannel) {
            serverconfig.generalChannel = generalChannel.id;
            save = true;
        }
        else missingSettings.push("generalChannel");
    }
    if (serverconfig.announcementChannel === "") {
        let announcementChannel = guild.channels.cache.find(channel => channel.name === "announcements");
        if (announcementChannel) {
            serverconfig.announcementChannel = announcementChannel.id;
            save = true;
        }
        else missingSettings.push("announcementChannel");
    }
    if (serverconfig.commandChannel === "") {
        let commandChannel = guild.channels.cache.find(channel => channel.name === "bot-commands");
        if (commandChannel) {
            serverconfig.commandChannel = commandChannel.id;
            save = true;
        }
        else missingSettings.push("commandChannel");
    }
    if (serverconfig.logChannel === "") {
        let logChannel = guild.channels.cache.find(channel => channel.name === "bot-log");
        if (logChannel) {
            serverconfig.logChannel = logChannel.id;
            save = true;
        }
        else missingSettings.push("logChannel");
    }
    if (save) {
        let json = JSON.stringify(serverconfig);
        await fs.writeFileSync('Configs/serverconfig.json', json, 'utf8');
        console.log("Populated serverconfig file.");
    }
    if (missingSettings.length > 0) {
        console.log(
            "Warning: Failed to correctly populate the serverconfig file by searching for default role and channel names. "
            + "The following ID(s) must be manually populated:\n"
            + missingSettings.join('\n')
        );
    }
};

module.exports.createCategory = function (guild, name) {
    return new Promise((resolve, reject) => {
        guild.channels.create({
            name: name,
            type: ChannelType.GuildCategory
        })
            .then(channel => resolve(channel))
            .catch(err => reject(err));
    });
};

module.exports.registerRoomCategory = async (category) => {
    if (!serverconfig.roomCategories.includes(category.id)) {
        if (serverconfig.roomCategories !== "")
            serverconfig.roomCategories += ",";
        serverconfig.roomCategories += category.id;

        let json = JSON.stringify(serverconfig);
        await fs.writeFileSync('Configs/serverconfig.json', json, 'utf8');

        return `Successfully registered room category "${category.name}".`;
    }
    else return `Room category "${category.name}" is already registered.`;
};
