const settings = include('settings.json');
const messageHandler = include(`${settings.modulesDir}/messageHandler.js`);

module.exports.config = {
    name: "text_moderator",
    description: "Sends a text message from an NPC.",
    details: "Sends a text message from the first player to the second player. The first player must have the talent \"NPC\". "
        + "If an image is attached, it will be sent as well.",
    usage: `${settings.commandPrefix}text amy florian I work at the bar.\n`
        + `${settings.commandPrefix}text amy florian Here's a picture of me at work. (attached image)\n`
        + `${settings.commandPrefix}text ??? keiko This is a message about your car's extended warranty.\n`
        + `${settings.commandPrefix}text ??? hibiki (attached image)`,
    usableBy: "Moderator",
    aliases: ["text"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length < 2)
        return game.messageHandler.addReply(message, `You need to specify a sender, a recipient, and a message. Usage:\n${exports.config.usage}`);

    var player = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase() && game.players_alive[i].talent === "NPC") {
            player = game.players_alive[i];
            break;
        }
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase() && game.players_alive[i].talent !== "NPC")
            return game.messageHandler.addReply(message, `You cannot text for a player that isn't an NPC.`);
    }
    if (player === null) return game.messageHandler.addReply(message, `Couldn't find player "${args[0]}".`);
    args.splice(0, 1);

    var recipient = null;
    for (let i = 0; i < game.players_alive.length; i++) {
        if (game.players_alive[i].name.toLowerCase() === args[0].toLowerCase()) {
            recipient = game.players_alive[i];
            break;
        }
    }
    if (recipient === null) return game.messageHandler.addReply(message, `Couldn't find player "${args[0]}".`);
    if (recipient.name === player.name) return game.messageHandler.addReply(message, `${player.name} cannot send a message to ${player.originalPronouns.ref}.`);
    args.splice(0, 1);

    var input = args.join(" ");
    if (input === "" && message.attachments.size === 0) return game.messageHandler.addReply(message, `Text message cannot be empty. Please send a message and/or an attachment.`);
    if (input.length > 1900)
        input = input.substring(0, 1897) + "...";

    var senderText = `\`[ ${player.name} -> ${recipient.name} ]\` `;
    var receiverText = `\`[ ${player.name} ]\` `;
    if (input !== "") {
        senderText += input;
        receiverText += input;
    }

    messageHandler.addDirectNarrationWithAttachments(player, senderText, message.attachments);
    messageHandler.addDirectNarrationWithAttachments(recipient, receiverText, message.attachments);

    return;
};
