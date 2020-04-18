const settings = include('settings.json');

const Narration = include(`${settings.dataDir}/Narration.js`);

module.exports.config = {
    name: "stop_player",
    description: "Stops your movement.",
    details: "Stops you in your tracks while moving to another room. Your distance to that room will be preserved, "
        + "so if you decide to move to that room again, it will not take as long.",
    usage: `${settings.commandPrefix}stop`,
    usableBy: "Player",
    aliases: ["stop"]
};

module.exports.run = async (bot, game, message, command, args, player) => {
    const status = player.getAttributeStatusEffects("disable stop");
    if (status.length > 0) return game.messageHandler.addReply(message, `You cannot do that because you are **${status[0].name}**.`);

    if (!player.isMoving) return game.messageHandler.addReply(message, `You cannot do that because you are not moving.`);

    // Stop the player's movement.
    clearInterval(player.moveTimer);
    player.isMoving = false;
    // Narrate that the player stopped.
    new Narration(game, player, player.location, `${player.displayName} stops moving.`).send();

    return;
};
