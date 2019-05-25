const discord = require("discord.js");
const settings = require("../settings.json");

const status = require("./status.js");

//>investigation start || >investigation end || >investigation trial

module.exports.run = async (bot, config, message, args) => {
    if (message.member.roles.find(role => role.name === config.role_needed)) {
        let usage = new discord.RichEmbed()
            .setTitle("Command Help")
            .setColor("a42004")
            .setDescription(`${settings.prefix}investigation start|end|trial`);

        if (!config.game) return message.reply("There is no game currently running");

        if (!args.length) {
            message.reply("you need to specify whether to start or end an investigation. Usage:");
            message.channel.send(usage);
            return;
        }

        if (args[0] === "start") {
            config.investigation = true;
            message.channel.send("Investigation started.");
        }
        else if (args[0] === "end") {
            config.investigation = false;
            var restrictedStatus;
            for (var i = 0; i < config.statusEffects.length; i++) {
                if (config.statusEffects[i].name === "restricted") {
                    restrictedStatus = config.statusEffects[i];
                    break;
                }
            }

            for (var j = 0; j < config.players_alive.length; j++)
                status.cure(config.players_alive[j], restrictedStatus, config, bot, false, false);

            message.channel.send("Investigation ended.");
        }
        else if (args[0] === "trial") {
            var restrictedStatus;
            for (var i = 0; i < config.statusEffects.length; i++) {
                if (config.statusEffects[i].name === "restricted") {
                    restrictedStatus = config.statusEffects[i];
                    break;
                }
            }

            for (var j = 0; j < config.players_alive.length; j++)
                status.inflict(config.players_alive[j], restrictedStatus, config, bot, false, true);

            message.channel.send("All players have been given **restricted** status effect.");
        }
    }
};

module.exports.help = {
    name: "investigation"
};