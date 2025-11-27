const settings = include('Configs/settings.json');

module.exports.config = {
    name: "stats_moderator",
    description: "Lists a given player's stats.",
    details: "Lists the given player's default and current stats, as well as the roll modifiers they have based on each current stat. "
        + "The maximum weight the player can carry will be listed, as well as how much weight they are currently carrying. "
        + "Additionally, the player's current maximum stamina will be listed, as this can differ if the player is inflicted with any "
        + "status effects that modify the stamina stat.",
    usage: `${settings.commandPrefix}stats ayaka`,
    usableBy: "Moderator",
    aliases: ["stats"],
    requiresGame: true
};

module.exports.run = async (bot, game, message, command, args) => {
    if (args.length === 0)
        return game.messageHandler.addReply(message, `You need to specify a player. Usage:\n${exports.config.usage}`);

    let player = game.players_alive_by_name.get(args[0]);
    if (player === undefined) return game.messageHandler.addReply(message, `Player "${args[0]}" not found.`);

    var statsString = `__${player.name}'s default stats:__\n`;
    statsString += `Str: ${player.defaultStrength}\n`;
    statsString += `Int: ${player.defaultIntelligence}\n`;
    statsString += `Dex: ${player.defaultDexterity}\n`;
    statsString += `Spd: ${player.defaultSpeed}\n`;
    statsString += `Sta: ${player.defaultStamina}\n`;
    statsString += `\n`;

    const strModifier = player.getStatModifier(player.strength);
    const intModifier = player.getStatModifier(player.intelligence);
    const dexModifier = player.getStatModifier(player.dexterity);
    const spdModifier = player.getStatModifier(player.speed);
    const staModifier = player.getStatModifier(player.stamina);
    statsString += `__${player.name}'s current stats:__\n`;
    statsString += `Str: ${player.strength} (Carry weight: ${player.carryWeight}/${player.maxCarryWeight}) [` + (strModifier > 0 ? '+' : '') + `${strModifier}]\n`;
    statsString += `Int: ${player.intelligence} [` + (intModifier > 0 ? '+' : '') + `${intModifier}]\n`;
    statsString += `Dex: ${player.dexterity} [` + (dexModifier > 0 ? '+' : '') + `${dexModifier}]\n`;
    statsString += `Spd: ${player.speed} [` + (spdModifier > 0 ? '+' : '') + `${spdModifier}]\n`;
    statsString += `Sta: ${Math.round(player.stamina * 100) / 100}/${player.maxStamina} [` + (staModifier > 0 ? '+' : '') + `${staModifier}]`;
    game.messageHandler.addGameMechanicMessage(message.channel, statsString);

    return;
};
