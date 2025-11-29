import settings from '../Configs/settings.json' with { type: 'json' };

module.exports.config = {
    name: "move_player",
    description: "Moves you to another room.",
    details: 'Moves you to another room. You will be removed from the current channel and put into the channel corresponding to the room you specify. '
        + 'You can specify either an exit of the current room or the name of the desired room, if you know it. Note that you can only move to adjacent rooms. '
        + 'It is recommended that you open the new channel immediately so that you can start seeing messages as soon as you\'re added. '
        + 'The room description will be sent to you via DMs. You can create a queue of movements to perform such that upon entering one room, you will immediately '
        + 'start moving to the next one. To do this, separate each destination with `>`.',
    usage: `${settings.commandPrefix}move door 1\n`
        + `${settings.commandPrefix}enter door 1\n`
        + `${settings.commandPrefix}go locker room\n`
        + `${settings.commandPrefix}move door 1>door 1>door 1\n`
        + `${settings.commandPrefix}walk hall 1 > hall 2 > hall 3 > hall 4\n`
        + `${settings.commandPrefix}m lobby>path 3>path 1>park>path 7>botanical garden`,
    usableBy: "Player",
    aliases: ["move", "go", "exit", "enter", "walk", "m"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify a room. Usage:\n${exports.config.usage}`);

    const status = player.getAttributeStatusEffects("disable move");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    if (player.isMoving) return game.messageHandler.addReply(message, `You cannot do that because you are already moving.`);

    player.moveQueue = args.join(" ").split(">");
    player.queueMovement(bot, game, false, player.moveQueue[0].trim());

    return;
};
