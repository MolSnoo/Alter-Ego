const settings = include('settings.json');
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
        // Create a webhook for this channel if necessary, or grab the existing one.
        let webHooks = await player.location.channel.fetchWebhooks();
        let webHook = webHooks.find(webhook => webhook.owner.id === bot.user.id);
        if (webHook === null || webHook === undefined)
            webHook = await player.location.channel.createWebhook(player.location.channel.name);

        var files = [];
        [...message.attachments.values()].forEach(attachment => files.push(attachment.url));

        const displayName = player.displayName;
        const displayIcon = player.displayIcon;
        if (player.hasAttribute("hidden")) {
            player.displayName = "Someone in the room";
            player.displayIcon = "https://cdn.discordapp.com/attachments/697623260736651335/911381958553128960/questionmark.png";
        }

        webHook.send({
            content: input,
            username: player.displayName,
            avatarURL: player.displayIcon ? player.displayIcon : player.member.displayAvatarURL() || message.author.defaultAvatarURL,
            embeds: message.embeds,
            files: files
        }).then(msg => {
            dialogHandler.execute(bot, game, msg, true, player, displayName)
                .then(() => {
                    player.displayName = displayName;
                    player.displayIcon = displayIcon;
                    // The say command isn't deleted by the commandHandler because it has necessary data. Delete it now.
                    if (message.channel.type !== "DM") message.delete().catch();
                });
        });
    }
    
    return;
};
