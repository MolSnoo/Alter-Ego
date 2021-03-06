﻿const settings = include('settings.json');
const dialogHandler = include(`${settings.modulesDir}/dialogHandler.js`);

module.exports.config = {
    name: "say_player",
    description: "Sends your message to the room you're in.",
    details: "Sends your message to the channel of the room you're currently in. This command is "
        + "only available to players with certain status effects.",
    usage: `${settings.commandPrefix}say What happened?\n`
        + `${settings.commandPrefix}speak Did someone turn out the lights?`,
    usableBy: "Player",
    aliases: ["say", "speak"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify something to say. Usage:\n${exports.config.usage}`);

    const status = player.getAttributeStatusEffects("enable say");
    if (status.length === 0) return game.messageHandler.addReply(message, `You have no reason to use the say command. Speak in the room channel instead.`);

    var input = args.join(" ");
    if (!input.startsWith("(")) {
        // Trick the dialog handler into thinking this is a real message sent to the room channel.
        message.channel = player.location.channel;
        message.member = player.member;
        message.content = input;

        dialogHandler.execute(bot, game, message, false);
    }
    
    return;
};
