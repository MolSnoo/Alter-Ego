const settings = include('Configs/settings.json');
const constants = include('Configs/constants.json');
const serverconfig = include('Configs/serverconfig.json');
const dialogHandler = include(`${constants.modulesDir}/dialogHandler.js`);

const Narration = include(`${constants.dataDir}/Narration.js`);

module.exports.config = {
    name: "say_moderator",
    description: "Sends a message.",
    details: 'Sends a message. A channel or player must be specified. Messages can be sent to any '
        + 'channel, but if it is sent to a room channel, it will be treated as a narration so that players with the '
        + '"see room" attribute can see it. If the name of a player is specified and that player has the talent "NPC", '
        + 'the player will speak in the channel of the room they\'re in. Their dialog will be treated just like that of '
        + 'any normal player\'s. The image URL set in the player\'s Discord ID will be used for the player\'s avatar.',
    usage: `${settings.commandPrefix}say #park Hello. My name is Alter Ego.\n`
        + `${settings.commandPrefix}say #general Thank you for speaking with me today.\n`
        + `${settings.commandPrefix}say amy One appletini, coming right up.`,
    usableBy: "Moderator",
    aliases: ["say"],
    requiresGame: false
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2)
        return game.messageHandler.addReply(message, `You need to specify a channel or player and something to say. Usage:\n${exports.config.usage}`);

    const channel = message.mentions.channels.first();
    const string = args.slice(1).join(" ");

    let player = null;
    var room = null;
    if (game.players_alive_by_name.has(args[0])) {
        player = game.players_alive_by_name.get(args[0]);
        if (player.talent !== "NPC")
            return game.messageHandler.addReply(message, `You cannot speak for a player that isn't an NPC.`);
    }
    if (player !== null) {
        // Create a webhook for this channel if necessary, or grab the existing one.
        let webHooks = await player.location.channel.fetchWebhooks();
        let webHook = webHooks.find(webhook => webhook.owner.id === bot.user.id);
        if (webHook === null || webHook === undefined)
            webHook = await player.location.channel.createWebhook({ name: player.location.channel.name });

        var files = [];
        [...message.attachments.values()].forEach(attachment => files.push(attachment.url));

        const displayName = player.displayName;
        const displayIcon = player.displayIcon;
        if (player.hasAttribute("hidden")) {
            player.displayName = "Someone in the room";
            player.displayIcon = "https://cdn.discordapp.com/attachments/697623260736651335/911381958553128960/questionmark.png";
        }

        webHook.send({
            content: string,
            username: player.displayName,
            avatarURL: player.displayIcon,
            embeds: message.embeds,
            files: files
        }).then(message => {
            dialogHandler.execute(bot, game, message, true, player, displayName)
                .then(() => {
                    player.displayName = displayName;
                    player.displayIcon = displayIcon;
                });
        });
    }
    else if (channel !== undefined && serverconfig.roomCategories.includes(channel.parentId)) {
        for (let i = 0; i < game.rooms.length; i++) {
            if (game.rooms[i].name === channel.name) {
                room = game.rooms[i];
                break;
            }
        }
        if (room !== null)
            new Narration(game, null, room, string).send();
    }
    else if (channel !== undefined)
        channel.send(string);
    else game.messageHandler.addReply(message, `Couldn't find a player or channel in your input. Usage:\n${exports.config.usage}`);

    return;
};
